import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { eurosToMGA } from '@/lib/currency'
import { initialContracts, initialDecisions, initialDisputes, ESCALATION_THRESHOLD } from '@/lib/mock-data'

export const runtime = 'nodejs'

function toAriary(contract: any) {
  if (contract.currency !== 'EUR') return { ...contract, supplier: { ...contract.supplier, nif: contract.supplier?.nif ?? contract.supplier?.siret } }
  const amountFields = ['amount', 'budget', 'actualSpent', 'earlyTerminationAmount', 'guaranteeAmount']
  const converted = { ...contract, currency: 'MGA', supplier: { ...contract.supplier, nif: contract.supplier?.nif ?? contract.supplier?.siret } }
  for (const field of amountFields) if (typeof contract[field] === 'number') converted[field] = eurosToMGA(contract[field])
  return converted
}

async function seedDemoDataIfEmpty() {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock($1)', [20261027])
    const existing = await client.query('SELECT 1 FROM contrats LIMIT 1')
    if (existing.rowCount) { await client.query('COMMIT'); return }

    await client.query(`INSERT INTO contrats(id, reference, criticality, fournisseur, donnees)
      SELECT id, reference, criticality, fournisseur, donnees FROM jsonb_to_recordset($1::jsonb)
      AS seed(id text, reference text, criticality text, fournisseur text, donnees jsonb)`, [JSON.stringify(initialContracts.map((c) => ({ id: c.id, reference: c.reference, criticality: c.criticality, fournisseur: c.supplier.name, donnees: c })))])

    const contractById = new Map(initialContracts.map((c) => [c.id, c]))
    await client.query(`INSERT INTO litiges(reference_litige, contrat_id, type_litige, description, montant_concerne, statut, priorite, escalation_dg, date_creation, id_utilisateur_action)
      SELECT reference_litige, contrat_id, type_litige, description, montant_concerne, statut, priorite, escalation_dg, date_creation, id_utilisateur_action
      FROM jsonb_to_recordset($1::jsonb) AS seed(reference_litige text, contrat_id text, type_litige text, description text, montant_concerne numeric, statut text, priorite text, escalation_dg boolean, date_creation timestamptz, id_utilisateur_action text)`, [JSON.stringify(initialDisputes.map((d) => {
        const contract = contractById.get(d.contractId)!
        const escalation = d.amountAtStake > ESCALATION_THRESHOLD || contract.criticality === 'Critique'
        return { reference_litige: d.id, contrat_id: d.contractId, type_litige: d.type, description: d.description, montant_concerne: d.amountAtStake, statut: d.status, priorite: escalation ? 'Haute' : 'Normale', escalation_dg: escalation, date_creation: d.createdAt, id_utilisateur_action: d.createdBy }
      }))])

    await client.query(`INSERT INTO decisions(id, contrat_id, titre, contexte, montant, date_limite, statut)
      SELECT id, contrat_id, titre, contexte, montant, date_limite, statut FROM jsonb_to_recordset($1::jsonb)
      AS seed(id text, contrat_id text, titre text, contexte text, montant numeric, date_limite date, statut text)`, [JSON.stringify(initialDecisions.map((d) => ({ id: d.id, contrat_id: d.contractId, titre: d.title, contexte: d.context, montant: d.amount, date_limite: d.dueDate, statut: d.status })))])
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally { client.release() }
}

export async function GET() {
  try {
    await seedDemoDataIfEmpty()
    const result = await db.query(`SELECT c.donnees, COALESCE(jsonb_agg(jsonb_build_object('id', d.id, 'name', d.nom, 'kind', d.type_document)) FILTER (WHERE d.id IS NOT NULL), '[]'::jsonb) AS documents
      FROM contrats c LEFT JOIN documents_contrats d ON d.contrat_id=c.id GROUP BY c.id ORDER BY c.date_creation DESC`)
    return NextResponse.json(result.rows.map((row) => ({ ...toAriary(row.donnees), documents: row.documents })))
  } catch (error) {
    console.error('GET /api/contrats failed', error)
    return NextResponse.json({ detail: 'Erreur de lecture des contrats.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const client = await db.connect()
  try {
    const contentType = request.headers.get('content-type') ?? ''
    let contract: any
    let files: { file: File; kind: 'Contrat' | 'Avenant' | 'CGV' }[] = []
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      contract = JSON.parse(String(form.get('contract') ?? '{}'))
      for (const [key, kind] of [['contractFile', 'Contrat'], ['termsFile', 'CGV']] as const) {
        const file = form.get(key)
        if (file instanceof File && file.size) files.push({ file, kind })
      }
      for (const value of form.getAll('amendments')) if (value instanceof File && value.size) files.push({ file: value, kind: 'Avenant' })
    } else contract = await request.json()
    if (!contract.id || !contract.reference || !contract.supplier?.name || !contract.criticality)
      return NextResponse.json({ detail: 'Informations du contrat incomplètes.' }, { status: 422 })
    if (files.some(({ file }) => file.size > 20 * 1024 * 1024 || file.type !== 'application/pdf')) return NextResponse.json({ detail: 'Les documents doivent être des PDF de 20 Mo maximum.' }, { status: 422 })
    await client.query('BEGIN')
    const result = await client.query(`INSERT INTO contrats(id, reference, criticality, fournisseur, donnees)
      VALUES($1,$2,$3,$4,$5::jsonb) RETURNING id, reference`, [contract.id, contract.reference, contract.criticality, contract.supplier.name, JSON.stringify(contract)])
    for (const { file, kind } of files) await client.query('INSERT INTO documents_contrats(contrat_id, nom, type_document, type_mime, contenu) VALUES($1,$2,$3,$4,$5)', [contract.id, file.name, kind, file.type || 'application/pdf', Buffer.from(await file.arrayBuffer())])
    await client.query('COMMIT')
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('POST /api/contrats failed', error)
    return NextResponse.json({ detail: 'Enregistrement impossible; référence déjà utilisée ou base indisponible.' }, { status: 409 })
  } finally { client.release() }
}
