# Registre numérique des contrats — guide de présentation

## 1. Résumé du projet

Le Registre numérique des contrats est une application web destinée à centraliser les contrats fournisseurs et à suivre leur cycle de vie. Elle aide les équipes juridique, achats, finance et direction à retrouver les informations importantes, anticiper les échéances, surveiller les engagements financiers et traiter les litiges.

Le parcours principal est le suivant :

1. Enregistrer un contrat et ses pièces justificatives.
2. Retrouver et filtrer les contrats dans le registre.
3. Repérer les préavis et échéances à venir grâce aux alertes et au calendrier.
4. Décider de renouveler, renégocier ou résilier.
5. Signaler et suivre un litige lié à un contrat.
6. Consulter les indicateurs et exporter la sélection pour un suivi externe.

L'interface est en français et les montants sont affiches en ariary malgache (MGA, souvent noté "Ar").

## 2. Démarrer l'application

Depuis la racine du projet, dans le terminal intégré de VS Code :

```powershell
corepack pnpm dev
```

Ouvrir ensuite [http://localhost:3000](http://localhost:3000). Garder le terminal ouvert pendant la démonstration ; `Ctrl+C` arrête le serveur.

Pour une compilation et un lancement en mode production :

```powershell
.\scripts\setup.ps1
.\scripts\start.ps1
```

Corepack fournit la version de pnpm configurée par le projet ; aucune activation séparée n'est necessaire.

## 3. Navigation et roles concernes

La barre supérieure donne acces aux pages suivantes :

| Page | Adresse | Utilité |
|---|---|---|
| Tableau de bord | `/` | Indicateurs, vues par profil, filtres globaux et calendrier des échéances. |
| Registre des contrats | `/registre` | Recherche, filtres, détails et exports des contrats. |
| Nouveau contrat | `/nouveau` | Saisie guidée d'un contrat et ajout de documents. |
| Alertes | `/alertes` | Notifications calculées, échéances proches, frise et actions de suivi. |
| Litiges actifs | `/litiges` | Consultation des dossiers de litige enregistrés et mise à jour rapide de leur statut. |

Le tableau de bord propose quatre vues adaptées aux responsabilités :

- **Juriste / Contract Manager** : préavis, renouvellements, alertes et conformité.
- **Direction des Achats** : fournisseurs, renouvellements, performances et fuite contractuelle.
- **DAF / Finance** : budgets, dépenses, engagements, exposition aux renouvellements et pénalités.
- **Direction Generale** : contrats critiques, risques financiers, litiges majeurs et décisions à traiter.

Ces vues utilisent le meme portefeuille : les onglets changent les indicateurs affiches, pas les données.

## 4. Tableau de bord

### Synthese du portefeuille

Le bandeau de synthese donne une lecture rapide du nombre de contrats, de leur valeur totale, des alertes J-30 et J-10, du taux de conformité et des litiges ouverts.

### Vue juridique

- **Alertes J-30 / J-10** : contrats proches de leur date de référence.
- **Litiges ouverts** : dossiers dont le statut n'est pas clôture dans les données chargées.
- **Taux de conformité** : proportion de contrats marques conformes.
- **Cycle de vie moyen** : durée initiale moyenne des contrats, en mois.
- **Pipeline de renouvellement** : contrats à traiter dans les fenetres de 0–30, 31–60 et 61–90 jours.

### Vue Achats

- **Valeur du portefeuille** : somme des montants des contrats sélectionnés.
- **Taux de renouvellement** : renouvellements rapportes aux décisions deja renseignees (renouvellement ou résiliation).
- **Fuite contractuelle** : dépassements du budget et estimation des achats hors contrat.
- **Score fournisseurs moyen** et classement des dix fournisseurs par valeur.
- **Répartition des performances** et comparaison renouvellement / résiliation.

### Vue Finance

- **Engagements à 30, 60 et 90 jours** : estimation des dépenses correspondant aux durees couvertes par chaque horizon.
- **Pénalités de retard potentielles** : estimation selon le taux, le nombre de retards et le plafond inscrits au contrat.
- **Exposition à la reconduction tacite** : valeur estimée des renouvellements tacites qui arrivent e échéance dans les 90 jours.
- **Budget vs réalisé par département** : comparaison des budgets contractuels et des dépenses réalisées.

### Vue Direction Generale

Elle met en avant la valeur sous gestion, les contrats critiques en alerte rouge, les litiges majeurs, le taux de renouvellement et le risque financier à 90 jours. Les décisions de démonstration peuvent etre approuvees ou rejetees depuis cette vue.

### Filtres et calendrier

Les filtres du tableau de bord reduisent les contrats analyses selon le fournisseur, le type, la criticite et une fourchette de montant. Le calendrier présentée les dates de référence des 90 prochains jours ; selectionner une date affiche les contrats concernes.

## 5. Registre des contrats

La page Registre permet de :

- rechercher dans les references, fournisseurs, NIF, objets, tags, indices et noms de documents ;
- filtrer par fournisseur, type, criticite et montant minimum ou maximum ;
- ouvrir une fiche détaillée en selectionnant une ligne ;
- exporter les contrats correspondant à la sélection en PDF, CSV ou Excel.

La fiche detail regroupe l'identification, les parties, les données financieres, les clauses, les garanties, les documents, les tags et les notes. Elle affiche aussi la frise du cycle d'alertes et le nombre de jours avant la prochaine date de référence.

## 6. Creer un contrat : champs et signification

Le formulaire est reparti en six sections. Les champs suivis d'un asterisque dans l'interface sont obligatoires.

### A — Identification du contrat

| Champ | Signification |
|---|---|
| Référence | Identifiant unique au format `CTR-AAAA-NNNN`. Le formulaire suggere le prochain numéro. |
| Type | Nature du contrat : fourniture de biens, prestation de services, maintenance, abonnement ou licence. |
| Objet | Description précise du besoin ou de la prestation. Minimum : 10 caractères. |
| Date de signature | Date à laquelle les parties ont signé le contrat. |
| Date d'effet | Date à partir de laquelle le contrat s'applique ; elle doit suivre la signature. |
| échéance initiale | Fin de la période contractuelle initiale ; elle doit etre posterieure à la date d'effet. |

### B — Parties contractantes

| Champ | Signification |
|---|---|
| Fournisseur — raison sociale | Nom légal du fournisseur. |
| NIF | Identifiant fiscal du fournisseur. La validation de démonstration verifie dix chiffres, sans verification aupres de l'administration fiscale. |
| Contact juridique | Personne à contacter pour les questions contractuelles. |
| Email fournisseur | Adresse de contact valide. |
| Cocontractant interne | Département qui porte le besoin ou le contrat. |
| Responsable interne | Personne responsable du suivi du contrat. |

### C — Conditions financieres

| Champ | Signification |
|---|---|
| Montant total HT | Valeur du contrat hors taxes, saisie en ariary (MGA). Le montant doit etre superieur à zero. |
| Devise | Devise du registre : MGA. |
| Périodicité de facturation | Mensuelle, trimestrielle, annuelle ou forfaitaire. |
| Modalités de paiement | Délai ou condition de règlement convenue avec le fournisseur. |
| Révision de prix | Indique si le tarif evolue suivant une formule contractuelle. |
| Index de référence | Indice utilisé pour la révision du tarif ; obligatoire si la révision est activée. |

### D - Durée et reconduction

| Champ | Signification |
|---|---|
| Durée initiale | Durée initiale en mois, nombre entier positif. |
| Mode de résiliation | Moyen de notification prévu : lettre recommandée, email ou portail fournisseur. |
| Reconduction tacite | Indique si le contrat se renouvelle automatiquement sans résiliation dans le délai prévu. |
| Durée de reconduction | Durée de chaque période renouvelée ; requise si la reconduction tacite est activée. |
| Préavis de résiliation | Nombre de jours avant l'echeance pour notifier la résiliation. Requis en cas de reconduction ; plafond de validation : 90 jours. |
| Date limite de préavis | Calcul automatique : date d'échéance moins le nombre de jours de préavis. |

### E - Pénalités et garanties

| Champ | Signification |
|---|---|
| Clause de pénalités de retard | Indique si une pénalité s'applique en cas de retard de livraison. |
| Taux de pénalités | Taux de pénalité prévu, exprime en pourcentage par semaine. |
| Plafond de pénalités | Pourcentage maximal du montant HT que les pénalités peuvent atteindre. |
| Pénalités de résiliation anticipee | Indique si une indemnité est due en cas d'arrêt avant le terme prévu. |
| Montant des pénalités de résiliation | Indemnité prevue, en ariary ; requise si la clause est activée. |
| Garantie bancaire | Indique si une garantie à premiere demande est exigee du fournisseur. |
| Montant de la garantie | Valeur de la garantie, en ariary ; requise si la garantie est activée. |

Les champs conditionnels s'affichent seulement lorsque leur clause correspondante est activée.

### F — Documents et métadonnées

| Champ | Signification |
|---|---|
| Contrat signé | Document PDF obligatoire. Il est conserve comme piece du dossier. |
| Avenants | Modifications signees du contrat ; plusieurs fichiers peuvent etre ajoutes. |
| Conditions generales | CGV/CGA du fournisseur, en PDF, champ facultatif. |
| Niveau de criticite | Niveau d'attention requis : Critique, Majeur, Standard ou Faible. |
| Tags | Mots-clés libres pour classer et retrouver les contrats. |
| Notes internes | Observations non destinées au fournisseur : vigilance, négociations ou contexte de suivi. |

Les documents transmis à l'API sont limites au PDF et e 20 Mo par fichier.

### Préremplissage présentée comme IA

Le PDF est lu localement : PDF.js extrait son texte et Tesseract.js lance l'OCR français / anglais pour les pages scannées. Le texte passe ensuite au modèle Ollama local (qwen2.5-coder:7b) pour repérer les champs et proposer des scores de confiance. Le PDF et son contenu ne sont pas envoyés à un service IA cloud. Les fichiers OCR et langues sont téléchargés depuis un CDN au premier usage puis mis en cache. Les valeurs extraites doivent être vérifiées avant enregistrement.

La fiche d’analyse IA ajoute un résumé du contrat, les clauses de reconduction, préavis, résiliation, pénalités, révision de prix, garanties, paiement et responsabilité qui ont été repérées, ainsi que des points de vigilance appuyés par de courts extraits du PDF. Elle est affichée après l’analyse et conservée dans la fiche du contrat. « Non repérée » signifie que le modèle ne l’a pas retrouvée dans le texte lu ; cela ne prouve pas que la clause est absente du contrat. Cette analyse reste indicative et doit être confirmée par le service juridique.

Apres validation, le contrat apparait dans le registre. Les valeurs de suivi générées par defaut pour une nouvelle saisie sont : contrat conforme, score de performance 80/100, budget égal au montant contractuel et dépenses réalisées initialement à zero.

### Configuration Ollama

Lancer Ollama sur le poste, puis vérifier la présence du modèle avec la commande ollama list. Le modèle utilisé par défaut est qwen2.5-coder:7b. Si le modèle manque, le télécharger avec ollama pull qwen2.5-coder:7b. Si le serveur Ollama est arrêté, démarrer Ollama ou exécuter ollama serve. Aucune clé API nest requise.


## 7. Alertes et cycle de vie

La date surveill'e depend du contrat :

- en cas de reconduction tacite, c'est la **date limite de préavis** ;
- sans reconduction tacite, c'est la **date d'échéance**.

Le système calcule le nombre de jours restants et affiche les jalons suivants :

| Jalon | Délai restant | Sens |
|---|---:|---|
| J-90 | 90 jours | Début de la preparation et revue du besoin. |
| J-60 | 60 jours | Décision de stratégie attendue. |
| J-30 | 30 jours | Alerte critique, preparation de la décision. |
| J-10 | 10 jours | Urgence et escalade au responsable. |
| J-5 | 5 jours | Rappel final avant la date de référence. |

Le centre de notifications permet de filtrer les jalons et de selectionner un contrat. La page Alertes affiche les compteurs J-30 et J-10, la fiche de l'alerte, les échéances et une frise chronologique. Les icenes email, SMS et push indiquent les canaux prevus dans les modèles ; cette version ne transmet pas reellement de messages.

Depuis une fiche d'alerte, l'utilisateur peut enregistrer une action de renouvellement, de renegociation ou de résiliation. Il peut également creer un signalement de litige lié au contrat.

## 8. Litiges : suivi et vocabulaire

Un litige represente un desaccord ou un ecart lié à un contrat. Les types utilises sont :

- **Manquement contractuel** : une obligation du fournisseur n'est pas respectee.
- **Facturation non conforme** : la facture ne correspond pas aux prix ou conditions contractuels.
- **Contestation de reconduction** : desaccord sur un renouvellement tacite ou sa résiliation.

Le montant concerne represente l'exposition financiere estimée. La liste des litiges actifs permet de filtrer par statut et par fournisseur, puis de modifier rapidement le statut. Les étapes proposees dans la liste sont : Nouveau, Pièces manquantes, Analyse interne, Réponse fournisseur attendue, Negociation, Avoir attendu et Contentieux. Les litiges depassant le seuil de seuil MGA correspondant a 50 000 EUR, ou associés à un contrat critique, déclenchent une priorité haute et un indicateur d'escalade à la Direction Generale.

Un avoir est une noté de crédit du fournisseur. La correction de facture et l'enregistrement de l'avoir sont les éléments de clôture suivis dans le modele de données. Les statuts Clôture et Abandonné sont prevus par l'API et la base ; la liste actuelle des actions rapides ne les propose pas encore.

## 9. Definitions des indicateurs financiers et fournisseurs

- **Budget** : montant prévu ou engage pour le contrat.
- **Réalisé** : dépenses deja imputees au contrat.
- **Depassement** : partie des dépenses réalisées supérieure au budget.
- **Achats hors contrat** : estimation des dépenses qui ne respectent pas le cadre contractuel.
- **Fuite contractuelle** : dépassements additionnes aux achats hors contrat estimes.
- **Score fournisseur** : appreciation sur 100, utilisee pour comparer les fournisseurs.
- **Livraisons en retard** : nombre de retards recenses pour le contrat.
- **Conformité** : indicateur binaire pour signaler si le dossier respecte les exigences suivies par l'application.
- **Exposition à la reconduction tacite** : montant estimé de la période qui pourrait se renouveler si le préavis n'est pas envoyé.
- **Pénalités récupérables** : estimation à partir du taux et des retards, plafonnée selon la clause du contrat.
- **Décision précédente** : dernier etat connu dans les données : renouvelé, résilié ou aucune décision.

Ces indicateurs aident au pilotage ; les montants calcules sont des estimations à valider avec les pièces et les règles comptables de l'organisation.

## 10. Exports

Le menu **Exporter** produit un fichier à partir des contrats actuellement sélectionnés ou filtres :

- **PDF** : ouvre une page de rapport prete à imprimer ou enregistrer en PDF depuis le navigateur.
- **Excel** : généré un tableau ouvrable dans un tableur.
- **CSV** : généré un fichier délimité par des points-virgules.

Les colonnes exportées couvrent la référence, le fournisseur et son NIF, le type et l'objet du contrat, le département, le responsable, le montant en MGA, les dates, la reconduction, le préavis, les jours restants, la criticite et la conformité.

## 11. Données, stockage et technologie

- **Interface** : Next.js, React et TypeScript.
- **Base de données** : PostgreSQL, connectée avec la variable d'environnement `DATABASE_URL`.
- **Contrats** : données structurées conservées en JSONB dans la table `contrats`.
- **Documents** : contenu PDF et métadonnées conserves dans `documents_contrats`.
- **Litiges** : statut, montant, priorité et informations de suivi conserves dans `litiges`; les changements de statut peuvent etre journalises dans lehistorique.
- **Actions** : les actions liees aux contrats sont conservées dans `actions_contrats`.
- **API** : routes sous `/api/contrats`, `/api/litiges`, `/api/actions` et `/api/documents`.

Le tableau de bord est fourni avec 250 contrats de démonstration et des montants synthétiques. En l'absence de contrats retournés par l'API, ces contrats restent charges dans l'interface. En revanche, la page **Litiges actifs** interroge directement l'API et nécessite une base PostgreSQL accessible pour afficher ou modifier des dossiers persistes.

La conversion des anciennes données EUR en MGA utilisé un taux de référence fixe enregistre dans le projet : 1 EUR = 5 077,086 MGA (référence au 27 octobre 2026). Il sert à convertir les exemples et les anciennes lignes EUR à l'affichage ; il ne constitue pas un taux de change actualisé en temps reel.

## 12. Limites à connaître pendant la présentation

- La date de référence des données de démonstration est fixée au **21 octobre 2026** dans le code. Les compteurs et alertes illustrent donc un scenario de démonstration, pas une horloge synchronisée en direct.
- Extraction locale PDF.js, Tesseract.js et Ollama ; aucune clé API cloud nécessaire.
- Les canaux de notification sont illustrés dans l'interface, mais aucun email, SMS ou push n'est envoyé.
- La validation NIF verifie le format numérique attendu dans la demo ; elle ne confirme pas l'existence du numéro.
- Les actions de décision de la vue DG sont gérées en memoire d'interface dans cette version ; elles ne disposent pas d'une route de persistance dédiée.
- La creation et la modification des dossiers Litiges necessitent une base PostgreSQL configurée et joignable.
- Les données fournisseurs et references du jeu de démonstration sont synthétiques et ne doivent pas etre presentees comme des contrats reels.

## 13. Proposition de démonstration orale (3 e 5 minutes)

1. **Présenter le besoin** : « L’application centralise les contrats fournisseurs et évite de manquer un préavis ou une échéance. »
2. **Montrer le tableau de bord** : parcourir les profils Juridique, Achats, Finance et Direction Generale, puis expliquer les compteurs et le calendrier.
3. **Ouvrir le registre** : filtrer un fournisseur ou un contrat, ouvrir sa fiche, montrer ses dates, son montant en ariary, ses clauses et documents.
4. Montrer la saisie : parcourir les six sections et presenter le pre-remplissage par OCR local et Ollama.
5. **Montrer les alertes** : expliquer le calcul de la date de référence et presenter les jalons J-30/J-10, la frise et les actions disponibles.
6. **Terminer par les litiges et les exports** : expliquer le suivi des statuts, le signalement depuis une alerte, puis exporter une sélection en PDF, Excel ou CSV.

### Résumé oral en une phrase

> Le Registre numérique des contrats transforme les contrats fournisseurs en un portefeuille consultable et pilotable : il centralise les documents, met en évidence les échéances et les risques financiers, et facilite le suivi des décisions et des litiges.


