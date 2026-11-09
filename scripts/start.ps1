$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$buildId = Join-Path $projectRoot '.next\BUILD_ID'

if (-not (Test-Path $buildId -PathType Leaf)) {
    Write-Error 'Build introuvable. Lancez .\scripts\setup.ps1 depuis la racine du projet.'
    exit 1
}

Push-Location $projectRoot
try {
    corepack pnpm run start
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
