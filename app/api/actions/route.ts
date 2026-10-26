import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
const ALLOWED = ['Renouvellement', 'Renégociation', 'Résiliation']

export async function GET() {
  try {
    const result = await db.query('SELECT contrat_id AS "contractId", action, date_action AS at, id_utilisateur AS "userId" FROM actions_contrats ORDER BY date_action DESC')
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('GET /api/actions failed', error)
    return NextResponse.json({ detail: 'Erreur de lecture des actions.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { contractId, action } = await request.json()
    if (!contractId || !ALLOWED.includes(action)) return NextResponse.json({ detail: 'Action invalide.' }, { status: 422 })
    const result = await db.query('INSERT INTO actions_contrats(contrat_id, action, id_utilisateur) VALUES($1,$2,$3) RETURNING contrat_id AS "contractId", action, date_action AS at, id_utilisateur AS "userId"', [contractId, action, request.headers.get('x-user-id') ?? 'USR-JUR-014'])
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('POST /api/actions failed', error)
    return NextResponse.json({ detail: 'Enregistrement de l’action impossible.' }, { status: 500 })
  }
}
