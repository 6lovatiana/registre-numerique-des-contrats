import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const output = path.resolve('pdf/test-documents')
const documents = [
  {
    file: '01_MadaTech_avenant_01.pdf', title: 'Avenant numero 1 - MadaTech Solutions', subject: 'Avenant fictif au contrat CTR-2026-0001', keywords: 'CTR-2026-0001, MadaTech, avenant, test, document fictif',
    sections: [
      ['Identification', 'Contrat concerne : CTR-2026-0001, prestation de services informatiques entre MadaTech Solutions SARL et le client. Reference reprise du specimen fourni.'],
      ['Objet de l avenant', 'Le present modele ajoute un suivi mensuel des incidents, des interventions et de la disponibilite des services d infogerance. Il sert uniquement a tester le classement d un document de type Avenant.'],
      ['Modalites de suivi', 'Le prestataire transmet au contact designe un releve mensuel des incidents ouverts et resolus, des delais de prise en charge, des maintenances effectuees et des actions correctives. Les parties completent les niveaux de service avant toute utilisation reelle.'],
      ['Prix et duree', 'Le prix annuel, la duree, la reconduction et le preavis du contrat initial restent inchanges dans ce modele. Toute modification doit etre indiquee explicitement dans un avenant signe par les deux parties.'],
      ['Maintien des autres clauses', 'Toutes les stipulations non modifiees du contrat initial demeurent applicables. En cas de contradiction, le texte de l avenant prevaut uniquement pour les points qu il modifie.'],
      ['Signatures de test', 'Fait a Antananarivo, le [date a completer]. Pour le client : [nom, fonction, signature]. Pour MadaTech Solutions SARL : [nom, fonction, signature].'],
    ],
  },
  {
    file: '01_MadaTech_conditions_generales.pdf', title: 'Conditions generales de services informatiques - MadaTech', subject: 'Conditions generales fictives associees au contrat CTR-2026-0001', keywords: 'CTR-2026-0001, MadaTech, conditions generales, informatique, test',
    sections: [
      ['Champ d application', 'Ces conditions generales de test concernent les prestations d infogerance, de supervision des serveurs et d assistance aux utilisateurs de MadaTech Solutions SARL. Le contrat signe et ses annexes definissent seuls les engagements applicables.'],
      ['Obligations du prestataire', 'Le prestataire execute les services avec diligence, tient un registre des demandes et informe le client des incidents susceptibles d affecter la continuite du service. Les horaires, niveaux de service et delais de retablissement sont a definir dans le contrat ou un avenant.'],
      ['Obligations du client', 'Le client fournit les acces autorises, des interlocuteurs disponibles et les informations utiles. Il conserve la responsabilite des decisions metier et valide les changements ayant un impact sur son environnement.'],
      ['Confidentialite et securite', 'Chaque partie protege les informations confidentielles recues. Les acces sont limites aux personnes autorisees. Les mesures de securite, la conservation des journaux et les modalites de traitement des donnees doivent etre precisees avant execution.'],
      ['Prix et facturation', 'Le modele reprend la facturation mensuelle mentionnee dans le specimen. Les montants, taxes, delais de paiement et conditions de revision applicables sont ceux du contrat signe.'],
      ['Responsabilite et fin des services', 'La responsabilite, les assurances, les mises en demeure, la resiliation et la restitution des acces suivent le contrat signe. Aucune clause de ce document de test ne remplace ni ne modifie ce contrat.'],
    ],
  },
  {
    file: '02_VolaEnergie_avenant_01.pdf', title: 'Avenant numero 1 - Vola Energie', subject: 'Avenant fictif au contrat de fourniture CTR-2026-0002', keywords: 'CTR-2026-0002, Vola Energie, avenant, fourniture solaire, test',
    sections: [
      ['Identification', 'Contrat concerne : CTR-2026-0002, fourniture de 20 systemes solaires par Vola Energie SARL. Reference, fournisseur et objet sont repris du specimen fourni.'],
      ['Objet de l avenant', 'Le present modele precise les controles de livraison et de reception des equipements. Il est destine au test d un document de type Avenant et ne constitue pas une modification contractuelle effective.'],
      ['Livraison et verification', 'A la livraison, les parties etablissent un bordereau indiquant les quantites, numeros de serie et accessoires recus. Le client dispose de [delai a convenir] jours ouvrables pour signaler par ecrit un ecart apparent ou un equipement endommage.'],
      ['Reception et garantie', 'La reception est constatee par un proces-verbal signe. Les garanties fabricant mentionnees au contrat initial restent applicables. Les reserves et leur delai de correction sont consignes dans le proces-verbal.'],
      ['Prix et autres clauses', 'Le prix total, l echeancier de paiement, la garantie bancaire, les penalites, la duree et l absence de reconduction tacite restent inchanges dans ce modele.'],
      ['Signatures de test', 'Fait a [lieu], le [date a completer]. Pour le client : [nom, fonction, signature]. Pour Vola Energie SARL : [nom, fonction, signature].'],
    ],
  },
  {
    file: '02_VolaEnergie_conditions_generales.pdf', title: 'Conditions generales de fourniture - Vola Energie', subject: 'Conditions generales fictives associees au contrat CTR-2026-0002', keywords: 'CTR-2026-0002, Vola Energie, conditions generales, equipements solaires, test',
    sections: [
      ['Champ d application', 'Ces conditions generales de test concernent la fourniture d equipements solaires, notamment panneaux, batteries, onduleurs et accessoires. Les quantites et specifications sont celles du contrat signe.'],
      ['Commande et livraison', 'La commande devient applicable selon les conditions du contrat. Le fournisseur protege les equipements durant le transport et communique les informations necessaires a la planification de la livraison. Le lieu et les dates sont fixes au contrat ou par accord ecrit.'],
      ['Reception et conformite', 'Le client verifie les quantites, l etat apparent et les caracteristiques convenues. Toute reserve est decrite dans un document de reception. Une reserve ne vaut pas renonciation aux garanties applicables.'],
      ['Prix et paiement', 'Le prix, la devise, les paiements par jalons et les justificatifs requis sont ceux du contrat signe. Aucune somme complementaire ne peut etre ajoutee sans accord ecrit des parties.'],
      ['Garanties et maintenance', 'Les garanties fabricant et les modalites de mise en oeuvre sont documentees lors de la livraison. Les exclusions, delais de reparation et disponibilites des pieces doivent etre confirmes par les documents du fabricant.'],
      ['Retard, force majeure et resiliation', 'Les consequences d un retard, les penalites, la force majeure et la resiliation sont determinees par le contrat signe. Le present document de test ne cree aucune penalite ni garantie nouvelle.'],
    ],
  },
  {
    file: '03_MaintenanceBatiments_avenant_01.pdf', title: 'Avenant numero 1 - Maintenance des batiments', subject: 'Modele fictif d avenant pour le PDF scanne de maintenance des batiments', keywords: 'maintenance batiments, avenant, document scanne, reference a verifier, test',
    sections: [
      ['Identification a verifier', 'Le PDF exemple est un document scanne dont le texte et la reference n ont pas pu etre lus automatiquement. Completer ici la reference exacte, les noms des parties, les sites concernes et la date du contrat initial avant tout rattachement.'],
      ['Objet de l avenant', 'Ce modele propose une fiche de suivi des interventions de maintenance des batiments. Il sert au test de la section Documents et ne presume pas des clauses du contrat scanne.'],
      ['Planification des interventions', 'Les sites, equipements, frequences de maintenance preventive, plages d intervention et interlocuteurs sont a reprendre du contrat initial ou a completer dans une annexe signee.'],
      ['Rapports et reception', 'Apres chaque intervention, le prestataire remet un compte rendu indiquant le site, les equipements verifies, les travaux realises, les anomalies et les suites recommandees. Toute intervention supplementaire fait l objet d un accord prealable.'],
      ['Prix et maintien des clauses', 'Ne pas renseigner de prix, duree, penalite ou preavis sans verification du contrat source. Les clauses non modifiees restent applicables selon le texte signe.'],
      ['Signatures de test', 'Fait a [lieu], le [date a completer]. Client : [raison sociale, signataire]. Prestataire : [raison sociale, signataire]. Signatures : [a completer].'],
    ],
  },
  {
    file: '03_MaintenanceBatiments_conditions_generales.pdf', title: 'Conditions generales de maintenance des batiments', subject: 'Conditions generales fictives pour le PDF scanne de maintenance des batiments', keywords: 'maintenance batiments, conditions generales, document scanne, test',
    sections: [
      ['Avertissement de rattachement', 'Le PDF source etant scanne et non lisible en extraction texte, ces conditions generales sont un modele thematique de test. Verifier le fournisseur, le client, la reference et le perimetre avant de les associer au contrat.'],
      ['Perimetre des services', 'Les prestations peuvent couvrir, selon le contrat signe, les controles preventifs, le depannage et le suivi des installations des sites identifies. La liste des batiments, equipements et exclusions doit etre annexee au contrat.'],
      ['Demandes et interventions', 'Le client signale les demandes par le canal convenu et indique le site, l equipement et le niveau d urgence. Le prestataire confirme la prise en charge et trace les actions effectuees. Les delais de service sont a verifier dans le contrat source.'],
      ['Securite sur site', 'Le prestataire respecte les regles d acces, de securite et de prevention communiquees pour chaque site. Il maintient les habilitations necessaires et signale sans delai tout risque ou incident observe.'],
      ['Rapports, pieces et travaux supplementaires', 'Les rapports mentionnent les controles, les pieces utilisees et les anomalies restantes. Les travaux hors perimetre et achats de pieces requierent un devis et un accord prealables, sauf urgence prevue au contrat.'],
      ['Prix, responsabilite et resiliation', 'Les prix, garanties, assurances, penalites, durees, preavis et conditions de resiliation ne sont pas connus a partir du PDF scanne. Seul le contrat lisible et signe permet de les confirmer.'],
    ],
  },
]

function cp1252(char) {
  const special = { '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f }
  const code = special[char] ?? char.codePointAt(0)
  return code <= 255 ? code : 63
}

const hexText = (text) => `<${Array.from(text).map((char) => cp1252(char).toString(16).padStart(2, '0')).join('')}>`
function wrap(text, max = 91) {
  const words = text.split(/\s+/)
  const rows = []
  let row = ''
  for (const word of words) {
    if (row && `${row} ${word}`.length > max) { rows.push(row); row = word }
    else row = row ? `${row} ${word}` : word
  }
  if (row) rows.push(row)
  return rows
}

function makePdf(doc) {
  const lines = [{ text: doc.title, style: 'title' }, { text: 'DOCUMENT FICTIF - POUR TEST UNIQUEMENT - SANS VALEUR JURIDIQUE', style: 'bold' }, { text: '' }]
  for (const [heading, body] of doc.sections) {
    lines.push({ text: heading, style: 'bold' })
    for (const row of wrap(body)) lines.push({ text: row, style: 'regular' })
    lines.push({ text: '' })
  }
  const pageLines = Array.from({ length: Math.ceil(lines.length / 48) }, (_, page) => lines.slice(page * 48, (page + 1) * 48))
  const objects = [null]
  const add = (value) => { objects.push(Buffer.from(value, 'binary')); return objects.length - 1 }
  const catalogId = add('')
  const pagesId = add('')
  const regularId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  const boldId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
  const pageIds = []
  for (let index = 0; index < pageLines.length; index++) {
    const content = []
    let y = 790
    for (const line of pageLines[index]) {
      if (!line.text) { y -= 8; continue }
      const size = line.style === 'title' ? 15 : line.style === 'bold' ? 10 : 9
      const font = line.style === 'bold' || line.style === 'title' ? 'F2' : 'F1'
      content.push(`BT /${font} ${size} Tf 1 0 0 1 52 ${y} Tm ${hexText(line.text)} Tj ET`)
      y -= line.style === 'title' ? 24 : 15
    }
    content.push(`BT /F1 8 Tf 1 0 0 1 52 32 Tm ${hexText(`Modele de donnees fictives | ${doc.file} | Page ${index + 1}/${pageLines.length}`)} Tj ET`)
    const stream = Buffer.from(content.join('\n'), 'binary')
    const contentId = add(`<< /Length ${stream.length} >>\nstream\n${stream.toString('binary')}\nendstream`)
    const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${regularId} 0 R /F2 ${boldId} 0 R >> >> /Contents ${contentId} 0 R >>`)
    pageIds.push(pageId)
  }
  objects[catalogId] = Buffer.from(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`, 'binary')
  objects[pagesId] = Buffer.from(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`, 'binary')
  const infoId = add(`<< /Title ${hexText(doc.title)} /Subject ${hexText(doc.subject)} /Author ${hexText('Registre numerique des contrats - jeux de test')} /Keywords ${hexText(doc.keywords)} /Creator ${hexText('Generateur de documents de test')} >>`)
  const chunks = [Buffer.from('%PDF-1.4\n%âãÏÓ\n', 'binary')]
  const offsets = [0]
  let position = chunks[0].length
  for (let id = 1; id < objects.length; id++) {
    offsets[id] = position
    const object = Buffer.concat([Buffer.from(`${id} 0 obj\n`, 'binary'), objects[id], Buffer.from('\nendobj\n', 'binary')])
    chunks.push(object)
    position += object.length
  }
  const xref = position
  let table = `xref\n0 ${objects.length}\n0000000000 65535 f \n`
  for (let id = 1; id < objects.length; id++) table += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
  table += `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  chunks.push(Buffer.from(table, 'binary'))
  return Buffer.concat(chunks)
}

await mkdir(output, { recursive: true })
for (const doc of documents) await writeFile(path.join(output, doc.file), makePdf(doc))
console.log(`Generated ${documents.length} sample PDFs in ${output}`)
