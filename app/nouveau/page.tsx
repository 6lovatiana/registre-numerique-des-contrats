import type { Metadata } from 'next'
import { ContractForm } from '@/components/form/contract-form'

export const metadata: Metadata = { title: 'Nouveau contrat · Registre Numérique' }

export default function NewContractPage() {
  return <ContractForm />
}
