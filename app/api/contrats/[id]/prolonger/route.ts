import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const endDate = typeof body.endDate === 'string' ? body.endDate : ''
  const parsedDate = new Date(`${endDate}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== endDate)
    return NextResponse.json({ detail: 'Date d’échéance invalide.' }, { status: 422 })
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const found = await client.query('SELECT donnees FROM contrats WHERE id=$1 FOR UPDATE', [id])
    if (!found.rowCount) { await client.query('ROLLBACK'); return NextResponse.json({ detail: 'Contrat introuvable.' }, { status: 404 }) }
    const contract = found.rows[0].donnees
    if (endDate <= contract.endDate) { await client.query('ROLLBACK'); return NextResponse.json({ detail: 'La nouvelle échéance doit être postérieure à l’échéance actuelle.' }, { status: 422 }) }
    const start = new Date(`${contract.effectiveDate}T00:00:00Z`)
    const end = new Date(`${endDate}T00:00:00Z`)
    const months = Math.max(1, (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth() + (end.getUTCDate() >= start.getUTCDate() ? 1 : 0))
    const updated = { ...contract, endDate, durationMonths: months }
    await client.query('UPDATE contrats SET donnees=$2::jsonb, date_modification=NOW() WHERE id=$1', [id, JSON.stringify(updated)])
    await client.query('INSERT INTO actions_contrats(contrat_id, action, id_utilisateur) VALUES($1,$2,$3)', [id, 'Prolongement', request.headers.get('x-user-id') ?? 'USR-JUR-014'])
    await client.query('COMMIT')
    return NextResponse.json(updated)
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('POST /api/contrats/[id]/prolonger failed', error)
    return NextResponse.json({ detail: 'Prolongation impossible.' }, { status: 500 })
  } finally { client.release() }
}
