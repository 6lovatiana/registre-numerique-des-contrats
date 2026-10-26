'use client'

import { useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/registry/bits'
import { EMPTY_FILTERS, activeFilterCount, type ContractFilters } from '@/lib/filters'
import { useRegistry } from '@/lib/store'
import { CONTRACT_TYPES, CRITICALITIES, type ContractType, type Criticality } from '@/lib/types'

export function FilterBar({ value, onChange, resultCount }: { value: ContractFilters; onChange: (f: ContractFilters) => void; resultCount: number }) {
  const { contracts } = useRegistry()
  const suppliers = useMemo(() => [...new Set(contracts.map((c) => c.supplier.name))].sort((a, b) => a.localeCompare(b, 'fr')), [contracts])
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
          placeholder="Recherche plein texte : référence, fournisseur, SIRET, objet, tag, indice, document…"
          aria-label="Recherche plein texte dans les contrats"
          className="h-10 pl-9"
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-[1.4fr_1fr_1fr_0.8fr_0.8fr_auto]">
        <label className="col-span-2 md:col-span-1">
          <span className="sr-only">Fournisseur</span>
          <NativeSelect value={value.supplier} onChange={(e) => set('supplier', e.target.value)}>
            <option value="">Tous les fournisseurs</option>
            {suppliers.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </NativeSelect>
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
          placeholder="Montant min €"
          aria-label="Montant minimum en euros"
          value={value.minAmount}
          onChange={(e) => set('minAmount', e.target.value)}
        />
        <Input
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Montant max €"
          aria-label="Montant maximum en euros"
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
