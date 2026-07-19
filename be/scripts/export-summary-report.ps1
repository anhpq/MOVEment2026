param(
  [string]$ApiBaseUrl = "http://localhost:3000",
  [string]$Username = "admin",
  [string]$Password = "admin123",
  [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"

if (-not $OutputPath) {
  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $OutputPath = "movement-summary-$timestamp.xlsx"
}

$loginBody = @{
  username = $Username
  password = $Password
} | ConvertTo-Json

Write-Host "Report export: logging in admin '$Username' against $ApiBaseUrl"
$login = Invoke-RestMethod `
  -Method Post `
  -Uri "$ApiBaseUrl/api/auth/login" `
  -ContentType "application/json" `
  -Body $loginBody

Write-Host "Report export: downloading summary workbook to $OutputPath"
Invoke-WebRequest `
  -Method Get `
  -Uri "$ApiBaseUrl/api/admin/reports/summary.xlsx" `
  -Headers @{ Authorization = "Bearer $($login.accessToken)" } `
  -OutFile $OutputPath

if (-not (Test-Path $OutputPath)) {
  throw "Report export did not create $OutputPath"
}

$file = Get-Item $OutputPath
if ($file.Length -le 0) {
  throw "Report export created an empty file"
}

Write-Host "Report export passed: $($file.FullName) ($($file.Length) bytes)"
