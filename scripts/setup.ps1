$ErrorActionPreference = 'Stop'

Write-Host 'Installation des dependances...'
corepack pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'Compilation de l application...'
corepack pnpm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'Installation et compilation terminees.'
