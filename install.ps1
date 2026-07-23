# Agents R - Quick Install Script for PowerShell
# Usage: irm https://raw.githubusercontent.com/tkjij77-ctrl/Agents-R/main/install.ps1 | iex

param(
    [string]$Version = "latest"
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
Write-Host "  █████╗ ███████╗ ██████╗ ███╗   ███╗" -ForegroundColor $ColorPrimary
Write-Host " ██╔══██╗██╔════╝██╔═══██╗████╗ ████║" -ForegroundColor $ColorPrimary
Write-Host " ███████║███████╗██║   ██║██╔████╔██║" -ForegroundColor $ColorPrimary
Write-Host " ██╔══██║╚════██║██║   ██║██║╚██╔╝██║" -ForegroundColor $ColorPrimary
Write-Host " ██║  ██║███████║╚██████╔╝██║ ╚═╝ ██║" -ForegroundColor $ColorPrimary
Write-Host " ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝     ╚═╝" -ForegroundColor $ColorPrimary
Write-Host ""
Write-Host "  Multi-Model AI Collaboration System" -ForegroundColor $ColorSuccess
Write-Host ""

# Check prerequisites
Write-Step "Checking prerequisites..."

# Check Git
try {
    $gitVersion = git --version 2>&1
    Write-Success "Git found: $gitVersion"
} catch {
    Write-Error_ "Git is not installed. Please install Git first: https://git-scm.com/download/win"
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Success "Node.js found: $nodeVersion"
} catch {
    Write-Warning_ "Node.js not found. Installing..."
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
}

# Check Bun
try {
    $bunVersion = bun --version 2>&1
    Write-Success "Bun found: v$bunVersion"
} catch {
    Write-Step "Installing Bun..."
    powershell -Command "& {$(irm bun.sh/install.ps1)}"
    $env:PATH += ";$env:USERPROFILE\.bun\bin"
}

# Clone repository
$InstallDir = "$env:USERPROFILE\agents-r"

if (Test-Path $InstallDir) {
    Write-Warning_ "Directory $InstallDir already exists"
    $response = Read-Host "Do you want to update? (y/N)"
    if ($response -ne "y") {
        Write-Warning_ "Installation cancelled"
        exit 0
    }
    
    Write-Step "Updating existing installation..."
    Set-Location $InstallDir
    git pull origin main
} else {
    Write-Step "Cloning Agents R..."
    git clone https://github.com/tkjij77-ctrl/Agents-R.git $InstallDir
    Set-Location $InstallDir
}

# Install dependencies
Write-Step "Installing dependencies..."
bun install

# Build
Write-Step "Building Agents R..."
bun run build

# Create symlink for global access
$BinDir = "$env:USERPROFILE\.agents-r\bin"
if (-not (Test-Path $BinDir)) {
    New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
}

# Create launcher script
$LauncherPath = "$BinDir\agents-r.ps1"
@"
# Agents R Launcher
& "$InstallDir\packages\tui\src\index.ts" `@args
"@ | Out-File -FilePath $LauncherPath -Encoding UTF8

# Add to PATH
$CurrentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($CurrentPath -notlike "*$BinDir*") {
    Write-Step "Adding to PATH..."
    [Environment]::SetEnvironmentVariable("PATH", "$CurrentPath;$BinDir", "User")
    Write-Success "Added to user PATH"
}

# Create desktop shortcut (optional)
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = "$DesktopPath\Agents R.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoExit -Command `"cd '$InstallDir'; bun run dev`""
$Shortcut.WorkingDirectory = $InstallDir
$Shortcut.IconLocation = "powershell.exe,0"
$Shortcut.Save()

Write-Success "Desktop shortcut created"

# Success message
Write-Host ""
Write-Host "  ╔════════════════════════════════════════╗" -ForegroundColor $ColorSuccess
Write-Host "  ║                                        ║" -ForegroundColor $ColorSuccess
Write-Host "  ║   Agents R installed successfully!    ║" -ForegroundColor $ColorSuccess
Write-Host "  ║                                        ║" -ForegroundColor $ColorSuccess
Write-Host "  ╚════════════════════════════════════════╝" -ForegroundColor $ColorSuccess
Write-Host ""
Write-Host "  Quick Start:" -ForegroundColor $ColorPrimary
Write-Host ""
Write-Host "  1. Restart your terminal" -ForegroundColor $ColorSuccess
Write-Host "  2. Run: agents-r" -ForegroundColor $ColorSuccess
Write-Host "  3. Or use desktop shortcut" -ForegroundColor $ColorSuccess
Write-Host ""
Write-Host "  Manual Start:" -ForegroundColor $ColorPrimary
Write-Host ""
Write-Host "  cd $InstallDir" -ForegroundColor $ColorSuccess
Write-Host "  bun run dev" -ForegroundColor $ColorSuccess
Write-Host ""
Write-Host "  Documentation:" -ForegroundColor $ColorPrimary
Write-Host ""
Write-Host "  https://github.com/tkjij77-ctrl/Agents-R" -ForegroundColor $ColorSuccess
Write-Host ""
