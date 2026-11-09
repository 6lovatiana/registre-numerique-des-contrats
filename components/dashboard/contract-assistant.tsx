'use client'

import { useState, type FormEvent } from 'react'
import { Bot, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Panel, PanelHeader } from '@/components/registry/bits'

type Message = { role: 'user' | 'assistant'; content: string }

export function ContractAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const text = question.trim()
    if (!text || busy) return
    setMessages((current) => [...current, { role: 'user', content: text }])
    setQuestion('')
    setBusy(true)
    try {
      const response = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: text }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.detail ?? 'Réponse impossible.')
      setMessages((current) => [...current, { role: 'assistant', content: payload.answer }])
    } catch (error) {
      setMessages((current) => [...current, { role: 'assistant', content: error instanceof Error ? error.message : 'Assistant indisponible.' }])
    } finally { setBusy(false) }
  }

  return <Panel>
    <PanelHeader title="Assistant IA contrats" description="Posez une question sur les contrats enregistrés." action={<Sparkles className="size-4 text-primary" aria-hidden />} />
    <div className="flex flex-col gap-2" aria-live="polite">
      {messages.length === 0 ? <p className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground"><Bot className="size-4 shrink-0" aria-hidden />Ex. « Quels contrats arrivent à échéance ce mois-ci ? »</p> : <div className="max-h-64 space-y-2 overflow-y-auto">{messages.map((message, index) => <p key={index} className={`max-w-[90%] whitespace-pre-wrap rounded-lg p-3 text-sm ${message.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted'}`}>{message.content}</p>)}</div>}
      <form onSubmit={submit} className="flex gap-2">
        <Input value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={1500} placeholder="Votre question sur le registre…" aria-label="Question à l’assistant" />
        <Button type="submit" disabled={busy || !question.trim()} aria-label="Envoyer la question"><Send className="size-4" aria-hidden />{busy && <span className="sr-only">Réponse en cours</span>}</Button>
      </form>
      <p className="text-xs text-muted-foreground">Les réponses sont générées à partir des données du registre. Vérifiez les documents contractuels.</p>
    </div>
  </Panel>
}
