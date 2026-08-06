$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $PSScriptRoot
$ReleaseDirectory = Join-Path $Root 'release'

function Write-Step([string]$Message) {
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Require-Command([string]$Name, [string]$InstallMessage) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name bulunamadı. $InstallMessage"
    }
}

try {
    Set-Location $Root
    Require-Command 'node.exe' 'Node.js 22 LTS kurup bilgisayarı yeniden başlatın.'
    Require-Command 'npm.cmd' 'Node.js kurulumu içindeki npm bileşenini etkinleştirin.'

    $NodeVersionText = (& node.exe --version).Trim()
    $NodeMajor = [int](($NodeVersionText -replace '^v', '').Split('.')[0])
    if ($NodeMajor -lt 20) {
        throw "Node.js 20 veya üstü gerekiyor. Mevcut sürüm: $NodeVersionText"
    }

    Write-Host "Odium Launcher Windows EXE Builder" -ForegroundColor Magenta
    Write-Host "Proje: $Root"
    Write-Host "Node.js: $NodeVersionText"

    Write-Step 'Eski release çıktısı temizleniyor'
    if (Test-Path $ReleaseDirectory) {
        Remove-Item $ReleaseDirectory -Recurse -Force
    }

    Write-Step 'Electron ve paketleme bağımlılıkları kuruluyor'
    & npm.cmd config set fund false
    & npm.cmd config set audit false
    & npm.cmd install
    if ($LASTEXITCODE -ne 0) { throw "npm install başarısız oldu: $LASTEXITCODE" }

    Write-Step 'Otomatik kontroller çalıştırılıyor'
    & npm.cmd run check
    if ($LASTEXITCODE -ne 0) { throw "npm run check başarısız oldu: $LASTEXITCODE" }

    Write-Step 'Windows x64 Setup ve Portable EXE oluşturuluyor'
    & npm.cmd run dist:win
    if ($LASTEXITCODE -ne 0) { throw "npm run dist:win başarısız oldu: $LASTEXITCODE" }

    $Setup = Get-ChildItem $ReleaseDirectory -File -Filter '*-Setup.exe' | Select-Object -First 1
    $Portable = Get-ChildItem $ReleaseDirectory -File -Filter '*-Portable.exe' | Select-Object -First 1
    if (-not $Setup) { throw 'NSIS Setup EXE üretilemedi.' }
    if (-not $Portable) { throw 'Portable EXE üretilemedi.' }

    Write-Step 'SHA-256 bütünlük değerleri hesaplanıyor'
    $Executables = @($Setup, $Portable)
    $ChecksumLines = foreach ($File in $Executables) {
        $Hash = (Get-FileHash $File.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        "$Hash  $($File.Name)"
    }
    $ChecksumPath = Join-Path $ReleaseDirectory 'SHA256SUMS.txt'
    $ChecksumLines | Set-Content $ChecksumPath -Encoding UTF8

    Write-Step 'Üretim tamamlandı'
    foreach ($File in $Executables) {
        $SizeMiB = [Math]::Round($File.Length / 1MB, 2)
        Write-Host "  $($File.Name) — $SizeMiB MiB" -ForegroundColor Green
    }
    Write-Host "  SHA256SUMS.txt" -ForegroundColor Green
    Write-Host "`nİlk olarak Portable EXE'yi çalıştırın; ardından Setup EXE kurulum/kaldırma testine geçin." -ForegroundColor Yellow

    Start-Process explorer.exe -ArgumentList $ReleaseDirectory
    exit 0
}
catch {
    Write-Host "`n[HATA] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Komut penceresinin ekran görüntüsünü paylaşın. Sonraki aşamaya geçmeyin." -ForegroundColor Yellow
    exit 1
}
