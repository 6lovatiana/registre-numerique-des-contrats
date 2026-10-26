import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const values: unknown[] = []
    const filters: string[] = ["l.statut NOT IN ('Clôturé', 'Abandonné')"]
    const statut = url.searchParams.get('statut')
    const fournisseur = url.searchParams.get('fournisseur')
    if (statut) { values.push(statut); filters.push(`l.statut = $${values.length}`) }
    if (fournisseur) { values.push(`%${fournisseur}%`); filters.push(`c.fournisseur ILIKE $${values.length}`) }
    const result = await db.query(`SELECT l.*, c.fournisseur FROM litiges l JOIN contrats c ON c.id = l.contrat_id WHERE ${filters.join(' AND ')} ORDER BY l.date_creation DESC`, values)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('GET /api/litiges failed', error)
    return NextResponse.json({ detail: 'Erreur de lecture de la base de données.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const client = await db.connect()
  try {
    const body = await request.json()
    if (!body.contrat_id || !body.type_litige || !body.description?.trim() || !Number.isFinite(Number(body.montant_concerne)) || Number(body.montant_concerne) < 0)
      return NextResponse.json({ detail: 'Données de litige invalides.' }, { status: 422 })
    await client.query('BEGIN')
    const contrat = await client.query('SELECT id, criticality, fournisseur FROM contrats WHERE id = $1', [body.contrat_id])
    if (!contrat.rowCount) { await client.query('ROLLBACK'); return NextResponse.json({ detail: 'Contrat introuvable.' }, { status: 404 }) }
    const year = new Date().getFullYear()
    await client.query('SELECT pg_advisory_xact_lock($1)', [year])
    const seq = await client.query("SELECT COALESCE(MAX(SPLIT_PART(reference_litige, '-', 3)::int), 0) + 1 AS n FROM litiges WHERE reference_litige LIKE $1", [`LIT-${year}-%`])
    const ref = body.reference_litige ?? `LIT-${year}-${String(seq.rows[0].n).padStart(4, '0')}`
    if (!/^LIT-\d{4}-\d{4}$/.test(ref)) { await client.query('ROLLBACK'); return NextResponse.json({ detail: 'Format attendu : LIT-AAAA-NNNN.' }, { status: 422 }) }
    const escalade = Number(body.montant_concerne) > 50000 || contrat.rows[0].criticality === 'Critique'
    const created = await client.query(`INSERT INTO litiges (reference_litige, contrat_id, type_litige, description, montant_concerne, statut, priorite, escalation_dg, id_utilisateur_action)
      VALUES ($1,$2,$3,$4,$5,'Nouveau',$6,$7,$8) RETURNING *`, [ref, body.contrat_id, body.type_litige, body.description.trim(), body.montant_concerne, escalade ? 'Haute' : 'Normale', escalade, request.headers.get('x-user-id') ?? 'USR-LOCAL'])
    await client.query('COMMIT')
    return NextResponse.json({ ...created.rows[0], fournisseur: contrat.rows[0].fournisseur }, { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('POST /api/litiges failed', error)
    return NextResponse.json({ detail: 'Création impossible; référence déjà utilisée ou base indisponible.' }, { status: 409 })
  } finally { client.release() }
}
