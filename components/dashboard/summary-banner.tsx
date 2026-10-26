'use client'

import { formatCompactEUR, formatPercent } from '@/lib/format'
import { portfolioSummary } from '@/lib/metrics'
import { useRegistry } from '@/lib/store'
import { cn } from '@/lib/utils'

export function SummaryBanner() {
  const { contracts, disputes } = useRegistry()
  const s = portfolioSummary(contracts, disputes)
  const items = [
    { label: 'Contrats actifs', value: s.count },
    { label: 'Valeur totale', value: formatCompactEUR(s.total) },
    { label: 'Alertes J-30', value: s.j30, tone: 'warning' },
    { label: 'Alertes J-10', value: s.j10, tone: 'danger' },
    { label: 'Conformité', value: formatPercent(s.compliance), tone: 'success' },
    { label: 'Litiges ouverts', value: s.openDisputes },
  ] as const

  return (
    <section aria-label="Synthèse du portefeuille" className="overflow-hidden rounded-xl bg-primary text-primary-foreground">
      <dl className="grid grid-cols-2 divide-primary-foreground/15 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x">
        {items.map((i) => (
          <div key={i.label} className="px-5 py-4">
            <dt className="text-xs text-primary-foreground/70">{i.label}</dt>
            <dd className="mt-1 flex items-center gap-2 font-display text-lg tabular-nums">
              {'tone' in i && (
                <span
                  aria-hidden
                  className={cn('size-2 rounded-full', i.tone === 'warning' && 'bg-warning', i.tone === 'danger' && 'bg-destructive', i.tone === 'success' && 'bg-success')}
                />
              )}
              {i.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
