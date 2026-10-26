import type { Contract, ContractType, Criticality } from './types'

export interface ContractFilters {
  query: string
  supplier: string
  type: ContractType | ''
  criticality: Criticality | ''
  minAmount: string
  maxAmount: string
}

export const EMPTY_FILTERS: ContractFilters = {
  query: '',
  supplier: '',
  type: '',
  criticality: '',
  minAmount: '',
  maxAmount: '',
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function haystack(c: Contract) {
  return normalize(
    [
      c.reference,
      c.type,
      c.object,
      c.supplier.name,
      c.supplier.siret,
      c.supplier.legalContact,
      c.department,
      c.owner,
      c.criticality,
      c.priceIndex ?? '',
      c.paymentTerms,
      c.terminationMode,
      c.notes,
      ...c.tags,
      ...c.documents.map((d) => d.name),
    ].join(' '),
  )
}

export function applyFilters(contracts: Contract[], f: ContractFilters) {
  const terms = normalize(f.query).split(/\s+/).filter(Boolean)
  const min = f.minAmount ? Number(f.minAmount) : null
  const max = f.maxAmount ? Number(f.maxAmount) : null
  return contracts.filter((c) => {
    if (f.supplier && c.supplier.name !== f.supplier) return false
    if (f.type && c.type !== f.type) return false
    if (f.criticality && c.criticality !== f.criticality) return false
    if (min !== null && c.amount < min) return false
    if (max !== null && c.amount > max) return false
    if (terms.length) {
      const h = haystack(c)
      if (!terms.every((t) => h.includes(t))) return false
    }
    return true
  })
}

export function activeFilterCount(f: ContractFilters) {
  return Object.values(f).filter(Boolean).length
}
