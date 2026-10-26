import type { AlertLevel } from '@/lib/types'

export const MILESTONE_STYLE: Record<AlertLevel, { dot: string; chip: string; ring: string }> = {
  'J-90': { dot: 'bg-chart-4', chip: 'bg-accent text-accent-foreground', ring: 'ring-chart-4/30' },
  'J-60': { dot: 'bg-primary', chip: 'bg-primary/10 text-primary', ring: 'ring-primary/30' },
  'J-30': { dot: 'bg-warning', chip: 'bg-warning/20 text-warning-foreground', ring: 'ring-warning/40' },
  'J-10': { dot: 'bg-destructive', chip: 'bg-destructive/10 text-destructive', ring: 'ring-destructive/30' },
  'J-5': { dot: 'bg-foreground', chip: 'bg-foreground text-background', ring: 'ring-foreground/30' },
}
