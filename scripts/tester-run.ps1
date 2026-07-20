param(
  [switch]$SkipInstall,
  [switch]$SkipSeed,
  [switch]$AllowRemoteDatabase,
  [int]$ApiPort = 3000,
  [int]$FrontendPort = 4173
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$BackendDir = Join-Path $Root "be"
$FrontendDir = Join-Path $Root "fe"
$LogDir = Join-Path $Root ".tester-logs"
$BackendEnv = Join-Path $BackendDir ".env"
$BackendEnvExample = Join-Path $BackendDir ".env.example"
$ApiOrigin = "http://localhost:$ApiPort"
$FrontendOrigin = "http://localhost:$FrontendPort"

function Step($Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Read-EnvValue($Path, $Name) {
  if (!(Test-Path -LiteralPath $Path)) {
    return $null
  }

  $line = Get-Content -LiteralPath $Path |
    Where-Object { $_ -match "^\s*$Name\s*=" } |
    Select-Object -First 1

  if (!$line) {
    return $null
  }

  return ($line -replace "^\s*$Name\s*=\s*", "").Trim().Trim('"').Trim("'")
}

function Ensure-LocalDatabase($DatabaseUrl) {
  if ($AllowRemoteDatabase) {
    return
  }

  if (!$DatabaseUrl) {
    throw "DATABASE_URL is missing. Set be/.env before running this command."
  }

  $isLocal = $DatabaseUrl -match "localhost|127\.0\.0\.1|host\.docker\.internal"
  if (!$isLocal) {
    throw "Refusing to migrate/seed a non-local database. Re-run with -AllowRemoteDatabase only for a disposable test DB."
  }
}

function Wait-Http($Url, $Name) {
  for ($i = 1; $i -le 40; $i++) {
    try {
      Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 | Out-Null
      Write-Host "$Name is ready: $Url" -ForegroundColor Green
      return
    } catch {
      Start-Sleep -Seconds 2
    }
  }

  Write-Host "$Name did not respond yet. Check logs in $LogDir." -ForegroundColor Yellow
}

function Stop-RunnerJobs {
  if ($script:ApiJob) {
    Stop-Job -Job $script:ApiJob -ErrorAction SilentlyContinue | Out-Null
    Remove-Job -Job $script:ApiJob -Force -ErrorAction SilentlyContinue | Out-Null
  }
  if ($script:FrontendJob) {
    Stop-Job -Job $script:FrontendJob -ErrorAction SilentlyContinue | Out-Null
    Remove-Job -Job $script:FrontendJob -Force -ErrorAction SilentlyContinue | Out-Null
  }
}

trap {
  Stop-RunnerJobs
  throw
}

Step "Preparing local env"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

if (!(Test-Path -LiteralPath $BackendEnv)) {
  Copy-Item -LiteralPath $BackendEnvExample -Destination $BackendEnv
  Write-Host "Created be/.env from be/.env.example"
}

$DatabaseUrl = Read-EnvValue $BackendEnv "DATABASE_URL"
Ensure-LocalDatabase $DatabaseUrl

if (!$SkipInstall) {
  Step "Installing dependencies when needed"
  if (!(Test-Path -LiteralPath (Join-Path $BackendDir "node_modules"))) {
    Push-Location $BackendDir
    npm.cmd ci
    Pop-Location
  }
  if (!(Test-Path -LiteralPath (Join-Path $FrontendDir "node_modules"))) {
    Push-Location $FrontendDir
    npm.cmd ci
    Pop-Location
  }
}

Step "Preparing database"
Push-Location $BackendDir
npm.cmd run prisma:generate
npm.cmd run prisma:deploy
if (!$SkipSeed) {
  npm.cmd run seed
}
Pop-Location

Step "Building backend"
Push-Location $BackendDir
npm.cmd run build
Pop-Location

Step "Building frontend"
Push-Location $FrontendDir
$env:VITE_API_BASE_URL = $ApiOrigin
npm.cmd run build
Pop-Location

Step "Starting test servers"
$ApiLog = Join-Path $LogDir "backend.log"
$FrontendLog = Join-Path $LogDir "frontend.log"
Remove-Item -LiteralPath $ApiLog, $FrontendLog -Force -ErrorAction SilentlyContinue

$script:ApiJob = Start-Job -Name "movement-api" -ScriptBlock {
  param($Dir, $Port, $CorsOrigin, $LogPath)
  Set-Location $Dir
  $env:NODE_ENV = "development"
  $env:PORT = "$Port"
  $env:CORS_ORIGIN = $CorsOrigin
  npm.cmd run start:prod *> $LogPath
} -ArgumentList $BackendDir, $ApiPort, $FrontendOrigin, $ApiLog

$script:FrontendJob = Start-Job -Name "movement-frontend" -ScriptBlock {
  param($Dir, $Port, $ApiBaseUrl, $LogPath)
  Set-Location $Dir
  $env:VITE_API_BASE_URL = $ApiBaseUrl
  npm.cmd run preview -- --host 0.0.0.0 --port $Port *> $LogPath
} -ArgumentList $FrontendDir, $FrontendPort, $ApiOrigin, $FrontendLog

Wait-Http "$ApiOrigin/api/docs" "Backend API"
Wait-Http $FrontendOrigin "Frontend"

Write-Host ""
Write-Host "Tester can open:" -ForegroundColor Green
Write-Host "  Frontend: $FrontendOrigin"
Write-Host "  API docs: $ApiOrigin/api/docs"
Write-Host ""
Write-Host "Seed accounts:"
Write-Host "  Admin: admin / admin123"
Write-Host "  Team:  team01 / team01"
Write-Host ""
Write-Host "Logs:"
Write-Host "  $ApiLog"
Write-Host "  $FrontendLog"
Write-Host ""
Write-Host "Keep this window open while testing. Press Ctrl+C to stop both servers."

try {
  while ($true) {
    $failed = @($script:ApiJob, $script:FrontendJob) | Where-Object { $_.State -in @("Failed", "Stopped", "Completed") }
    if ($failed.Count -gt 0) {
      Write-Host "A server stopped. Check logs in $LogDir." -ForegroundColor Yellow
      break
    }
    Start-Sleep -Seconds 3
  }
} finally {
  Stop-RunnerJobs
}
