# Agents R - npm Install Script
irm https://raw.githubusercontent.com/tkjij77-ctrl/Agents-R/main/uninstall.ps1 | Out-Null

$ColorPrimary = "Cyan"
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError = "Red"

Write-Host ""
Write-Host "  Agents R - npm Installer" -ForegroundColor $ColorPrimary
Write-Host ""

# Check prerequisites
try { node --version | Out-Null; Write-Host "[OK] Node.js" -ForegroundColor $ColorSuccess }
catch { Write-Host "[!] Node.js required" -ForegroundColor $ColorError; exit 1 }

try { npm --version | Out-Null; Write-Host "[OK] npm" -ForegroundColor $ColorSuccess }
catch { Write-Host "[!] npm required" -ForegroundColor $ColorError; exit 1 }

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

# Install (npm is faster than bun)
Write-Host "[*] Installing dependencies..." -ForegroundColor $ColorPrimary
npm install

# Build
Write-Host "[*] Building..." -ForegroundColor $ColorPrimary
npm run build

# Setup PATH
$BinDir = "$env:USERPROFILE\.agents-r\bin"
if (-not (Test-Path $BinDir)) { New-Item -ItemType Directory -Force -Path $BinDir | Out-Null }

# Create agents-r.cmd launcher
@"
@echo off
cd /d "$InstallDir"
npm run dev %*
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
$sc.Arguments = "-NoExit -Command `"cd '$InstallDir'; npm run dev`""
$sc.Save()

$sc2 = $Wsh.CreateShortcut("$([Environment]::GetFolderPath("Desktop"))\Uninstall Agents R.lnk")
$sc2.TargetPath = "powershell.exe"
$sc2.Arguments = "-Command `"irm 'https://raw.githubusercontent.com/tkjij77-ctrl/Agents-R/main/uninstall.ps1' | iex`""
$sc2.Save()

Write-Host ""
Write-Host "  [OK] Agents R installed!" -ForegroundColor $ColorSuccess
Write-Host ""
Write-Host "  Commands:" -ForegroundColor $ColorPrimary
Write-Host "    agents-r          Run Agents R" -ForegroundColor $ColorSuccess
Write-Host "    agents-r --help   Show help" -ForegroundColor $ColorSuccess
Write-Host ""
Write-Host "  Or run from Desktop shortcut" -ForegroundColor $ColorPrimary
Write-Host ""
