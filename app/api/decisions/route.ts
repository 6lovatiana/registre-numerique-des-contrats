import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { computeNoticeDeadline } from '@/lib/alerts'

export const runtime = 'nodejs'
const ACTIONS = ['Renouvellement', 'Renégociation', 'Résiliation']

export async function GET() {
  try {
    const result = await db.query(`SELECT id, titre AS title, contrat_id AS "contractId", contexte AS context, montant AS amount, date_limite AS "dueDate", statut AS status FROM decisions ORDER BY date_limite NULLS LAST, id`)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('GET /api/decisions failed', error)
    return NextResponse.json({ detail: 'Erreur de lecture des décisions.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const client = await db.connect()
  try {
    const { contractId, action } = await request.json()
    if (!contractId || !ACTIONS.includes(action)) return NextResponse.json({ detail: 'Demande invalide.' }, { status: 422 })
    await client.query('BEGIN')
    const found = await client.query('SELECT id, reference, fournisseur, criticality, donnees FROM contrats WHERE id=$1', [contractId])
    if (!found.rowCount) { await client.query('ROLLBACK'); return NextResponse.json({ detail: 'Contrat introuvable.' }, { status: 404 }) }
    const contract = found.rows[0]
    const data = contract.donnees
    const dueDate = data.noticeDays ? computeNoticeDeadline(data.endDate, Number(data.noticeDays)) : data.endDate
    const id = `DEC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const title = `Demande de ${String(action).toLowerCase()} · ${contract.reference}`
    const context = `Demande enregistrée depuis l’alerte du contrat ${contract.reference} (${contract.fournisseur}). Elle attend une décision de la Direction Générale.`
    const userId = request.headers.get('x-user-id') ?? 'USR-JUR-014'
    const inserted = await client.query(`INSERT INTO decisions(id, contrat_id, titre, contexte, montant, date_limite, statut)
      VALUES($1,$2,$3,$4,$5,$6,'En attente') RETURNING id, titre AS title, contrat_id AS "contractId", contexte AS context, montant AS amount, date_limite AS "dueDate", statut AS status`, [id, contractId, title, context, Number(data.amount) || 0, dueDate])
    const logged = await client.query('INSERT INTO actions_contrats(contrat_id, action, id_utilisateur) VALUES($1,$2,$3) RETURNING contrat_id AS "contractId", action, date_action AS at, id_utilisateur AS "userId"', [contractId, action, userId])
    await client.query('COMMIT')
    return NextResponse.json({ decision: inserted.rows[0], action: logged.rows[0] }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('POST /api/decisions failed', error)
    return NextResponse.json({ detail: 'Création de la demande impossible.' }, { status: 500 })
  } finally { client.release() }
}
