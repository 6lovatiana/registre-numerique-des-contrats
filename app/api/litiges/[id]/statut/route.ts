import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
const STATUTS = ['Nouveau', 'Pièces manquantes', 'Analyse interne', 'Réponse fournisseur attendue', 'Négociation', 'Avoir attendu', 'Contentieux', 'Clôturé', 'Abandonné']

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { statut } = await request.json()
    if (!STATUTS.includes(statut)) return NextResponse.json({ detail: 'Statut invalide.' }, { status: 422 })
    const result = await db.query(`UPDATE litiges SET statut=$1, id_utilisateur_action=$2, date_modification=NOW() WHERE (id::text=$3 OR reference_litige=$3) AND statut NOT IN ('Clôturé','Abandonné') RETURNING *`, [statut, request.headers.get('x-user-id') ?? 'USR-LOCAL', id])
    if (!result.rowCount) return NextResponse.json({ detail: 'Litige introuvable ou déjà clôturé.' }, { status: 404 })
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('PUT /api/litiges/[id]/statut failed', error)
    return NextResponse.json({ detail: 'Mise à jour impossible.' }, { status: 500 })
  }
}
