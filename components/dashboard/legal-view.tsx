'use client'

import Link from 'next/link'
import { Bar, DaysBadge, Panel, PanelHeader, Stat } from '@/components/registry/bits'
import { alertBucket, daysLeft, referenceLabel } from '@/lib/alerts'
import { formatEUR, formatPercent } from '@/lib/format'
import { OPEN_DISPUTE, averageLifecycleMonths, renewalPipeline } from '@/lib/metrics'
import { useRegistry } from '@/lib/store'
import type { Contract } from '@/lib/types'

export function LegalView({ contracts }: { contracts: Contract[] }) {
  const { disputes } = useRegistry()
  const pipeline = renewalPipeline(contracts)
  const j30 = contracts.filter((c) => alertBucket(c) === 'J-30').length
  const j10 = contracts.filter((c) => alertBucket(c) === 'J-10').length
  const ids = new Set(contracts.map((c) => c.id))
  const open = disputes.filter((d) => OPEN_DISPUTE(d) && ids.has(d.contractId)).length
  const compliance = contracts.length ? contracts.filter((c) => c.compliant).length / contracts.length : 0
  const columns = [
    { label: '0 – 30 jours', items: pipeline.d30, tone: 'danger' as const },
    { label: '31 – 60 jours', items: pipeline.d60, tone: 'warning' as const },
    { label: '61 – 90 jours', items: pipeline.d90, tone: 'primary' as const },
  ]
  const maxCount = Math.max(...columns.map((c) => c.items.length), 1)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Alertes J-30" value={j30} tone="warning" hint="11 à 30 jours" />
        <Stat label="Alertes J-10" value={j10} tone="danger" hint="0 à 10 jours" />
        <Stat label="Litiges ouverts" value={open} />
        <Stat label="Taux de conformité" value={formatPercent(compliance)} tone="success" />
        <Stat label="Cycle de vie moyen" value={`${averageLifecycleMonths(contracts).toFixed(1)} mois`} />
      </div>

      <Panel>
        <PanelHeader
          title="Pipeline de renouvellement"
          description="Contrats arrivant à leur date de référence"
          action={
            <Link href="/alertes" className="text-xs font-medium text-primary hover:underline">
              Ouvrir le moteur d’alertes
            </Link>
          }
        />
        <div className="grid gap-4 md:grid-cols-3">
          {columns.map((col) => (
            <div key={col.label} className="rounded-lg border">
              <div className="border-b p-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{col.label}</span>
                  <span className="text-lg font-semibold tabular-nums">{col.items.length}</span>
                </div>
                <div className="mt-2">
                  <Bar value={col.items.length} max={maxCount} tone={col.tone} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground tabular-nums">{formatEUR(col.items.reduce((s, c) => s + c.amount, 0))} HT</p>
              </div>
              <ul className="max-h-72 divide-y overflow-y-auto">
                {[...col.items]
                  .sort((a, b) => daysLeft(a) - daysLeft(b))
                  .map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{c.supplier.name}</p>
                        <p className="truncate text-muted-foreground">
                          {c.reference} · {referenceLabel(c)}
                        </p>
                      </div>
                      <DaysBadge days={daysLeft(c)} />
                    </li>
                  ))}
                {col.items.length === 0 && <li className="px-3 py-6 text-center text-xs text-muted-foreground">Aucun contrat</li>}
              </ul>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
