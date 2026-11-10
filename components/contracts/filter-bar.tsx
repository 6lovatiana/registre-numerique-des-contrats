'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/registry/bits'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { EMPTY_FILTERS, activeFilterCount, type ContractFilters } from '@/lib/filters'
import { useRegistry } from '@/lib/store'
import { CONTRACT_TYPES, CRITICALITIES, type ContractType, type Criticality } from '@/lib/types'
import { cn } from '@/lib/utils'

export function FilterBar({ value, onChange, resultCount }: { value: ContractFilters; onChange: (f: ContractFilters) => void; resultCount: number }) {
  const { contracts } = useRegistry()
  const suppliers = useMemo(() => [...new Set(contracts.map((c) => c.supplier.name))].sort((a, b) => a.localeCompare(b, 'fr')), [contracts])
  const [supplierOpen, setSupplierOpen] = useState(false)
  const [supplierSearch, setSupplierSearch] = useState('')
  const fold = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr')
  const filteredSuppliers = suppliers.filter((supplier) => fold(supplier).includes(fold(supplierSearch)))
  const set = <K extends keyof ContractFilters>(k: K, v: ContractFilters[K]) => onChange({ ...value, [k]: v })
  const count = activeFilterCount(value)

  return (
    <div className="rounded-xl border bg-card p-3" role="search">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={value.query}
          onChange={(e) => set('query', e.target.value)}
          placeholder="Recherche plein texte : référence, fournisseur, NIF, objet, tag, indice, document…"
          aria-label="Recherche plein texte dans les contrats"
          className="h-10 pl-9"
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-[1.4fr_1fr_1fr_0.8fr_0.8fr_auto]">
        <label className="col-span-2 md:col-span-1">
          <span className="sr-only">Fournisseur</span>
          <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
            <PopoverTrigger className="flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-2.5 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" role="combobox" aria-expanded={supplierOpen} aria-label="Filtrer par fournisseur">
              <span className="truncate">{value.supplier || 'Tous les fournisseurs'}</span><ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[var(--anchor-width)] min-w-64 p-2">
              <Input autoFocus value={supplierSearch} onChange={(event) => setSupplierSearch(event.target.value)} placeholder="Rechercher un fournisseur…" aria-label="Rechercher un fournisseur" />
              <div role="listbox" aria-label="Fournisseurs" className="mt-1 max-h-60 overflow-y-auto">
                <button type="button" role="option" aria-selected={!value.supplier} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted" onClick={() => { set('supplier', ''); setSupplierSearch(''); setSupplierOpen(false) }}>
                  <Check className={cn('size-4', value.supplier ? 'opacity-0' : 'opacity-100')} aria-hidden />Tous les fournisseurs
                </button>
                {filteredSuppliers.map((supplier) => <button type="button" role="option" aria-selected={value.supplier === supplier} key={supplier} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted" onClick={() => { set('supplier', supplier); setSupplierSearch(''); setSupplierOpen(false) }}><Check className={cn('size-4', value.supplier === supplier ? 'opacity-100' : 'opacity-0')} aria-hidden /><span className="truncate">{supplier}</span></button>)}
                {filteredSuppliers.length === 0 && <p className="px-2 py-3 text-sm text-muted-foreground">Aucun fournisseur trouvé.</p>}
              </div>
            </PopoverContent>
          </Popover>
        </label>
        <label>
          <span className="sr-only">Type de contrat</span>
          <NativeSelect value={value.type} onChange={(e) => set('type', e.target.value as ContractType | '')}>
            <option value="">Tous les types</option>
            {CONTRACT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </NativeSelect>
        </label>
        <label>
          <span className="sr-only">Criticité</span>
          <NativeSelect value={value.criticality} onChange={(e) => set('criticality', e.target.value as Criticality | '')}>
            <option value="">Toute criticité</option>
            {CRITICALITIES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </NativeSelect>
        </label>
        <Input
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Montant min Ar"
          aria-label="Montant minimum en ariary"
          value={value.minAmount}
          onChange={(e) => set('minAmount', e.target.value)}
        />
        <Input
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Montant max Ar"
          aria-label="Montant maximum en ariary"
          value={value.maxAmount}
          onChange={(e) => set('maxAmount', e.target.value)}
        />
        <Button variant="ghost" className="col-span-2 md:col-span-1" disabled={count === 0} onClick={() => onChange(EMPTY_FILTERS)}>
          <X data-icon="inline-start" aria-hidden />
          Réinitialiser{count > 0 && ` (${count})`}
        </Button>
      </div>
      <p className="mt-2 px-1 text-xs text-muted-foreground" aria-live="polite">
        {resultCount} contrat{resultCount > 1 ? 's' : ''} correspondant{resultCount > 1 ? 's' : ''}
      </p>
    </div>
  )
}
