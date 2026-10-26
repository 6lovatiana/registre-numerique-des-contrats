'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Mail, MessageSquare, LayoutDashboard, Smartphone } from 'lucide-react'
import { currentMilestone, daysLeft, milestoneDate, milestoneTemplate, type Channel } from '@/lib/alerts'
import { formatShortDate } from '@/lib/format'
import { useRegistry } from '@/lib/store'
import type { AlertLevel, Contract } from '@/lib/types'
import { cn } from '@/lib/utils'
import { MILESTONE_STYLE } from './milestone-style'

const CHANNEL_ICON: Record<Channel, typeof Mail> = {
  Email: Mail,
  SMS: MessageSquare,
  'Tableau de bord': LayoutDashboard,
  Push: Smartphone,
}

export function ChannelIcons({ channels }: { channels: Channel[] }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      {channels.map((ch) => {
        const Icon = CHANNEL_ICON[ch]
        return (
          <span key={ch} title={ch} className="flex items-center">
            <Icon className="size-3.5" aria-hidden />
            <span className="sr-only">{ch}</span>
          </span>
        )
      })}
    </span>
  )
}

export interface Notification {
  contract: Contract
  level: AlertLevel
  days: number
}

export function useNotifications() {
  const { contracts } = useRegistry()
  return useMemo(() => {
    const list: Notification[] = []
    for (const c of contracts) {
      const days = daysLeft(c)
      const level = currentMilestone(days)
      if (level) list.push({ contract: c, level, days })
    }
    return list.sort((a, b) => a.days - b.days)
  }, [contracts])
}

const FILTERS: (AlertLevel | 'Toutes')[] = ['Toutes', 'J-5', 'J-10', 'J-30', 'J-60', 'J-90']

export function NotificationCenter({ compact = false, onSelect }: { compact?: boolean; onSelect?: (c: Contract) => void }) {
  const notifications = useNotifications()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Toutes')
  const filtered = filter === 'Toutes' ? notifications : notifications.filter((n) => n.level === filter)
  const visible = compact ? filtered.slice(0, 7) : filtered

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Centre de notifications</p>
          <p className="text-xs text-muted-foreground">{notifications.length} alertes sur 90 jours</p>
        </div>
        {compact && (
          <Link href="/alertes" className="text-xs font-medium text-primary hover:underline">
            Tout voir
          </Link>
        )}
      </div>
      <div className="flex gap-1 overflow-x-auto border-b px-3 py-2" role="tablist" aria-label="Filtrer par jalon">
        {FILTERS.map((f) => {
          const count = f === 'Toutes' ? notifications.length : notifications.filter((n) => n.level === f).length
          return (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                'shrink-0 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted',
                filter === f && 'bg-muted text-foreground',
              )}
            >
              {f} <span className="tabular-nums opacity-70">{count}</span>
            </button>
          )
        })}
      </div>
      <ul className={cn('divide-y overflow-y-auto', compact ? 'max-h-96' : 'max-h-[34rem]')}>
        {visible.map(({ contract: c, level, days }) => {
          const tpl = milestoneTemplate(level)
          const Wrapper = onSelect ? 'button' : 'div'
          return (
            <li key={c.id}>
              <Wrapper
                {...(onSelect ? { type: 'button' as const, onClick: () => onSelect(c) } : {})}
                className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60"
              >
                <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', MILESTONE_STYLE[level].dot)} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold', MILESTONE_STYLE[level].chip)}>
                      {level} · {tpl.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      émise le {formatShortDate(milestoneDate(c, tpl.offset))}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-sm font-medium">{tpl.subject(c)}</span>
                  <span className="mt-0.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="truncate">
                      {c.supplier.name} · {days} j restants
                    </span>
                    <ChannelIcons channels={tpl.channels} />
                  </span>
                </span>
              </Wrapper>
            </li>
          )
        })}
        {visible.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">Aucune alerte pour ce jalon.</li>}
      </ul>
    </div>
  )
}
