# Agents R - Bun Install Script (Official)
# Usage: irm https://raw.githubusercontent.com/tkjij77-ctrl/Agents-R/main/install-bun.ps1 | iex

$ColorPrimary = "Cyan"
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError = "Red"

Write-Host ""
Write-Host "  Agents R - Official Installer" -ForegroundColor $ColorPrimary
Write-Host ""

# Install Bun if not exists
try { 
    $bunVer = bun --version 2>&1
    Write-Host "[OK] Bun v$bunVer" -ForegroundColor $ColorSuccess 
} catch {
    Write-Host "[*] Installing Bun..." -ForegroundColor $ColorPrimary
    powershell -Command "& {$(irm bun.sh/install.ps1)}"
    $env:PATH += ";$env:USERPROFILE\.bun\bin"
}

# Check Git
try { git --version | Out-Null; Write-Host "[OK] Git" -ForegroundColor $ColorSuccess }
catch { Write-Host "[!] Git required" -ForegroundColor $ColorError; exit 1 }

# Clone or update
$InstallDir = "$env:USERPROFILE\agents-r"
if (Test-Path $InstallDir) {
    Write-Host "[*] Updating..." -ForegroundColor $ColorPrimary
    Set-Location $InstallDir
    git pull origin main
} else {
    Write-Host "[*] Cloning..." -ForegroundColor $ColorPrimary
    git clone https://github.com/tkjij77-ctrl/Agents-R.git $InstallDir
    Set-Location $InstallDir
}

# Install with Bun (fastest for this project)
Write-Host "[*] Installing dependencies..." -ForegroundColor $ColorPrimary
bun install --no-save

# Setup PATH
$BinDir = "$env:USERPROFILE\.agents-r\bin"
if (-not (Test-Path $BinDir)) { New-Item -ItemType Directory -Force -Path $BinDir | Out-Null }

# Create launcher
@"
@echo off
cd /d "$InstallDir"
bun run dev %*
"@ | Out-File -FilePath "$BinDir\agents-r.cmd" -Encoding ASCII

# Add to PATH
$CurrentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($CurrentPath -notlike "*$BinDir*") {
    [Environment]::SetEnvironmentVariable("PATH", "$CurrentPath;$BinDir", "User")
    $env:PATH += ";$BinDir"
}

# Desktop shortcuts
$Wsh = New-Object -ComObject WScript.Shell
$sc = $Wsh.CreateShortcut("$([Environment]::GetFolderPath("Desktop"))\Agents R.lnk")
$sc.TargetPath = "powershell.exe"
$sc.Arguments = "-NoExit -Command `"cd '$InstallDir'; bun run dev`""
$sc.Save()

$sc2 = $Wsh.CreateShortcut("$([Environment]::GetFolderPath("Desktop"))\Uninstall Agents R.lnk")
$sc2.TargetPath = "powershell.exe"
$sc2.Arguments = "-Command `"irm 'https://raw.githubusercontent.com/tkjij77-ctrl/Agents-R/main/uninstall.ps1' | iex`""
$sc2.Save()

Write-Host ""
Write-Host "  [OK] Agents R installed!" -ForegroundColor $ColorSuccess
Write-Host ""
Write-Host "  Run: agents-r" -ForegroundColor $ColorPrimary
Write-Host ""
