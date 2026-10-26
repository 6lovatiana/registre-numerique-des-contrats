import type { AlertLevel, Contract } from './types'

export const TODAY = '2026-10-21'

const DAY_MS = 86_400_000

export function parseISO(iso: string) {
  return new Date(`${iso}T00:00:00Z`)
}

export function toISO(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function addDays(iso: string, days: number) {
  return toISO(new Date(parseISO(iso).getTime() + days * DAY_MS))
}

export function addMonths(iso: string, months: number) {
  const d = parseISO(iso)
  d.setUTCMonth(d.getUTCMonth() + months)
  return toISO(d)
}

export function diffDays(from: string, to: string) {
  return Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / DAY_MS)
}

export function computeNoticeDeadline(endDate: string, noticeDays: number) {
  return addDays(endDate, -noticeDays)
}

export function noticeDeadline(c: Contract) {
  if (!c.tacitRenewal || !c.noticeDays) return undefined
  return computeNoticeDeadline(c.endDate, c.noticeDays)
}

/** Tacit renewal contracts are tracked against the notice deadline, others against the end date. */
export function referenceDate(c: Contract) {
  return noticeDeadline(c) ?? c.endDate
}

export function referenceLabel(c: Contract) {
  return c.tacitRenewal ? 'Date limite de préavis' : 'Date d’échéance'
}

export function daysLeft(c: Contract, today = TODAY) {
  return diffDays(today, referenceDate(c))
}

export type AlertBucket = 'J-10' | 'J-30' | null

export function alertBucket(c: Contract): AlertBucket {
  const d = daysLeft(c)
  if (d < 0) return null
  if (d <= 10) return 'J-10'
  if (d <= 30) return 'J-30'
  return null
}

export function currentMilestone(days: number): AlertLevel | null {
  if (days < 0) return null
  if (days <= 5) return 'J-5'
  if (days <= 10) return 'J-10'
  if (days <= 30) return 'J-30'
  if (days <= 60) return 'J-60'
  if (days <= 90) return 'J-90'
  return null
}

export type Channel = 'Email' | 'SMS' | 'Tableau de bord' | 'Push'

export interface MilestoneTemplate {
  level: AlertLevel
  offset: number
  label: string
  severity: 'info' | 'notice' | 'critical' | 'urgent' | 'final'
  channels: Channel[]
  subject: (c: Contract) => string
  body: (c: Contract) => string
}

export const MILESTONES: MilestoneTemplate[] = [
  {
    level: 'J-90',
    offset: 90,
    label: 'Avertissement',
    severity: 'info',
    channels: ['Email', 'Tableau de bord'],
    subject: (c) => `[Avertissement] ${c.reference} arrive à échéance dans 90 jours`,
    body: (c) =>
      `Le contrat ${c.reference} (${c.supplier.name}) entre dans sa fenêtre de revue. Préparez l’évaluation fournisseur et l’analyse du besoin.`,
  },
  {
    level: 'J-60',
    offset: 60,
    label: 'Intermédiaire',
    severity: 'notice',
    channels: ['Email', 'Tableau de bord'],
    subject: (c) => `[Revue] ${c.reference} : décision attendue sous 60 jours`,
    body: (c) =>
      `Merci de statuer sur la stratégie (renouvellement, renégociation ou résiliation) pour ${c.supplier.name}. Le responsable interne ${c.owner} est en copie.`,
  },
  {
    level: 'J-30',
    offset: 30,
    label: 'Critique',
    severity: 'critical',
    channels: ['Email', 'SMS', 'Tableau de bord'],
    subject: (c) => `[CRITIQUE] ${c.reference} : 30 jours avant ${c.tacitRenewal ? 'la date limite de préavis' : 'l’échéance'}`,
    body: (c) =>
      c.tacitRenewal
        ? `Sans action avant la date limite de préavis, le contrat sera reconduit tacitement pour ${c.renewalMonths} mois. Mode de résiliation : ${c.terminationMode}.`
        : `Le contrat ${c.reference} expire dans 30 jours. Toute continuité de service nécessite un renouvellement formel.`,
  },
  {
    level: 'J-10',
    offset: 10,
    label: 'Urgence',
    severity: 'urgent',
    channels: ['Push', 'SMS', 'Email'],
    subject: (c) => `[URGENCE] ${c.reference} : 10 jours restants`,
    body: (c) =>
      `Escalade automatique vers ${c.owner} et la Direction Juridique. Décision immédiate requise pour ${c.supplier.name}.`,
  },
  {
    level: 'J-5',
    offset: 5,
    label: 'Rappel final',
    severity: 'final',
    channels: ['Push', 'SMS', 'Email', 'Tableau de bord'],
    subject: (c) => `[RAPPEL FINAL] ${c.reference} : 5 jours restants`,
    body: (c) =>
      `Dernier rappel avant ${c.tacitRenewal ? 'reconduction tacite' : 'expiration'}. Le courrier de ${c.terminationMode.toLowerCase()} doit être émis au plus tard aujourd’hui pour garantir les délais.`,
  },
]

export function milestoneTemplate(level: AlertLevel) {
  return MILESTONES.find((m) => m.level === level)!
}

export function milestoneDate(c: Contract, offset: number) {
  return addDays(referenceDate(c), -offset)
}
