$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.next')) {
    Write-Error 'Build introuvable. Lancez d abord: .\scripts\setup.ps1'
    exit 1
}

corepack pnpm run start
exit $LASTEXITCODE
