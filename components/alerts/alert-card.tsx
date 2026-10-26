'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertTriangle, FileWarning, Handshake, RefreshCw, XOctagon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CriticalityBadge } from '@/components/registry/bits'
import { currentMilestone, daysLeft, milestoneTemplate, noticeDeadline } from '@/lib/alerts'
import { formatDate, formatEUR } from '@/lib/format'
import { useRegistry, type ContractAction } from '@/lib/store'
import type { Contract } from '@/lib/types'
import { cn } from '@/lib/utils'
import { MILESTONE_STYLE } from './milestone-style'
import { ChannelIcons } from './notification-center'

export function AlertCard({ contract }: { contract: Contract }) {
  const { logAction, actions, createDispute } = useRegistry()
  const router = useRouter()
  const days = daysLeft(contract)
  const level = currentMilestone(days) ?? 'J-30'
  const tpl = milestoneTemplate(level)
  const deadline = noticeDeadline(contract)
  const lastAction = actions.find((a) => a.contractId === contract.id)

  const act = (action: ContractAction) => {
    logAction(contract.id, action)
    toast.success(`${action} engagé(e) pour ${contract.reference}`, {
      description:
        action === 'Résiliation'
          ? `Procédure déclenchée · ${contract.terminationMode} à émettre avant le ${formatDate(deadline ?? contract.endDate)}`
          : `Tâche assignée à ${contract.owner} · horodatée ${new Date().toLocaleString('fr-FR')}`,
    })
  }

  const openDispute = async () => {
    try {
    const id = await createDispute({
      contractId: contract.id,
      type: contract.tacitRenewal ? 'Contestation de reconduction' : 'Manquement contractuel',
      description: `Signalement automatique depuis l’alerte ${level} du contrat ${contract.reference}.`,
      amountAtStake: Math.round((contract.amount / contract.durationMonths) * (contract.renewalMonths ?? 6)),
      source: 'Moteur d’alertes',
    })
    toast.success(`Litige ${id} créé`, { description: 'Redirection vers le workflow litiges.' })
    router.push(`/litiges?id=${id}`)
    } catch (error) {
      toast.error('Création du litige impossible', { description: error instanceof Error ? error.message : 'Vérifiez la base de données.' })
    }
  }

  return (
    <article className="overflow-hidden rounded-xl border bg-card" aria-labelledby={`alert-${contract.id}`}>
      <div className={cn('flex items-center justify-between gap-3 px-5 py-3', level === 'J-10' || level === 'J-5' ? 'bg-destructive text-primary-foreground' : 'bg-warning/25')}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Alerte {level} · {tpl.label}
          </span>
        </div>
        <ChannelIcons channels={tpl.channels} />
      </div>

      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground tabular-nums">{contract.reference}</p>
            <h3 id={`alert-${contract.id}`} className="mt-0.5 text-base font-semibold">
              {contract.supplier.name}
            </h3>
            <p className="text-sm text-muted-foreground">{contract.object}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold tabular-nums tracking-tight">{days}</p>
            <p className="text-xs text-muted-foreground">jours restants</p>
          </div>
        </div>

        <p className="mt-4 rounded-lg bg-muted/60 p-3 text-sm text-pretty">{tpl.body(contract)}</p>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <Meta label="Montant HT" value={formatEUR(contract.amount)} />
          <Meta label="Criticité" value={<CriticalityBadge value={contract.criticality} />} />
          <Meta label="Reconduction tacite" value={contract.tacitRenewal ? `Oui · ${contract.renewalMonths} mois` : 'Non'} />
          <Meta label="Date limite de préavis" value={deadline ? formatDate(deadline) : '—'} />
          <Meta label="Échéance" value={formatDate(contract.endDate)} />
          <Meta label="Préavis" value={contract.noticeDays ? `${contract.noticeDays} jours` : '—'} />
          <Meta label="Mode de résiliation" value={contract.terminationMode} />
          <Meta label="Responsable" value={contract.owner} />
          <Meta label="Département" value={contract.department} />
        </dl>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => act('Renouvellement')}>
            <RefreshCw data-icon="inline-start" aria-hidden />
            Renouveler
          </Button>
          <Button variant="outline" onClick={() => act('Renégociation')}>
            <Handshake data-icon="inline-start" aria-hidden />
            Renégocier
          </Button>
          <Button variant="destructive" onClick={() => act('Résiliation')}>
            <XOctagon data-icon="inline-start" aria-hidden />
            Déclencher la procédure de résiliation
          </Button>
          <Button variant="ghost" onClick={openDispute}>
            <FileWarning data-icon="inline-start" aria-hidden />
            Signaler un litige
          </Button>
        </div>
        {lastAction && (
          <p className="mt-3 text-xs text-muted-foreground" role="status">
            Dernière action : <span className="font-medium text-foreground">{lastAction.action}</span> par {lastAction.userId} le{' '}
            {new Date(lastAction.at).toLocaleString('fr-FR')}
          </p>
        )}
      </div>
    </article>
  )
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  )
}
