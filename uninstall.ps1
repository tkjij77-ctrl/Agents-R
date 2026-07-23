# Agents R - Complete Uninstall Script
# Removes Agents R from the system

param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# Colors
$ColorPrimary = "Cyan"
$ColorSuccess = "Green"
$ColorError = "Red"
$ColorWarning = "Yellow"

function Write-Step {
    param([string]$Message)
    Write-Host "[*] $Message" -ForegroundColor $ColorPrimary
}

function Write-Success {
    param([string]$Message)
    Write-Host "[✓] $Message" -ForegroundColor $ColorSuccess
}

function Write-Error_ {
    param([string]$Message)
    Write-Host "[✗] $Message" -ForegroundColor $ColorError
}

function Write-Warning_ {
    param([string]$Message)
    Write-Host "[!] $Message" -ForegroundColor $ColorWarning
}

# Banner
Write-Host ""
Write-Host "  ╔════════════════════════════════════════╗" -ForegroundColor $ColorWarning
Write-Host "  ║                                        ║" -ForegroundColor $ColorWarning
Write-Host "     Agents R - Complete Uninstaller      ║" -ForegroundColor $ColorWarning
Write-Host "                                          ║" -ForegroundColor $ColorWarning
Write-Host "  ╚════════════════════════════════════════╝" -ForegroundColor $ColorWarning
Write-Host ""

# Confirm uninstallation
if (-not $Force) {
    $response = Read-Host "Are you sure you want to completely remove Agents R? (y/N)"
    if ($response -ne "y") {
        Write-Warning_ "Uninstallation cancelled"
        exit 0
    }
}

$InstallDir = "$env:USERPROFILE\agents-r"
$BinDir = "$env:USERPROFILE\.agents-r"

# Check if installed
if (-not (Test-Path $InstallDir)) {
    Write-Error_ "Agents R is not installed at $InstallDir"
    exit 1
}

# Stop any running processes
Write-Step "Stopping Agents R processes..."
Get-Process -Name "bun*" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*agents-r*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Success "Processes stopped"

# Remove installation directory
Write-Step "Removing installation directory..."
if (Test-Path $InstallDir) {
    Remove-Item -Path $InstallDir -Recurse -Force
    Write-Success "Removed $InstallDir"
}

# Remove bin directory
Write-Step "Removing bin directory..."
if (Test-Path $BinDir) {
    Remove-Item -Path $BinDir -Recurse -Force
    Write-Success "Removed $BinDir"
}

# Remove from PATH
Write-Step "Removing from PATH..."
$CurrentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$NewPath = $CurrentPath -replace [regex]::Escape(";$BinDir\bin"), ""
[Environment]::SetEnvironmentVariable("PATH", $NewPath, "User")
Write-Success "Removed from PATH"

# Remove desktop shortcut
Write-Step "Removing desktop shortcut..."
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = "$DesktopPath\Agents R.lnk"
if (Test-Path $ShortcutPath) {
    Remove-Item -Path $ShortcutPath -Force
    Write-Success "Removed desktop shortcut"
}

# Remove start menu shortcut (if exists)
Write-Step "Removing start menu shortcut..."
$StartMenuPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Agents R.lnk"
if (Test-Path $StartMenuPath) {
    Remove-Item -Path $StartMenuPath -Force
    Write-Success "Removed start menu shortcut"
}

# Clean up npm/bun cache (optional)
Write-Step "Cleaning up cache..."
if (Test-Path "$env:USERPROFILE\.bun\install\cache") {
    Remove-Item -Path "$env:USERPROFILE\.bun\install\cache" -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Success "Cache cleaned"

# Success message
Write-Host ""
Write-Host "  ╔════════════════════════════════════════╗" -ForegroundColor $ColorSuccess
Write-Host "  ║                                        " -ForegroundColor $ColorSuccess
Write-Host "  ║   Agents R completely removed!         ║" -ForegroundColor $ColorSuccess
Write-Host "  ║                                        ║" -ForegroundColor $ColorSuccess
Write-Host "  ╚════════════════════════════════════════╝" -ForegroundColor $ColorSuccess
Write-Host ""
Write-Host "  To reinstall:" -ForegroundColor $ColorPrimary
Write-Host ""
Write-Host "  irm https://raw.githubusercontent.com/tkjij77-ctrl/Agents-R/main/install.ps1 | iex" -ForegroundColor $ColorSuccess
Write-Host ""
