'use client'

import { AlertTriangle, Check, Cpu, FileSearch, Loader2, ShieldAlert, Sparkles, Tags, Wand2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { confidenceStatus, type Extraction } from '@/lib/contract-form'
import type { ContractAiAnalysis } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ConfidenceTag } from './form-primitives'

export const INGESTION_STEPS = [
  { label: 'Lecture du contrat', detail: 'Récupération des informations', icon: FileSearch },
  { label: 'Analyse du contrat', detail: 'Repérage des données et des clauses', icon: Tags },
  { label: 'Préremplissage', detail: 'Les champs détectés sont complétés', icon: Wand2 },
] as const

export function AiIngestion({ fileName, step, progress, results, analysis }: { fileName: string; step: number; progress: number; results: Extraction[] | null; analysis: ContractAiAnalysis | null }) {
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
          <p className="font-display text-xs tracking-wide">Analyse du contrat</p>
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
                Informations fiables
              </div>
              <div className="rounded-lg bg-warning/15 p-2 text-warning-foreground">
                <p className="text-lg font-semibold tabular-nums">{counts.review}</p>
                À vérifier
              </div>
              <div className="rounded-lg bg-destructive/10 p-2 text-destructive">
                <p className="text-lg font-semibold tabular-nums">{counts.manual}</p>
                À vérifier attentivement
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
                      <p className={cn('truncate font-medium', status === 'manual' && 'text-muted-foreground')}>{display}</p>
                    </div>
                    <ConfidenceTag score={r.score} />
                  </li>
                )
              })}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Les informations extraites sont préremplies. Vérifiez celles qui sont signalées avant l’enregistrement.
            </p>
          </div>
        )}

        {done && analysis && (
          <section className="mt-6 border-t pt-5" aria-label="Fiche d’analyse IA">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" aria-hidden />
              <h3 className="font-display text-sm font-semibold">Fiche d’analyse IA</h3>
            </div>
            <div className="mt-3 rounded-lg border bg-accent/30 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Résumé du contrat</p>
              <p className="text-sm leading-relaxed">{analysis.summary}</p>
            </div>

            <div className="mt-5">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Clauses repérées</h4>
              {analysis.clauses.length === 0 ? (
                <p className="rounded-lg border p-3 text-sm text-muted-foreground">Aucune clause n’a pu être résumée de façon fiable.</p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {analysis.clauses.map((clause, index) => (
                    <li key={`${clause.title}-${index}`} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{clause.title}</p>
                        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', clause.status === 'present' ? 'bg-success/15 text-success' : clause.status === 'not_found' ? 'bg-muted text-muted-foreground' : 'bg-warning/20 text-warning-foreground')}>
                          {clause.status === 'present' ? 'Repérée' : clause.status === 'not_found' ? 'Non repérée' : 'À vérifier'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{clause.summary}</p>
                      {clause.evidence && <blockquote className="mt-2 border-l-2 pl-2 text-xs italic text-muted-foreground">« {clause.evidence} »</blockquote>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-5">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ShieldAlert className="size-3.5" aria-hidden /> Points de vigilance
              </h4>
              {analysis.vigilance.length === 0 ? (
                <p className="rounded-lg border p-3 text-sm text-muted-foreground">Aucun point de vigilance spécifique n’a été identifié par le modèle.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {analysis.vigilance.map((item, index) => (
                    <li key={`${item.title}-${index}`} className={cn('rounded-lg border p-3', item.level === 'high' && 'border-destructive/40 bg-destructive/5', item.level === 'medium' && 'border-warning/40 bg-warning/5')}>
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <AlertTriangle className={cn('size-4', item.level === 'high' ? 'text-destructive' : item.level === 'medium' ? 'text-warning-foreground' : 'text-muted-foreground')} aria-hidden />
                        {item.title}
                        <span className="ml-auto text-[10px] font-semibold uppercase text-muted-foreground">{item.level === 'high' ? 'Élevé' : item.level === 'medium' ? 'À surveiller' : 'Information'}</span>
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                      {item.evidence && <blockquote className="mt-2 border-l-2 pl-2 text-xs italic text-muted-foreground">« {item.evidence} »</blockquote>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Les clauses et points de vigilance sont à vérifier avant validation du contrat.</p>
          </section>
        )}
      </div>
    </section>
  )
}

