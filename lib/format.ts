import { parseISO } from './alerts'

const mga = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
const shortDate = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', timeZone: 'UTC' })
const dateTimeFmt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Indian/Antananarivo' })

export const formatMGA = (n: number) => `${mga.format(n)} Ar`

export function formatCompactMGA(n: number) {
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Md Ar`
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M Ar`
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000).toLocaleString('fr-FR')} k Ar`
  return `${Math.round(n).toLocaleString('fr-FR')} Ar`
}

export const formatDate = (iso: string) => dateFmt.format(parseISO(iso.slice(0, 10)))
export const formatShortDate = (iso: string) => shortDate.format(parseISO(iso.slice(0, 10)))
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso))
export const formatPercent = (n: number) => `${Math.round(n * 100)} %`
