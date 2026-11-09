import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
const STATUSES = ['Approuvée', 'Rejetée']

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { status } = await request.json()
    if (!STATUSES.includes(status)) return NextResponse.json({ detail: 'Décision invalide.' }, { status: 422 })
    const result = await db.query(`UPDATE decisions SET statut=$1 WHERE id=$2 AND statut='En attente' RETURNING id, statut AS status`, [status, id])
    if (!result.rowCount) return NextResponse.json({ detail: 'Décision introuvable ou déjà traitée.' }, { status: 404 })
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('PUT /api/decisions/[id]/statut failed', error)
    return NextResponse.json({ detail: 'Mise à jour de la décision impossible.' }, { status: 500 })
  }
}
