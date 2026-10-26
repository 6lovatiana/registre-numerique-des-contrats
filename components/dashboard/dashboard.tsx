'use client'

import { useMemo, useState } from 'react'
import { Briefcase, Crown, Landmark, Scale } from 'lucide-react'
import { ExportMenu } from '@/components/contracts/export-menu'
import { FilterBar } from '@/components/contracts/filter-bar'
import { PageHeader } from '@/components/registry/bits'
import { TODAY } from '@/lib/alerts'
import { applyFilters, EMPTY_FILTERS } from '@/lib/filters'
import { formatDate } from '@/lib/format'
import { useRegistry } from '@/lib/store'
import { cn } from '@/lib/utils'
import { DeadlineCalendar } from './deadline-calendar'
import { ExecutiveView } from './executive-view'
import { FinanceView } from './finance-view'
import { LegalView } from './legal-view'
import { PurchasingView } from './purchasing-view'
import { SummaryBanner } from './summary-banner'

const PROFILES = [
  { id: 'legal', label: 'Juriste / Contract Manager', short: 'Juriste', icon: Scale, View: LegalView },
  { id: 'purchasing', label: 'Direction des Achats', short: 'Achats', icon: Briefcase, View: PurchasingView },
  { id: 'finance', label: 'DAF / Finance', short: 'Finance', icon: Landmark, View: FinanceView },
  { id: 'executive', label: 'Direction Générale', short: 'DG', icon: Crown, View: ExecutiveView },
] as const

type ProfileId = (typeof PROFILES)[number]['id']

export function Dashboard() {
  const { contracts } = useRegistry()
  const [profile, setProfile] = useState<ProfileId>('legal')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const filtered = useMemo(() => applyFilters(contracts, filters), [contracts, filters])
  const active = PROFILES.find((p) => p.id === profile)!
  const View = active.View

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={`Situation au ${formatDate(TODAY)}`}
        title="Tableau de bord"
        description={`Vue ${active.label} · portefeuille fournisseurs`}
        actions={<ExportMenu contracts={filtered} />}
      />

      <SummaryBanner />

      <div role="tablist" aria-label="Profil utilisateur" className="grid grid-cols-2 gap-1 rounded-xl border bg-muted/50 p-1 md:grid-cols-4">
        {PROFILES.map((p) => (
          <button
            key={p.id}
            role="tab"
            type="button"
            aria-selected={profile === p.id}
            aria-controls="profile-panel"
            onClick={() => setProfile(p.id)}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              profile === p.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <p.icon className="size-4" aria-hidden />
            <span className="hidden lg:inline">{p.label}</span>
            <span className="lg:hidden">{p.short}</span>
          </button>
        ))}
      </div>

      <FilterBar value={filters} onChange={setFilters} resultCount={filtered.length} />

      <div id="profile-panel" role="tabpanel" aria-label={active.label}>
        <View contracts={filtered} />
      </div>

      <DeadlineCalendar contracts={filtered} />
    </div>
  )
}
