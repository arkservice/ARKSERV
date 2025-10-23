# Script de preparation du deploiement pour ARK Service
# Cree et remplit le dossier deploy/ avec les fichiers necessaires

$ErrorActionPreference = "Stop"

# Remonter d'un niveau pour atteindre la racine du projet
$projectRoot = Split-Path -Parent $PSScriptRoot
$deployPath = Join-Path $projectRoot "deploy"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "PREPARATION DU DEPLOIEMENT ARK SERVICE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Etape 1: Nettoyer/Creer le dossier deploy
Write-Host "[1/4] Preparation du dossier deploy..." -ForegroundColor Yellow

if (Test-Path $deployPath) {
    Write-Host "   Suppression de l'ancien dossier deploy..." -ForegroundColor Gray
    Remove-Item -Recurse -Force $deployPath
}

Write-Host "   Creation du nouveau dossier deploy..." -ForegroundColor Gray
New-Item -ItemType Directory -Path $deployPath | Out-Null
Write-Host "   [OK] Dossier deploy cree" -ForegroundColor Green
Write-Host ""

# Etape 2: Copier index.html
Write-Host "[2/4] Copie de index.html..." -ForegroundColor Yellow
$indexSource = Join-Path $projectRoot "index.html"
$indexDest = Join-Path $deployPath "index.html"

if (Test-Path $indexSource) {
    Copy-Item $indexSource -Destination $indexDest
    Write-Host "   [OK] index.html copie" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] index.html introuvable!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Etape 3: Copier le dossier CSS
Write-Host "[3/4] Copie du dossier css/..." -ForegroundColor Yellow
$cssSource = Join-Path $projectRoot "css"
$cssDest = Join-Path $deployPath "css"

if (Test-Path $cssSource) {
    Copy-Item -Path $cssSource -Destination $cssDest -Recurse
    $cssFiles = (Get-ChildItem -Path $cssDest -Recurse -File).Count
    Write-Host "   [OK] $cssFiles fichiers CSS copies" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Dossier css/ introuvable!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Etape 4: Copier le dossier JS
Write-Host "[4/4] Copie du dossier js/..." -ForegroundColor Yellow
$jsSource = Join-Path $projectRoot "js"
$jsDest = Join-Path $deployPath "js"

if (Test-Path $jsSource) {
    Copy-Item -Path $jsSource -Destination $jsDest -Recurse
    $jsFiles = (Get-ChildItem -Path $jsDest -Recurse -File).Count
    Write-Host "   [OK] $jsFiles fichiers JS copies" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Dossier js/ introuvable!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Resume final
$totalFiles = (Get-ChildItem -Path $deployPath -Recurse -File).Count
$totalDirs = (Get-ChildItem -Path $deployPath -Recurse -Directory).Count

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "PREPARATION TERMINEE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Fichiers totaux: $totalFiles" -ForegroundColor Green
Write-Host "Dossiers totaux: $totalDirs" -ForegroundColor Green
Write-Host ""
Write-Host "Structure preparee:" -ForegroundColor Yellow
Write-Host "   deploy/" -ForegroundColor Gray
Write-Host "   ├── index.html" -ForegroundColor Gray
Write-Host "   ├── css/ ($cssFiles fichiers)" -ForegroundColor Gray
Write-Host "   └── js/ ($jsFiles fichiers)" -ForegroundColor Gray
Write-Host ""
Write-Host ">>> Pret pour le deploiement!" -ForegroundColor Green
Write-Host ">>> Lancez: .\scripts\deploy-ftp.ps1" -ForegroundColor Cyan
Write-Host ""
