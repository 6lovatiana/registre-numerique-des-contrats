import { daysLeft, noticeDeadline } from './alerts'
import type { Contract } from './types'

export type ExportFormat = 'PDF' | 'CSV' | 'Excel'

const COLUMNS: [string, (c: Contract) => string | number][] = [
  ['Référence', (c) => c.reference],
  ['Fournisseur', (c) => c.supplier.name],
  ['SIRET', (c) => c.supplier.siret],
  ['Type', (c) => c.type],
  ['Objet', (c) => c.object],
  ['Département', (c) => c.department],
  ['Responsable', (c) => c.owner],
  ['Montant HT (EUR)', (c) => c.amount],
  ['Date d’effet', (c) => c.effectiveDate],
  ['Échéance', (c) => c.endDate],
  ['Reconduction tacite', (c) => (c.tacitRenewal ? 'Oui' : 'Non')],
  ['Date limite de préavis', (c) => noticeDeadline(c) ?? ''],
  ['Jours restants', (c) => daysLeft(c)],
  ['Criticité', (c) => c.criticality],
  ['Conforme', (c) => (c.compliant ? 'Oui' : 'Non')],
]

function escapeCSV(v: string | number) {
  const s = String(v)
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function escapeHTML(v: string | number) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob(['\uFEFF', content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function tableHTML(contracts: Contract[]) {
  const head = COLUMNS.map(([h]) => `<th>${escapeHTML(h)}</th>`).join('')
  const rows = contracts
    .map((c) => `<tr>${COLUMNS.map(([, get]) => `<td>${escapeHTML(get(c))}</td>`).join('')}</tr>`)
    .join('')
  return `<table border="1" cellspacing="0" cellpadding="4"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`
}

export function exportContracts(contracts: Contract[], format: ExportFormat) {
  const stamp = new Date().toISOString().slice(0, 10)
  if (format === 'CSV') {
    const lines = [COLUMNS.map(([h]) => escapeCSV(h)).join(';')]
    for (const c of contracts) lines.push(COLUMNS.map(([, get]) => escapeCSV(get(c))).join(';'))
    download(lines.join('\n'), `registre-contrats-${stamp}.csv`, 'text/csv;charset=utf-8')
    return
  }
  if (format === 'Excel') {
    const html = `<html><head><meta charset="utf-8"></head><body>${tableHTML(contracts)}</body></html>`
    download(html, `registre-contrats-${stamp}.xls`, 'application/vnd.ms-excel')
    return
  }
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(
    `<html><head><meta charset="utf-8"><title>Registre des contrats — ${stamp}</title><style>body{font-family:system-ui,sans-serif;font-size:10px;padding:24px}h1{font-size:16px}table{border-collapse:collapse;width:100%}th{background:#eef1f6;text-align:left}td,th{border:1px solid #d5dae3;padding:4px}</style></head><body><h1>Registre numérique des contrats — ${contracts.length} contrats — ${stamp}</h1>${tableHTML(contracts)}<script>window.onload=()=>window.print()</script></body></html>`,
  )
  win.document.close()
}
