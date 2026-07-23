# Agents R - Simple Installer (Works 100%)

$ColorPrimary = "Cyan"
$ColorSuccess = "Green"
$ColorWarning = "Yellow"

Write-Host ""
Write-Host "  Agents R Installer" -ForegroundColor $ColorPrimary
Write-Host ""

try { bun --version 2>&1 | Out-Null; Write-Host "[OK] Bun" -ForegroundColor $ColorSuccess }
catch {
    Write-Host "[*] Installing Bun..." -ForegroundColor $ColorPrimary
    powershell -Command "& {$(irm bun.sh/install.ps1)}"
    $env:PATH += ";$env:USERPROFILE\.bun\bin"
}

try { git --version | Out-Null; Write-Host "[OK] Git" -ForegroundColor $ColorSuccess }
catch { Write-Host "[!] Git required" -ForegroundColor $ColorWarning; exit 1 }

$InstallDir = "$env:USERPROFILE\agents-r"
if (Test-Path $InstallDir) {
    Write-Host "[*] Updating..." -ForegroundColor $ColorPrimary
    Set-Location $InstallDir
    git pull --depth 1 origin main
} else {
    Write-Host "[*] Cloning... (this takes a few minutes)" -ForegroundColor $ColorPrimary
    git clone --depth 1 https://github.com/tkjij77-ctrl/Agents-R.git $InstallDir
    Set-Location $InstallDir
}

Write-Host "[*] Installing dependencies... (please wait 5-10 minutes)" -ForegroundColor $ColorPrimary
Write-Host "      This is normal for large projects" -ForegroundColor $ColorWarning
bun install

$BinDir = "$env:USERPROFILE\.agents-r\bin"
if (-not (Test-Path $BinDir)) { New-Item -ItemType Directory -Force -Path $BinDir | Out-Null }

"@echo off`ncd /d `"$InstallDir`"`nbun run dev %*" | Out-File "$BinDir\agents-r.cmd" -Encoding ASCII

$cp = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($cp -notlike "*$BinDir*") {
    [Environment]::SetEnvironmentVariable("PATH", "$cp;$BinDir", "User")
    $env:PATH += ";$BinDir"
}

Write-Host ""
Write-Host "  [OK] Done!" -ForegroundColor $ColorSuccess
Write-Host ""
Write-Host "  Run: agents-r" -ForegroundColor $ColorPrimary
Write-Host ""
