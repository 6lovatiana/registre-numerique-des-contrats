import type { Metadata } from 'next'
import { AlertsWorkspace } from '@/components/alerts/alerts-workspace'

export const metadata: Metadata = { title: 'Moteur d’alertes J-30 / J-10 · Registre des contrats' }

export default function AlertsPage() {
  return <AlertsWorkspace />
}
