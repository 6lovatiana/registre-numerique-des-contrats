'use client'

import { Check, Cpu, FileSearch, Loader2, Tags, Wand2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { confidenceStatus, type Extraction } from '@/lib/contract-form'
import { cn } from '@/lib/utils'
import { ConfidenceTag } from './form-primitives'

export const INGESTION_STEPS = [
  { label: 'Analyse du texte', detail: 'OCR · extraction de 14 pages, 4 812 tokens', icon: FileSearch },
  { label: 'Classification', detail: 'NLP · type de contrat et clauses détectées', icon: Tags },
  { label: 'Pré-remplissage structuré', detail: 'Mapping des entités vers les 6 sections', icon: Wand2 },
] as const

export function AiIngestion({ fileName, step, progress, results }: { fileName: string; step: number; progress: number; results: Extraction[] | null }) {
  const done = results !== null
  const counts = done
    ? results.reduce(
        (acc, r) => ((acc[confidenceStatus(r.score)] += 1), acc),
        { validated: 0, review: 0, manual: 0 } as Record<'validated' | 'review' | 'manual', number>,
      )
    : null

  return (
    <section aria-live="polite" aria-label="Ingestion IA du document" className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-3 border-b bg-primary px-5 py-3 text-primary-foreground">
        <Cpu className="size-4" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-display text-xs tracking-wide">Module IA · OCR / NLP</p>
          <p className="truncate text-xs text-primary-foreground/70">{fileName}</p>
        </div>
        <span className="text-xs tabular-nums">{done ? 'Terminé' : `${Math.round(progress)} %`}</span>
      </div>

      <div className="p-5">
        <Progress value={done ? 100 : progress} aria-label="Progression du traitement" />
        <ol className="mt-4 grid gap-3 md:grid-cols-3">
          {INGESTION_STEPS.map((s, i) => {
            const state = done || i < step ? 'done' : i === step ? 'active' : 'pending'
            const Icon = s.icon
            return (
              <li key={s.label} className={cn('flex items-start gap-3 rounded-lg border p-3', state === 'active' && 'border-primary bg-accent/40', state === 'pending' && 'opacity-50')}>
                <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-md', state === 'done' ? 'bg-success text-success-foreground' : 'bg-muted')}>
                  {state === 'done' ? <Check className="size-4" /> : state === 'active' ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {i + 1}. {s.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.detail}</p>
                </div>
              </li>
            )
          })}
        </ol>

        {done && counts && (
          <div className="mt-5">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-success/10 p-2 text-success">
                <p className="text-lg font-semibold tabular-nums">{counts.validated}</p>
                {'> 95 % · validés'}
              </div>
              <div className="rounded-lg bg-warning/15 p-2 text-warning-foreground">
                <p className="text-lg font-semibold tabular-nums">{counts.review}</p>
                70–95 % · à vérifier
              </div>
              <div className="rounded-lg bg-destructive/10 p-2 text-destructive">
                <p className="text-lg font-semibold tabular-nums">{counts.manual}</p>
                {'< 70 % · manuel'}
              </div>
            </div>
            <ul className="mt-4 grid max-h-72 gap-1.5 overflow-y-auto md:grid-cols-2">
              {results.map((r) => {
                const status = confidenceStatus(r.score)
                const display = typeof r.value === 'boolean' ? (r.value ? 'OUI' : 'NON') : r.value
                return (
                  <li key={r.field} className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs">
                    <div className="min-w-0">
                      <p className="text-muted-foreground">{r.label}</p>
                      <p className={cn('truncate font-medium', status === 'manual' && 'text-muted-foreground italic line-through')}>{display}</p>
                    </div>
                    <ConfidenceTag score={r.score} />
                  </li>
                )
              })}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Les valeurs à moins de 70 % de confiance ne sont pas injectées : les champs restent vides et sont signalés pour vérification manuelle.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
