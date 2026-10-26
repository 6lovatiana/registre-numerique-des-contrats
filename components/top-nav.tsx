'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Bell, FileSignature, Menu, X } from 'lucide-react'
import { NotificationCenter } from '@/components/alerts/notification-center'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useRegistry } from '@/lib/store'
import { alertBucket } from '@/lib/alerts'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/', label: 'Tableau de bord' },
  { href: '/registre', label: 'Registre des contrats' },
  { href: '/nouveau', label: 'Nouveau contrat' },
  { href: '/alertes', label: 'Alertes' },
  { href: '/litiges', label: 'Litiges actifs' },
]

export function TopNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { contracts } = useRegistry()
  const urgent = contracts.filter((c) => alertBucket(c) !== null).length

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Accueil — Registre Numérique des Contrats">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileSignature className="size-4" aria-hidden />
          </span>
          <span className="font-display hidden text-[11px] leading-tight text-foreground sm:block">
            REGISTRE
            <br />
            <span className="text-muted-foreground">DES CONTRATS</span>
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden flex-1 lg:block">
          <ul className="flex items-center gap-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? 'page' : undefined}
                  className={cn(
                    'relative rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                    isActive(l.href) &&
                      'text-foreground after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-primary',
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Popover>
            <PopoverTrigger
              className="relative flex size-9 items-center justify-center rounded-lg border bg-card text-foreground transition-colors hover:bg-muted"
              aria-label={`Centre de notifications, ${urgent} alertes actives`}
            >
              <Bell className="size-4" aria-hidden />
              {urgent > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">
                  {urgent}
                </span>
              )}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(92vw,26rem)] p-0">
              <NotificationCenter compact />
            </PopoverContent>
          </Popover>

          <div className="hidden items-center gap-2 border-l pl-3 md:flex">
            <span className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
              CD
            </span>
            <div className="text-xs leading-tight">
              <p className="font-medium text-foreground">Claire Dumas</p>
              <p className="text-muted-foreground">USR-JUR-014</p>
            </div>
          </div>

          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-lg border lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Navigation mobile" className="border-t lg:hidden">
          <ul className="mx-auto flex max-w-7xl flex-col px-4 py-2">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(l.href) ? 'page' : undefined}
                  className={cn(
                    'block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground',
                    isActive(l.href) && 'bg-muted text-foreground',
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
