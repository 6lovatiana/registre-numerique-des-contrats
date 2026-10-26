'use client'

import { Bar, Panel, PanelHeader, Stat } from '@/components/registry/bits'
import { formatCompactEUR, formatEUR, formatPercent } from '@/lib/format'
import { avgPerformance, contractLeakage, performanceDistribution, renewalVsTermination, topSuppliers } from '@/lib/metrics'
import type { Contract } from '@/lib/types'

export function PurchasingView({ contracts }: { contracts: Contract[] }) {
  const total = contracts.reduce((s, c) => s + c.amount, 0)
  const top = topSuppliers(contracts)
  const rvt = renewalVsTermination(contracts)
  const leak = contractLeakage(contracts)
  const perf = avgPerformance(contracts)
  const dist = performanceDistribution(contracts)
  const maxDist = Math.max(...dist.map((d) => d.count), 1)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Valeur totale du portefeuille" value={formatCompactEUR(total)} hint={`${contracts.length} contrats`} />
        <Stat label="Taux de renouvellement" value={formatPercent(rvt.rate)} tone="success" hint={`${rvt.renewed} renouvelés · ${rvt.terminated} résiliés`} />
        <Stat label="Fuite contractuelle" value={formatCompactEUR(leak.total)} tone="warning" hint="Dépassements + achats hors contrat" />
        <Stat label="Score fournisseurs moyen" value={`${perf.toFixed(1)} / 100`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader title="Top 10 fournisseurs par valeur" description="Montant HT cumulé et score de performance moyen" />
          <ol className="flex flex-col gap-3">
            {top.map((s, i) => (
              <li key={s.name} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3 text-sm">
                <span className="text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-medium">{s.name}</span>
                    <span className="shrink-0 text-xs tabular-nums">{formatEUR(s.value)}</span>
                  </div>
                  <div className="mt-1.5">
                    <Bar value={s.value} max={top[0]?.value ?? 1} />
                  </div>
                </div>
                <span className="w-14 text-right text-xs text-muted-foreground tabular-nums">{s.score.toFixed(0)} pts</span>
              </li>
            ))}
          </ol>
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel>
            <PanelHeader title="Renouvellement vs résiliation" description="Dernières décisions enregistrées" />
            <div className="flex h-3 overflow-hidden rounded-full bg-muted">
              <div className="bg-success" style={{ width: `${rvt.rate * 100}%` }} />
              <div className="bg-destructive" style={{ width: `${(1 - rvt.rate) * 100}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <span>Renouvelés · {rvt.renewed}</span>
              <span>Résiliés · {rvt.terminated}</span>
            </div>
          </Panel>
          <Panel>
            <PanelHeader title="Fuite contractuelle" />
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Dépassements budgétaires</dt>
                <dd className="font-medium tabular-nums">{formatEUR(leak.overspend)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Achats hors conformité (4 %)</dt>
                <dd className="font-medium tabular-nums">{formatEUR(leak.offContract)}</dd>
              </div>
            </dl>
          </Panel>
          <Panel>
            <PanelHeader title="Répartition des scores fournisseurs" />
            <div className="flex h-28 items-end gap-3">
              {dist.map((d, i) => (
                <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs tabular-nums">{d.count}</span>
                  <div
                    className={i === 0 ? 'w-full rounded-t bg-destructive' : i === 1 ? 'w-full rounded-t bg-warning' : 'w-full rounded-t bg-primary'}
                    style={{ height: `${(d.count / maxDist) * 72}px` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{d.label}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
