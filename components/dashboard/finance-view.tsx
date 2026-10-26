'use client'

import { Bar, DaysBadge, Panel, PanelHeader, Stat } from '@/components/registry/bits'
import { daysLeft } from '@/lib/alerts'
import { formatCompactEUR, formatEUR, formatPercent } from '@/lib/format'
import { budgetVsActual, futureCommitments, potentialLatePenalties, tacitExposure } from '@/lib/metrics'
import type { Contract } from '@/lib/types'

export function FinanceView({ contracts }: { contracts: Contract[] }) {
  const commitments = futureCommitments(contracts)
  const penalties = potentialLatePenalties(contracts)
  const tacit = tacitExposure(contracts)
  const budget = budgetVsActual(contracts)
  const maxBudget = Math.max(...budget.map((b) => Math.max(b.budget, b.actual)), 1)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {commitments.map((c) => (
          <Stat key={c.horizon} label={`Engagements ${c.horizon} jours`} value={formatCompactEUR(c.value)} />
        ))}
        <Stat label="Pénalités de retard potentielles" value={formatCompactEUR(penalties.total)} tone="success" hint={`${penalties.items.length} contrats concernés`} />
        <Stat label="Exposition reconduction tacite" value={formatCompactEUR(tacit.total)} tone="warning" hint="Sous 90 jours" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Budget vs réalisé par département" description="Barre foncée : budget · barre claire : réalisé" />
          <ul className="flex flex-col gap-4">
            {budget.map((b) => {
              const ratio = b.budget ? b.actual / b.budget : 0
              return (
                <li key={b.department} className="text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{b.department}</span>
                    <span className={ratio > 1 ? 'text-xs font-medium text-destructive tabular-nums' : 'text-xs text-muted-foreground tabular-nums'}>
                      {formatPercent(ratio)} · {formatCompactEUR(b.actual)} / {formatCompactEUR(b.budget)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-col gap-1">
                    <Bar value={b.budget} max={maxBudget} />
                    <Bar value={b.actual} max={maxBudget} tone={ratio > 1 ? 'danger' : 'success'} />
                  </div>
                </li>
              )
            })}
          </ul>
        </Panel>

        <div className="flex flex-col gap-6">
          <ExposureList title="Exposition liée à la reconduction tacite" description="Valeur de la période reconduite si le préavis n’est pas émis" items={tacit.items} />
          <ExposureList title="Pénalités de retard récupérables" description="Estimation plafonnée selon les clauses contractuelles" items={penalties.items} />
        </div>
      </div>
    </div>
  )
}

function ExposureList({ title, description, items }: { title: string; description: string; items: { contract: Contract; value: number }[] }) {
  return (
    <Panel>
      <PanelHeader title={title} description={description} />
      <ul className="max-h-64 divide-y overflow-y-auto">
        {items.slice(0, 12).map(({ contract: c, value }) => (
          <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{c.supplier.name}</p>
              <p className="text-xs text-muted-foreground tabular-nums">{c.reference}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="tabular-nums">{formatEUR(value)}</span>
              <DaysBadge days={daysLeft(c)} />
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="py-6 text-center text-xs text-muted-foreground">Aucun contrat concerné</li>}
      </ul>
    </Panel>
  )
}
