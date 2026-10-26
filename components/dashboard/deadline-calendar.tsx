'use client'

import { useMemo, useState } from 'react'
import { CriticalityBadge, DaysBadge, Panel, PanelHeader } from '@/components/registry/bits'
import { TODAY, addDays, parseISO, referenceDate, referenceLabel } from '@/lib/alerts'
import { formatDate, formatEUR } from '@/lib/format'
import type { Contract } from '@/lib/types'
import { cn } from '@/lib/utils'

const HORIZON = 90
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function DeadlineCalendar({ contracts }: { contracts: Contract[] }) {
  const byDay = useMemo(() => {
    const map = new Map<string, Contract[]>()
    for (const c of contracts) {
      const ref = referenceDate(c)
      if (ref < TODAY || ref > addDays(TODAY, HORIZON)) continue
      map.set(ref, [...(map.get(ref) ?? []), c])
    }
    return map
  }, [contracts])

  const firstWithItems = [...byDay.keys()].sort()[0] ?? TODAY
  const [selected, setSelected] = useState(firstWithItems)

  const leading = (parseISO(TODAY).getUTCDay() + 6) % 7
  const days = Array.from({ length: HORIZON + 1 }, (_, i) => addDays(TODAY, i))
  const items = byDay.get(selected) ?? []

  return (
    <Panel>
      <PanelHeader
        title="Calendrier des échéances · 90 jours"
        description="Date de référence : limite de préavis (reconduction tacite) ou échéance"
        action={
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Legend className="bg-destructive" label="≤ 10 j" />
            <Legend className="bg-warning" label="≤ 30 j" />
            <Legend className="bg-primary" label="≤ 90 j" />
          </div>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground" aria-hidden>
            {WEEKDAYS.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: leading }, (_, i) => (
              <span key={`pad-${i}`} />
            ))}
            {days.map((iso, i) => {
              const n = byDay.get(iso)?.length ?? 0
              const tone = i <= 10 ? 'bg-destructive' : i <= 30 ? 'bg-warning' : 'bg-primary'
              const date = parseISO(iso)
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelected(iso)}
                  aria-pressed={selected === iso}
                  aria-label={`${formatDate(iso)} : ${n} échéance${n > 1 ? 's' : ''}`}
                  className={cn(
                    'relative flex aspect-square flex-col items-center justify-center rounded-md border text-xs tabular-nums transition-colors',
                    n > 0 ? 'bg-background hover:bg-muted' : 'border-transparent text-muted-foreground/70',
                    selected === iso && 'border-foreground ring-1 ring-foreground',
                    iso === TODAY && 'font-semibold text-foreground',
                  )}
                >
                  <span>{date.getUTCDate()}</span>
                  {date.getUTCDate() === 1 && (
                    <span className="absolute top-0.5 left-1 text-[8px] uppercase text-muted-foreground">
                      {date.toLocaleDateString('fr-FR', { month: 'short', timeZone: 'UTC' })}
                    </span>
                  )}
                  {n > 0 && (
                    <span className={cn('mt-0.5 rounded-full px-1 text-[9px] leading-3 text-primary-foreground', tone, i > 10 && i <= 30 && 'text-foreground')}>{n}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-semibold">{formatDate(selected)}</p>
          {items.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">Aucune échéance ce jour.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {items.map((c) => (
                <li key={c.id} className="rounded-md border bg-card p-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium tabular-nums">{c.reference}</span>
                    <DaysBadge days={Math.round((parseISO(selected).getTime() - parseISO(TODAY).getTime()) / 86_400_000)} />
                  </div>
                  <p className="mt-1 truncate font-medium">{c.supplier.name}</p>
                  <p className="text-muted-foreground">{referenceLabel(c)}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="tabular-nums">{formatEUR(c.amount)}</span>
                    <CriticalityBadge value={c.criticality} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn('size-2 rounded-full', className)} aria-hidden />
      {label}
    </span>
  )
}
