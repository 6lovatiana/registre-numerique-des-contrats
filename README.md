# Registre numérique des contrats

Application Next.js utilisant `pnpm`.

## Installation et compilation

Avec PowerShell, depuis la racine du projet :

```powershell
.\scripts\setup.ps1
```

Ce script installe les dépendances à partir du fichier `pnpm-lock.yaml`, puis compile l’application pour la production. Node.js et Corepack doivent être installés.

## Lancement en production

Après la compilation :

```powershell
.\scripts\start.ps1
```

Le serveur Next.js démarre par défaut sur `http://localhost:3000`.

Pour lancer le serveur de développement :

```powershell
corepack pnpm dev
```

Les fichiers d’environnement locaux (`.env*`) ne doivent pas être envoyés sur Git. Créez un fichier `.env.example` sans valeurs secrètes pour documenter les variables nécessaires.
