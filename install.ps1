# Agents R - FINAL Lightweight Installer
# Everything in ONE script - no external files needed

$ColorPrimary = "Cyan"
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError = "Red"

Write-Host ""
Write-Host "  Agents R - FINAL Installer" -ForegroundColor $ColorPrimary
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

# Clean install
$InstallDir = "$env:USERPROFILE\agents-r"
if (Test-Path $InstallDir) {
    Write-Host "[*] Removing old installation..." -ForegroundColor $ColorWarning
    Remove-Item -Path $InstallDir -Recurse -Force
}

Write-Host "[*] Shallow clone..." -ForegroundColor $ColorPrimary
git clone --depth 1 https://github.com/tkjij77-ctrl/Agents-R.git $InstallDir
Set-Location $InstallDir

# Delete unnecessary files
Write-Host "[*] Cleaning..." -ForegroundColor $ColorPrimary
$paths = @("README.*.md","artifacts","packages/docs","packages/web","packages/storybook",
    "packages/console","packages/desktop","packages/app","packages/sdk-next","packages/slack",
    "github","infra","perf","sdks","specs",".github",
    "packages/core/test","packages/tui/test","packages/llm/test","packages/multi-agent/test")

foreach ($p in $paths) { if (Test-Path $p) { Remove-Item $p -Recurse -Force } }
Write-Host "     Cleaned" -ForegroundColor $ColorSuccess

# Update package.json inline with Node
Write-Host "[*] Fixing package.json..." -ForegroundColor $ColorPrimary
node -e "const fs=require('fs'),path=require('path');const p=path.join(__dirname,'package.json');const pkg=JSON.parse(fs.readFileSync(p,'utf8'));const dirs=fs.readdirSync('packages').filter(n=>fs.statSync(path.join('packages',n)).isDirectory()&&fs.existsSync(path.join('packages',n,'package.json')));pkg.workspaces.packages=dirs.map(d=>'packages/'+d);fs.writeFileSync(p,JSON.stringify(pkg,null,2)+'\n');console.log('Fixed:',dirs.length,'packages')"

# Install
Write-Host "[*] Installing..." -ForegroundColor $ColorPrimary
bun install --no-save

# Setup
$BinDir = "$env:USERPROFILE\.agents-r\bin"
if (-not (Test-Path $BinDir)) { New-Item -ItemType Directory -Force -Path $BinDir | Out-Null }

"@echo off`ncd /d `"$InstallDir`"`nbun run dev %*" | Out-File "$BinDir\agents-r.cmd" -Encoding ASCII

$cp = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($cp -notlike "*$BinDir*") {
    [Environment]::SetEnvironmentVariable("PATH", "$cp;$BinDir", "User")
    $env:PATH += ";$BinDir"
}

Write-Host ""
Write-Host "  [OK] Agents R installed!" -ForegroundColor $ColorSuccess
Write-Host ""
Write-Host "  Run: agents-r" -ForegroundColor $ColorPrimary
Write-Host ""
