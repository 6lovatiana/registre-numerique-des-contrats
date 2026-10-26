'use client'

import Link from 'next/link'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CriticalityBadge, DaysBadge, Panel, PanelHeader, Stat } from '@/components/registry/bits'
import { daysLeft } from '@/lib/alerts'
import { formatCompactEUR, formatDate, formatEUR, formatPercent } from '@/lib/format'
import { ESCALATION_THRESHOLD } from '@/lib/mock-data'
import { OPEN_DISPUTE, contractLeakage, redAlerts, renewalVsTermination, tacitExposure } from '@/lib/metrics'
import { useRegistry } from '@/lib/store'
import type { Contract } from '@/lib/types'

export function ExecutiveView({ contracts }: { contracts: Contract[] }) {
  const { disputes, decisions, decide, contractById } = useRegistry()
  const total = contracts.reduce((s, c) => s + c.amount, 0)
  const red = redAlerts(contracts)
  const major = disputes.filter((d) => {
    const c = contractById(d.contractId)
    return OPEN_DISPUTE(d) && (d.amountAtStake > ESCALATION_THRESHOLD || c?.criticality === 'Critique')
  })
  const pending = decisions.filter((d) => d.status === 'En attente')

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Valeur sous gestion" value={formatCompactEUR(total)} />
        <Stat label="Contrats en alerte rouge" value={red.length} tone="danger" />
        <Stat label="Litiges majeurs" value={major.length} tone="warning" hint={`Seuil d’escalade ${formatCompactEUR(ESCALATION_THRESHOLD)}`} />
        <Stat label="Taux de renouvellement" value={formatPercent(renewalVsTermination(contracts).rate)} />
        <Stat label="Risque financier 90 j" value={formatCompactEUR(tacitExposure(contracts).total + contractLeakage(contracts).total)} hint="Reconduction + fuite" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="border-destructive/30">
          <PanelHeader title="Contrats critiques en alerte rouge" description="J-10 ou J-30 sur contrat Critique" />
          <ul className="divide-y">
            {red.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.supplier.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.reference} · {formatEUR(c.amount)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <CriticalityBadge value={c.criticality} />
                  <DaysBadge days={daysLeft(c)} />
                </div>
              </li>
            ))}
            {red.length === 0 && <li className="py-6 text-center text-xs text-muted-foreground">Aucune alerte rouge</li>}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader title="Décisions à prendre" description="Approbations requises de la Direction Générale" />
          <ul className="flex flex-col gap-3">
            {decisions.map((d) => {
              const c = contractById(d.contractId)
              return (
                <li key={d.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{d.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {c?.reference} · {formatEUR(d.amount)} · avant le {formatDate(d.dueDate)}
                      </p>
                    </div>
                    {d.status !== 'En attente' && (
                      <span className={d.status === 'Approuvée' ? 'text-xs font-medium text-success' : 'text-xs font-medium text-destructive'}>{d.status}</span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-pretty text-muted-foreground">{d.context}</p>
                  {d.status === 'En attente' && (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={() => (decide(d.id, 'Approuvée'), toast.success('Décision approuvée', { description: d.title }))}>
                        <Check data-icon="inline-start" aria-hidden />
                        Approuver
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => (decide(d.id, 'Rejetée'), toast('Décision rejetée', { description: d.title }))}>
                        <X data-icon="inline-start" aria-hidden />
                        Rejeter
                      </Button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          {pending.length === 0 && <p className="mt-3 text-xs text-muted-foreground">Toutes les décisions ont été traitées.</p>}
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Litiges majeurs"
          action={
            <Link href="/litiges" className="text-xs font-medium text-primary hover:underline">
              Voir le workflow
            </Link>
          }
        />
        <ul className="divide-y">
          {major.map((d) => (
            <li key={d.id}>
              <Link href={`/litiges?id=${d.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:bg-muted/50">
                <div className="min-w-0">
                  <p className="font-medium tabular-nums">{d.id}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {contractById(d.contractId)?.supplier.name} · {d.type}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="tabular-nums">{formatEUR(d.amountAtStake)}</p>
                  <p className="text-xs text-muted-foreground">{d.status}</p>
                </div>
              </Link>
            </li>
          ))}
          {major.length === 0 && <li className="py-6 text-center text-xs text-muted-foreground">Aucun litige majeur</li>}
        </ul>
      </Panel>
    </div>
  )
}
