'use client'

import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { FileText, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const formatSize = (bytes: number) => (bytes > 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} Mo` : `${Math.max(1, Math.round(bytes / 1000))} Ko`)

export function FileDrop({
  label,
  hint,
  accept,
  multiple,
  files,
  onFiles,
  onRemove,
  error,
  required,
  emphasis,
}: {
  label: string
  hint: string
  accept?: string
  multiple?: boolean
  files: File[]
  onFiles: (files: File[]) => void
  onRemove: (index: number) => void
  error?: string
  required?: boolean
  emphasis?: boolean
}) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  return (
    <div className={cn('flex flex-col gap-1.5', emphasis && 'md:col-span-2')}>
      <span id={`${id}-label`} className="text-xs font-medium">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      <button
        type="button"
        aria-labelledby={`${id}-label`}
        aria-describedby={error ? `${id}-err` : `${id}-hint`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => (e.preventDefault(), setDragging(true))}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const list = [...e.dataTransfer.files]
          if (list.length) onFiles(multiple ? list : list.slice(0, 1))
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 text-center transition-colors hover:border-primary hover:bg-accent/40',
          emphasis ? 'py-8' : 'py-5',
          dragging && 'border-primary bg-accent/60',
          error && 'border-destructive',
        )}
      >
        <Upload className="size-5 text-muted-foreground" aria-hidden />
        <span className="text-sm font-medium">Glisser-déposer ou parcourir</span>
        <span id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const list = [...(e.target.files ?? [])]
          if (list.length) onFiles(list)
          e.target.value = ''
        }}
      />
      {files.length > 0 && (
        <ul className="flex flex-col gap-1">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs">
              <FileText className="size-3.5 text-muted-foreground" aria-hidden />
              <span className="flex-1 truncate">{f.name}</span>
              <span className="text-muted-foreground tabular-nums">{formatSize(f.size)}</span>
              <button type="button" onClick={() => onRemove(i)} aria-label={`Retirer ${f.name}`} className="rounded p-0.5 hover:bg-muted">
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p id={`${id}-err`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export function TagInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const id = useId()
  const [draft, setDraft] = useState('')
  const commit = () => {
    const tag = draft.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-')
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setDraft('')
  }
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium">
        Tags
      </label>
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-md bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">
            #{t}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Retirer le tag ${t}`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          placeholder={value.length ? '' : 'rgpd, cloud, stratégique…'}
          className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <p className="text-xs text-muted-foreground">Entrée ou virgule pour valider un tag</p>
    </div>
  )
}
