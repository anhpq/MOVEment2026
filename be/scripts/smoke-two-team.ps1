param(
  [string]$ApiBaseUrl = "http://localhost:3000",
  [string]$ScoringCode = "2468"
)

$ErrorActionPreference = "Stop"

function Invoke-JsonRequest {
  param(
    [string]$Method,
    [string]$Path,
    [object]$Body,
    [string]$Token
  )

  $headers = @{}
  if ($Token) {
    $headers.Authorization = "Bearer $Token"
  }

  $jsonBody = $null
  if ($null -ne $Body) {
    $jsonBody = $Body | ConvertTo-Json -Depth 8
  }

  Invoke-RestMethod `
    -Method $Method `
    -Uri "$ApiBaseUrl$Path" `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $jsonBody
}

function Login-Team {
  param(
    [string]$Username,
    [string]$Password,
    [string]$DeviceLabel
  )

  Invoke-JsonRequest `
    -Method "Post" `
    -Path "/api/auth/team-login" `
    -Body @{
      username = $Username
      password = $Password
      deviceLabel = $DeviceLabel
    }
}

function Complete-Station {
  param(
    [string]$Token,
    [string]$StationId,
    [int]$Score
  )

  Invoke-JsonRequest `
    -Method "Post" `
    -Path "/api/player/stations/$StationId/check-in" `
    -Token $Token `
    -Body @{ qrToken = "$StationId-CHECK_IN" } | Out-Null

  Invoke-JsonRequest `
    -Method "Post" `
    -Path "/api/player/stations/$StationId/check-out" `
    -Token $Token `
    -Body @{ qrToken = "$StationId-CHECK_OUT" } | Out-Null

  Invoke-JsonRequest `
    -Method "Post" `
    -Path "/api/player/stations/$StationId/score" `
    -Token $Token `
    -Body @{
      score = $Score
      confirmationCode = $ScoringCode
      reason = "two-team smoke test"
    } | Out-Null
}

Write-Host "Smoke: logging in team01 and team02 against $ApiBaseUrl"
$team01 = Login-Team -Username "team01" -Password "team01" -DeviceLabel "smoke-team01"
$team02 = Login-Team -Username "team02" -Password "team02" -DeviceLabel "smoke-team02"

Write-Host "Smoke: completing ST002 for team01"
Complete-Station -Token $team01.accessToken -StationId "ST002" -Score 25

Write-Host "Smoke: completing ST047 for team02"
Complete-Station -Token $team02.accessToken -StationId "ST047" -Score 30

$team01Me = Invoke-JsonRequest -Method "Get" -Path "/api/player/me" -Token $team01.accessToken
$team02Me = Invoke-JsonRequest -Method "Get" -Path "/api/player/me" -Token $team02.accessToken

if ($team01Me.team.totalPoints -lt 25) {
  throw "team01 totalPoints did not reflect station score"
}
if ($team02Me.team.totalPoints -lt 30) {
  throw "team02 totalPoints did not reflect station score"
}

Write-Host "Smoke passed:"
Write-Host "  team01 totalPoints=$($team01Me.team.totalPoints), completedStations=$($team01Me.completedStations)"
Write-Host "  team02 totalPoints=$($team02Me.team.totalPoints), completedStations=$($team02Me.completedStations)"
