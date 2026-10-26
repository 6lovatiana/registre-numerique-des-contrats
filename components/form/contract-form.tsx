'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { CalendarClock, RotateCcw, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/registry/bits'
import { diffDays, TODAY } from '@/lib/alerts'
import {
  EMPTY_FORM,
  MAX_B2B_NOTICE_DAYS,
  confidenceStatus,
  formNoticeDeadline,
  formToContract,
  simulateExtraction,
  validateContractForm,
  type ContractFormState,
  type Extraction,
  type FieldKey,
} from '@/lib/contract-form'
import { formatDate } from '@/lib/format'
import { useRegistry } from '@/lib/store'
import { BILLING_PERIODS, CONTRACT_TYPES, CRITICALITIES, CURRENCIES, DEPARTMENTS, TERMINATION_MODES } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AiIngestion, INGESTION_STEPS } from './ai-ingestion'
import { FileDrop, TagInput } from './file-inputs'
import { Conditional, FormProvider, FormSection, SelectField, TextAreaField, TextField, ToggleField } from './form-primitives'

const SECTIONS: { letter: string; label: string; fields: FieldKey[] }[] = [
  { letter: 'A', label: 'Identification', fields: ['reference', 'type', 'object', 'signatureDate', 'effectiveDate', 'endDate'] },
  { letter: 'B', label: 'Parties', fields: ['supplierName', 'siret', 'legalContact', 'email', 'department', 'owner'] },
  { letter: 'C', label: 'Financier', fields: ['amount', 'currency', 'billing', 'paymentTerms', 'priceIndex'] },
  { letter: 'D', label: 'Durée', fields: ['durationMonths', 'renewalMonths', 'noticeDays', 'terminationMode'] },
  { letter: 'E', label: 'Pénalités', fields: ['latePenaltyRate', 'latePenaltyCap', 'earlyTerminationAmount', 'guaranteeAmount'] },
  { letter: 'F', label: 'Documents', fields: ['contractFile', 'termsFile', 'criticality'] },
]

interface Ingestion {
  fileName: string
  step: number
  progress: number
  results: Extraction[] | null
}

export function ContractForm() {
  const router = useRouter()
  const { contracts, addContract } = useRegistry()
  const [values, setValues] = useState<ContractFormState>(EMPTY_FORM)
  const [touched, setTouched] = useState<Set<FieldKey>>(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [confidence, setConfidence] = useState<Partial<Record<FieldKey, number>>>({})
  const [ingestion, setIngestion] = useState<Ingestion | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => void (timer.current && clearInterval(timer.current)), [])

  const references = useMemo(() => new Set(contracts.map((c) => c.reference)), [contracts])
  const nextReference = useMemo(() => {
    const max = contracts.reduce((m, c) => Math.max(m, Number(c.reference.slice(-4)) || 0), 0)
    return `CTR-${TODAY.slice(0, 4)}-${String(max + 1).padStart(4, '0')}`
  }, [contracts])
  const errors = validateContractForm(values, references)
  const errorCount = Object.keys(errors).length

  const set: <K extends FieldKey>(key: K, value: ContractFormState[K]) => void = (key, value) => {
    setValues((v) => ({ ...v, [key]: value }))
    setConfidence((c) => {
      if (!(key in c)) return c
      const { [key]: _removed, ...rest } = c
      return rest
    })
  }
  const touch = (key: FieldKey) => setTouched((t) => (t.has(key) ? t : new Set(t).add(key)))
  const errorFor = (key: FieldKey) => (submitted || touched.has(key) ? errors[key] : undefined)

  const runIngestion = (file: File) => {
    if (timer.current) clearInterval(timer.current)
    setIngestion({ fileName: file.name, step: 0, progress: 0, results: null })
    let progress = 0
    timer.current = setInterval(() => {
      progress += 4 + Math.random() * 5
      if (progress >= 100) {
        if (timer.current) clearInterval(timer.current)
        const results = simulateExtraction(file.name, nextReference)
        applyExtraction(results)
        setIngestion({ fileName: file.name, step: INGESTION_STEPS.length, progress: 100, results })
        const review = results.filter((r) => confidenceStatus(r.score) !== 'validated').length
        toast.success('Pré-remplissage IA terminé', { description: `${results.length - review} champs validés · ${review} à contrôler` })
        return
      }
      setIngestion((s) => s && { ...s, progress, step: Math.min(INGESTION_STEPS.length - 1, Math.floor(progress / (100 / INGESTION_STEPS.length))) })
    }, 120)
  }

  const applyExtraction = (results: Extraction[]) => {
    const patch: Partial<ContractFormState> = {}
    const scores: Partial<Record<FieldKey, number>> = {}
    for (const r of results) {
      scores[r.field] = r.score
      if (confidenceStatus(r.score) !== 'manual') Object.assign(patch, { [r.field]: r.value })
      else if (typeof r.value === 'string') Object.assign(patch, { [r.field]: '' })
    }
    setValues((v) => ({ ...v, ...patch }))
    setConfidence(scores)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (errorCount > 0) {
      const first = SECTIONS.find((s) => s.fields.some((f) => errors[f]))
      document.getElementById(`section-${first?.letter}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      toast.error('Le formulaire contient des erreurs', { description: `${errorCount} champ${errorCount > 1 ? 's' : ''} à corriger` })
      return
    }
    const contract = formToContract(values)
    try {
      const formData = new FormData()
      formData.set('contract', JSON.stringify(contract))
      if (values.contractFile) formData.set('contractFile', values.contractFile)
      if (values.termsFile) formData.set('termsFile', values.termsFile)
      values.amendments.forEach((file) => formData.append('amendments', file))
      const response = await fetch('/api/contrats', { method: 'POST', body: formData })
      if (!response.ok) throw new Error((await response.json()).detail ?? 'Enregistrement impossible.')
      addContract(contract)
      toast.success(`Contrat ${values.reference} enregistré`, { description: 'Ajouté au registre et au moteur d’alertes' })
      router.push('/registre')
    } catch (error) {
      toast.error('Enregistrement impossible', { description: error instanceof Error ? error.message : 'Vérifiez la connexion à la base de données.' })
    }
  }

  const reset = () => {
    if (timer.current) clearInterval(timer.current)
    setValues(EMPTY_FORM)
    setTouched(new Set())
    setSubmitted(false)
    setConfidence({})
    setIngestion(null)
  }

  const deadline = formNoticeDeadline(values)
  const flagged = Object.entries(confidence).filter(([, s]) => confidenceStatus(s!) !== 'validated').length

  return (
    <FormProvider value={{ values, set, touch, errorFor, confidence }}>
      <PageHeader eyebrow="Saisie" title="Nouveau contrat" description="Déposez le contrat signé pour un pré-remplissage IA, puis complétez et validez les 6 sections." />

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
        <nav aria-label="Sections du formulaire" className="sticky top-16 z-30 -mx-1 flex items-center gap-2 overflow-x-auto rounded-xl border bg-background/90 p-1.5 backdrop-blur">
          {SECTIONS.map((s) => {
            const invalid = submitted && s.fields.some((f) => errors[f])
            return (
              <a key={s.letter} href={`#section-${s.letter}`} className={cn('flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-muted', invalid && 'text-destructive')}>
                <span className={cn('flex size-5 items-center justify-center rounded font-display text-[10px]', invalid ? 'bg-destructive text-primary-foreground' : 'bg-muted')}>{s.letter}</span>
                {s.label}
              </a>
            )
          })}
          <span className="ml-auto hidden shrink-0 px-2 text-xs text-muted-foreground md:inline" aria-live="polite">
            {flagged > 0 && <span className="text-warning-foreground">{flagged} champs IA à vérifier · </span>}
            {errorCount === 0 ? <span className="text-success">Formulaire valide</span> : `${errorCount} contrôle${errorCount > 1 ? 's' : ''} en attente`}
          </span>
        </nav>

        <div className="grid gap-4 rounded-xl border border-dashed border-primary/40 bg-accent/30 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <h2 className="font-display text-sm tracking-wide">Ingestion automatique</h2>
            <p className="mt-1 text-xs text-pretty text-muted-foreground">
              Le document contractuel est analysé localement (OCR + NLP). Les champs extraits sont pré-remplis avec un score de confiance : {'> 95 %'} validé, 70–95 % à vérifier, {'< 70 %'} laissé vide.
            </p>
          </div>
          <FileDrop
            label="Document contractuel (PDF)"
            hint="PDF signé · 20 Mo max"
            accept="application/pdf,.pdf"
            required
            files={values.contractFile ? [values.contractFile] : []}
            onFiles={([f]) => {
              set('contractFile', f)
              touch('contractFile')
              runIngestion(f)
            }}
            onRemove={() => set('contractFile', null)}
            error={errorFor('contractFile')}
          />
        </div>

        {ingestion && <AiIngestion {...ingestion} />}

        <FormSection letter="A" title="Identification du contrat" description="Référence unique, nature et dates clés">
          <TextField name="reference" label="Référence contrat" placeholder={nextReference} hint="Format CTR-AAAA-NNNN" required />
          <SelectField name="type" label="Type de contrat" options={CONTRACT_TYPES} required />
          <TextAreaField name="object" label="Objet du contrat" placeholder="Décrivez la nature des prestations ou fournitures…" required />
          <TextField name="signatureDate" label="Date de signature" type="date" required />
          <TextField name="effectiveDate" label="Date d’effet" type="date" required />
          <TextField name="endDate" label="Date d’échéance initiale" type="date" required />
        </FormSection>

        <FormSection letter="B" title="Parties contractantes" description="Fournisseur et cocontractant interne">
          <TextField name="supplierName" label="Fournisseur - Raison sociale" required />
          <TextField name="siret" label="Fournisseur - SIRET" inputMode="numeric" placeholder="14 chiffres" required />
          <TextField name="legalContact" label="Fournisseur - Contact juridique" required />
          <TextField name="email" label="Fournisseur - Email" type="email" inputMode="email" required />
          <SelectField name="department" label="Cocontractant interne" options={DEPARTMENTS} required />
          <TextField name="owner" label="Responsable interne" required />
        </FormSection>

        <FormSection letter="C" title="Conditions financières" description="Montant, facturation et indexation">
          <TextField name="amount" label="Montant total HT" type="number" inputMode="decimal" min={0} step="0.01" suffix={values.currency} required />
          <SelectField name="currency" label="Devise" options={CURRENCIES} placeholder="" required />
          <SelectField name="billing" label="Périodicité de facturation" options={BILLING_PERIODS} required />
          <TextField name="paymentTerms" label="Modalités de paiement" placeholder="ex. 30 jours fin de mois" required />
          <ToggleField name="priceRevision" label="Révision de prix" description="Le prix est indexé sur un indice de référence" />
          <Conditional show={values.priceRevision}>
            <TextField name="priceIndex" label="Index de référence" placeholder="Syntec, ICHT-IME, INSEE BT01…" required full />
          </Conditional>
        </FormSection>

        <FormSection letter="D" title="Durée et reconduction" description="Les alertes J-30 / J-10 sont calculées sur la date limite de préavis en cas de reconduction tacite">
          <TextField name="durationMonths" label="Durée initiale" type="number" inputMode="numeric" min={1} suffix="mois" required />
          <SelectField name="terminationMode" label="Mode de résiliation" options={TERMINATION_MODES} required />
          <ToggleField name="tacitRenewal" label="Clause de reconduction tacite" description="Le contrat se renouvelle automatiquement sans préavis" />
          <Conditional show={values.tacitRenewal}>
            <TextField name="renewalMonths" label="Durée de reconduction" type="number" inputMode="numeric" min={1} suffix="mois" required />
            <TextField name="noticeDays" label="Préavis de résiliation" type="number" inputMode="numeric" min={1} suffix="jours" hint={`Maximum ${MAX_B2B_NOTICE_DAYS} jours (B2B)`} required />
            <div className="flex items-center gap-3 rounded-lg bg-primary p-3 text-primary-foreground md:col-span-2" aria-live="polite">
              <CalendarClock className="size-5 shrink-0" aria-hidden />
              <div className="flex-1">
                <p className="text-xs text-primary-foreground/70">Date limite de préavis · calcul automatique</p>
                <p className="font-display text-sm">{deadline ? formatDate(deadline) : 'Renseignez l’échéance et le préavis'}</p>
              </div>
              {deadline && <span className="text-xs tabular-nums">{diffDays(TODAY, deadline) >= 0 ? `J-${diffDays(TODAY, deadline)}` : 'Dépassée'}</span>}
            </div>
          </Conditional>
        </FormSection>

        <FormSection letter="E" title="Pénalités et garanties" description="Clauses de protection financière">
          <ToggleField name="latePenalty" label="Clause de pénalités de retard" description="Pénalités applicables en cas de retard de livraison" />
          <Conditional show={values.latePenalty}>
            <TextField name="latePenaltyRate" label="Taux de pénalités" type="number" inputMode="decimal" min={0} step="0.1" suffix="%/sem." required />
            <TextField name="latePenaltyCap" label="Plafond de pénalités" type="number" inputMode="decimal" min={0} step="0.5" suffix="% HT" required />
          </Conditional>
          <ToggleField name="earlyTerminationPenalty" label="Pénalités de résiliation anticipée" description="Indemnité due en cas de sortie avant terme" />
          <Conditional show={values.earlyTerminationPenalty}>
            <TextField name="earlyTerminationAmount" label="Montant des pénalités de résiliation" type="number" inputMode="decimal" min={0} suffix={values.currency} required full />
          </Conditional>
          <ToggleField name="bankGuarantee" label="Garantie bancaire" description="Garantie à première demande fournie par le fournisseur" />
          <Conditional show={values.bankGuarantee}>
            <TextField name="guaranteeAmount" label="Montant de la garantie" type="number" inputMode="decimal" min={0} suffix={values.currency} required full />
          </Conditional>
        </FormSection>

        <FormSection letter="F" title="Documents et méta-informations" description="Pièces annexes, criticité et classification">
          <FileDrop
            label="Avenants"
            hint="Plusieurs fichiers acceptés"
            multiple
            files={values.amendments}
            onFiles={(f) => set('amendments', [...values.amendments, ...f])}
            onRemove={(i) => set('amendments', values.amendments.filter((_, j) => j !== i))}
          />
          <FileDrop
            label="Conditions générales (PDF)"
            hint="CGV / CGA du fournisseur"
            accept="application/pdf,.pdf"
            files={values.termsFile ? [values.termsFile] : []}
            onFiles={([f]) => (set('termsFile', f), touch('termsFile'))}
            onRemove={() => set('termsFile', null)}
            error={errorFor('termsFile')}
          />
          <SelectField name="criticality" label="Niveau de criticité" options={CRITICALITIES} required />
          <TagInput value={values.tags} onChange={(t) => set('tags', t)} />
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="notes" className="text-xs font-medium">
              Notes internes
            </label>
            <Textarea id="notes" rows={3} value={values.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Points de vigilance, historique de négociation…" />
          </div>
        </FormSection>

        <div className="sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur">
          <p className="text-xs text-muted-foreground">
            {submitted && errorCount > 0 ? <span className="text-destructive">{errorCount} champ(s) à corriger avant enregistrement</span> : 'Les champs marqués * sont obligatoires'}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={reset}>
              <RotateCcw data-icon="inline-start" aria-hidden />
              Réinitialiser
            </Button>
            <Button type="submit">
              <Save data-icon="inline-start" aria-hidden />
              Enregistrer le contrat
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}
