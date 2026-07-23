param(
  [switch]$SkipInstall,
  [switch]$SkipSeed,
  [switch]$AllowRemoteDatabase,
  [switch]$KeepOpen,
  [switch]$Smoke,
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
$ApiOrigin = "http://127.0.0.1:$ApiPort"
$FrontendOrigin = "http://127.0.0.1:$FrontendPort"
$DisplayApiOrigin = "http://localhost:$ApiPort"
$DisplayFrontendOrigin = "http://localhost:$FrontendPort"

function Step($Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Invoke-Checked {
  param(
    [string]$Name,
    [string]$WorkingDirectory,
    [string]$FilePath,
    [string[]]$Arguments,
    [hashtable]$Environment = @{}
  )

  Step $Name
  $startedAt = Get-Date
  Push-Location $WorkingDirectory
  try {
    $previousValues = @{}
    foreach ($key in $Environment.Keys) {
      $previousValues[$key] = [Environment]::GetEnvironmentVariable($key, "Process")
      [Environment]::SetEnvironmentVariable($key, [string]$Environment[$key], "Process")
    }

    & $FilePath @Arguments
    $exitCode = if ($null -eq $LASTEXITCODE) { 0 } else { $LASTEXITCODE }
    if ($exitCode -ne 0) {
      throw "$Name failed with exit code $exitCode. Command: $FilePath $($Arguments -join ' ')"
    }
    $duration = [int]((Get-Date) - $startedAt).TotalSeconds
    Write-Host "$Name completed in ${duration}s." -ForegroundColor Green
  } finally {
    foreach ($key in $Environment.Keys) {
      [Environment]::SetEnvironmentVariable($key, $previousValues[$key], "Process")
    }
    Pop-Location
  }
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

function Test-LocalBin($Directory, $Name) {
  $extension = if ($IsWindows -or $env:OS -eq "Windows_NT") { ".cmd" } else { "" }
  return Test-Path -LiteralPath (Join-Path $Directory "node_modules/.bin/$Name$extension")
}

function Ensure-Dependencies($Name, $Directory, $RequiredBins, $RequiredPackages = @()) {
  $nodeModules = Join-Path $Directory "node_modules"
  $needsInstall = !(Test-Path -LiteralPath $nodeModules)

  if (!$needsInstall) {
    foreach ($bin in $RequiredBins) {
      if (!(Test-LocalBin $Directory $bin)) {
        Write-Host "$Name dependency install is incomplete: missing local binary '$bin'." -ForegroundColor Yellow
        $needsInstall = $true
        break
      }
    }
  }

  if (!$needsInstall) {
    foreach ($package in $RequiredPackages) {
      if (!(Test-Path -LiteralPath (Join-Path $nodeModules $package))) {
        Write-Host "$Name dependency install is incomplete: missing package '$package'." -ForegroundColor Yellow
        $needsInstall = $true
        break
      }
    }
  }

  if ($needsInstall) {
    Invoke-Checked "$Name npm ci" $Directory "npm.cmd" @("ci")
  } else {
    Write-Host "$Name dependencies already installed." -ForegroundColor Green
  }
}

function Wait-Http($Url, $Name) {
  $lastError = $null
  for ($i = 1; $i -le 40; $i++) {
    try {
      Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 | Out-Null
      Write-Host "$Name is ready: $Url" -ForegroundColor Green
      return
    } catch {
      $lastError = $_.Exception.Message
      Start-Sleep -Seconds 2
    }
  }

  throw "$Name did not respond at $Url. Last error: $lastError. Check logs in $LogDir."
}

function Assert-PortAvailable($Port, $Name) {
  $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if ($connection) {
    throw "$Name port $Port is already in use by PID $($connection.OwningProcess). Stop that process or pass a different port before running tester."
  }
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
  $errorMessage = if ($_.Exception.Message) { $_.Exception.Message } else { $_ | Out-String }
  Stop-RunnerJobs
  Write-Error $errorMessage
  exit 1
}

Step "Preparing local env"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

if (!(Test-Path -LiteralPath $BackendEnv)) {
  Copy-Item -LiteralPath $BackendEnvExample -Destination $BackendEnv
  Write-Host "Created be/.env from be/.env.example"
}

$DatabaseUrl = Read-EnvValue $BackendEnv "DATABASE_URL"
Ensure-LocalDatabase $DatabaseUrl
Assert-PortAvailable $ApiPort "Backend API"
Assert-PortAvailable $FrontendPort "Frontend"

if (!$SkipInstall) {
  Step "Installing dependencies when needed"
  Ensure-Dependencies "Backend" $BackendDir @("prisma", "ts-node", "nest", "tsc")
  Ensure-Dependencies "Frontend" $FrontendDir @("vite", "tsc") @("jsqr")
}

Invoke-Checked "Backend Prisma generate" $BackendDir "npm.cmd" @("run", "prisma:generate")
Invoke-Checked "Backend Prisma migrate deploy" $BackendDir "npm.cmd" @("run", "prisma:deploy")
if (!$SkipSeed) {
  Invoke-Checked "Backend seed database" $BackendDir "npm.cmd" @("run", "seed")
}

Invoke-Checked "Backend build" $BackendDir "npm.cmd" @("run", "build")
Invoke-Checked "Frontend build" $FrontendDir "npm.cmd" @("run", "build") @{VITE_API_BASE_URL = ""}

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
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
} -ArgumentList $BackendDir, $ApiPort, $FrontendOrigin, $ApiLog

$script:FrontendJob = Start-Job -Name "movement-frontend" -ScriptBlock {
  param($Dir, $Port, $ApiProxyTarget, $LogPath)
  Set-Location $Dir
  $env:API_PROXY_TARGET = $ApiProxyTarget
  [Environment]::SetEnvironmentVariable("VITE_API_BASE_URL", $null, "Process")
  npm.cmd run preview -- --host 0.0.0.0 --port $Port *> $LogPath
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
} -ArgumentList $FrontendDir, $FrontendPort, $ApiOrigin, $FrontendLog

Wait-Http "$ApiOrigin/api/docs" "Backend API"
Wait-Http $FrontendOrigin "Frontend"

Write-Host ""
Write-Host "Tester can open:" -ForegroundColor Green
Write-Host "  Frontend: $DisplayFrontendOrigin"
Write-Host "  API docs: $DisplayApiOrigin/api/docs"
Write-Host "  Loopback health URLs used by runner: $FrontendOrigin and $ApiOrigin/api/docs"
Write-Host ""
Write-Host "Seed accounts:"
Write-Host "  Admin: admin / admin123"
Write-Host "  Team:  team01 / team01"
Write-Host ""
Write-Host "Logs:"
Write-Host "  $ApiLog"
Write-Host "  $FrontendLog"
Write-Host ""
if ($Smoke) {
  Write-Host "Tester smoke completed; stopping test servers." -ForegroundColor Green
  Stop-RunnerJobs
  exit 0
}

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
