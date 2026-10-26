'use client'

import { FileText } from 'lucide-react'
import { AlertTimeline } from '@/components/alerts/alert-timeline'
import { CriticalityBadge, DaysBadge } from '@/components/registry/bits'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { daysLeft, noticeDeadline } from '@/lib/alerts'
import { formatDate, formatEUR } from '@/lib/format'
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
  const deadline = noticeDeadline(c)
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

        <Group title="Fournisseur">
          <Row label="Raison sociale" value={c.supplier.name} />
          <Row label="SIRET" value={c.supplier.siret} />
          <Row label="Contact juridique" value={c.supplier.legalContact} />
          <Row label="Email" value={c.supplier.email} />
          <Row label="Département" value={c.department} />
          <Row label="Responsable interne" value={c.owner} />
        </Group>

        <Group title="Financier">
          <Row label="Montant HT" value={formatEUR(c.amount)} />
          <Row label="Devise" value={c.currency} />
          <Row label="Facturation" value={c.billing} />
          <Row label="Paiement" value={c.paymentTerms} />
          <Row label="Révision de prix" value={c.priceRevision ? `Oui · ${c.priceIndex}` : 'Non'} />
          <Row label="Budget / Réalisé" value={`${formatEUR(c.budget)} / ${formatEUR(c.actualSpent)}`} />
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
          <Row label="Pénalité résiliation anticipée" value={c.earlyTerminationPenalty ? formatEUR(c.earlyTerminationAmount ?? 0) : 'Non'} />
          <Row label="Garantie bancaire" value={c.bankGuarantee ? formatEUR(c.guaranteeAmount ?? 0) : 'Non'} />
          <Row label="Score de performance" value={`${c.performanceScore} / 100`} />
        </Group>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Documents</h3>
          <ul className="flex flex-col gap-1.5">
            {c.documents.map((d) => (
              <li key={d.name} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <FileText className="size-4 text-muted-foreground" aria-hidden />
                {d.id ? <a className="flex-1 truncate underline-offset-2 hover:underline" href={`/api/documents/${d.id}`} target="_blank" rel="noreferrer">{d.name}</a> : <span className="flex-1 truncate">{d.name}</span>}
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
