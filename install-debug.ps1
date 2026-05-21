# Script para instalar APK de debug no emulador/celular

Write-Host "IBV APP - Debug Installer" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

$apkPath = ".\android\app\build\outputs\apk\debug\app-debug.apk"

if (-not (Test-Path $apkPath)) {
    Write-Host "❌ APK não encontrado em: $apkPath" -ForegroundColor Red
    Write-Host "Execute primeiro: npm run build:mobile" -ForegroundColor Yellow
    exit 0 # Exit safely to avoid Node.js crash
}

Write-Host "✅ APK encontrado: $apkPath" -ForegroundColor Green
Write-Host ""

# Verificar se adb está disponível
$adbPath = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk\platform-tools\adb.exe"

if (-not (Test-Path $adbPath)) {
    Write-Host "❌ ADB não encontrado no caminho padrão!" -ForegroundColor Red
    # Tenta encontrar adb no PATH
    $adbPath = (Get-Command adb.exe -ErrorAction SilentlyContinue).Source
    if (-not $adbPath) {
        Write-Host "Certifique-se que o Android SDK está instalado." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "Listando dispositivos conectados..."
$devices = & $adbPath devices | Select-String -Pattern "\tdevice$"

if (-not $devices) {
    Write-Host ""
    Write-Host "⚠️ NENHUM DISPOSITIVO OU EMULADOR ENCONTRADO!" -ForegroundColor Yellow
    Write-Host "1. Conecte seu celular via USB (com Depuração USB ativa)" -ForegroundColor Gray
    Write-Host "2. OU abra um emulador no Android Studio" -ForegroundColor Gray
    Write-Host ""
    exit 0 # Exit safely
}

Write-Host "✅ Dispositivo detectado!" -ForegroundColor Green
Write-Host ""
Write-Host "Instalando app..." -ForegroundColor Cyan
& $adbPath install -r $apkPath

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ App instalado com sucesso!" -ForegroundColor Green
    Write-Host "Abra o 'IBV APP' no seu Android." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Erro durante a instalação (ADB Error Code: $LASTEXITCODE)" -ForegroundColor Red
}
