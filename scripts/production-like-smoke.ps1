param(
  [int]$DbPort = 55433,
  [int]$ApiPort = 3100,
  [int]$HttpsPort = 4443
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$BackendDir = Join-Path $Root "be"
$FrontendDir = Join-Path $Root "fe"
$LogDir = Join-Path $Root ".tester-logs\production-like-smoke"
$ContainerName = "movement2026-smoke-postgres"
$DatabaseUrl = "postgresql://postgres:postgres@127.0.0.1:$DbPort/movement"
$LocalPostgresAdminUrl = "postgresql://postgres:postgres@127.0.0.1:55432/postgres"
$ApiOrigin = "http://127.0.0.1:$ApiPort"
$HttpsOrigin = "https://127.0.0.1:$HttpsPort"
$JwtSecret = "smoke-jwt-" + [Guid]::NewGuid().ToString("N")
$ScoringCode = "smoke-" + [Guid]::NewGuid().ToString("N").Substring(0, 12)

[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

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
  } finally {
    foreach ($key in $Environment.Keys) {
      [Environment]::SetEnvironmentVariable($key, $previousValues[$key], "Process")
    }
    Pop-Location
  }
}

function Assert-PortAvailable($Port, $Name) {
  $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if ($connection) {
    throw "$Name port $Port is already in use by PID $($connection.OwningProcess)."
  }
}

function Invoke-Json {
  param(
    [string]$Method,
    [string]$Path,
    [object]$Body,
    [string]$Token,
    [int[]]$ExpectedStatus = @(200, 201)
  )

  $headers = @{}
  if ($Token) {
    $headers.Authorization = "Bearer $Token"
  }
  $jsonBody = $null
  if ($null -ne $Body) {
    $headers["Content-Type"] = "application/json"
    $jsonBody = $Body | ConvertTo-Json -Depth 12
  }

  $response = Invoke-SmokeRequest -Method $Method -Url "$HttpsOrigin$Path" -Headers $headers -Body $jsonBody
  if ($ExpectedStatus -notcontains [int]$response.status) {
    throw "Expected $($ExpectedStatus -join '/') from $Method $Path, got $($response.status). Body: $($response.body)"
  }
  if (!$response.body) {
    return $null
  }
  return $response.body | ConvertFrom-Json
}

function Invoke-DirectJson {
  param(
    [string]$Method,
    [string]$Path,
    [object]$Body,
    [string]$Token,
    [int[]]$ExpectedStatus = @(200, 201)
  )

  $headers = @{}
  if ($Token) {
    $headers.Authorization = "Bearer $Token"
  }
  $jsonBody = $null
  if ($null -ne $Body) {
    $jsonBody = $Body | ConvertTo-Json -Depth 12
  }

  try {
    $response = Invoke-WebRequest `
      -Method $Method `
      -Uri "$ApiOrigin$Path" `
      -ContentType "application/json" `
      -Headers $headers `
      -Body $jsonBody `
      -UseBasicParsing
    if ($ExpectedStatus -notcontains [int]$response.StatusCode) {
      throw "Expected $($ExpectedStatus -join '/') from $Method $Path, got $($response.StatusCode)."
    }
    if (!$response.Content) {
      return $null
    }
    return $response.Content | ConvertFrom-Json
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($ExpectedStatus -contains [int]$status) {
      return $null
    }
    throw
  }
}

function Wait-Http($Url, $Name, [switch]$SkipCertificateCheck) {
  for ($i = 1; $i -le 60; $i++) {
    try {
      if ($Url.StartsWith("https://")) {
        $response = Invoke-SmokeRequest -Method "Get" -Url $Url
        if ([int]$response.status -ge 400) {
          throw "HTTP $($response.status)"
        }
      } else {
        Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 | Out-Null
      }
      Write-Host "$Name is ready: $Url" -ForegroundColor Green
      return
    } catch {
      Start-Sleep -Seconds 2
    }
  }
  throw "$Name did not become ready at $Url."
}

function Write-SmokeRequestScript($Path) {
  @'
const fs = require('fs');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const request = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

(async () => {
  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers || {},
    body: request.body || undefined,
  });
  const headers = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const body = await response.text();
  process.stdout.write(JSON.stringify({
    status: response.status,
    headers,
    body,
  }));
})().catch((error) => {
  const cause = error && error.cause ? ` cause=${error.cause.stack || error.cause.message || error.cause}` : '';
  console.error(`${request.method} ${request.url}: ${error.stack || error.message || error}${cause}`);
  process.exit(1);
});
'@ | Set-Content -LiteralPath $Path -Encoding UTF8
}

function Invoke-SmokeRequest {
  param(
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers = @{},
    [string]$Body = $null
  )

  $scriptPath = Join-Path $LogDir "https-request.js"
  Write-SmokeRequestScript $scriptPath
  $requestPath = Join-Path $LogDir ("request-" + [Guid]::NewGuid().ToString("N") + ".json")
  try {
    @{
      method = $Method
      url = $Url
      headers = $Headers
      body = $Body
    } | ConvertTo-Json -Depth 8 | ForEach-Object {
      [System.IO.File]::WriteAllText(
        $requestPath,
        $_,
        [System.Text.UTF8Encoding]::new($false)
      )
    }
    $output = $null
    $exitCode = 1
    for ($i = 1; $i -le 5; $i++) {
      $output = node $scriptPath $requestPath
      $exitCode = if ($null -eq $LASTEXITCODE) { 0 } else { $LASTEXITCODE }
      if ($exitCode -eq 0) {
        break
      }
      Start-Sleep -Milliseconds 250
    }
    if ($exitCode -ne 0) {
      throw "HTTPS request failed with exit code $exitCode. $output"
    }
    return $output | ConvertFrom-Json
  } finally {
    Remove-Item -LiteralPath $requestPath -Force -ErrorAction SilentlyContinue
  }
}

function Stop-Smoke {
  if ($script:ProxyProcess -and !$script:ProxyProcess.HasExited) {
    Stop-Process -Id $script:ProxyProcess.Id -Force -ErrorAction SilentlyContinue
  }
  if ($script:ProxyJob) {
    Stop-Job -Job $script:ProxyJob -ErrorAction SilentlyContinue | Out-Null
    Remove-Job -Job $script:ProxyJob -Force -ErrorAction SilentlyContinue | Out-Null
  }
  if ($script:ApiJob) {
    Stop-Job -Job $script:ApiJob -ErrorAction SilentlyContinue | Out-Null
    Remove-Job -Job $script:ApiJob -Force -ErrorAction SilentlyContinue | Out-Null
  }
  if ($script:UsingDocker) {
    docker stop $ContainerName 2>$null | Out-Null
  }
  if ($script:CreatedDatabaseName) {
    try {
      Invoke-PostgresAdminSql $LocalPostgresAdminUrl "DROP DATABASE IF EXISTS `"$($script:CreatedDatabaseName)`""
    } catch {
      Write-Host "Could not drop disposable database $($script:CreatedDatabaseName): $($_.Exception.Message)" -ForegroundColor Yellow
    }
  }
}

function Write-PostgresAdminScript($Path) {
  @'
const { PrismaClient } = require(process.env.PRISMA_CLIENT_MODULE || '@prisma/client');

const url = process.argv[2];
const sql = process.argv[3];

const prisma = new PrismaClient({ datasources: { db: { url } } });

(async () => {
  await prisma.$executeRawUnsafe(sql);
})()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
'@ | Set-Content -LiteralPath $Path -Encoding UTF8
}

function Invoke-PostgresAdminSql($AdminUrl, $Sql) {
  $scriptPath = Join-Path $LogDir "postgres-admin.js"
  Write-PostgresAdminScript $scriptPath
  Push-Location $BackendDir
  try {
    $previousPrismaClientModule = [Environment]::GetEnvironmentVariable("PRISMA_CLIENT_MODULE", "Process")
    [Environment]::SetEnvironmentVariable(
      "PRISMA_CLIENT_MODULE",
      (Join-Path $BackendDir "node_modules\@prisma\client"),
      "Process"
    )
    node $scriptPath $AdminUrl $Sql
    $exitCode = if ($null -eq $LASTEXITCODE) { 0 } else { $LASTEXITCODE }
    if ($exitCode -ne 0) {
      throw "PostgreSQL admin SQL failed with exit code $exitCode."
    }
  } finally {
    [Environment]::SetEnvironmentVariable("PRISMA_CLIENT_MODULE", $previousPrismaClientModule, "Process")
    Pop-Location
  }
}

function Test-DockerReady {
  $previousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    docker info *> $null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  } finally {
    $ErrorActionPreference = $previousPreference
  }
}

function New-SmokeCertificate($PfxPath) {
  Add-Type -AssemblyName System.Security
  $rsa = [System.Security.Cryptography.RSA]::Create(2048)
  $subject = [System.Security.Cryptography.X509Certificates.X500DistinguishedName]::new("CN=localhost")
  $request = [System.Security.Cryptography.X509Certificates.CertificateRequest]::new(
    $subject,
    $rsa,
    [System.Security.Cryptography.HashAlgorithmName]::SHA256,
    [System.Security.Cryptography.RSASignaturePadding]::Pkcs1
  )
  $san = [System.Security.Cryptography.X509Certificates.SubjectAlternativeNameBuilder]::new()
  $san.AddDnsName("localhost")
  $san.AddIpAddress([System.Net.IPAddress]::Parse("127.0.0.1"))
  $request.CertificateExtensions.Add($san.Build())
  $request.CertificateExtensions.Add(
    [System.Security.Cryptography.X509Certificates.X509BasicConstraintsExtension]::new($false, $false, 0, $false)
  )
  $request.CertificateExtensions.Add(
    [System.Security.Cryptography.X509Certificates.X509KeyUsageExtension]::new(
      [System.Security.Cryptography.X509Certificates.X509KeyUsageFlags]::DigitalSignature,
      $false
    )
  )
  $cert = $request.CreateSelfSigned([DateTimeOffset]::Now.AddMinutes(-5), [DateTimeOffset]::Now.AddDays(2))
  [System.IO.File]::WriteAllBytes($PfxPath, $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Pkcs12))
  $cert.Dispose()
  $rsa.Dispose()
}

function Write-ProxyScript($Path) {
  @'
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

const distDir = process.env.FRONTEND_DIST;
const apiOrigin = new URL(process.env.API_ORIGIN);
const pfxPath = process.env.PFX_PATH;
const port = Number(process.env.HTTPS_PORT || 4443);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function sendFile(response, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, {'content-type': 'text/plain'});
      response.end('Not found');
      return;
    }
    response.writeHead(200, {'content-type': contentTypes[path.extname(filePath)] || 'application/octet-stream'});
    response.end(data);
  });
}

function proxyApi(request, response) {
  const chunks = [];
  request.on('data', (chunk) => chunks.push(chunk));
  request.on('end', () => {
    const body = Buffer.concat(chunks);
    const headers = {
      ...request.headers,
      host: apiOrigin.host,
      'x-forwarded-proto': 'https',
      'content-length': body.length,
    };
    delete headers.connection;

    const options = {
      hostname: apiOrigin.hostname,
      port: apiOrigin.port || 80,
      path: request.url,
      method: request.method,
      headers,
    };
    const proxyRequest = http.request(options, (proxyResponse) => {
      response.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
      proxyResponse.pipe(response);
    });
    proxyRequest.on('error', (error) => {
      response.writeHead(502, {'content-type': 'text/plain'});
      response.end(error.message);
    });
    proxyRequest.end(body);
  });
}

https.createServer({pfx: fs.readFileSync(pfxPath)}, (request, response) => {
  if (request.url.startsWith('/api/')) {
    proxyApi(request, response);
    return;
  }

  const parsed = new URL(request.url, 'https://localhost');
  const requestedPath = decodeURIComponent(parsed.pathname);
  const normalizedPath = requestedPath === '/' ? '/index.html' : requestedPath;
  const filePath = path.join(distDir, normalizedPath);
  if (!filePath.startsWith(distDir)) {
    response.writeHead(403, {'content-type': 'text/plain'});
    response.end('Forbidden');
    return;
  }

  fs.stat(filePath, (error, stat) => {
    if (!error && stat.isFile()) {
      sendFile(response, filePath);
      return;
    }
    if (path.extname(requestedPath)) {
      response.writeHead(404, {'content-type': 'text/plain'});
      response.end('Not found');
      return;
    }
    sendFile(response, path.join(distDir, 'index.html'));
  });
}).listen(port, '127.0.0.1', () => {
  console.log(`HTTPS smoke proxy listening on https://127.0.0.1:${port}`);
});
'@ | Set-Content -LiteralPath $Path -Encoding UTF8
}

function Assert($Condition, $Message) {
  if (!$Condition) {
    throw $Message
  }
}

function Get-RawTokenFromUrl($Url) {
  $match = [regex]::Match([string]$Url, "[?&]token=([^&]+)")
  if (!$match.Success) {
    return $null
  }
  return [System.Uri]::UnescapeDataString($match.Groups[1].Value)
}

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
[Environment]::SetEnvironmentVariable("DOCKER_CONFIG", (Join-Path $LogDir "docker-config"), "Process")
New-Item -ItemType Directory -Force -Path $env:DOCKER_CONFIG | Out-Null
Assert-PortAvailable $DbPort "PostgreSQL"
Assert-PortAvailable $ApiPort "Backend API"
Assert-PortAvailable $HttpsPort "HTTPS proxy"

trap {
  Write-Host "Smoke failed: $($_.Exception.Message)" -ForegroundColor Red
  Stop-Smoke
  throw
}

Step "Preparing disposable PostgreSQL"
if (Test-DockerReady) {
  $script:UsingDocker = $true
  docker rm -f $ContainerName 2>$null | Out-Null
  docker run -d --rm --name $ContainerName `
    -e POSTGRES_USER=postgres `
    -e POSTGRES_PASSWORD=postgres `
    -e POSTGRES_DB=movement `
    -p "127.0.0.1:$DbPort`:5432" `
    postgres:16-alpine | Out-Null

  for ($i = 1; $i -le 60; $i++) {
    docker exec $ContainerName pg_isready -U postgres -d movement *> $null
    if ($LASTEXITCODE -eq 0) {
      Write-Host "PostgreSQL is ready on 127.0.0.1:$DbPort" -ForegroundColor Green
      break
    }
    if ($i -eq 60) {
      throw "Disposable PostgreSQL did not become ready."
    }
    Start-Sleep -Seconds 1
  }
} else {
  $script:UsingDocker = $false
  $script:CreatedDatabaseName = "movement_smoke_" + (Get-Date -Format "yyyyMMddHHmmss")
  Invoke-PostgresAdminSql $LocalPostgresAdminUrl "DROP DATABASE IF EXISTS `"$($script:CreatedDatabaseName)`""
  Invoke-PostgresAdminSql $LocalPostgresAdminUrl "CREATE DATABASE `"$($script:CreatedDatabaseName)`""
  $DatabaseUrl = "postgresql://postgres:postgres@127.0.0.1:55432/$($script:CreatedDatabaseName)"
  Write-Host "Disposable PostgreSQL database is ready: $($script:CreatedDatabaseName)" -ForegroundColor Green
}

$baseEnv = @{
  DATABASE_URL = $DatabaseUrl
  JWT_SECRET = $JwtSecret
  JWT_EXPIRES_IN = "12h"
  CORS_ORIGIN = $HttpsOrigin
  FRONTEND_PUBLIC_URL = $HttpsOrigin
  QR_LOGIN_TOKEN_TTL_MINUTES = "1440"
  SCORING_CODE = $ScoringCode
}

Invoke-Checked "Backend Prisma generate" $BackendDir "npm.cmd" @("run", "prisma:generate") $baseEnv
Invoke-Checked "Clean database migrate deploy through latest migration" $BackendDir "npm.cmd" @("run", "prisma:deploy") ($baseEnv + @{ NODE_ENV = "development" })
Invoke-Checked "Seed clean database" $BackendDir "npm.cmd" @("run", "seed") ($baseEnv + @{ NODE_ENV = "development" })
Invoke-Checked "Seed clean database again" $BackendDir "npm.cmd" @("run", "seed") ($baseEnv + @{ NODE_ENV = "development" })
Invoke-Checked "Database verification" $BackendDir "npm.cmd" @("run", "db:verify") ($baseEnv + @{ NODE_ENV = "development" })
Invoke-Checked "Backend production build" $BackendDir "npm.cmd" @("run", "build") $baseEnv
Invoke-Checked "Frontend production build" $FrontendDir "npm.cmd" @("run", "build") @{ VITE_API_BASE_URL = "" }

Step "Starting backend in production-like mode"
$ApiLog = Join-Path $LogDir "backend-production-like.log"
Remove-Item -LiteralPath $ApiLog -Force -ErrorAction SilentlyContinue
$script:ApiJob = Start-Job -Name "movement-production-like-api" -ScriptBlock {
  param($Dir, $Port, $Environment, $LogPath)
  Set-Location $Dir
  foreach ($key in $Environment.Keys) {
    [Environment]::SetEnvironmentVariable($key, [string]$Environment[$key], "Process")
  }
  $env:NODE_ENV = "production"
  $env:PORT = "$Port"
  npm.cmd run start:prod *> $LogPath
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
} -ArgumentList $BackendDir, $ApiPort, $baseEnv, $ApiLog
Wait-Http "$ApiOrigin/api/docs" "Backend API"

Step "Starting disposable HTTPS same-origin proxy"
$PfxPath = Join-Path $LogDir "localhost.pfx"
$ProxyPath = Join-Path $LogDir "https-proxy.js"
$ProxyLog = Join-Path $LogDir "https-proxy.log"
$ProxyErrorLog = Join-Path $LogDir "https-proxy.err.log"
New-SmokeCertificate $PfxPath
Write-ProxyScript $ProxyPath
Remove-Item -LiteralPath $ProxyLog, $ProxyErrorLog -Force -ErrorAction SilentlyContinue
$previousFrontendDist = [Environment]::GetEnvironmentVariable("FRONTEND_DIST", "Process")
$previousApiOrigin = [Environment]::GetEnvironmentVariable("API_ORIGIN", "Process")
$previousPfxPath = [Environment]::GetEnvironmentVariable("PFX_PATH", "Process")
$previousHttpsPort = [Environment]::GetEnvironmentVariable("HTTPS_PORT", "Process")
try {
  [Environment]::SetEnvironmentVariable("FRONTEND_DIST", (Join-Path $FrontendDir "dist"), "Process")
  [Environment]::SetEnvironmentVariable("API_ORIGIN", $ApiOrigin, "Process")
  [Environment]::SetEnvironmentVariable("PFX_PATH", $PfxPath, "Process")
  [Environment]::SetEnvironmentVariable("HTTPS_PORT", "$HttpsPort", "Process")
  $script:ProxyProcess = Start-Process `
    -FilePath "node" `
    -ArgumentList @($ProxyPath) `
    -RedirectStandardOutput $ProxyLog `
    -RedirectStandardError $ProxyErrorLog `
    -WindowStyle Hidden `
    -PassThru
} finally {
  [Environment]::SetEnvironmentVariable("FRONTEND_DIST", $previousFrontendDist, "Process")
  [Environment]::SetEnvironmentVariable("API_ORIGIN", $previousApiOrigin, "Process")
  [Environment]::SetEnvironmentVariable("PFX_PATH", $previousPfxPath, "Process")
  [Environment]::SetEnvironmentVariable("HTTPS_PORT", $previousHttpsPort, "Process")
}
Wait-Http "$HttpsOrigin/" "HTTPS frontend" -SkipCertificateCheck

Step "Verifying HTTPS routing, SPA fallback, and CORS"
$root = Invoke-SmokeRequest -Method "Get" -Url "$HttpsOrigin/"
Assert ($root.body -match '<div id="root"') "Frontend root did not serve the app shell."
$qrPage = Invoke-SmokeRequest -Method "Get" -Url "$HttpsOrigin/qr-login"
Assert ($qrPage.body -match '<div id="root"') "Direct /qr-login did not serve SPA shell."
$qrRefresh = Invoke-SmokeRequest -Method "Get" -Url "$HttpsOrigin/qr-login?token=placeholder"
Assert ($qrRefresh.body -match '<div id="root"') "Refresh-style /qr-login did not serve SPA shell."
$apiDocs = Invoke-SmokeRequest -Method "Get" -Url "$HttpsOrigin/api/docs"
Assert ($apiDocs.status -eq 200) "Reverse proxy did not route /api/docs."
$missingAsset = Invoke-SmokeRequest -Method "Get" -Url "$HttpsOrigin/assets/missing-smoke.js"
Assert ($missingAsset.status -eq 404) "Missing asset should return 404 instead of SPA fallback."

$allowedCors = Invoke-WebRequest `
  -Method Get `
  -Uri "$ApiOrigin/api/docs" `
  -Headers @{ Origin = $HttpsOrigin } `
  -UseBasicParsing
Assert ($allowedCors.Headers["Access-Control-Allow-Origin"] -eq $HttpsOrigin) "Allowed CORS origin was not echoed."
$blockedCors = Invoke-WebRequest `
  -Method Get `
  -Uri "$ApiOrigin/api/docs" `
  -Headers @{ Origin = "https://evil.example" } `
  -UseBasicParsing
Assert (!$blockedCors.Headers["Access-Control-Allow-Origin"]) "Disallowed CORS origin received an allow header."

Step "Verifying Admin, Team QR, sessions, Station QR, scoring, Final, and leaderboard"
$admin = Invoke-Json -Method "Post" -Path "/api/auth/login" -Body @{ username = "admin"; password = "admin123" }
$adminToken = $admin.accessToken

$time = Get-Date
$beforeEnd = $time.AddMinutes(10).ToString("HH':'mm")
$afterEnd = $time.AddMinutes(-1).ToString("HH':'mm")
Invoke-DirectJson -Method "Patch" -Path "/api/admin/event-config" -Token $adminToken -Body @{ eventEndTime = $beforeEnd } | Out-Null

$qrTeam = Invoke-Json -Method "Post" -Path "/api/admin/teams" -Token $adminToken -Body @{
  name = "Smoke QR Team"
  username = "smoke_qr_team"
  password = "smoke_qr_team"
  captainName = "Smoke QR"
}
$teamQrUrl = $qrTeam.qrLoginUrl
if (!$teamQrUrl) {
  $teamQrUrl = $qrTeam.loginUrl
}
$teamQrToken = Get-RawTokenFromUrl $teamQrUrl
Assert $teamQrToken "Created Team did not return a QR login URL."

$qrLogin1 = Invoke-Json -Method "Post" -Path "/api/auth/qr-login" -Body @{ token = $teamQrToken; deviceLabel = "smoke-qr-1" }
$qrLogin2 = Invoke-Json -Method "Post" -Path "/api/auth/qr-login" -Body @{ token = $teamQrToken; deviceLabel = "smoke-qr-2" }
Invoke-Json -Method "Get" -Path "/api/auth/me" -Token $qrLogin1.accessToken -ExpectedStatus @(401) | Out-Null
Invoke-Json -Method "Get" -Path "/api/auth/me" -Token $qrLogin2.accessToken | Out-Null
Invoke-Json -Method "Delete" -Path "/api/admin/teams/$($qrTeam.id)/qr-login" -Token $adminToken | Out-Null
Invoke-Json -Method "Post" -Path "/api/auth/qr-login" -Body @{ token = $teamQrToken; deviceLabel = "smoke-revoked" } -ExpectedStatus @(400, 401, 403) | Out-Null
$rotated = Invoke-Json -Method "Post" -Path "/api/admin/teams/$($qrTeam.id)/qr-login/rotate" -Token $adminToken -Body @{}
$rotatedUrl = $rotated.qrLoginUrl
if (!$rotatedUrl) {
  $rotatedUrl = $rotated.loginUrl
}
$rotatedToken = Get-RawTokenFromUrl $rotatedUrl
Invoke-Json -Method "Post" -Path "/api/auth/qr-login" -Body @{ token = $teamQrToken; deviceLabel = "smoke-old-rotated" } -ExpectedStatus @(400, 401, 403) | Out-Null
Invoke-Json -Method "Post" -Path "/api/auth/qr-login" -Body @{ token = $rotatedToken; deviceLabel = "smoke-new-rotated" } | Out-Null

$scoreStation = Invoke-Json -Method "Post" -Path "/api/admin/stations" -Token $adminToken -Body @{
  id = "SMKSCORE"
  name = "Smoke Score"
  trackingMode = "SCORE"
  mapX = 10
  mapY = 10
  gameType = "PUZZLE"
}
Assert (@($scoreStation.qrTokens | Where-Object {$_.status -eq "ACTIVE"}).Count -eq 2) "New Station did not return exactly two active QR tokens."
$scoreIn = ($scoreStation.qrTokens | Where-Object {$_.purpose -eq "CHECK_IN"}).rawToken
$scoreOut = ($scoreStation.qrTokens | Where-Object {$_.purpose -eq "CHECK_OUT"}).rawToken
Assert ($scoreIn -and $scoreOut -and $scoreIn -ne $scoreOut) "Station QR tokens were missing or not independent."
Assert ($scoreIn -match '^MV26-SQ1-I-' -and $scoreOut -match '^MV26-SQ1-O-') "Station QR tokens were not SQ1 format."

$stationQrTeam = Invoke-Json -Method "Post" -Path "/api/auth/team-login" -Body @{ username = "team03"; password = "team03"; deviceLabel = "station-qr-team" }
Invoke-Json -Method "Post" -Path "/api/player/stations/SMKSCORE/check-in" -Token $stationQrTeam.accessToken -Body @{ qrToken = $scoreOut } -ExpectedStatus @(400, 403) | Out-Null
Invoke-Json -Method "Post" -Path "/api/player/stations/SMKSCORE/check-in" -Token $stationQrTeam.accessToken -Body @{ qrToken = $scoreIn } | Out-Null
Invoke-Json -Method "Post" -Path "/api/player/stations/SMKSCORE/check-out" -Token $stationQrTeam.accessToken -Body @{ qrToken = $scoreOut } | Out-Null
Invoke-Json -Method "Post" -Path "/api/player/stations/SMKSCORE/score" -Token $stationQrTeam.accessToken -Body @{ score = 31; confirmationCode = $ScoringCode } -ExpectedStatus @(400) | Out-Null
Invoke-Json -Method "Post" -Path "/api/player/stations/SMKSCORE/score" -Token $stationQrTeam.accessToken -Body @{ score = -1; confirmationCode = $ScoringCode } -ExpectedStatus @(400) | Out-Null
Invoke-Json -Method "Post" -Path "/api/player/stations/SMKSCORE/score" -Token $stationQrTeam.accessToken -Body @{ score = 10; confirmationCode = "000000" } -ExpectedStatus @(400, 401, 403) | Out-Null
$scoreComplete = Invoke-Json -Method "Post" -Path "/api/player/stations/SMKSCORE/score" -Token $stationQrTeam.accessToken -Body @{ score = 10; confirmationCode = $ScoringCode }
Assert ($scoreComplete.completedAt -and $scoreComplete.scoreAchieved -eq 10) "SCORE station did not complete with expected score."
Invoke-Json -Method "Post" -Path "/api/player/stations/SMKSCORE/score" -Token $stationQrTeam.accessToken -Body @{ score = 10; confirmationCode = $ScoringCode } -ExpectedStatus @(400) | Out-Null

$oldCheckIn = $scoreIn
Invoke-Json -Method "Delete" -Path "/api/admin/stations/SMKSCORE/qr-tokens/CHECK_IN" -Token $adminToken | Out-Null
Invoke-Json -Method "Post" -Path "/api/player/stations/SMKSCORE/check-in" -Token $stationQrTeam.accessToken -Body @{ qrToken = $oldCheckIn } -ExpectedStatus @(400, 403) | Out-Null
$newCheckIn = Invoke-Json -Method "Post" -Path "/api/admin/stations/SMKSCORE/qr-tokens/CHECK_IN/rotate" -Token $adminToken -Body @{}
$tokensAfterRotate = Invoke-Json -Method "Get" -Path "/api/admin/stations/SMKSCORE/qr-tokens" -Token $adminToken
Assert (@($tokensAfterRotate | Where-Object {$_.purpose -eq "CHECK_OUT" -and $_.status -eq "ACTIVE"}).Count -eq 1) "CHECK_IN rotation affected CHECK_OUT active token."
Assert ($newCheckIn.rawToken -ne $oldCheckIn) "CHECK_IN rotation did not create a new raw token."

$timeStation = Invoke-Json -Method "Post" -Path "/api/admin/stations" -Token $adminToken -Body @{
  id = "SMKTIME"
  name = "Smoke Time"
  trackingMode = "TIME"
  mapX = 20
  mapY = 20
  gameType = "PUZZLE"
  maxPoints = 45
}
$timeTeam = Invoke-Json -Method "Post" -Path "/api/auth/team-login" -Body @{ username = "team04"; password = "team04"; deviceLabel = "time-team" }
$timeIn = ($timeStation.qrTokens | Where-Object {$_.purpose -eq "CHECK_IN"}).rawToken
$timeOut = ($timeStation.qrTokens | Where-Object {$_.purpose -eq "CHECK_OUT"}).rawToken
Invoke-Json -Method "Post" -Path "/api/player/stations/SMKTIME/check-in" -Token $timeTeam.accessToken -Body @{ qrToken = $timeIn } | Out-Null
Start-Sleep -Seconds 1
$timeDone = Invoke-Json -Method "Post" -Path "/api/player/stations/SMKTIME/check-out" -Token $timeTeam.accessToken -Body @{ qrToken = $timeOut }
Assert ($timeDone.completedAt -and $timeDone.scoreAchieved -eq 0) "TIME station did not auto-complete with score 0."
Assert ([DateTime]$timeDone.checkedOutAt -gt [DateTime]$timeDone.checkedInAt) "TIME station did not record real duration."
Invoke-Json -Method "Post" -Path "/api/player/stations/SMKTIME/score" -Token $timeTeam.accessToken -Body @{ score = 1; confirmationCode = $ScoringCode } -ExpectedStatus @(400) | Out-Null

$bothStation = Invoke-Json -Method "Post" -Path "/api/admin/stations" -Token $adminToken -Body @{
  id = "SMKBOTH"
  name = "Smoke Both"
  trackingMode = "BOTH"
  mapX = 30
  mapY = 30
  gameType = "PUZZLE"
  maxPoints = 12
}
$bothTeam = Invoke-Json -Method "Post" -Path "/api/auth/team-login" -Body @{ username = "team05"; password = "team05"; deviceLabel = "both-team" }
$bothIn = ($bothStation.qrTokens | Where-Object {$_.purpose -eq "CHECK_IN"}).rawToken
$bothOut = ($bothStation.qrTokens | Where-Object {$_.purpose -eq "CHECK_OUT"}).rawToken
Invoke-Json -Method "Post" -Path "/api/player/stations/SMKBOTH/check-in" -Token $bothTeam.accessToken -Body @{ qrToken = $bothIn } | Out-Null
Start-Sleep -Seconds 1
$bothAwaitingScore = Invoke-Json -Method "Post" -Path "/api/player/stations/SMKBOTH/check-out" -Token $bothTeam.accessToken -Body @{ qrToken = $bothOut }
Assert (!$bothAwaitingScore.completedAt -and $bothAwaitingScore.checkedOutAt) "BOTH station should await score after checkout."
Assert ([DateTime]$bothAwaitingScore.checkedOutAt -gt [DateTime]$bothAwaitingScore.checkedInAt) "BOTH station did not record real duration."
$bothComplete = Invoke-Json -Method "Post" -Path "/api/player/stations/SMKBOTH/score" -Token $bothTeam.accessToken -Body @{ score = 12; confirmationCode = $ScoringCode }
Assert ($bothComplete.completedAt -and $bothComplete.scoreAchieved -eq 12) "BOTH station did not complete with custom max score."

$activeFinalTeam = Invoke-Json -Method "Post" -Path "/api/auth/team-login" -Body @{ username = "team06"; password = "team06"; deviceLabel = "active-final-team" }
Invoke-Json -Method "Post" -Path "/api/player/stations/SMKBOTH/check-in" -Token $activeFinalTeam.accessToken -Body @{ qrToken = $bothIn } | Out-Null
$preFinal = Invoke-Json -Method "Get" -Path "/api/player/final" -Token $bothTeam.accessToken
Assert (!$preFinal.isOpen) "Final opened before configured Event end."
Invoke-DirectJson -Method "Patch" -Path "/api/admin/event-config" -Token $adminToken -Body @{ eventEndTime = $afterEnd } | Out-Null
$activeBlocked = Invoke-Json -Method "Get" -Path "/api/player/final" -Token $activeFinalTeam.accessToken
Assert ($activeBlocked.blockedByActiveStation -and !$activeBlocked.canSubmit) "Active Station Team was not blocked from Final."
$postFinal = Invoke-Json -Method "Get" -Path "/api/player/final" -Token $bothTeam.accessToken
Assert ($postFinal.isOpen -and $postFinal.canSubmit) "Final did not open after configured Event end."
$wrongFinal = Invoke-Json -Method "Post" -Path "/api/player/final/submit" -Token $bothTeam.accessToken -Body @{ answer = "wrong" }
Assert (!$wrongFinal.isCorrect) "Wrong Final answer unexpectedly succeeded."
Invoke-Json -Method "Post" -Path "/api/player/final/submit" -Token $bothTeam.accessToken -Body @{ answer = "wrong again" } -ExpectedStatus @(400) | Out-Null
Start-Sleep -Seconds 1
$correctFinal = Invoke-Json -Method "Post" -Path "/api/player/final/submit" -Token $bothTeam.accessToken -Body @{ answer = "  disanvanhoa2026  " }
Assert ($correctFinal.isCorrect -and $correctFinal.pointsAwarded -eq 10) "Final keyword normalization or rank 1 bonus failed."
$duplicateFinal = Invoke-Json -Method "Post" -Path "/api/player/final/submit" -Token $bothTeam.accessToken -Body @{ answer = "DISANVANHOA2026" }
Assert ($duplicateFinal.id -eq $correctFinal.id -and $duplicateFinal.pointsAwarded -eq 10) "Duplicate Final submission did not return prior correct result."

for ($i = 7; $i -le 16; $i++) {
  $username = "team$($i.ToString("00"))"
  $team = Invoke-Json -Method "Post" -Path "/api/auth/team-login" -Body @{ username = $username; password = $username; deviceLabel = "final-rank-$i" }
  $result = Invoke-Json -Method "Post" -Path "/api/player/final/submit" -Token $team.accessToken -Body @{ answer = "disanvanhoa2026" }
  if ($result.winnerRank -eq 10) {
    Assert ($result.pointsAwarded -eq 1) "Rank 10 did not receive 1 point."
  }
  if ($result.winnerRank -eq 11) {
    Assert ($result.pointsAwarded -eq 0) "Rank 11 did not receive 0 points."
  }
}

$leaderboard = Invoke-Json -Method "Get" -Path "/api/leaderboard"
$bothEntry = $leaderboard | Where-Object { $_.teamId -eq $bothTeam.team.id } | Select-Object -First 1
Assert ($bothEntry.totalPoints -eq 22) "Leaderboard did not include Station score plus Final bonus exactly once."

Step "Scanning tracked files and production-like logs for raw secrets"
$rawPatterns = @($teamQrToken, $rotatedToken, $scoreIn, $scoreOut, $timeIn, $timeOut, $bothIn, $bothOut, $ScoringCode)
foreach ($pattern in $rawPatterns) {
  if (!$pattern) {
    continue
  }
  $trackedHits = git grep -F -- $pattern 2>$null
  if ($LASTEXITCODE -eq 0) {
    throw "A raw runtime secret was found in tracked files."
  }
  if ($LASTEXITCODE -ne 1) {
    throw "Tracked-file secret scan failed."
  }
  $logHits = Get-ChildItem -LiteralPath $LogDir -File |
    Where-Object { $_.Name -match 'production-like|https-proxy' } |
    Select-String -SimpleMatch $pattern -ErrorAction SilentlyContinue
  Assert (!$logHits) "A raw runtime secret was found in production-like logs."
}

Step "Verifying production environment guards reject unsafe defaults"
Invoke-Checked "Backend production env guard test" $BackendDir "npm.cmd" @("test", "--", "--runInBand", "src/config/validate-environment.spec.ts")

Write-Host ""
Write-Host "Production-like integration smoke passed." -ForegroundColor Green
Write-Host "  HTTPS origin: $HttpsOrigin"
Write-Host "  API origin: $ApiOrigin"
Write-Host "  Logs: $LogDir"

Stop-Smoke
