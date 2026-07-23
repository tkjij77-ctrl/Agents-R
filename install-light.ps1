# Agents R - LIGHTWEIGHT Install (Fast, minimal)
# Downloads only what's needed - skips docs, artifacts, tests

$ColorPrimary = "Cyan"
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError = "Red"

Write-Host ""
Write-Host "  Agents R - Lightweight Installer" -ForegroundColor $ColorPrimary
Write-Host "  (Fast, minimal, skips unnecessary files)" -ForegroundColor $ColorWarning
Write-Host ""

# Check prerequisites
try { node --version | Out-Null; Write-Host "[OK] Node.js" -ForegroundColor $ColorSuccess }
catch { Write-Host "[!] Install Node.js" -ForegroundColor $ColorError; exit 1 }

try { bun --version 2>&1 | Out-Null; Write-Host "[OK] Bun" -ForegroundColor $ColorSuccess }
catch {
    Write-Host "[*] Installing Bun..." -ForegroundColor $ColorPrimary
    powershell -Command "& {$(irm bun.sh/install.ps1)}"
    $env:PATH += ";$env:USERPROFILE\.bun\bin"
}

try { git --version | Out-Null; Write-Host "[OK] Git" -ForegroundColor $ColorSuccess }
catch { Write-Host "[!] Git required" -ForegroundColor $ColorError; exit 1 }

# Shallow clone (only latest commit - much faster)
$InstallDir = "$env:USERPROFILE\agents-r"
if (Test-Path $InstallDir) {
    Write-Host "[*] Updating..." -ForegroundColor $ColorPrimary
    Set-Location $InstallDir
    git pull --depth 1 origin main
} else {
    Write-Host "[*] Shallow clone (fast)..." -ForegroundColor $ColorPrimary
    git clone --depth 1 https://github.com/tkjij77-ctrl/Agents-R.git $InstallDir
    Set-Location $InstallDir
}

# Delete heavy unnecessary files BEFORE install
Write-Host "[*] Removing unnecessary files..." -ForegroundColor $ColorPrimary

$deletePaths = @(
    "README.*.md",  # All translated READMEs
    "artifacts",
    "packages/docs",
    "packages/web",
    "packages/storybook",
    "packages/console",
    "packages/desktop",
    "packages/app",
    "packages/sdk-next",
    "packages/slack",
    "github",
    "infra",
    "perf",
    "sdks",
    "specs",
    ".github",
    "packages/core/test",
    "packages/tui/test",
    "packages/llm/test",
    "packages/multi-agent/test"
)

$deleted = 0
foreach ($path in $deletePaths) {
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force
        $deleted++
    }
}
Write-Host "     Removed $deleted large directories" -ForegroundColor $ColorSuccess

# Install ONLY required packages
Write-Host "[*] Installing minimal dependencies..." -ForegroundColor $ColorPrimary
bun install --no-save --filter @opencode-ai/multi-agent --filter @opencode-ai/tui

# Setup
$BinDir = "$env:USERPROFILE\.agents-r\bin"
if (-not (Test-Path $BinDir)) { New-Item -ItemType Directory -Force -Path $BinDir | Out-Null }

@"
@echo off
cd /d "$InstallDir"
bun run dev %*
"@ | Out-File -FilePath "$BinDir\agents-r.cmd" -Encoding ASCII

$CurrentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($CurrentPath -notlike "*$BinDir*") {
    [Environment]::SetEnvironmentVariable("PATH", "$CurrentPath;$BinDir", "User")
    $env:PATH += ";$BinDir"
}

# Shortcuts
$Wsh = New-Object -ComObject WScript.Shell
$sc = $Wsh.CreateShortcut("$([Environment]::GetFolderPath("Desktop"))\Agents R.lnk")
$sc.TargetPath = "powershell.exe"
$sc.Arguments = "-NoExit -Command `"cd '$InstallDir'; bun run dev`""
$sc.Save()

Write-Host ""
Write-Host "  [OK] Agents R installed (lightweight)!" -ForegroundColor $ColorSuccess
Write-Host ""
Write-Host "  Run: agents-r" -ForegroundColor $ColorPrimary
Write-Host ""
Write-Host "  Time saved: ~70%" -ForegroundColor $ColorSuccess
Write-Host ""
