'use client'

import { createContext, useContext, useId, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Flag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/registry/bits'
import { confidenceStatus, type ContractFormState, type FieldKey } from '@/lib/contract-form'
import { cn } from '@/lib/utils'

interface FormCtx {
  values: ContractFormState
  set: <K extends FieldKey>(key: K, value: ContractFormState[K]) => void
  touch: (key: FieldKey) => void
  errorFor: (key: FieldKey) => string | undefined
  confidence: Partial<Record<FieldKey, number>>
}

const Ctx = createContext<FormCtx | null>(null)
export const FormProvider = Ctx.Provider
export function useContractForm() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useContractForm must be used inside FormProvider')
  return c
}

export function FormSection({ letter, title, description, children }: { letter: string; title: string; description: string; children: ReactNode }) {
  return (
    <section id={`section-${letter}`} aria-labelledby={`section-${letter}-title`} className="scroll-mt-24 rounded-xl border bg-card">
      <header className="flex items-start gap-4 border-b p-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary font-display text-sm text-primary-foreground">{letter}</span>
        <div>
          <h2 id={`section-${letter}-title`} className="font-display text-sm tracking-wide">
            {title}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="grid gap-x-5 gap-y-4 p-5 md:grid-cols-2">{children}</div>
    </section>
  )
}

export function ConfidenceTag({ score }: { score: number }) {
  const status = confidenceStatus(score)
  const map = {
    validated: { icon: CheckCircle2, cls: 'bg-success/10 text-success', label: 'IA validé' },
    review: { icon: AlertTriangle, cls: 'bg-warning/15 text-warning-foreground', label: 'À vérifier' },
    manual: { icon: Flag, cls: 'bg-destructive/10 text-destructive', label: 'Saisie manuelle' },
  }[status]
  const Icon = map.icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums', map.cls)} title={`Confiance IA : ${score} %`}>
      <Icon className="size-3" aria-hidden />
      {map.label} · {score} %
    </span>
  )
}

function FieldShell({ name, label, hint, required, full, children }: { name: FieldKey; label: string; hint?: ReactNode; required?: boolean; full?: boolean; children: (id: string, describedBy: string | undefined, invalid: boolean) => ReactNode }) {
  const { errorFor, confidence } = useContractForm()
  const id = useId()
  const error = errorFor(name)
  const score = confidence[name]
  const describedBy = [error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
  const status = score !== undefined ? confidenceStatus(score) : undefined
  return (
    <div className={cn('flex flex-col gap-1.5', full && 'md:col-span-2')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium">
          {label}
          {required && (
            <span className="text-destructive" aria-hidden>
              {' '}
              *
            </span>
          )}
        </label>
        {score !== undefined && <ConfidenceTag score={score} />}
      </div>
      <div className={cn('rounded-lg', status === 'review' && 'ring-2 ring-warning/50', status === 'manual' && 'ring-2 ring-destructive/40')}>{children(id, describedBy, Boolean(error))}</div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

type TextKeys = { [K in FieldKey]: ContractFormState[K] extends string ? K : never }[FieldKey]

export function TextField({ name, label, type = 'text', placeholder, hint, required, full, inputMode, min, step, suffix }: { name: TextKeys; label: string; type?: string; placeholder?: string; hint?: ReactNode; required?: boolean; full?: boolean; inputMode?: 'numeric' | 'decimal' | 'email'; min?: number; step?: string; suffix?: string }) {
  const { values, set, touch } = useContractForm()
  return (
    <FieldShell name={name} label={label} hint={hint} required={required} full={full}>
      {(id, describedBy, invalid) => (
        <div className="relative">
          <Input
            id={id}
            type={type}
            value={values[name]}
            placeholder={placeholder}
            inputMode={inputMode}
            min={min}
            step={step}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            aria-required={required}
            onChange={(e) => set(name, e.target.value as never)}
            onBlur={() => touch(name)}
            className={cn('h-9', suffix && 'pr-12')}
          />
          {suffix && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
        </div>
      )}
    </FieldShell>
  )
}

export function TextAreaField({ name, label, placeholder, required }: { name: TextKeys; label: string; placeholder?: string; required?: boolean }) {
  const { values, set, touch } = useContractForm()
  return (
    <FieldShell name={name} label={label} required={required} full>
      {(id, describedBy, invalid) => (
        <Textarea
          id={id}
          rows={3}
          value={values[name]}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-required={required}
          onChange={(e) => set(name, e.target.value as never)}
          onBlur={() => touch(name)}
        />
      )}
    </FieldShell>
  )
}

export function SelectField({ name, label, options, placeholder = 'Sélectionner…', required }: { name: TextKeys; label: string; options: readonly string[]; placeholder?: string; required?: boolean }) {
  const { values, set, touch } = useContractForm()
  return (
    <FieldShell name={name} label={label} required={required}>
      {(id, describedBy, invalid) => (
        <NativeSelect
          id={id}
          value={values[name]}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-required={required}
          onChange={(e) => (set(name, e.target.value as never), touch(name))}
          onBlur={() => touch(name)}
          className="h-9"
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </NativeSelect>
      )}
    </FieldShell>
  )
}

type BoolKeys = { [K in FieldKey]: ContractFormState[K] extends boolean ? K : never }[FieldKey]

export function ToggleField({ name, label, description }: { name: BoolKeys; label: string; description: string }) {
  const { values, set, confidence } = useContractForm()
  const id = useId()
  const score = confidence[name]
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-3 md:col-span-2">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={id} className="text-sm font-medium">
            {label}
          </label>
          {score !== undefined && <ConfidenceTag score={score} />}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground" aria-hidden>
          {values[name] ? 'OUI' : 'NON'}
        </span>
        <Switch id={id} checked={values[name]} onCheckedChange={(v) => set(name, v)} />
      </div>
    </div>
  )
}

export function Conditional({ show, children }: { show: boolean; children: ReactNode }) {
  if (!show) return null
  return <div className="grid gap-x-5 gap-y-4 border-l-2 border-primary/30 pl-4 md:col-span-2 md:grid-cols-2 animate-in fade-in slide-in-from-top-1">{children}</div>
}
