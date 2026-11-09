import { computeNoticeDeadline } from './alerts'
import type { BillingPeriod, Contract, ContractType, Criticality, Currency, Department, TerminationMode } from './types'

export interface ContractFormState {
  reference: string
  type: ContractType | ''
  object: string
  signatureDate: string
  effectiveDate: string
  endDate: string
  supplierName: string
  nif: string
  legalContact: string
  email: string
  department: Department | ''
  owner: string
  amount: string
  currency: Currency
  billing: BillingPeriod | ''
  paymentTerms: string
  priceRevision: boolean
  priceIndex: string
  durationMonths: string
  tacitRenewal: boolean
  renewalMonths: string
  noticeDays: string
  terminationMode: TerminationMode | ''
  latePenalty: boolean
  latePenaltyRate: string
  latePenaltyCap: string
  earlyTerminationPenalty: boolean
  earlyTerminationAmount: string
  bankGuarantee: boolean
  guaranteeAmount: string
  contractFile: File | null
  amendments: File[]
  termsFile: File | null
  criticality: Criticality | ''
  tags: string[]
  notes: string
}

export type FieldKey = keyof ContractFormState

export const EMPTY_FORM: ContractFormState = {
  reference: '',
  type: '',
  object: '',
  signatureDate: '',
  effectiveDate: '',
  endDate: '',
  supplierName: '',
  nif: '',
  legalContact: '',
  email: '',
  department: '',
  owner: '',
  amount: '',
  currency: 'MGA',
  billing: '',
  paymentTerms: '',
  priceRevision: false,
  priceIndex: '',
  durationMonths: '',
  tacitRenewal: false,
  renewalMonths: '',
  noticeDays: '',
  terminationMode: '',
  latePenalty: false,
  latePenaltyRate: '',
  latePenaltyCap: '',
  earlyTerminationPenalty: false,
  earlyTerminationAmount: '',
  bankGuarantee: false,
  guaranteeAmount: '',
  contractFile: null,
  amendments: [],
  termsFile: null,
  criticality: '',
  tags: [],
  notes: '',
}

export const REFERENCE_PATTERN = /^CTR-\d{4}-\d{4}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const MAX_B2B_NOTICE_DAYS = 90

const isPositive = (v: string) => v.trim() !== '' && Number(v) > 0
const isPdf = (f: File) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
const isValidDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v

export function formNoticeDeadline(f: ContractFormState) {
  const days = Number(f.noticeDays)
  if (!f.endDate || !Number.isInteger(days) || days <= 0) return ''
  return computeNoticeDeadline(f.endDate, days)
}

export function validateContractForm(f: ContractFormState, existingReferences: Set<string>) {
  const e: Partial<Record<FieldKey, string>> = {}
  const req = (k: FieldKey, msg = 'Champ obligatoire') => {
    const v = f[k]
    if (typeof v === 'string' && v.trim() === '') e[k] = msg
  }

  if (!f.reference.trim()) e.reference = 'Champ obligatoire'
  else if (!REFERENCE_PATTERN.test(f.reference)) e.reference = 'Format attendu : CTR-AAAA-NNNN (ex. CTR-2026-0251)'
  else if (existingReferences.has(f.reference)) e.reference = 'Cette référence existe déjà dans le registre'

  req('type', 'Sélectionnez un type de contrat')
  if (!f.object.trim()) e.object = 'Champ obligatoire'
  else if (f.object.trim().length < 10) e.object = 'Décrivez l’objet en 10 caractères minimum'
  req('signatureDate')
  req('effectiveDate')
  req('endDate')
  for (const key of ['signatureDate', 'effectiveDate', 'endDate'] as const) if (f[key] && !isValidDate(f[key])) e[key] = 'Date invalide'
  if (f.signatureDate && f.effectiveDate && f.effectiveDate < f.signatureDate) e.effectiveDate = 'La date d’effet doit suivre la signature'
  if (f.effectiveDate && f.endDate && f.endDate <= f.effectiveDate) e.endDate = 'L’échéance doit être postérieure à la date d’effet'

  req('supplierName')
  if (!f.nif.trim()) e.nif = 'Champ obligatoire'
  else if (!/^\d{10}$/.test(f.nif.replace(/\s/g, ''))) e.nif = 'Le NIF comporte 10 chiffres'
  req('legalContact')
  if (!f.email.trim()) e.email = 'Champ obligatoire'
  else if (!EMAIL_PATTERN.test(f.email)) e.email = 'Adresse email invalide'
  req('department', 'Sélectionnez un département')
  req('owner')

  if (!isPositive(f.amount)) e.amount = 'Le montant HT doit être strictement positif'
  req('billing', 'Sélectionnez une périodicité')
  req('paymentTerms')
  if (f.priceRevision) req('priceIndex', 'Indiquez l’indice de référence')

  if (!isPositive(f.durationMonths) || !Number.isInteger(Number(f.durationMonths))) e.durationMonths = 'Durée en mois entiers, supérieure à 0'
  if (f.tacitRenewal) {
    if (!isPositive(f.renewalMonths) || !Number.isInteger(Number(f.renewalMonths))) e.renewalMonths = 'Durée en mois entiers, supérieure à 0'
  }
  if (f.noticeDays.trim()) {
    const notice = Number(f.noticeDays)
    if (!Number.isInteger(notice) || notice <= 0) e.noticeDays = 'Nombre de jours entier, supérieur à 0'
    else if (notice > MAX_B2B_NOTICE_DAYS) e.noticeDays = `Le préavis B2B ne peut excéder ${MAX_B2B_NOTICE_DAYS} jours`
  }
  req('terminationMode', 'Sélectionnez un mode de résiliation')

  if (f.latePenalty) {
    const rate = Number(f.latePenaltyRate)
    if (!isPositive(f.latePenaltyRate) || rate > 100) e.latePenaltyRate = 'Taux compris entre 0 et 100 %'
    if (!isPositive(f.latePenaltyCap) || Number(f.latePenaltyCap) > 100) e.latePenaltyCap = 'Plafond compris entre 0 et 100 %'
  }
  if (f.earlyTerminationPenalty && !isPositive(f.earlyTerminationAmount)) e.earlyTerminationAmount = 'Montant strictement positif'
  if (f.bankGuarantee && !isPositive(f.guaranteeAmount)) e.guaranteeAmount = 'Montant strictement positif'

  if (!f.contractFile) e.contractFile = 'Le document contractuel est obligatoire'
  else if (!isPdf(f.contractFile)) e.contractFile = 'Format PDF attendu'
  else if (f.contractFile.size > 20 * 1024 * 1024) e.contractFile = 'PDF limité à 20 Mo'
  if (f.termsFile && !isPdf(f.termsFile)) e.termsFile = 'Format PDF attendu'
  else if (f.termsFile && f.termsFile.size > 20 * 1024 * 1024) e.termsFile = 'PDF limité à 20 Mo'
  if (f.amendments.some((file) => !isPdf(file) || file.size > 20 * 1024 * 1024)) e.amendments = 'Chaque avenant doit être un PDF de 20 Mo maximum'
  req('criticality', 'Sélectionnez un niveau de criticité')

  return e
}

export function formToContract(f: ContractFormState): Contract {
  const num = (v: string) => (v.trim() === '' ? undefined : Number(v))
  return {
    id: `c-${f.reference}`,
    reference: f.reference,
    type: f.type as ContractType,
    object: f.object.trim(),
    signatureDate: f.signatureDate,
    effectiveDate: f.effectiveDate,
    endDate: f.endDate,
    supplier: { name: f.supplierName.trim(), nif: f.nif.replace(/\s/g, ''), legalContact: f.legalContact.trim(), email: f.email.trim() },
    department: f.department as Department,
    owner: f.owner.trim(),
    amount: Number(f.amount),
    currency: f.currency,
    billing: f.billing as BillingPeriod,
    paymentTerms: f.paymentTerms.trim(),
    priceRevision: f.priceRevision,
    priceIndex: f.priceRevision ? f.priceIndex.trim() : undefined,
    durationMonths: Number(f.durationMonths),
    tacitRenewal: f.tacitRenewal,
    renewalMonths: f.tacitRenewal ? num(f.renewalMonths) : undefined,
    noticeDays: num(f.noticeDays),
    terminationMode: f.terminationMode as TerminationMode,
    latePenalty: f.latePenalty,
    latePenaltyRate: f.latePenalty ? num(f.latePenaltyRate) : undefined,
    latePenaltyCap: f.latePenalty ? num(f.latePenaltyCap) : undefined,
    earlyTerminationPenalty: f.earlyTerminationPenalty,
    earlyTerminationAmount: f.earlyTerminationPenalty ? num(f.earlyTerminationAmount) : undefined,
    bankGuarantee: f.bankGuarantee,
    guaranteeAmount: f.bankGuarantee ? num(f.guaranteeAmount) : undefined,
    criticality: f.criticality as Criticality,
    tags: f.tags,
    notes: f.notes.trim(),
    documents: [
      ...(f.contractFile ? [{ name: f.contractFile.name, kind: 'Contrat' as const }] : []),
      ...f.amendments.map((a) => ({ name: a.name, kind: 'Avenant' as const })),
      ...(f.termsFile ? [{ name: f.termsFile.name, kind: 'CGV' as const }] : []),
    ],
    compliant: true,
    performanceScore: 80,
    budget: Number(f.amount),
    actualSpent: 0,
    lateDeliveries: 0,
    lastDecision: 'Aucune',
  }
}

export type ConfidenceStatus = 'validated' | 'review' | 'manual'

export function confidenceStatus(score: number): ConfidenceStatus {
  if (score > 95) return 'validated'
  if (score >= 70) return 'review'
  return 'manual'
}

export interface Extraction {
  field: FieldKey
  label: string
  value: string | boolean
  score: number
}
