'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { AlertTriangle, Plus, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatMGA } from '@/lib/format'
import { useRegistry } from '@/lib/store'
import { DISPUTE_TYPES, type DisputeType } from '@/lib/types'

const STATUTS = ['Nouveau', 'Pièces manquantes', 'Analyse interne', 'Réponse fournisseur attendue', 'Négociation', 'Avoir attendu', 'Contentieux'] as const
type Statut = (typeof STATUTS)[number] | 'Clôturé' | 'Abandonné'

interface Litige {
  id: number
  reference_litige: string
  contrat_id: number
  fournisseur?: string | null
  type_litige: string
  description: string
  montant_concerne: number | string
  statut: Statut
  priorite: 'Normale' | 'Haute'
  escalation_dg: boolean
  date_creation: string
}

/** Liste connectée à l'API locale; l'en-tête utilisateur sert uniquement au développement local. */
export function LitigesActifs() {
  const { contracts, createDispute } = useRegistry()
  const [litiges, setLitiges] = useState<Litige[]>([])
  const [statut, setStatut] = useState('')
  const [fournisseur, setFournisseur] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState<number | null>(null)
  const [creationOuverte, setCreationOuverte] = useState(false)
  const [contratId, setContratId] = useState('')
  const [typeLitige, setTypeLitige] = useState<DisputeType>('Manquement contractuel')
  const [description, setDescription] = useState('')
  const [montant, setMontant] = useState('0')
  const [creationEnCours, setCreationEnCours] = useState(false)
  const [litigeCible, setLitigeCible] = useState('')

  useEffect(() => {
    setLitigeCible(new URLSearchParams(window.location.search).get('id') ?? '')
  }, [])

  useEffect(() => {
    if (litigeCible && litiges.some((l) => l.reference_litige === litigeCible)) {
      document.getElementById(`litige-${litigeCible}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [litigeCible, litiges])

  const charger = useCallback(async () => {
    setChargement(true); setErreur('')
    try {
      const params = new URLSearchParams()
      if (statut) params.set('statut', statut)
      if (fournisseur.trim()) params.set('fournisseur', fournisseur.trim())
      const response = await fetch(`/api/litiges?${params}`, { cache: 'no-store' })
      if (!response.ok) throw new Error(`Erreur API (${response.status})`)
      setLitiges(await response.json())
    } catch (e) { setErreur(e instanceof Error ? e.message : 'Impossible de charger les litiges.') }
    finally { setChargement(false) }
  }, [statut, fournisseur])

  useEffect(() => { void charger() }, [charger])

  async function changerStatut(litige: Litige, nouveauStatut: Statut) {
    setEnCours(litige.id); setErreur('')
    try {
      const response = await fetch(`/api/litiges/${litige.id}/statut`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-User-ID': 'USR-LOCAL' },
        body: JSON.stringify({ statut: nouveauStatut }),
      })
      if (!response.ok) throw new Error((await response.json()).detail ?? 'Mise à jour impossible.')
      await charger()
    } catch (e) { setErreur(e instanceof Error ? e.message : 'Mise à jour impossible.') }
    finally { setEnCours(null) }
  }

  async function creerLitige(e: FormEvent) {
    e.preventDefault()
    const id = contratId || contracts[0]?.id
    if (!id) { setErreur('Ajoutez d’abord un contrat au registre.'); return }
    if (!description.trim()) { setErreur('Décrivez le différend avant de créer le litige.'); return }
    setCreationEnCours(true); setErreur('')
    try {
      const reference = await createDispute({ contractId: id, type: typeLitige, description: description.trim(), amountAtStake: Number(montant) || 0, source: 'Manuel' })
      setLitigeCible(reference)
      setDescription(''); setMontant('0'); setCreationOuverte(false)
      await charger()
    } catch (e) { setErreur(e instanceof Error ? e.message : 'Création du litige impossible.') }
    finally { setCreationEnCours(false) }
  }

  return <section className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-semibold">Litiges actifs</h1><p className="mt-1 text-sm text-muted-foreground">Suivi des dossiers et de leurs prochaines actions.</p></div>
      <div className="flex gap-2"><Button onClick={() => setCreationOuverte((open) => !open)}><Plus aria-hidden /> Nouveau litige</Button><Button variant="outline" onClick={() => void charger()} disabled={chargement}><RefreshCw aria-hidden /> Actualiser</Button></div>
    </div>
    {creationOuverte && <form onSubmit={creerLitige} className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2">
      <h2 className="font-semibold md:col-span-2">Signaler un différend</h2>
      <label className="grid gap-1 text-xs text-muted-foreground">Contrat<select required className="h-9 rounded-md border bg-background px-2 text-sm text-foreground" value={contratId || contracts[0]?.id || ''} onChange={(e) => setContratId(e.target.value)}><option value="" disabled>Sélectionner un contrat</option>{contracts.map((c) => <option key={c.id} value={c.id}>{c.reference} · {c.supplier.name}</option>)}</select></label>
      <label className="grid gap-1 text-xs text-muted-foreground">Type de litige<select className="h-9 rounded-md border bg-background px-2 text-sm text-foreground" value={typeLitige} onChange={(e) => setTypeLitige(e.target.value as DisputeType)}>{DISPUTE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
      <label className="grid gap-1 text-xs text-muted-foreground">Montant concerné (Ar)<Input type="number" min="0" step="1" value={montant} onChange={(e) => setMontant(e.target.value)} /></label>
      <label className="grid gap-1 text-xs text-muted-foreground md:col-span-2">Description<Textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décrivez les faits, les dates et les pièces concernées…" /></label>
      <div className="flex justify-end gap-2 md:col-span-2"><Button type="button" variant="outline" onClick={() => setCreationOuverte(false)}>Annuler</Button><Button type="submit" disabled={creationEnCours || contracts.length === 0}>{creationEnCours ? 'Création…' : 'Créer le litige'}</Button></div>
    </form>}
    <div className="flex flex-wrap gap-3">
      <label className="grid gap-1 text-xs text-muted-foreground">Statut<select className="h-9 min-w-52 rounded-md border bg-background px-2 text-sm text-foreground" value={statut} onChange={(e) => setStatut(e.target.value)}><option value="">Tous les statuts</option>{STATUTS.map((s) => <option key={s}>{s}</option>)}</select></label>
      <label className="grid gap-1 text-xs text-muted-foreground">Fournisseur<input className="h-9 min-w-56 rounded-md border bg-background px-3 text-sm text-foreground" value={fournisseur} onChange={(e) => setFournisseur(e.target.value)} placeholder="Nom du fournisseur" /></label>
    </div>
    {erreur && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{erreur}</p>}
    {chargement ? <p className="py-8 text-center text-sm text-muted-foreground">Chargement des litiges…</p> : litiges.length === 0 ? <p className="rounded-lg border p-8 text-center text-sm text-muted-foreground">Aucun litige actif pour ces filtres.</p> :
      <ul className="grid gap-3">{litiges.map((l) => <li id={`litige-${l.reference_litige}`} key={l.id} className={`scroll-mt-24 rounded-lg border bg-card p-4 ${l.escalation_dg ? 'border-amber-500/50' : ''} ${litigeCible === l.reference_litige ? 'ring-2 ring-primary/40' : ''}`}>
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{l.reference_litige}</h2><Badge variant="secondary">{l.statut}</Badge>{l.escalation_dg && <Badge variant="destructive"><AlertTriangle aria-hidden /> Alerte Direction Générale</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">{l.fournisseur ?? `Contrat ${l.contrat_id}`} · {l.type_litige} · {formatMGA(Number(l.montant_concerne))}</p><p className="mt-2 text-sm">{l.description}</p></div>
          <label className="grid gap-1 text-xs text-muted-foreground">Action rapide<select aria-label={`Nouveau statut pour ${l.reference_litige}`} disabled={enCours === l.id} className="h-9 rounded-md border bg-background px-2 text-sm text-foreground" value="" onChange={(e) => { if (e.target.value) void changerStatut(l, e.target.value as Statut) }}><option value="">Changer le statut…</option>{STATUTS.filter((s) => s !== l.statut).map((s) => <option key={s}>{s}</option>)}</select></label>
        </div>
      </li>)}</ul>}
  </section>
}
