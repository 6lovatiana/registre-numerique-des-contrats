import { MILESTONES, TODAY, daysLeft, diffDays, milestoneDate, referenceDate, referenceLabel } from '@/lib/alerts'
import { formatDate, formatShortDate } from '@/lib/format'
import type { Contract } from '@/lib/types'
import { cn } from '@/lib/utils'
import { MILESTONE_STYLE } from './milestone-style'
import { ChannelIcons } from './notification-center'

const SPAN = 100

export function AlertTimeline({ contract }: { contract: Contract }) {
  const ref = referenceDate(contract)
  const remaining = daysLeft(contract)
  const start = milestoneDate(contract, SPAN)
  const todayPos = Math.max(0, Math.min(100, (diffDays(start, TODAY) / SPAN) * 100))

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Référence de calcul : <span className="font-medium text-foreground">{referenceLabel(contract)}</span> ·{' '}
          {formatDate(ref)}
        </span>
        {contract.tacitRenewal && <span>Échéance contractuelle : {formatDate(contract.endDate)}</span>}
      </div>

      <div className="relative mx-4 mt-10 mb-4">
        <div className="h-1.5 rounded-full bg-muted" />
        <div className="absolute top-0 left-0 h-1.5 rounded-full bg-primary/25" style={{ width: `${todayPos}%` }} />

        {MILESTONES.map((m) => {
          const pos = ((SPAN - m.offset) / SPAN) * 100
          const passed = remaining <= m.offset
          return (
            <div key={m.level} className="absolute top-0 -translate-x-1/2" style={{ left: `${pos}%` }}>
              <span
                className={cn(
                  'block size-3.5 -translate-y-1 rounded-full border-2 border-card ring-4',
                  passed ? MILESTONE_STYLE[m.level].dot : 'bg-muted-foreground/30',
                  passed ? MILESTONE_STYLE[m.level].ring : 'ring-transparent',
                )}
              />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold">{m.level}</span>
            </div>
          )
        })}

        <div className="absolute top-0 -translate-x-1/2" style={{ left: '100%' }}>
          <span className="block h-5 w-0.5 -translate-y-2 bg-foreground" />
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold">J</span>
        </div>

        <div className="absolute top-0 -translate-x-1/2" style={{ left: `${todayPos}%` }}>
          <span className="block size-2.5 -translate-y-0.5 rotate-45 bg-primary" />
          <span className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
            {"Aujourd'hui"}
          </span>
        </div>
      </div>

      <ol className="mt-10 grid gap-2 sm:grid-cols-5">
        {MILESTONES.map((m) => {
          const passed = remaining <= m.offset
          const current = passed && (MILESTONES.find((x) => remaining <= x.offset && x.offset < m.offset) === undefined)
          return (
            <li
              key={m.level}
              className={cn(
                'rounded-lg border p-3 text-xs',
                passed ? 'bg-card' : 'bg-muted/40 text-muted-foreground',
                current && 'border-foreground/40 ring-2 ring-foreground/10',
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold', passed ? MILESTONE_STYLE[m.level].chip : 'bg-muted')}>
                  {m.level}
                </span>
                <ChannelIcons channels={m.channels} />
              </div>
              <p className="mt-2 font-medium text-foreground">{m.label}</p>
              <p className="tabular-nums">{formatShortDate(milestoneDate(contract, m.offset))}</p>
              <p className="mt-1">{passed ? (current ? 'Jalon en cours' : 'Notification émise') : 'Planifiée'}</p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
