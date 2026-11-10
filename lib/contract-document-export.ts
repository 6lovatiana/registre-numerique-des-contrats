import { noticeDeadline } from './alerts'
import { formatDate, formatMGA } from './format'
import type { Contract } from './types'

function escapeHtml(value: unknown) {
  const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
  return String(value ?? '—').replace(/[&<>"']/g, (character) => entities[character])
}

function contractHtml(contract: Contract) {
  const deadline = noticeDeadline(contract)
  const articles: [string, string][] = [
    ['ARTICLE 1 — DÉSIGNATION DES PARTIES', `<p><strong>Le fournisseur / prestataire :</strong> ${escapeHtml(contract.supplier.name)}, NIF ${escapeHtml(contract.supplier.nif)}, représenté par ${escapeHtml(contract.supplier.legalContact)} (pouvoir et qualité à vérifier).</p><p><strong>Le client / acheteur :</strong> [raison sociale, forme juridique, NIF/STAT, adresse du siège et représentant habilité à compléter].</p><p>Ci-après désignés ensemble « les Parties ».</p>`],
    ['ARTICLE 2 — OBJET', `<p>Le présent contrat porte sur : <strong>${escapeHtml(contract.object)}</strong> (type : ${escapeHtml(contract.type)}).</p><p>Le périmètre détaillé, les spécifications, les livrables ou les sites concernés sont à compléter ou à joindre en annexe avant signature.</p>`],
    ['ARTICLE 3 — DURÉE ET PRISE D’EFFET', `<p>Prise d’effet : ${escapeHtml(formatDate(contract.effectiveDate))}. Échéance prévue : ${escapeHtml(formatDate(contract.endDate))}. Durée enregistrée : ${escapeHtml(contract.durationMonths)} mois.</p><p>Reconduction tacite : ${contract.tacitRenewal ? `oui, par périodes de ${escapeHtml(contract.renewalMonths ?? 'durée à préciser')} mois` : 'non'}.</p><p>Les conditions de renouvellement et toute période de préavis doivent être confirmées dans le texte final.</p>`],
    ['ARTICLE 4 — PRIX ET MODALITÉS DE PAIEMENT', `<p>Montant enregistré : <strong>${escapeHtml(formatMGA(contract.amount))} HT</strong>. Facturation : ${escapeHtml(contract.billing)}. Modalités de paiement : ${escapeHtml(contract.paymentTerms)}.</p><p>Révision de prix : ${contract.priceRevision ? `oui, indice indiqué au registre : ${escapeHtml(contract.priceIndex ?? 'à préciser')}` : 'non indiquée'}.</p><p>Les taxes, pièces justificatives et coordonnées de paiement doivent être précisées dans le contrat final.</p>`],
    ['ARTICLE 5 — EXÉCUTION ET OBLIGATIONS DES PARTIES', `<p>Le fournisseur / prestataire exécute les prestations ou livre les biens conformément au périmètre et au calendrier convenus par les Parties. Le client / acheteur communique les informations nécessaires et désigne un interlocuteur.</p><p><strong>À compléter avant signature :</strong> calendrier, lieu d’exécution ou de livraison, critères de réception, délais, livrables, responsabilités opérationnelles et modalités de validation.</p>`],
    ['ARTICLE 6 — GARANTIES ET PÉNALITÉS', `<p>Pénalité de retard enregistrée : ${contract.latePenalty ? `${escapeHtml(contract.latePenaltyRate ?? 'taux à préciser')} % par semaine, plafonnée à ${escapeHtml(contract.latePenaltyCap ?? 'plafond à préciser')} %` : 'aucune dans les données du registre'}.</p><p>Garantie bancaire : ${contract.bankGuarantee ? escapeHtml(formatMGA(contract.guaranteeAmount ?? 0)) : 'aucune dans les données du registre'}. Indemnité de résiliation anticipée : ${contract.earlyTerminationPenalty ? escapeHtml(formatMGA(contract.earlyTerminationAmount ?? 0)) : 'aucune dans les données du registre'}.</p><p>Les conditions d’appel, de durée et de restitution des garanties, ainsi que les exclusions de responsabilité, sont à préciser dans le texte signé.</p>`],
    ['ARTICLE 7 — RÉSILIATION', `<p>Préavis enregistré : ${contract.noticeDays ? `${escapeHtml(contract.noticeDays)} jours` : 'non renseigné'}${deadline ? ` (date limite calculée : ${escapeHtml(formatDate(deadline))})` : ''}. Mode de notification enregistré : ${escapeHtml(contract.terminationMode)}.</p><p>Les cas de résiliation, la procédure de mise en demeure et les effets de la résiliation doivent être explicitement confirmés par les Parties.</p>`],
    ['ARTICLE 8 — DROIT APPLICABLE ET RÈGLEMENT DES DIFFÉRENDS', '<p>Droit applicable, juridiction compétente et éventuel mode de règlement amiable : <strong>à compléter et valider selon la nature du contrat et les Parties</strong>.</p>'],
    ['ARTICLE 9 — DOCUMENTS CONTRACTUELS ET SIGNATURE', `<p>Documents associés au registre : ${contract.documents.length ? contract.documents.map((doc) => `${escapeHtml(doc.name)} (${escapeHtml(doc.kind)})`).join('; ') : 'aucun document associé'}.</p><p>La liste définitive des pièces contractuelles et leur ordre de priorité doivent être convenus. Les modifications du contrat sont à établir par écrit et à faire approuver par les Parties.</p><p>Fait à [lieu], le [date], en [nombre] exemplaires originaux.</p><div class="signatures"><div><strong>Pour le client / acheteur</strong><br>Nom et qualité : ____________________<br>Date et signature : ____________________</div><div><strong>Pour le fournisseur / prestataire</strong><br>${escapeHtml(contract.supplier.name)}<br>Nom et qualité : ____________________<br>Date et signature : ____________________</div></div>`],
  ]
  const body = articles.map(([title, content]) => `<section><h2>${escapeHtml(title)}</h2>${content}</section>`).join('')
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="Title" content="Projet de contrat ${escapeHtml(contract.reference)}"><meta name="Subject" content="Projet de contrat commercial à Madagascar — ${escapeHtml(contract.reference)}"><meta name="Author" content="Registre numérique des contrats"><meta name="Keywords" content="projet contrat, Madagascar, ${escapeHtml(contract.reference)}, ${escapeHtml(contract.supplier.name)}"><title>Projet de contrat ${escapeHtml(contract.reference)}</title><style>body{font:13px Arial,sans-serif;color:#202838;line-height:1.5;margin:32px auto;max-width:850px;padding:0 24px}header{text-align:center;border-bottom:2px solid #263b55;padding:12px 0 18px;margin-bottom:22px}header .country{font-size:12px;letter-spacing:.08em;text-transform:uppercase}h1{font-size:22px;margin:12px 0 4px}header p{margin:3px;color:#4b596d}h2{font-size:14px;color:#20344f;margin:22px 0 8px;padding-bottom:5px;border-bottom:1px solid #aeb8c6}p{margin:7px 0}.warning{padding:12px;background:#fff4d6;border:1px solid #dfbd62;font-weight:600}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:24px}.signatures div{min-height:100px;border:1px solid #c7ced8;padding:12px}.footer{margin-top:26px;padding-top:8px;border-top:1px solid #c7ced8;color:#5d6878;font-size:10px}@media print{body{margin:12mm auto;padding:0}header{break-after:avoid}section{break-inside:avoid}.warning{print-color-adjust:exact}}</style></head><body><header><div class="country">République de Madagascar</div><h1>PROJET DE CONTRAT COMMERCIAL</h1><p>${escapeHtml(contract.type)} — Référence ${escapeHtml(contract.reference)}</p><p>${escapeHtml(contract.object)}</p></header><p class="warning">PROJET À COMPLÉTER ET À FAIRE VALIDER — Ce document reprend les seules données disponibles dans le registre. Il ne constitue pas un contrat signé ni une validation de conformité juridique.</p>${body}<p class="footer">Canevas généré le ${escapeHtml(new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date()))}. Vérifier notamment la capacité et les pouvoirs des signataires, leur consentement, la précision et la licéité de l’objet, les règles propres au type de contrat, ainsi que toute forme particulière applicable.</p></body></html>`
}

export function exportContractWord(contract: Contract) {
  const blob = new Blob(['\ufeff', contractHtml(contract)], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${contract.reference}-projet-contrat.doc`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportContractPdf(contract: Contract) {
  const win = window.open('', '_blank')
  if (!win) return false
  win.document.write(contractHtml(contract).replace('</body>', '<script>window.addEventListener("load",()=>window.print())</script></body>'))
  win.document.close()
  return true
}
