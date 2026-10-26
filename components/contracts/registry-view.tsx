'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { PageHeader } from '@/components/registry/bits'
import { applyFilters, EMPTY_FILTERS } from '@/lib/filters'
import { formatEUR } from '@/lib/format'
import { useRegistry } from '@/lib/store'
import type { Contract } from '@/lib/types'
import { ContractDetailSheet } from './contract-detail-sheet'
import { ContractTable } from './contract-table'
import { ExportMenu } from './export-menu'
import { FilterBar } from './filter-bar'

export function RegistryView() {
  const { contracts } = useRegistry()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [selected, setSelected] = useState<Contract | null>(null)
  const filtered = useMemo(() => applyFilters(contracts, filters), [contracts, filters])
  const total = filtered.reduce((s, c) => s + c.amount, 0)

  return (
    <div>
      <PageHeader
        eyebrow="Registre"
        title="Registre des contrats"
        description={`${contracts.length} contrats actifs · ${formatEUR(total)} HT sur la sélection courante`}
        actions={
          <>
            <ExportMenu contracts={filtered} />
            <Link href="/nouveau" className={buttonVariants()}>
              <Plus data-icon="inline-start" aria-hidden />
              Nouveau contrat
            </Link>
          </>
        }
      />
      <div className="flex flex-col gap-4">
        <FilterBar value={filters} onChange={setFilters} resultCount={filtered.length} />
        <ContractTable key={JSON.stringify(filters)} contracts={filtered} onSelect={setSelected} />
      </div>
      <ContractDetailSheet contract={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
