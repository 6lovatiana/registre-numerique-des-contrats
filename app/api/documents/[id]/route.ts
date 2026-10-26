import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await db.query('SELECT nom, type_mime, contenu FROM documents_contrats WHERE id=$1', [id])
    if (!result.rowCount) return NextResponse.json({ detail: 'Document introuvable.' }, { status: 404 })
    const document = result.rows[0]
    return new Response(document.contenu, { headers: { 'Content-Type': document.type_mime, 'Content-Disposition': `inline; filename="${encodeURIComponent(document.nom)}"`, 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('GET /api/documents/[id] failed', error)
    return NextResponse.json({ detail: 'Lecture du document impossible.' }, { status: 500 })
  }
}
