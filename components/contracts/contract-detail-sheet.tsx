'use client'

import { AlertTriangle, Download, FileText, Printer, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRegistry } from '@/lib/store'
import { AlertTimeline } from '@/components/alerts/alert-timeline'
import { CriticalityBadge, DaysBadge } from '@/components/registry/bits'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { daysLeft, noticeDeadline } from '@/lib/alerts'
import { formatDate, formatMGA } from '@/lib/format'
import { exportContractPdf, exportContractWord } from '@/lib/contract-document-export'
import type { Contract } from '@/lib/types'

export function ContractDetailSheet({ contract, onClose }: { contract: Contract | null; onClose: () => void }) {
  return (
    <Sheet open={contract !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        {contract && <Detail c={contract} />}
      </SheetContent>
    </Sheet>
  )
}

function Detail({ c }: { c: Contract }) {
  const { prolongContract } = useRegistry()
  const [newEndDate, setNewEndDate] = useState('')
  const [renewalConfirmed, setRenewalConfirmed] = useState(false)
  const [savingExtension, setSavingExtension] = useState(false)
  const deadline = noticeDeadline(c)
  const saveExtension = async () => {
    setSavingExtension(true)
    try {
      await prolongContract(c.id, newEndDate)
      toast.success('Contrat prolongé', { description: `Nouvelle échéance : ${formatDate(newEndDate)}.` })
      setNewEndDate('')
    } catch (error) { toast.error('Prolongation impossible', { description: error instanceof Error ? error.message : 'Réessayez.' }) }
    finally { setSavingExtension(false) }
  }
  return (
    <>
      <SheetHeader className="border-b">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground tabular-nums">{c.reference}</span>
          <DaysBadge days={daysLeft(c)} />
          <CriticalityBadge value={c.criticality} />
        </div>
        <SheetTitle className="text-lg">{c.supplier.name}</SheetTitle>
        <SheetDescription>
          {c.type} · {c.object}
        </SheetDescription>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="button" size="sm" variant="outline" onClick={() => { if (!exportContractPdf(c)) toast.error('Autorisez les fenêtres pop-up pour imprimer le projet PDF.') }}><Printer data-icon="inline-start" aria-hidden />Projet PDF</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => { exportContractWord(c); toast.success('Projet Word téléchargé') }}><Download data-icon="inline-start" aria-hidden />Projet Word</Button>
        </div>
      </SheetHeader>

      <div className="flex flex-col gap-6 p-4">
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cycle d’alertes</h3>
          <AlertTimeline contract={c} />
        </section>

        <Group title="Identification">
          <Row label="Signature" value={formatDate(c.signatureDate)} />
          <Row label="Date d’effet" value={formatDate(c.effectiveDate)} />
          <Row label="Échéance" value={formatDate(c.endDate)} />
          <Row label="Durée" value={`${c.durationMonths} mois`} />
        </Group>

        <section className="rounded-lg border bg-muted/20 p-3">
          <h3 className="text-sm font-semibold">Prolonger le contrat</h3>
          <p className="mt-1 text-xs text-muted-foreground">Vérifiez les conditions du contrat avant toute prolongation : reconduction tacite, durée prévue et délai de préavis.</p>
          <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
            <li>Reconduction tacite : {c.tacitRenewal ? `oui, ${c.renewalMonths ?? 'durée non précisée'} mois` : 'non prévue dans la fiche'}.</li>
            <li>Préavis contractuel : {c.noticeDays ? `${c.noticeDays} jours (limite ${deadline ? formatDate(deadline) : 'à vérifier'})` : 'non renseigné'}.</li>
            <li>La date retenue doit être conforme à l’avenant ou à l’accord signé.</li>
          </ul>
          <label className="mt-3 flex items-start gap-2 text-xs"><input type="checkbox" checked={renewalConfirmed} onChange={(event) => setRenewalConfirmed(event.target.checked)} />J’ai vérifié les conditions de renouvellement et dispose de l’accord ou de l’avenant nécessaire.</label>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-xs font-medium">Nouvelle échéance
              <Input type="date" min={c.endDate} value={newEndDate} onChange={(event) => setNewEndDate(event.target.value)} aria-label="Nouvelle date d’échéance" />
            </label>
            <Button type="button" disabled={!renewalConfirmed || !newEndDate || newEndDate <= c.endDate || savingExtension} onClick={() => void saveExtension()}>{savingExtension ? 'Enregistrement…' : 'Enregistrer la prolongation'}</Button>
          </div>
        </section>

        <Group title="Fournisseur">
          <Row label="Raison sociale" value={c.supplier.name} />
          <Row label="NIF" value={c.supplier.nif} />
          <Row label="Contact juridique" value={c.supplier.legalContact} />
          <Row label="Email" value={c.supplier.email} />
          <Row label="Département" value={c.department} />
          <Row label="Responsable interne" value={c.owner} />
        </Group>

        <Group title="Financier">
          <Row label="Montant HT" value={formatMGA(c.amount)} />
          <Row label="Devise" value={c.currency} />
          <Row label="Facturation" value={c.billing} />
          <Row label="Paiement" value={c.paymentTerms} />
          <Row label="Révision de prix" value={c.priceRevision ? `Oui · ${c.priceIndex}` : 'Non'} />
          <Row label="Budget / Réalisé" value={`${formatMGA(c.budget)} / ${formatMGA(c.actualSpent)}`} />
        </Group>

        <Group title="Reconduction & résiliation">
          <Row label="Reconduction tacite" value={c.tacitRenewal ? 'Oui' : 'Non'} />
          {c.tacitRenewal && <Row label="Durée de reconduction" value={`${c.renewalMonths} mois`} />}
          <Row label="Préavis" value={c.noticeDays ? `${c.noticeDays} jours` : '—'} />
          <Row label="Date limite de préavis" value={deadline ? formatDate(deadline) : '—'} />
          <Row label="Mode de résiliation" value={c.terminationMode} />
        </Group>

        <Group title="Clauses & garanties">
          <Row label="Pénalités de retard" value={c.latePenalty ? `${c.latePenaltyRate} %/sem. · plafond ${c.latePenaltyCap} %` : 'Non'} />
          <Row label="Pénalité résiliation anticipée" value={c.earlyTerminationPenalty ? formatMGA(c.earlyTerminationAmount ?? 0) : 'Non'} />
          <Row label="Garantie bancaire" value={c.bankGuarantee ? formatMGA(c.guaranteeAmount ?? 0) : 'Non'} />
          <Row label="Score de performance" value={`${c.performanceScore} / 100`} />
        </Group>

        {c.aiAnalysis && (
          <section className="rounded-xl border border-primary/20 bg-accent/20 p-4">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="size-4" aria-hidden /> Fiche d’analyse IA
            </h3>
            <p className="text-sm leading-relaxed">{c.aiAnalysis.summary}</p>
            {c.aiAnalysis.clauses.length > 0 && (
              <div className="mt-4">
                <h4 className="mb-2 text-xs font-semibold text-muted-foreground">Clauses repérées</h4>
                <ul className="flex flex-col gap-2">
                  {c.aiAnalysis.clauses.map((clause, index) => (
                    <li key={`${clause.title}-${index}`} className="rounded-lg border bg-card p-3">
                      <p className="text-sm font-medium">{clause.title} · {clause.status === 'present' ? 'Repérée' : clause.status === 'not_found' ? 'Non repérée dans le texte' : 'À vérifier'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{clause.summary}</p>
                      {clause.evidence && <blockquote className="mt-2 border-l-2 pl-2 text-xs italic text-muted-foreground">« {clause.evidence} »</blockquote>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {c.aiAnalysis.vigilance.length > 0 && (
              <div className="mt-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><AlertTriangle className="size-3.5" aria-hidden /> Points de vigilance</h4>
                <ul className="flex flex-col gap-2">
                  {c.aiAnalysis.vigilance.map((item, index) => (
                    <li key={`${item.title}-${index}`} className="rounded-lg border bg-card p-3">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                      {item.evidence && <blockquote className="mt-2 border-l-2 pl-2 text-xs italic text-muted-foreground">« {item.evidence} »</blockquote>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">Analyse automatique indicative, à confirmer par le service juridique.</p>
          </section>
        )}

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Documents</h3>
          <ul className="flex flex-col gap-1.5">
            {c.documents.map((d) => (
              <li key={d.name} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <FileText className="size-4 text-muted-foreground" aria-hidden />
                {d.id ? <a className="flex-1 truncate underline-offset-2 hover:underline" href={`/api/documents/${d.id}`} target="_blank" rel="noreferrer" aria-label={`Ouvrir le document ${d.name}`}>{d.name}</a> : <span className="flex-1 truncate">{d.name}</span>}
                <span className="text-xs text-muted-foreground">{d.kind}</span>
              </li>
            ))}
          </ul>
          {c.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.tags.map((t) => (
                <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-xs">
                  #{t}
                </span>
              ))}
            </div>
          )}
          {c.notes && <p className="mt-3 text-sm text-muted-foreground">{c.notes}</p>}
        </section>
      </div>
    </>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-lg border p-3 sm:grid-cols-2">{children}</dl>
    </section>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-sm sm:flex-col sm:justify-start sm:gap-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium sm:text-left">{value}</dd>
    </div>
  )
}
