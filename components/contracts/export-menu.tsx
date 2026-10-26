'use client'

import { Download, FileSpreadsheet, FileText, Sheet } from 'lucide-react'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { buttonVariants } from '@/components/ui/button'
import { exportContracts, type ExportFormat } from '@/lib/export'
import type { Contract } from '@/lib/types'

const OPTIONS: { format: ExportFormat; label: string; icon: typeof FileText }[] = [
  { format: 'PDF', label: 'Rapport PDF', icon: FileText },
  { format: 'Excel', label: 'Classeur Excel', icon: FileSpreadsheet },
  { format: 'CSV', label: 'Fichier CSV', icon: Sheet },
]

export function ExportMenu({ contracts, label = 'Exporter' }: { contracts: Contract[]; label?: string }) {
  return (
    <Popover>
      <PopoverTrigger className={buttonVariants({ variant: 'outline' })}>
        <Download data-icon="inline-start" aria-hidden />
        {label}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1">
        <p className="px-2 py-1.5 text-xs text-muted-foreground">{contracts.length} contrats filtrés</p>
        {OPTIONS.map(({ format, label: l, icon: Icon }) => (
          <button
            key={format}
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
            onClick={() => {
              exportContracts(contracts, format)
              toast.success(`Export ${format} généré`, { description: `${contracts.length} contrats exportés` })
            }}
          >
            <Icon className="size-4 text-muted-foreground" aria-hidden />
            {l}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
