import { TODAY, addDays, addMonths } from './alerts'
import {
  BILLING_PERIODS,
  CONTRACT_TYPES,
  DEPARTMENTS,
  TERMINATION_MODES,
  type Contract,
  type ContractType,
  type Criticality,
  type Decision,
  type Dispute,
  type LastDecision,
} from './types'

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = mulberry32(20261021)
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rng() * arr.length)]
const between = (min: number, max: number) => Math.floor(min + rng() * (max - min + 1))

export const TOTAL_PORTFOLIO_VALUE = 12_400_000
export const CONTRACT_COUNT = 250
export const ESCALATION_THRESHOLD = 50_000

const SUPPLIERS = [
  'Altavia Logistique', 'Bureau Veritas Services', 'Capgemini Technology', 'Dassault Systèmes',
  'Econocom Group', 'Fnac Darty Pro', 'Groupe Atlantic', 'Hexagone Facility', 'Inetum Solutions',
  'Jaguar Network', 'Keolis Entreprises', 'Legrand Systèmes', 'Manutan Collectivités', 'Nexity Services',
  'Onet Propreté', 'Prosegur Sécurité', 'Quadient France', 'Rexel Distribution', 'Sodexo Pro',
  'Thales Cyber', 'Ubiqus Traduction', 'Veolia Eau Pro', 'Worldline Paiements', 'Xefi Informatique',
  'Yousign SAS', 'Zscaler France', 'Axians Réseaux', 'Bouygues Telecom Entreprises', 'Cegid Logiciels',
  'Docaposte', 'Elior Services', 'Fiducial Bureautique', 'Gefco Transport', 'Hiscox Assurances',
  'ISS Facility', 'Jamespot', 'Kyriba Finance', 'Lyreco France', 'Mazars Conseil', 'Nuxeo Platform',
  'OVHcloud', 'Planet Vélo Pro', 'Qonto Business', 'Randstad Services', 'Schneider Electric',
  'Talend Data', 'Umanis Conseil', 'Verisure Pro', 'Wavestone', 'Sopra Steria',
] as const

const OWNERS = [
  'Claire Dumas', 'Julien Morel', 'Sophie Lambert', 'Thomas Girard', 'Nadia Benali', 'Hugo Fontaine',
  'Émilie Rousseau', 'Karim Haddad', 'Laure Chevalier', 'Antoine Marchand', 'Inès Garnier', 'Paul Lefèvre',
]

const OBJECTS: Record<ContractType, string[]> = {
  'Fourniture de biens': [
    'Fourniture de postes de travail et périphériques',
    'Fourniture de mobilier de bureau ergonomique',
    'Approvisionnement en consommables d’impression',
    'Fourniture d’équipements de protection individuelle',
  ],
  'Prestation de services': [
    'Prestations de nettoyage multi-sites',
    'Assistance à maîtrise d’ouvrage SI',
    'Prestations de sécurité et gardiennage',
    'Services de traduction juridique',
  ],
  Maintenance: [
    'Maintenance préventive des installations CVC',
    'Maintenance du parc d’ascenseurs',
    'Tierce maintenance applicative ERP',
    'Maintenance des infrastructures réseau',
  ],
  Abonnement: [
    'Abonnement télécom flotte mobile',
    'Abonnement hébergement cloud IaaS',
    'Abonnement veille juridique et réglementaire',
    'Abonnement plateforme de signature électronique',
  ],
  Licence: [
    'Licences logicielles CAO',
    'Licences suite collaborative',
    'Licence plateforme de gestion de trésorerie',
    'Licences outil de cybersécurité EDR',
  ],
}

const INDEXES = ['Syntec', 'INSEE ICHT-IME', 'IPC hors tabac', 'BT01', 'ILAT']
const TAG_POOL = ['RGPD', 'Stratégique', 'Multi-sites', 'Cloud', 'Sous-traitance', 'ESG', 'Offshore', 'Audit 2026']

// Crafted reference-date offsets so the portfolio contains exactly 3 J-10 and 8 J-30 alerts.
const CRAFTED_OFFSETS = [3, 6, 9, 12, 14, 17, 19, 22, 25, 27, 29]
const CRAFTED_CRITICALITY: Criticality[] = [
  'Critique', 'Majeur', 'Critique', 'Critique', 'Majeur', 'Standard', 'Critique', 'Majeur', 'Standard', 'Majeur', 'Faible',
]

function siret() {
  let s = ''
  for (let i = 0; i < 14; i++) s += between(0, 9)
  return s
}

function slug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function generateContracts(): Contract[] {
  const raw: Omit<Contract, 'amount' | 'budget' | 'actualSpent'>[] = []
  const weights: number[] = []
  const spendRatios: number[] = []

  for (let i = 0; i < CONTRACT_COUNT; i++) {
    const crafted = i < CRAFTED_OFFSETS.length
    const type = pick(CONTRACT_TYPES)
    const supplierName = crafted ? SUPPLIERS[(i * 7) % SUPPLIERS.length] : pick(SUPPLIERS)
    const tacitRenewal = crafted ? i % 3 !== 1 : rng() < 0.6
    const noticeDays = tacitRenewal ? pick([30, 60, 90] as const) : undefined
    const durationMonths = pick([12, 24, 36, 48] as const)

    let refOffset: number
    if (crafted) refOffset = CRAFTED_OFFSETS[i]
    else refOffset = rng() < 0.16 ? between(31, 90) : between(91, 1100)

    const endDate = addDays(TODAY, refOffset + (noticeDays ?? 0))
    const effectiveDate = addMonths(endDate, -durationMonths)
    const signatureDate = addDays(effectiveDate, -between(5, 30))
    const year = signatureDate.slice(0, 4)
    const criticality: Criticality = crafted
      ? CRAFTED_CRITICALITY[i]
      : pick(['Critique', 'Majeur', 'Majeur', 'Standard', 'Standard', 'Standard', 'Faible'] as const)

    const priceRevision = rng() < 0.45
    const latePenalty = rng() < 0.55
    const earlyTerminationPenalty = rng() < 0.3
    const bankGuarantee = criticality === 'Critique' ? rng() < 0.7 : rng() < 0.15
    const d = rng()
    const lastDecision: LastDecision = d < 0.72 ? 'Renouvelé' : d < 0.9 ? 'Résilié' : 'Aucune'
    const tagCount = between(0, 3)
    const tags = Array.from(new Set(Array.from({ length: tagCount }, () => pick(TAG_POOL))))

    const weightBase = criticality === 'Critique' ? 3 : criticality === 'Majeur' ? 1.8 : criticality === 'Standard' ? 1 : 0.5
    weights.push(weightBase * (0.3 + rng() ** 2 * 3))
    spendRatios.push(0.82 + rng() * 0.32)

    const owner = pick(OWNERS)
    raw.push({
      id: `c-${i + 1}`,
      reference: `CTR-${year}-${String(1000 + i).padStart(4, '0')}`,
      type,
      object: pick(OBJECTS[type]),
      signatureDate,
      effectiveDate,
      endDate,
      supplier: {
        name: supplierName,
        siret: siret(),
        legalContact: pick(['M. Bernard', 'Mme Petit', 'M. Durand', 'Mme Leroy', 'M. Moreau', 'Mme Simon']),
        email: `juridique@${slug(supplierName)}.fr`,
      },
      department: pick(DEPARTMENTS),
      owner,
      currency: 'EUR',
      billing: pick(BILLING_PERIODS),
      paymentTerms: pick(['30 jours fin de mois', '45 jours date de facture', '60 jours date de facture', 'À réception']),
      priceRevision,
      priceIndex: priceRevision ? pick(INDEXES) : undefined,
      durationMonths,
      tacitRenewal,
      renewalMonths: tacitRenewal ? pick([12, 12, 24]) : undefined,
      noticeDays,
      terminationMode: pick(TERMINATION_MODES),
      latePenalty,
      latePenaltyRate: latePenalty ? pick([0.5, 1, 1.5, 2]) : undefined,
      latePenaltyCap: latePenalty ? pick([5, 10, 15]) : undefined,
      earlyTerminationPenalty,
      earlyTerminationAmount: undefined,
      bankGuarantee,
      guaranteeAmount: undefined,
      criticality,
      tags,
      notes: '',
      documents: [
        { name: `${year}-contrat-${slug(supplierName)}.pdf`, kind: 'Contrat' },
        ...(rng() < 0.3 ? [{ name: `avenant-1-${slug(supplierName)}.pdf`, kind: 'Avenant' as const }] : []),
        { name: `cgv-${slug(supplierName)}.pdf`, kind: 'CGV' },
      ],
      compliant: i % 17 !== 8,
      performanceScore: between(55, 98),
      lateDeliveries: rng() < 0.15 ? between(1, 4) : 0,
      lastDecision,
    })
  }

  const totalWeight = weights.reduce((a, b) => a + b, 0)
  const amounts = weights.map((w) => Math.round(((w / totalWeight) * TOTAL_PORTFOLIO_VALUE) / 100) * 100)
  const drift = TOTAL_PORTFOLIO_VALUE - amounts.reduce((a, b) => a + b, 0)
  const largest = amounts.indexOf(Math.max(...amounts))
  amounts[largest] += drift

  return raw.map((c, i) => {
    const amount = amounts[i]
    return {
      ...c,
      amount,
      budget: amount,
      actualSpent: Math.round(amount * spendRatios[i]),
      earlyTerminationAmount: c.earlyTerminationPenalty ? Math.round(amount * 0.15) : undefined,
      guaranteeAmount: c.bankGuarantee ? Math.round(amount * 0.1) : undefined,
    }
  })
}

export const initialContracts: Contract[] = generateContracts()

function iso(date: string, time: string) {
  return `${date}T${time}:00.000Z`
}

function closedDispute(n: number, contractIdx: number, type: Dispute['type'], amount: number, final: number, start: string, days: number): Dispute {
  const c = initialContracts[contractIdx]
  const closedAt = addDays(start, days)
  return {
    id: `LIT-2026-${String(n).padStart(4, '0')}`,
    contractId: c.id,
    type,
    source: n % 2 ? 'Manuel' : 'Moteur d’alertes',
    description: `${type} relevé(e) sur le contrat ${c.reference} avec ${c.supplier.name}.`,
    amountAtStake: amount,
    createdAt: iso(start, '09:12'),
    createdBy: 'USR-JUR-014',
    status: 'Clôturé',
    history: [
      { status: 'Nouveau', at: iso(start, '09:12'), userId: 'USR-JUR-014' },
      { status: 'Analyse interne', at: iso(addDays(start, 2), '10:40'), userId: 'USR-JUR-014' },
      { status: 'Négociation', at: iso(addDays(start, Math.floor(days / 2)), '15:05'), userId: 'USR-ACH-022' },
      { status: 'Avoir attendu', at: iso(addDays(start, days - 4), '11:30'), userId: 'USR-FIN-008' },
      { status: 'Clôturé', at: iso(closedAt, '17:20'), userId: 'USR-FIN-008', note: 'Avoir reçu et comptabilisé' },
    ],
    evidence: defaultEvidence(c),
    legalAnalysis: 'Manquement établi au regard des engagements de niveau de service.',
    financialAssessment: `Préjudice évalué à ${amount.toLocaleString('fr-FR')} € HT.`,
    legalDueAt: iso(addDays(start, 5), '18:00'),
    financeDueAt: iso(addDays(start, 3), '18:00'),
    exchanges: [
      { at: iso(addDays(start, 3), '09:00'), direction: 'Sortant', channel: 'Email', summary: 'Notification formelle du différend au fournisseur.', userId: 'USR-JUR-014' },
      { at: iso(addDays(start, 8), '14:20'), direction: 'Entrant', channel: 'Email', summary: 'Le fournisseur reconnaît l’écart et propose un avoir.', userId: 'EXT' },
    ],
    closure: { creditNoteBooked: true, invoiceCorrected: true, finalAmount: final, closedAt: iso(closedAt, '17:20') },
  }
}

export function defaultEvidence(c: Contract): Dispute['evidence'] {
  return [
    { kind: 'Contrat', label: `${c.reference} — contrat signé`, date: c.signatureDate, available: true },
    { kind: 'Facture', label: `FAC-${c.reference.slice(4)}-031`, date: addDays(TODAY, -42), available: true },
    { kind: 'Facture', label: `FAC-${c.reference.slice(4)}-032`, date: addDays(TODAY, -12), available: true },
    { kind: 'Bon de commande', label: `BC-2026-${c.reference.slice(-4)}`, date: addDays(TODAY, -60), available: true },
    { kind: 'Bon de livraison', label: `BL-2026-${c.reference.slice(-4)}`, date: addDays(TODAY, -38), available: false },
    { kind: 'Correspondance', label: 'Échanges email avec le fournisseur', date: addDays(TODAY, -9), available: true },
  ]
}

export const initialDisputes: Dispute[] = [
  closedDispute(1, 40, 'Facturation non conforme', 12_400, 11_900, '2026-01-12', 34),
  closedDispute(2, 77, 'Manquement contractuel', 38_000, 22_500, '2026-02-20', 51),
  closedDispute(3, 102, 'Contestation de reconduction', 46_000, 0, '2026-03-18', 27),
  closedDispute(4, 130, 'Facturation non conforme', 8_700, 8_700, '2026-05-04', 19),
  closedDispute(5, 166, 'Manquement contractuel', 61_500, 40_000, '2026-06-09', 63),
  closedDispute(6, 201, 'Facturation non conforme', 5_300, 5_300, '2026-08-27', 15),
  {
    id: 'LIT-2026-0007',
    contractId: initialContracts[3].id,
    type: 'Facturation non conforme',
    source: 'Moteur d’alertes',
    description: `Écart de 18 % entre la facture trimestrielle et le bordereau de prix contractuel (${initialContracts[3].reference}).`,
    amountAtStake: 68_400,
    createdAt: iso(addDays(TODAY, -6), '08:47'),
    createdBy: 'SYS-ALERT',
    status: 'Analyse interne',
    history: [
      { status: 'Nouveau', at: iso(addDays(TODAY, -6), '08:47'), userId: 'SYS-ALERT', note: 'Déclenchement automatique : écart de facturation' },
      { status: 'Pièces manquantes', at: iso(addDays(TODAY, -5), '10:15'), userId: 'USR-JUR-014', note: 'Bon de livraison manquant' },
      { status: 'Analyse interne', at: iso(addDays(TODAY, -3), '16:02'), userId: 'USR-JUR-014' },
    ],
    evidence: defaultEvidence(initialContracts[3]),
    legalAnalysis: 'Le bordereau de prix annexé (annexe 2) ne prévoit aucune révision avant le 1er janvier 2027.',
    financialAssessment: '',
    legalDueAt: iso(addDays(TODAY, 2), '18:00'),
    financeDueAt: iso(addDays(TODAY, -1), '18:00'),
    exchanges: [],
    closure: { creditNoteBooked: false, invoiceCorrected: false },
  },
  {
    id: 'LIT-2026-0008',
    contractId: initialContracts[1].id,
    type: 'Contestation de reconduction',
    source: 'Manuel',
    description: `Le fournisseur conteste la validité de la résiliation notifiée pour ${initialContracts[1].reference}.`,
    amountAtStake: 24_000,
    createdAt: iso(addDays(TODAY, -19), '11:05'),
    createdBy: 'USR-ACH-022',
    status: 'Négociation',
    history: [
      { status: 'Nouveau', at: iso(addDays(TODAY, -19), '11:05'), userId: 'USR-ACH-022' },
      { status: 'Analyse interne', at: iso(addDays(TODAY, -17), '09:30'), userId: 'USR-JUR-014' },
      { status: 'Réponse fournisseur attendue', at: iso(addDays(TODAY, -12), '14:45'), userId: 'USR-JUR-014' },
      { status: 'Négociation', at: iso(addDays(TODAY, -4), '10:00'), userId: 'USR-ACH-022' },
    ],
    evidence: defaultEvidence(initialContracts[1]),
    legalAnalysis: 'Préavis notifié par email alors que le contrat impose la lettre recommandée — risque modéré.',
    financialAssessment: 'Exposition : 12 mois de reconduction, soit 24 000 € HT.',
    legalDueAt: iso(addDays(TODAY, -14), '18:00'),
    financeDueAt: iso(addDays(TODAY, -16), '18:00'),
    exchanges: [
      { at: iso(addDays(TODAY, -12), '15:00'), direction: 'Sortant', channel: 'Lettre recommandée', summary: 'Confirmation de la volonté de résilier, rappel des faits.', userId: 'USR-JUR-014' },
      { at: iso(addDays(TODAY, -6), '09:40'), direction: 'Entrant', channel: 'Email', summary: 'Le fournisseur propose une reconduction de 6 mois avec remise de 10 %.', userId: 'EXT' },
      { at: iso(addDays(TODAY, -4), '10:00'), direction: 'Sortant', channel: 'Visioconférence', summary: 'Réunion de négociation — contre-proposition à 3 mois.', userId: 'USR-ACH-022' },
    ],
    closure: { creditNoteBooked: false, invoiceCorrected: false },
  },
]

export const initialDecisions: Decision[] = [
  {
    id: 'DEC-01',
    title: 'Renouvellement stratégique',
    contractId: initialContracts[0].id,
    context: 'Reconduction tacite imminente sur un contrat critique — validation DG requise.',
    amount: initialContracts[0].amount,
    dueDate: addDays(TODAY, 3),
    status: 'En attente',
  },
  {
    id: 'DEC-02',
    title: 'Escalade litige > 50 k€',
    contractId: initialContracts[3].id,
    context: 'Litige LIT-2026-0007 escaladé automatiquement (seuil de 50 000 € dépassé).',
    amount: 68_400,
    dueDate: addDays(TODAY, 2),
    status: 'En attente',
  },
  {
    id: 'DEC-03',
    title: 'Résiliation anticipée',
    contractId: initialContracts[2].id,
    context: 'Performance fournisseur insuffisante, pénalité de résiliation à arbitrer.',
    amount: Math.round(initialContracts[2].amount * 0.15),
    dueDate: addDays(TODAY, 9),
    status: 'En attente',
  },
  {
    id: 'DEC-04',
    title: 'Dépassement budgétaire',
    contractId: initialContracts[6].id,
    context: 'Réalisé supérieur au budget engagé — approbation d’un avenant financier.',
    amount: Math.round(initialContracts[6].amount * 0.12),
    dueDate: addDays(TODAY, 14),
    status: 'En attente',
  },
]

export const USERS: Record<string, string> = {
  'USR-JUR-014': 'Claire Dumas · Juriste',
  'USR-ACH-022': 'Julien Morel · Achats',
  'USR-FIN-008': 'Sophie Lambert · Finance',
  'USR-DG-001': 'Marc Delattre · DG',
  'SYS-ALERT': 'Moteur d’alertes',
  EXT: 'Fournisseur',
}
