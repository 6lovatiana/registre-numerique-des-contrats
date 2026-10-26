import type { Metadata } from 'next'
import { RegistryView } from '@/components/contracts/registry-view'

export const metadata: Metadata = { title: 'Registre des contrats · Registre Numérique' }

export default function RegistryPage() {
  return <RegistryView />
}
