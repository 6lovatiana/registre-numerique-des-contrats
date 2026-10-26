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
  siret: string
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
  siret: '',
  legalContact: '',
  email: '',
  department: '',
  owner: '',
  amount: '',
  currency: 'EUR',
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

export function formNoticeDeadline(f: ContractFormState) {
  const days = Number(f.noticeDays)
  if (!f.tacitRenewal || !f.endDate || !Number.isInteger(days) || days <= 0) return ''
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
  if (f.signatureDate && f.effectiveDate && f.effectiveDate < f.signatureDate) e.effectiveDate = 'La date d’effet doit suivre la signature'
  if (f.effectiveDate && f.endDate && f.endDate <= f.effectiveDate) e.endDate = 'L’échéance doit être postérieure à la date d’effet'

  req('supplierName')
  if (!f.siret.trim()) e.siret = 'Champ obligatoire'
  else if (!/^\d{14}$/.test(f.siret.replace(/\s/g, ''))) e.siret = 'Le SIRET comporte 14 chiffres'
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
    const notice = Number(f.noticeDays)
    if (!f.noticeDays.trim()) e.noticeDays = 'Champ obligatoire'
    else if (!Number.isInteger(notice) || notice <= 0) e.noticeDays = 'Nombre de jours entier, supérieur à 0'
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
  if (f.termsFile && !isPdf(f.termsFile)) e.termsFile = 'Format PDF attendu'
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
    supplier: { name: f.supplierName.trim(), siret: f.siret.replace(/\s/g, ''), legalContact: f.legalContact.trim(), email: f.email.trim() },
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
    noticeDays: f.tacitRenewal ? num(f.noticeDays) : undefined,
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

/** Simulated OCR/NLP output for an uploaded supplier contract. */
export function simulateExtraction(fileName: string, nextReference: string): Extraction[] {
  const seed = [...fileName].reduce((s, ch) => s + ch.charCodeAt(0), 0)
  const jitter = (base: number) => Math.min(99, base + (seed % 3))
  return [
    { field: 'reference', label: 'Référence contrat', value: nextReference, score: jitter(97) },
    { field: 'type', label: 'Type de contrat', value: 'Prestation de services', score: jitter(96) },
    { field: 'object', label: 'Objet du contrat', value: 'Prestation d’infogérance et de support applicatif niveau 2 pour le système d’information RH.', score: 96 },
    { field: 'supplierName', label: 'Fournisseur - Raison sociale', value: 'Nexora Services SAS', score: 98 },
    { field: 'siret', label: 'Fournisseur - SIRET', value: '84215796300027', score: 97 },
    { field: 'legalContact', label: 'Contact juridique', value: 'Hélène Marchand', score: 81 },
    { field: 'email', label: 'Email fournisseur', value: 'juridique@nexora-services.fr', score: 79 },
    { field: 'signatureDate', label: 'Date de signature', value: '2026-09-15', score: 97 },
    { field: 'effectiveDate', label: 'Date d’effet', value: '2026-10-01', score: 96 },
    { field: 'endDate', label: 'Date d’échéance initiale', value: '2027-09-30', score: 84 },
    { field: 'amount', label: 'Montant total HT', value: '186000', score: 82 },
    { field: 'billing', label: 'Périodicité de facturation', value: 'Mensuelle', score: 97 },
    { field: 'paymentTerms', label: 'Modalités de paiement', value: '45 jours fin de mois', score: 76 },
    { field: 'durationMonths', label: 'Durée initiale', value: '12', score: 98 },
    { field: 'tacitRenewal', label: 'Reconduction tacite', value: true, score: 97 },
    { field: 'renewalMonths', label: 'Durée de reconduction', value: '12', score: 83 },
    { field: 'noticeDays', label: 'Préavis de résiliation', value: '60', score: 74 },
    { field: 'terminationMode', label: 'Mode de résiliation', value: 'Lettre recommandée', score: 96 },
    { field: 'priceRevision', label: 'Révision de prix', value: true, score: 88 },
    { field: 'priceIndex', label: 'Index de référence', value: 'Syntec', score: 62 },
    { field: 'latePenalty', label: 'Pénalités de retard', value: true, score: 97 },
    { field: 'latePenaltyRate', label: 'Taux de pénalités', value: '1.5', score: 71 },
    { field: 'latePenaltyCap', label: 'Plafond de pénalités', value: '10', score: 58 },
    { field: 'bankGuarantee', label: 'Garantie bancaire', value: false, score: 91 },
  ]
}
