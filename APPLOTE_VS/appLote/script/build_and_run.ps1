param(
  [Parameter(Position = 0)]
  [string]$Mode = "tunnel"
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $RootDir

function Show-Usage {
  @"
usage: ./script/build_and_run.ps1 [mode]

Modes:
  start, run, tunnel       Start Expo with tunnel transport for shared QR access
  lan                      Start Expo on the local network
  local                    Start Expo bound to localhost only
  android                  Start Expo tunnel and open Android
  ios                      Start Expo tunnel and open iOS
  web                      Start Expo web
  dev-client               Start Expo in development-client mode
  export-web               Export the web build locally
  doctor                   Run Expo diagnostics
  help                     Show this help
"@ | Write-Host
}

function Invoke-Npx {
  param([string[]]$Arguments)
  & npx @Arguments
  exit $LASTEXITCODE
}

function Invoke-Npm {
  param([string[]]$Arguments)
  & npm @Arguments
  exit $LASTEXITCODE
}

function Start-Expo {
  param([string[]]$ExpoArgs)
  Invoke-Npx (@("expo") + $ExpoArgs)
}

switch ($Mode.ToLowerInvariant()) {
  { $_ -in @("start", "run", "tunnel", "--tunnel") } {
    Write-Host "Starting Expo with tunnel. Share the QR with any Expo Go user."
    Start-Expo @("start", "--tunnel", "--clear")
  }
  { $_ -in @("lan", "--lan") } {
    Write-Host "Starting Expo on LAN. Phones must be on the same Wi-Fi."
    Start-Expo @("start", "--lan")
  }
  { $_ -in @("local", "--local", "localhost", "--localhost") } {
    Write-Host "Starting Expo on localhost."
    Start-Expo @("start", "--localhost")
  }
  { $_ -in @("android", "--android") } {
    Write-Host "Starting Expo tunnel and opening Android."
    Start-Expo @("start", "--android", "--tunnel", "--clear")
  }
  { $_ -in @("ios", "--ios") } {
    Write-Host "Starting Expo tunnel and opening iOS."
    Start-Expo @("start", "--ios", "--tunnel", "--clear")
  }
  { $_ -in @("web", "--web") } {
    Invoke-Npm @("run", "web")
  }
  { $_ -in @("dev-client", "--dev-client") } {
    Write-Host "Starting Expo in development-client mode."
    Start-Expo @("start", "--dev-client", "--tunnel", "--clear")
  }
  { $_ -in @("export-web", "--export-web") } {
    Start-Expo @("export", "--platform", "web")
  }
  { $_ -in @("doctor", "--doctor") } {
    Invoke-Npx @("expo-doctor")
  }
  { $_ -in @("help", "--help", "-h") } {
    Show-Usage
  }
  default {
    Show-Usage
    exit 2
  }
}
