import { parseISO } from './alerts'

const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
const shortDate = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', timeZone: 'UTC' })
const dateTimeFmt = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'Europe/Paris',
})

export const formatEUR = (n: number) => eur.format(n)

export function formatCompactEUR(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M€`
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000).toLocaleString('fr-FR')} k€`
  return `${Math.round(n)} €`
}

export const formatDate = (iso: string) => dateFmt.format(parseISO(iso.slice(0, 10)))
export const formatShortDate = (iso: string) => shortDate.format(parseISO(iso.slice(0, 10)))
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso))
export const formatPercent = (n: number) => `${Math.round(n * 100)} %`
