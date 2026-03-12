param(
  [ValidateSet('start', 'stop', 'status')]
  [string]$Action = 'status'
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir '..')).Path
$runtimeDir = Join-Path $repoRoot '.runtime'
$logDir = Join-Path $repoRoot 'logs\dev-background'

New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

$services = @(
  @{
    Name = 'backend'
    Port = 4310
    Command = 'node'
    Arguments = @('backend/src/server.js')
    WorkingDirectory = $repoRoot
    ReadyUrl = 'http://127.0.0.1:4310/api/health'
    PidFile = Join-Path $runtimeDir 'backend.pid'
    StdOut = Join-Path $logDir 'backend.out.log'
    StdErr = Join-Path $logDir 'backend.err.log'
  },
  @{
    Name = 'frontend'
    Port = 5173
    Command = 'node'
    Arguments = @(
      '..\node_modules\vite\bin\vite.js',
      '--host',
      '127.0.0.1',
      '--port',
      '5173'
    )
    WorkingDirectory = Join-Path $repoRoot 'frontend'
    ReadyUrl = 'http://127.0.0.1:5173'
    PidFile = Join-Path $runtimeDir 'frontend.pid'
    StdOut = Join-Path $logDir 'frontend.out.log'
    StdErr = Join-Path $logDir 'frontend.err.log'
  }
)

function Get-ListenerByPort {
  param([int]$Port)

  return Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1
}

function Get-TrackedPid {
  param($Service)

  if (-not (Test-Path $Service.PidFile)) {
    return $null
  }

  $rawPid = (Get-Content $Service.PidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
  $parsedPid = 0
  if ([int]::TryParse([string]$rawPid, [ref]$parsedPid)) {
    return $parsedPid
  }

  return $null
}

function Write-TrackedPid {
  param($Service, [int]$ProcessId)

  Set-Content -Path $Service.PidFile -Value $ProcessId -Encoding ascii
}

function Remove-TrackedPid {
  param($Service)

  if (Test-Path $Service.PidFile) {
    Remove-Item $Service.PidFile -Force
  }
}

function Wait-ForReady {
  param($Service, [int]$TimeoutSeconds = 20)

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $Service.ReadyUrl -TimeoutSec 2
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    } catch {
      Start-Sleep -Milliseconds 500
      continue
    }

    Start-Sleep -Milliseconds 500
  }

  return $false
}

function Get-StatusRow {
  param($Service)

  $listener = Get-ListenerByPort -Port $Service.Port
  $processId = if ($listener) { $listener.OwningProcess } else { Get-TrackedPid -Service $Service }

  return [pscustomobject]@{
    Name = $Service.Name
    Port = $Service.Port
    Running = [bool]$listener
    Pid = $processId
    Url = $Service.ReadyUrl
    StdOut = $Service.StdOut
    StdErr = $Service.StdErr
  }
}

function Start-ServiceInBackground {
  param($Service)

  $existing = Get-ListenerByPort -Port $Service.Port
  if ($existing) {
    Write-TrackedPid -Service $Service -Pid $existing.OwningProcess
    Write-Output ("{0} already running on port {1} (PID {2})." -f $Service.Name, $Service.Port, $existing.OwningProcess)
    return
  }

  if (Test-Path $Service.StdOut) {
    Remove-Item $Service.StdOut -Force
  }

  if (Test-Path $Service.StdErr) {
    Remove-Item $Service.StdErr -Force
  }

  $process = Start-Process `
    -FilePath $Service.Command `
    -ArgumentList $Service.Arguments `
    -WorkingDirectory $Service.WorkingDirectory `
    -RedirectStandardOutput $Service.StdOut `
    -RedirectStandardError $Service.StdErr `
    -WindowStyle Hidden `
    -PassThru

  Write-TrackedPid -Service $Service -Pid $process.Id

  if (-not (Wait-ForReady -Service $Service)) {
    $stderrTail = if (Test-Path $Service.StdErr) {
      (Get-Content $Service.StdErr -ErrorAction SilentlyContinue | Select-Object -Last 10) -join [Environment]::NewLine
    } else {
      ''
    }

    throw ("{0} failed to become ready. Log tail:`n{1}" -f $Service.Name, $stderrTail)
  }

  $listener = Get-ListenerByPort -Port $Service.Port
  if ($listener) {
    Write-TrackedPid -Service $Service -Pid $listener.OwningProcess
    Write-Output ("Started {0} on port {1} (PID {2})." -f $Service.Name, $Service.Port, $listener.OwningProcess)
  }
}

function Stop-ServiceInBackground {
  param($Service)

  $pids = New-Object System.Collections.Generic.HashSet[int]
  $listener = Get-ListenerByPort -Port $Service.Port
  if ($listener) {
    [void]$pids.Add([int]$listener.OwningProcess)
  }

  $trackedPid = Get-TrackedPid -Service $Service
  if ($trackedPid) {
    [void]$pids.Add([int]$trackedPid)
  }

  if ($pids.Count -eq 0) {
    Remove-TrackedPid -Service $Service
    Write-Output ("{0} is not running." -f $Service.Name)
    return
  }

  foreach ($processId in $pids) {
    try {
      Stop-Process -Id $processId -Force -ErrorAction Stop
      Write-Output ("Stopped {0} (PID {1})." -f $Service.Name, $processId)
    } catch {
      Write-Output ("Failed to stop {0} (PID {1}): {2}" -f $Service.Name, $processId, $_.Exception.Message)
    }
  }

  Start-Sleep -Milliseconds 500
  Remove-TrackedPid -Service $Service
}

switch ($Action) {
  'start' {
    foreach ($service in $services) {
      Start-ServiceInBackground -Service $service
    }

    $services | ForEach-Object { Get-StatusRow -Service $_ } | Format-Table -AutoSize
  }
  'stop' {
    foreach ($service in $services) {
      Stop-ServiceInBackground -Service $service
    }
  }
  'status' {
    $services | ForEach-Object { Get-StatusRow -Service $_ } | Format-Table -AutoSize
  }
}
