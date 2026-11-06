param([switch]$TrocarChave)

$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT' -or -not $env:LOCALAPPDATA) {
    throw 'Use este inicializador no Windows.'
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Instale e abra o Docker Desktop no modo Linux containers.'
}

$repoDir = Split-Path -Parent $PSScriptRoot
$secretsDir = Join-Path $env:LOCALAPPDATA 'MedicinaDemocraticaStudio'
$geminiPath = Join-Path $secretsDir 'gemini.clixml'
$tokenPath = Join-Path $secretsDir 'studio.clixml'
New-Item -ItemType Directory -Path $secretsDir -Force | Out-Null

function Save-StudioSecret([string]$Name, [securestring]$Value, [string]$Path) {
    $credential = [PSCredential]::new($Name, $Value)
    $temporary = "$Path.$([guid]::NewGuid().ToString('N')).tmp"
    try {
        $credential | Export-Clixml -LiteralPath $temporary
        Move-Item -LiteralPath $temporary -Destination $Path -Force
    } finally {
        if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary -Force }
    }
}

$recreate = $TrocarChave.IsPresent
if ($TrocarChave -or -not (Test-Path -LiteralPath $geminiPath)) {
    $gemini = Read-Host 'Chave Gemini do projeto Free Tier (Enter para usar WAV)' -AsSecureString
    if ($gemini.Length -gt 0) {
        Save-StudioSecret 'Gemini' $gemini $geminiPath
        $recreate = $true
    } elseif ($TrocarChave) {
        throw 'Informe uma nova chave para atualizar o cadastro.'
    }
}

if (-not (Test-Path -LiteralPath $tokenPath)) {
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    $token = [BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
    Save-StudioSecret 'Studio' (ConvertTo-SecureString $token -AsPlainText -Force) $tokenPath
    $recreate = $true
}

$studioCredential = Import-Clixml -LiteralPath $tokenPath
$geminiKey = ' '
if (Test-Path -LiteralPath $geminiPath) {
    $geminiCredential = Import-Clixml -LiteralPath $geminiPath
    $geminiKey = $geminiCredential.GetNetworkCredential().Password
}

$composeFile = Join-Path $repoDir 'compose.yaml'
$composeArgs = @('--context', 'desktop-linux', 'compose', '-f', $composeFile, 'up', '--build', '--wait', '--wait-timeout', '90')
if ($recreate) { $composeArgs += '--force-recreate' }

$previousGemini = $env:GEMINI_API_KEY
$previousToken = $env:STUDIO_API_TOKEN
try {
    $env:GEMINI_API_KEY = $geminiKey
    $env:STUDIO_API_TOKEN = $studioCredential.GetNetworkCredential().Password
    & docker @composeArgs
    if ($LASTEXITCODE -ne 0) { throw 'O Docker nao iniciou o estudio. Confira se o Docker Desktop esta aberto.' }
    Write-Host "Chave de acesso ao formulario  $env:STUDIO_API_TOKEN"
} finally {
    $env:GEMINI_API_KEY = $previousGemini
    $env:STUDIO_API_TOKEN = $previousToken
}
Start-Process 'http://127.0.0.1:8787'
