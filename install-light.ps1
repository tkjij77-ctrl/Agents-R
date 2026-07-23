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

# Shallow clone
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

# Delete heavy unnecessary files
Write-Host "[*] Removing unnecessary files..." -ForegroundColor $ColorPrimary

$deletePaths = @(
    "README.*.md",
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

# Update package.json workspaces to match remaining packages
Write-Host "[*] Updating package.json..." -ForegroundColor $ColorPrimary

$pkg = Get-Content "package.json" -Raw | ConvertFrom-Json

# Keep only existing workspace packages
$existingWorkspaces = @()
foreach ($pkg_path in @("packages/*", "packages/console/*", "packages/stats/*", "packages/sdk/js")) {
    if ($pkg_path -like "*/*/*") {
        # Skip nested patterns
        continue
    }
    $basePath = $pkg_path -replace "\*", ""
    $basePath = $basePath -replace "/", ""
    if ($basePath -eq "packages") {
        # Check each package folder
        if (Test-Path "packages/core") { $existingWorkspaces += "packages/core" }
        if (Test-Path "packages/tui") { $existingWorkspaces += "packages/tui" }
        if (Test-Path "packages/llm") { $existingWorkspaces += "packages/llm" }
        if (Test-Path "packages/multi-agent") { $existingWorkspaces += "packages/multi-agent" }
        if (Test-Path "packages/protocol") { $existingWorkspaces += "packages/protocol" }
        if (Test-Path "packages/schema") { $existingWorkspaces += "packages/schema" }
        if (Test-Path "packages/plugin") { $existingWorkspaces += "packages/plugin" }
        if (Test-Path "packages/server") { $existingWorkspaces += "packages/server" }
        if (Test-Path "packages/client") { $existingWorkspaces += "packages/client" }
        if (Test-Path "packages/enterprise") { $existingWorkspaces += "packages/enterprise" }
        if (Test-Path "packages/function") { $existingWorkspaces += "packages/function" }
        if (Test-Path "packages/http-recorder") { $existingWorkspaces += "packages/http-recorder" }
        if (Test-Path "packages/httpapi-codegen") { $existingWorkspaces += "packages/httpapi-codegen" }
        if (Test-Path "packages/identity") { $existingWorkspaces += "packages/identity" }
        if (Test-Path "packages/script") { $existingWorkspaces += "packages/script" }
        if (Test-Path "packages/sdk") { $existingWorkspaces += "packages/sdk" }
        if (Test-Path "packages/session-ui") { $existingWorkspaces += "packages/session-ui" }
        if (Test-Path "packages/ui") { $existingWorkspaces += "packages/ui" }
        break
    }
}

if ($existingWorkspaces.Count -gt 0) {
    $pkg.workspaces.packages = $existingWorkspaces
    $pkg | ConvertTo-Json -Depth 10 | Set-Content "package.json" -Encoding UTF8
    Write-Host "     Updated workspaces: $($existingWorkspaces.Count) packages" -ForegroundColor $ColorSuccess
}

# Install minimal dependencies
Write-Host "[*] Installing minimal dependencies..." -ForegroundColor $ColorPrimary
bun install --no-save

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
