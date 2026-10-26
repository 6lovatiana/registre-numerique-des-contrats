'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CriticalityBadge, DaysBadge } from '@/components/registry/bits'
import { daysLeft, noticeDeadline } from '@/lib/alerts'
import { formatDate, formatEUR } from '@/lib/format'
import type { Contract } from '@/lib/types'
import { cn } from '@/lib/utils'

type SortKey = 'reference' | 'supplier' | 'amount' | 'days'
const PAGE_SIZE = 20

const SORTERS: Record<SortKey, (a: Contract, b: Contract) => number> = {
  reference: (a, b) => a.reference.localeCompare(b.reference),
  supplier: (a, b) => a.supplier.name.localeCompare(b.supplier.name, 'fr'),
  amount: (a, b) => a.amount - b.amount,
  days: (a, b) => daysLeft(a) - daysLeft(b),
}

export function ContractTable({ contracts, onSelect }: { contracts: Contract[]; onSelect: (c: Contract) => void }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'days', dir: 1 })
  const [page, setPage] = useState(0)
  const sorted = [...contracts].sort((a, b) => SORTERS[sort.key](a, b) * sort.dir)
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const rows = sorted.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)

  const header = (key: SortKey, label: string, align: 'left' | 'right' = 'left') => (
    <th scope="col" aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} className={cn('px-3 py-2.5 font-medium', align === 'right' && 'text-right')}>
      <button
        type="button"
        className={cn('inline-flex items-center gap-1 hover:text-foreground', align === 'right' && 'flex-row-reverse')}
        onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((s.dir * -1) as 1 | -1) : 1 }))}
      >
        {label}
        {sort.key === key && (sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
      </button>
    </th>
  )

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              {header('reference', 'Référence')}
              {header('supplier', 'Fournisseur')}
              <th scope="col" className="px-3 py-2.5 font-medium">
                Type / Objet
              </th>
              {header('amount', 'Montant HT', 'right')}
              <th scope="col" className="px-3 py-2.5 font-medium">
                Échéance
              </th>
              {header('days', 'Délai')}
              <th scope="col" className="px-3 py-2.5 font-medium">
                Criticité
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((c) => {
              const deadline = noticeDeadline(c)
              return (
                <tr key={c.id} className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => onSelect(c)}>
                  <td className="px-3 py-2.5">
                    <button type="button" className="font-medium tabular-nums text-primary hover:underline" onClick={(e) => (e.stopPropagation(), onSelect(c))}>
                      {c.reference}
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{c.supplier.name}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{c.supplier.siret}</p>
                  </td>
                  <td className="max-w-64 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">{c.type}</p>
                    <p className="truncate">{c.object}</p>
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium tabular-nums">{formatEUR(c.amount)}</td>
                  <td className="px-3 py-2.5 tabular-nums">
                    <p>{formatDate(c.endDate)}</p>
                    {c.tacitRenewal && deadline && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <RefreshCw className="size-3" aria-label="Reconduction tacite" />
                        préavis {formatDate(deadline)}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <DaysBadge days={daysLeft(c)} />
                  </td>
                  <td className="px-3 py-2.5">
                    <CriticalityBadge value={c.criticality} />
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-12 text-center text-muted-foreground">
                  Aucun contrat ne correspond à ces critères.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {sorted.length === 0 ? 0 : current * PAGE_SIZE + 1}–{Math.min((current + 1) * PAGE_SIZE, sorted.length)} sur {sorted.length}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Page précédente">
            <ChevronLeft />
          </Button>
          <span className="tabular-nums">
            {current + 1} / {pages}
          </span>
          <Button variant="ghost" size="icon-sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} aria-label="Page suivante">
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}
