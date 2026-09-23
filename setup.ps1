# One-time setup for the presenting laptop. Safe to run again.
# Run from this folder:  powershell -ExecutionPolicy Bypass -File .\setup.ps1
$ErrorActionPreference = 'Continue'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$ok = $true
function Say($m) { Write-Host $m }
function Have($c) { return [bool](Get-Command $c -ErrorAction SilentlyContinue) }

Say ""
Say "STAR 2026 Built Live: laptop setup"
Say "----------------------------------"

# 1. Tools
$tools = @(
  @{ cmd = 'git';    id = 'Git.Git';            name = 'Git' },
  @{ cmd = 'node';   id = 'OpenJS.NodeJS.LTS';  name = 'Node.js' },
  @{ cmd = 'gh';     id = 'GitHub.cli';         name = 'GitHub CLI' },
  @{ cmd = 'claude'; id = 'Anthropic.ClaudeCode'; name = 'Claude Code' }
)
foreach ($t in $tools) {
  if (Have $t.cmd) { Say ("[ok]   " + $t.name) ; continue }
  Say ("[..]   Installing " + $t.name + " ...")
  winget install --id $t.id -e --accept-source-agreements --accept-package-agreements | Out-Null
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
  if (Have $t.cmd) { Say ("[ok]   " + $t.name + " installed") }
  else { Say ("[FIX]  " + $t.name + " did not install. Close this window, reopen PowerShell, and run setup again.") ; $ok = $false }
}

# 2. GitHub login (needed to publish the deck)
if (Have 'gh') {
  gh auth status 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { Say "[ok]   Signed in to GitHub" }
  else { Say "[FIX]  Not signed in to GitHub. Type:  gh auth login   (pick GitHub.com, HTTPS, browser)"; $ok = $false }
}

# 3. Commit identity for this folder only
Push-Location $here
git config user.name "PathAble AI"
git config user.email "PathAbleAI@users.noreply.github.com"
Pop-Location
Say "[ok]   Publishing identity set"

# 4. Clean Claude profile: no memory, no connectors, quiet screen
$profileDir = Join-Path $env:USERPROFILE '.claude-star'
New-Item -ItemType Directory -Force $profileDir | Out-Null
$settings = @'
{
  "disableClaudeAiConnectors": true,
  "autoMemoryEnabled": false,
  "spinnerTipsEnabled": false,
  "prefersReducedMotion": true,
  "showTurnDuration": false
}
'@
[IO.File]::WriteAllText((Join-Path $profileDir 'settings.json'), $settings, (New-Object Text.UTF8Encoding $false))
Say "[ok]   Clean Claude profile ready at $profileDir"

# 5. Desktop shortcut
$lnk = Join-Path ([Environment]::GetFolderPath('Desktop')) 'STAR Live.lnk'
$ws = New-Object -ComObject WScript.Shell
$s = $ws.CreateShortcut($lnk)
$s.TargetPath = Join-Path $here 'Start-STAR-Live.cmd'
$s.WorkingDirectory = $here
$s.Save()
Say "[ok]   Desktop shortcut: STAR Live"

Say ""
if ($ok) {
  Say "All set. Next: double-click 'STAR Live' on the desktop and log in to Claude once."
} else {
  Say "Almost there. Fix the [FIX] lines above, then run setup again."
}
