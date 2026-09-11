$ErrorActionPreference = 'Stop'

Set-Location $PSScriptRoot

# Always point leaderboard APIs to local repo data.
$env:LEADERBOARD_DIR = (Join-Path $PSScriptRoot 'leaderboard_data')

# Optional probe-analysis paths (set only when they exist).
$curatedMeme = '/Users/zrsion/2025/IdiotBench/results/without_filter/meme'
$hfMeme = '/Users/zrsion/2025/IdiotBench/results_hf_leaderboard/without_filter/meme'
$qtable = '/Users/zrsion/2025/IdiotBench/results/without_filter/question_probe_tables_json/'

if (Test-Path $curatedMeme) { $env:PROBE_CURATED_MEME_DIR = $curatedMeme }
if (Test-Path $hfMeme) { $env:PROBE_HF_MEME_DIR = $hfMeme }
if (Test-Path $qtable) { $env:PROBE_CURATED_QTABLE_DIR = $qtable }

# Kill any existing uvicorn process already listening on port 8010.
$existing = netstat -ano 2>$null |
Select-String '^(\s*)TCP\s+(0\.0\.0\.0|127\.0\.0\.1):8010\s+.*LISTENING\s+(\d+)$' |
ForEach-Object { $_.Matches[0].Groups[3].Value } |
Select-Object -Unique
foreach ($procId in $existing) {
    Stop-Process -Id ([int]$procId) -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped old uvicorn process (PID $procId)"
}

$pythonCandidates = @(
    'c:/python314/python.exe',
    "$PSScriptRoot/../.venv/Scripts/python.exe",
    'python'
)
$pythonExe = $null
foreach ($candidate in $pythonCandidates) {
    $cmd = Get-Command $candidate -ErrorAction SilentlyContinue
    $resolved = if ($cmd) { $cmd.Source } else { $candidate }
    if (Test-Path $resolved -ErrorAction SilentlyContinue) {
        $pythonExe = $resolved
        break
    }
    if ($candidate -eq 'python') { $pythonExe = 'python'; break }
}
Write-Host "Using Python: $pythonExe"
& $pythonExe -m uvicorn app:app --host 127.0.0.1 --port 8010
