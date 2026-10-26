import { TODAY, addDays, alertBucket, daysLeft, diffDays } from './alerts'
import type { Contract, Department, Dispute } from './types'

export const OPEN_DISPUTE = (d: Dispute) => d.status !== 'Clôturé'

export function portfolioSummary(contracts: Contract[], disputes: Dispute[]) {
  const total = contracts.reduce((s, c) => s + c.amount, 0)
  const j30 = contracts.filter((c) => alertBucket(c) === 'J-30').length
  const j10 = contracts.filter((c) => alertBucket(c) === 'J-10').length
  const compliance = contracts.length ? contracts.filter((c) => c.compliant).length / contracts.length : 0
  return {
    count: contracts.length,
    total,
    j30,
    j10,
    compliance,
    openDisputes: disputes.filter(OPEN_DISPUTE).length,
  }
}

export function renewalPipeline(contracts: Contract[]) {
  const buckets = { d30: [] as Contract[], d60: [] as Contract[], d90: [] as Contract[] }
  for (const c of contracts) {
    const d = daysLeft(c)
    if (d < 0) continue
    if (d <= 30) buckets.d30.push(c)
    else if (d <= 60) buckets.d60.push(c)
    else if (d <= 90) buckets.d90.push(c)
  }
  return buckets
}

export function averageLifecycleMonths(contracts: Contract[]) {
  if (!contracts.length) return 0
  return contracts.reduce((s, c) => s + c.durationMonths, 0) / contracts.length
}

export function topSuppliers(contracts: Contract[], n = 10) {
  const map = new Map<string, { name: string; value: number; count: number; score: number }>()
  for (const c of contracts) {
    const e = map.get(c.supplier.name) ?? { name: c.supplier.name, value: 0, count: 0, score: 0 }
    e.value += c.amount
    e.count += 1
    e.score += c.performanceScore
    map.set(c.supplier.name, e)
  }
  return [...map.values()]
    .map((e) => ({ ...e, score: e.score / e.count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n)
}

export function renewalVsTermination(contracts: Contract[]) {
  const decided = contracts.filter((c) => c.lastDecision !== 'Aucune')
  const renewed = decided.filter((c) => c.lastDecision === 'Renouvelé').length
  return { renewed, terminated: decided.length - renewed, rate: decided.length ? renewed / decided.length : 0 }
}

/** Spend above contracted budget plus missed price-revision opportunities. */
export function contractLeakage(contracts: Contract[]) {
  const overspend = contracts.reduce((s, c) => s + Math.max(0, c.actualSpent - c.budget), 0)
  const offContract = contracts.filter((c) => !c.compliant).reduce((s, c) => s + c.amount * 0.04, 0)
  return { overspend, offContract, total: overspend + offContract }
}

export function avgPerformance(contracts: Contract[]) {
  if (!contracts.length) return 0
  return contracts.reduce((s, c) => s + c.performanceScore, 0) / contracts.length
}

export function performanceDistribution(contracts: Contract[]) {
  const bands = [
    { label: '< 65', min: 0, max: 64, count: 0 },
    { label: '65–79', min: 65, max: 79, count: 0 },
    { label: '80–89', min: 80, max: 89, count: 0 },
    { label: '≥ 90', min: 90, max: 100, count: 0 },
  ]
  for (const c of contracts) {
    const b = bands.find((x) => c.performanceScore >= x.min && c.performanceScore <= x.max)
    if (b) b.count++
  }
  return bands
}

function monthlyRunRate(c: Contract) {
  return c.amount / c.durationMonths
}

export function futureCommitments(contracts: Contract[]) {
  return [30, 60, 90].map((horizon) => {
    const end = addDays(TODAY, horizon)
    const value = contracts.reduce((s, c) => {
      const activeDays = Math.max(0, Math.min(horizon, diffDays(TODAY, c.endDate)))
      const renewalDays = c.tacitRenewal ? horizon - activeDays : 0
      return s + (monthlyRunRate(c) * (activeDays + renewalDays)) / 30
    }, 0)
    return { horizon, end, value }
  })
}

export function potentialLatePenalties(contracts: Contract[]) {
  const items = contracts
    .filter((c) => c.latePenalty && c.lateDeliveries > 0)
    .map((c) => {
      const raw = c.amount * ((c.latePenaltyRate ?? 0) / 100) * c.lateDeliveries * 4
      const cap = c.amount * ((c.latePenaltyCap ?? 0) / 100)
      return { contract: c, value: Math.min(raw, cap) }
    })
    .sort((a, b) => b.value - a.value)
  return { items, total: items.reduce((s, i) => s + i.value, 0) }
}

export function tacitExposure(contracts: Contract[], horizon = 90) {
  const items = contracts
    .filter((c) => c.tacitRenewal && daysLeft(c) >= 0 && daysLeft(c) <= horizon)
    .map((c) => ({ contract: c, value: monthlyRunRate(c) * (c.renewalMonths ?? 12) }))
    .sort((a, b) => b.value - a.value)
  return { items, total: items.reduce((s, i) => s + i.value, 0) }
}

export function budgetVsActual(contracts: Contract[]) {
  const map = new Map<Department, { department: Department; budget: number; actual: number }>()
  for (const c of contracts) {
    const e = map.get(c.department) ?? { department: c.department, budget: 0, actual: 0 }
    e.budget += c.budget
    e.actual += c.actualSpent
    map.set(c.department, e)
  }
  return [...map.values()].sort((a, b) => b.budget - a.budget)
}

export function redAlerts(contracts: Contract[]) {
  return contracts
    .filter((c) => {
      const b = alertBucket(c)
      return b === 'J-10' || (b === 'J-30' && c.criticality === 'Critique')
    })
    .sort((a, b) => daysLeft(a) - daysLeft(b))
}
