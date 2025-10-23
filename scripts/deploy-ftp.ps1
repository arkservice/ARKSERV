# Script de deploiement FTP pour ARK Service
# Serveur: ftp.arkance-training.world

$ErrorActionPreference = "Stop"

# Configuration FTP
$ftpServer = "ftp://ftp.arkance-training.world"
$ftpUser = "arkan2683084"
$ftpPassword = "Arkance2007!"
# Remonter d'un niveau pour atteindre la racine du projet
$projectRoot = Split-Path -Parent $PSScriptRoot
$localPath = "$projectRoot\deploy"

Write-Host ""
Write-Host ">>> Demarrage du deploiement FTP..." -ForegroundColor Cyan
Write-Host "Serveur: $ftpServer" -ForegroundColor Gray
Write-Host "Utilisateur: $ftpUser" -ForegroundColor Gray
Write-Host "Dossier local: $localPath" -ForegroundColor Gray
Write-Host ""

# Fonction pour creer un dossier FTP
function Create-FtpDirectory {
    param($ftpPath)

    try {
        $request = [System.Net.WebRequest]::Create($ftpPath)
        $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $request.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPassword)
        $request.UseBinary = $true
        $request.KeepAlive = $false

        $response = $request.GetResponse()
        $response.Close()
        return $true
    }
    catch {
        # Le dossier existe deja ou erreur ignorable
        return $false
    }
}

# Fonction pour uploader un fichier
function Upload-File {
    param($localFile, $remotePath)

    try {
        $webclient = New-Object System.Net.WebClient
        $webclient.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPassword)
        $webclient.UploadFile($remotePath, $localFile) | Out-Null
        return $true
    }
    catch {
        Write-Host "[ERREUR] $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Recuperer tous les fichiers a uploader
$files = Get-ChildItem -Path $localPath -Recurse -File
$totalFiles = $files.Count
$uploadedFiles = 0
$failedFiles = 0

Write-Host ">>> Fichiers a uploader: $totalFiles" -ForegroundColor Yellow
Write-Host ""

# Creer les dossiers necessaires
$directories = Get-ChildItem -Path $localPath -Recurse -Directory
foreach ($dir in $directories) {
    $relativePath = $dir.FullName.Substring($localPath.Length).Replace('\', '/')
    $ftpDirPath = "$ftpServer$relativePath"
    Create-FtpDirectory -ftpPath $ftpDirPath | Out-Null
}

# Uploader chaque fichier
foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($localPath.Length).Replace('\', '/')
    $ftpFilePath = "$ftpServer$relativePath"

    Write-Host "Upload [$($uploadedFiles + 1)/$totalFiles] $relativePath" -NoNewline

    if (Upload-File -localFile $file.FullName -remotePath $ftpFilePath) {
        Write-Host " [OK]" -ForegroundColor Green
        $uploadedFiles++
    }
    else {
        Write-Host " [ECHEC]" -ForegroundColor Red
        $failedFiles++
    }
}

# Resume
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "RESUME DU DEPLOIEMENT" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "[OK] Fichiers uploades: $uploadedFiles/$totalFiles" -ForegroundColor Green

if ($failedFiles -gt 0) {
    Write-Host "[ERREUR] Fichiers echoues: $failedFiles" -ForegroundColor Red
}

if ($uploadedFiles -eq $totalFiles) {
    Write-Host ""
    Write-Host ">>> Deploiement termine avec succes!" -ForegroundColor Green
    Write-Host ">>> Site accessible sur: https://arkance-training.world" -ForegroundColor Cyan
}
else {
    Write-Host ""
    Write-Host "[ATTENTION] Deploiement partiel (certains fichiers ont echoue)" -ForegroundColor Yellow
}

Write-Host ""
