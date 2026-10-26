'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { TODAY, addDays } from './alerts'
import { defaultEvidence } from './mock-data'
import type { Contract, Decision, Dispute, DisputeStatus, DisputeType, Exchange } from './types'

export const CURRENT_USER_ID = 'USR-JUR-014'

export type ContractAction = 'Renouvellement' | 'Renégociation' | 'Résiliation'

interface ActionLog {
  contractId: string
  action: ContractAction
  at: string
  userId: string
}

interface RegistryState {
  contracts: Contract[]
  disputes: Dispute[]
  decisions: Decision[]
  actions: ActionLog[]
  addContract: (c: Contract) => void
  createDispute: (input: {
    contractId: string
    type: DisputeType
    description: string
    amountAtStake: number
    source: Dispute['source']
  }) => Promise<string>
  setDisputeStatus: (id: string, status: DisputeStatus, note?: string) => void
  updateDispute: (id: string, patch: Partial<Pick<Dispute, 'legalAnalysis' | 'financialAssessment' | 'closure'>>) => void
  addExchange: (id: string, exchange: Omit<Exchange, 'at' | 'userId'>) => void
  decide: (id: string, status: Decision['status']) => void
  logAction: (contractId: string, action: ContractAction) => void
  contractById: (id: string) => Contract | undefined
}

const RegistryContext = createContext<RegistryState | null>(null)

export function RegistryProvider({ children }: { children: ReactNode }) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [actions, setActions] = useState<ActionLog[]>([])

  useEffect(() => {
    let active = true
    void Promise.all([
      fetch('/api/contrats').then((r) => r.ok ? r.json() : Promise.reject(new Error('Contrats indisponibles'))),
      fetch('/api/actions').then((r) => r.ok ? r.json() : Promise.reject(new Error('Actions indisponibles'))),
      fetch('/api/litiges').then((r) => r.ok ? r.json() : Promise.reject(new Error('Litiges indisponibles'))),
    ]).then(([loadedContracts, loadedActions, loadedDisputes]) => {
      if (!active) return
      setContracts(loadedContracts)
      setActions(loadedActions)
      const byId = new Map<string, Contract>(loadedContracts.map((c: Contract) => [c.id, c]))
      setDisputes(loadedDisputes.map((row: Record<string, any>) => {
        const contractId = String(row.contrat_id)
        const contract = byId.get(contractId)
        const at = new Date(row.date_creation).toISOString()
        return {
          id: row.reference_litige, contractId, type: row.type_litige,
          source: row.id_utilisateur_action === 'SYS-ALERT' ? 'Moteur d’alertes' : 'Manuel',
          description: row.description, amountAtStake: Number(row.montant_concerne), createdAt: at,
          createdBy: row.id_utilisateur_action, status: row.statut,
          history: [{ status: row.statut, at, userId: row.id_utilisateur_action }],
          evidence: contract ? defaultEvidence(contract) : [], legalAnalysis: '', financialAssessment: '',
          legalDueAt: `${addDays(TODAY, 5)}T18:00:00.000Z`, financeDueAt: `${addDays(TODAY, 3)}T18:00:00.000Z`,
          exchanges: [], closure: { creditNoteBooked: false, invoiceCorrected: false },
        } as Dispute
      }))
    }).catch((error) => console.error('Chargement du registre impossible', error))
    return () => { active = false }
  }, [])

  const contractMap = useMemo(() => new Map(contracts.map((c) => [c.id, c])), [contracts])
  const contractById = useCallback((id: string) => contractMap.get(id), [contractMap])

  const addContract = useCallback((c: Contract) => setContracts((prev) => [c, ...prev]), [])

  const createDispute: RegistryState['createDispute'] = useCallback(async (input) => {
    const response = await fetch('/api/litiges', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-ID': input.source === 'Moteur d’alertes' ? 'SYS-ALERT' : CURRENT_USER_ID },
      body: JSON.stringify({ contrat_id: input.contractId, type_litige: input.type, description: input.description, montant_concerne: input.amountAtStake }),
    })
    const row = await response.json()
    if (!response.ok) throw new Error(row.detail ?? 'Création du litige impossible.')
    const id = row.reference_litige
    const now = new Date(row.date_creation).toISOString()
    const contract = contractMap.get(input.contractId)
    const dispute: Dispute = { id, ...input, createdAt: now, createdBy: row.id_utilisateur_action, status: row.statut, history: [{ status: row.statut, at: now, userId: row.id_utilisateur_action }], evidence: contract ? defaultEvidence(contract) : [], legalAnalysis: '', financialAssessment: '', legalDueAt: `${addDays(TODAY, 5)}T18:00:00.000Z`, financeDueAt: `${addDays(TODAY, 3)}T18:00:00.000Z`, exchanges: [], closure: { creditNoteBooked: false, invoiceCorrected: false } }
    setDisputes((prev) => [dispute, ...prev])
    return id
  }, [contractMap])

  const setDisputeStatus = useCallback((id: string, status: DisputeStatus, note?: string) => {
    setDisputes((prev) =>
      prev.map((d) => {
        if (d.id !== id || d.status === status) return d
        const at = new Date().toISOString()
        return {
          ...d,
          status,
          history: [...d.history, { status, at, userId: CURRENT_USER_ID, note }],
          closure: status === 'Clôturé' ? { ...d.closure, closedAt: at } : d.closure,
        }
      }),
    )
  }, [])

  const updateDispute: RegistryState['updateDispute'] = useCallback((id, patch) => {
    setDisputes((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }, [])

  const addExchange: RegistryState['addExchange'] = useCallback((id, exchange) => {
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              exchanges: [
                ...d.exchanges,
                {
                  ...exchange,
                  at: new Date().toISOString(),
                  userId: exchange.direction === 'Entrant' ? 'EXT' : CURRENT_USER_ID,
                },
              ],
            }
          : d,
      ),
    )
  }, [])

  const decide = useCallback((id: string, status: Decision['status']) => {
    setDecisions((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)))
  }, [])

  const logAction = useCallback((contractId: string, action: ContractAction) => {
    void fetch('/api/actions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-ID': CURRENT_USER_ID }, body: JSON.stringify({ contractId, action }) })
      .then(async (response) => { if (!response.ok) throw new Error('Action non enregistrée'); setActions((prev) => [{ contractId, action, at: new Date().toISOString(), userId: CURRENT_USER_ID }, ...prev]) })
      .catch((error) => console.error('Enregistrement de l’action impossible', error))
  }, [])

  const value = useMemo(
    () => ({
      contracts,
      disputes,
      decisions,
      actions,
      addContract,
      createDispute,
      setDisputeStatus,
      updateDispute,
      addExchange,
      decide,
      logAction,
      contractById,
    }),
    [contracts, disputes, decisions, actions, addContract, createDispute, setDisputeStatus, updateDispute, addExchange, decide, logAction, contractById],
  )

  return <RegistryContext.Provider value={value}>{children}</RegistryContext.Provider>
}

export function useRegistry() {
  const ctx = useContext(RegistryContext)
  if (!ctx) throw new Error('useRegistry must be used within RegistryProvider')
  return ctx
}
