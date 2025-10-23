# Script de verification FTP pour ARK Service
# Liste tous les fichiers presents sur le serveur

$ErrorActionPreference = "Stop"

# Configuration FTP
$ftpServer = "ftp://ftp.arkance-training.world"
$ftpUser = "arkan2683084"
$ftpPassword = "Arkance2007!"

Write-Host ""
Write-Host ">>> Verification du serveur FTP..." -ForegroundColor Cyan
Write-Host "Serveur: $ftpServer" -ForegroundColor Gray
Write-Host ""

# Fonction pour lister les fichiers FTP
function Get-FtpDirectory {
    param($ftpPath)

    try {
        $request = [System.Net.WebRequest]::Create($ftpPath)
        $request.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectoryDetails
        $request.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPassword)
        $request.UseBinary = $true
        $request.KeepAlive = $false

        $response = $request.GetResponse()
        $stream = $response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $content = $reader.ReadToEnd()

        $reader.Close()
        $stream.Close()
        $response.Close()

        return $content
    }
    catch {
        Write-Host "[ERREUR] Impossible de lister le repertoire: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Fonction pour compter les fichiers recursivement
function Count-FtpFiles {
    param($ftpPath, $indent = 0)

    $files = @()
    $dirs = @()

    try {
        $request = [System.Net.WebRequest]::Create($ftpPath)
        $request.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
        $request.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPassword)

        $response = $request.GetResponse()
        $stream = $response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)

        while (($line = $reader.ReadLine()) -ne $null) {
            $files += $line
        }

        $reader.Close()
        $stream.Close()
        $response.Close()

        return $files.Count
    }
    catch {
        return 0
    }
}

# Lister la racine
Write-Host "=== FICHIERS A LA RACINE ===" -ForegroundColor Yellow
$rootContent = Get-FtpDirectory -ftpPath $ftpServer

if ($rootContent) {
    $lines = $rootContent -split "`n"
    $fileCount = 0
    $dirCount = 0

    foreach ($line in $lines) {
        if ($line -match "^d") {
            $dirCount++
            $name = ($line -split "\s+")[-1]
            Write-Host "[DOSSIER] $name" -ForegroundColor Cyan
        }
        elseif ($line.Trim() -ne "") {
            $fileCount++
            $name = ($line -split "\s+")[-1]
            $size = ($line -split "\s+")[4]
            Write-Host "[FICHIER] $name ($size octets)" -ForegroundColor Green
        }
    }

    Write-Host ""
    Write-Host "=== STATISTIQUES ===" -ForegroundColor Yellow
    Write-Host "Dossiers: $dirCount" -ForegroundColor Cyan
    Write-Host "Fichiers: $fileCount" -ForegroundColor Green

    # Compter les fichiers dans css/ et js/
    $cssCount = Count-FtpFiles -ftpPath "$ftpServer/css"
    $jsCount = Count-FtpFiles -ftpPath "$ftpServer/js"

    if ($cssCount -gt 0) {
        Write-Host "Fichiers CSS: $cssCount" -ForegroundColor Gray
    }
    if ($jsCount -gt 0) {
        Write-Host "Fichiers JS: $jsCount" -ForegroundColor Gray
    }

    Write-Host ""
    Write-Host ">>> Site accessible sur: https://arkance-training.world" -ForegroundColor Cyan
}
else {
    Write-Host "[ERREUR] Impossible de lister les fichiers" -ForegroundColor Red
}

Write-Host ""
