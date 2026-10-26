'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import { PageHeader, Panel, PanelHeader, Stat } from '@/components/registry/bits'
import { MILESTONES, alertBucket, daysLeft, milestoneDate } from '@/lib/alerts'
import { formatShortDate } from '@/lib/format'
import { useRegistry } from '@/lib/store'
import { cn } from '@/lib/utils'
import { AlertCard } from './alert-card'
import { AlertTimeline } from './alert-timeline'
import { MILESTONE_STYLE } from './milestone-style'
import { ChannelIcons, NotificationCenter, useNotifications } from './notification-center'

export function AlertsWorkspace() {
  const { contracts } = useRegistry()
  const notifications = useNotifications()
  const defaultContract = contracts.find((c) => alertBucket(c) === 'J-30') ?? contracts[0]
  const [selectedId, setSelectedId] = useState('')
  const selected = contracts.find((c) => c.id === selectedId) ?? defaultContract

  const j30 = contracts.filter((c) => alertBucket(c) === 'J-30').length
  const j10 = contracts.filter((c) => alertBucket(c) === 'J-10').length
  const tacit = notifications.filter((n) => n.contract.tacitRenewal).length

  if (!selected) return <div><PageHeader eyebrow="Moteur d’alertes" title="Alertes critiques J-30 / J-10" description="Ajoutez un contrat au registre pour activer les alertes." /><p className="rounded-lg border p-8 text-center text-sm text-muted-foreground">Aucun contrat enregistré. <a className="text-primary underline" href="/nouveau">Créer un contrat</a></p></div>

  return (
    <div>
      <PageHeader
        eyebrow="Moteur d’alertes"
        title="Alertes critiques J-30 / J-10"
        description="Le cycle de vie des alertes est calculé selon la configuration de chaque contrat. Sélectionnez une notification pour afficher sa frise chronologique."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Alertes J-10 (urgence)" value={j10} tone="danger" hint="0 à 10 jours" />
        <Stat label="Alertes J-30 (critique)" value={j30} tone="warning" hint="11 à 30 jours" />
        <Stat label="Notifications actives (90 j)" value={notifications.length} />
        <Stat label="Dont reconduction tacite" value={tacit} hint="Calcul sur date limite de préavis" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-xl border bg-card lg:sticky lg:top-24 lg:self-start">
          <NotificationCenter onSelect={(c) => setSelectedId(c.id)} />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <AlertCard contract={selected} />

          <Panel>
            <PanelHeader
              title="Frise chronologique du cycle d’alertes"
              description={`${selected.reference} · ${selected.supplier.name} · ${daysLeft(selected)} jours avant la date de référence`}
            />
            <AlertTimeline contract={selected} />
            <p className="mt-5 flex gap-2 rounded-lg bg-accent p-3 text-xs text-accent-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>
                Règle de calcul : pour les contrats avec reconduction tacite, les jalons sont calculés par rapport à la{' '}
                <strong>date limite de préavis</strong> (échéance − préavis). Sans reconduction, ils sont calculés par rapport à la{' '}
                <strong>date d’échéance</strong>.
              </span>
            </p>
          </Panel>

          <Panel>
            <PanelHeader title="Modèles de notification" description="Rendu des messages envoyés à chaque jalon pour ce contrat" />
            <ol className="flex flex-col gap-3">
              {MILESTONES.map((m) => (
                <li key={m.level} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold', MILESTONE_STYLE[m.level].chip)}>{m.level}</span>
                      <span className="text-sm font-medium">{m.label}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">· {formatShortDate(milestoneDate(selected, m.offset))}</span>
                    </div>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      {m.channels.join(' · ')}
                      <ChannelIcons channels={m.channels} />
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium">{m.subject(selected)}</p>
                  <p className="mt-1 text-sm text-muted-foreground text-pretty">{m.body(selected)}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </div>
  )
}
