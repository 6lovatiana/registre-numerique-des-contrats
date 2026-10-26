import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const result = await db.query(`SELECT c.donnees, COALESCE(jsonb_agg(jsonb_build_object('id', d.id, 'name', d.nom, 'kind', d.type_document)) FILTER (WHERE d.id IS NOT NULL), '[]'::jsonb) AS documents
      FROM contrats c LEFT JOIN documents_contrats d ON d.contrat_id=c.id GROUP BY c.id ORDER BY c.date_creation DESC`)
    return NextResponse.json(result.rows.map((row) => ({ ...row.donnees, documents: row.documents })))
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
