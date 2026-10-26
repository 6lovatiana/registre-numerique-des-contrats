export const CONTRACT_TYPES = [
  'Fourniture de biens',
  'Prestation de services',
  'Maintenance',
  'Abonnement',
  'Licence',
] as const
export type ContractType = (typeof CONTRACT_TYPES)[number]

export const CRITICALITIES = ['Critique', 'Majeur', 'Standard', 'Faible'] as const
export type Criticality = (typeof CRITICALITIES)[number]

export const DEPARTMENTS = [
  'Direction Juridique',
  'Direction des Achats',
  'DSI',
  'Direction Financière',
  'Ressources Humaines',
  'Marketing',
  'Opérations',
  'Services Généraux',
] as const
export type Department = (typeof DEPARTMENTS)[number]

export const CURRENCIES = ['EUR', 'USD', 'GBP'] as const
export type Currency = (typeof CURRENCIES)[number]

export const BILLING_PERIODS = ['Mensuelle', 'Trimestrielle', 'Annuelle', 'Forfaitaire'] as const
export type BillingPeriod = (typeof BILLING_PERIODS)[number]

export const TERMINATION_MODES = ['Lettre recommandée', 'Email', 'Portail fournisseur'] as const
export type TerminationMode = (typeof TERMINATION_MODES)[number]

export type LastDecision = 'Renouvelé' | 'Résilié' | 'Aucune'

export interface Contract {
  id: string
  reference: string
  type: ContractType
  object: string
  signatureDate: string
  effectiveDate: string
  endDate: string
  supplier: {
    name: string
    siret: string
    legalContact: string
    email: string
  }
  department: Department
  owner: string
  amount: number
  currency: Currency
  billing: BillingPeriod
  paymentTerms: string
  priceRevision: boolean
  priceIndex?: string
  durationMonths: number
  tacitRenewal: boolean
  renewalMonths?: number
  noticeDays?: number
  terminationMode: TerminationMode
  latePenalty: boolean
  latePenaltyRate?: number
  latePenaltyCap?: number
  earlyTerminationPenalty: boolean
  earlyTerminationAmount?: number
  bankGuarantee: boolean
  guaranteeAmount?: number
  criticality: Criticality
  tags: string[]
  notes: string
  documents: { id?: number; name: string; kind: 'Contrat' | 'Avenant' | 'CGV' }[]
  compliant: boolean
  performanceScore: number
  budget: number
  actualSpent: number
  lateDeliveries: number
  lastDecision: LastDecision
}

export const DISPUTE_STATUSES = [
  'Nouveau',
  'Pièces manquantes',
  'Analyse interne',
  'Réponse fournisseur attendue',
  'Négociation',
  'Avoir attendu',
  'Contentieux',
  'Clôturé',
] as const
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number]

export const DISPUTE_TYPES = [
  'Manquement contractuel',
  'Facturation non conforme',
  'Contestation de reconduction',
] as const
export type DisputeType = (typeof DISPUTE_TYPES)[number]

export interface StatusEvent {
  status: DisputeStatus
  at: string
  userId: string
  note?: string
}

export interface Exchange {
  at: string
  direction: 'Sortant' | 'Entrant'
  channel: 'Email' | 'Lettre recommandée' | 'Visioconférence' | 'Portail fournisseur'
  summary: string
  userId: string
}

export interface Evidence {
  kind: 'Contrat' | 'Facture' | 'Bon de commande' | 'Bon de livraison' | 'Correspondance'
  label: string
  date: string
  available: boolean
}

export interface Dispute {
  id: string
  contractId: string
  type: DisputeType
  source: 'Manuel' | 'Moteur d’alertes'
  description: string
  amountAtStake: number
  createdAt: string
  createdBy: string
  status: DisputeStatus
  history: StatusEvent[]
  evidence: Evidence[]
  legalAnalysis: string
  financialAssessment: string
  legalDueAt: string
  financeDueAt: string
  exchanges: Exchange[]
  closure: {
    creditNoteBooked: boolean
    invoiceCorrected: boolean
    finalAmount?: number
    closedAt?: string
  }
}

export interface Decision {
  id: string
  title: string
  contractId: string
  context: string
  amount: number
  dueDate: string
  status: 'En attente' | 'Approuvée' | 'Rejetée'
}

export type AlertLevel = 'J-90' | 'J-60' | 'J-30' | 'J-10' | 'J-5'
