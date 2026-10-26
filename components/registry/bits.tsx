import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { Criticality } from '@/lib/types'

const CRITICALITY_STYLES: Record<Criticality, string> = {
  Critique: 'bg-destructive/10 text-destructive border-destructive/20',
  Majeur: 'bg-warning/15 text-warning-foreground border-warning/30',
  Standard: 'bg-accent text-accent-foreground border-primary/10',
  Faible: 'bg-muted text-muted-foreground border-border',
}

export function CriticalityBadge({ value }: { value: Criticality }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', CRITICALITY_STYLES[value])}>
      {value}
    </span>
  )
}

export function DaysBadge({ days }: { days: number }) {
  const tone =
    days < 0
      ? 'bg-muted text-muted-foreground'
      : days <= 10
        ? 'bg-destructive text-primary-foreground'
        : days <= 30
          ? 'bg-warning text-foreground'
          : days <= 90
            ? 'bg-accent text-accent-foreground'
            : 'bg-muted text-muted-foreground'
  return (
    <span className={cn('inline-flex min-w-14 items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums', tone)}>
      {days < 0 ? 'Échu' : `J-${days}`}
    </span>
  )
}

export function Panel({ className, children, ...props }: ComponentProps<'section'>) {
  return (
    <section className={cn('rounded-xl border bg-card p-5', className)} {...props}>
      {children}
    </section>
  )
}

export function PanelHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Stat({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'default' | 'danger' | 'warning' | 'success'
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-2 text-2xl font-semibold tabular-nums tracking-tight',
          tone === 'danger' && 'text-destructive',
          tone === 'warning' && 'text-warning-foreground',
          tone === 'success' && 'text-success',
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function NativeSelect({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Bar({ value, max, tone = 'primary' }: { value: number; max: number; tone?: 'primary' | 'success' | 'warning' | 'danger' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn(
          'h-full rounded-full',
          tone === 'primary' && 'bg-primary',
          tone === 'success' && 'bg-success',
          tone === 'warning' && 'bg-warning',
          tone === 'danger' && 'bg-destructive',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div className="max-w-2xl">
        {eyebrow && <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{eyebrow}</p>}
        <h1 className="mt-1 text-balance text-xl text-foreground md:text-2xl">{title}</h1>
        {description && <p className="mt-2 text-pretty text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
