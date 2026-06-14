# ============================================================
#  VukaPay — Script de Build e Empacotamento
#  Uso: .\build-release.ps1
#  Opcoes:
#    .\build-release.ps1 -SkipAndroid   (so compila Windows)
#    .\build-release.ps1 -SkipWindows   (so compila Android)
# ============================================================

param(
    [switch]$SkipAndroid,
    [switch]$SkipWindows
)

# ── Cabecalho ────────────────────────────────────────────────
Clear-Host
Write-Host ""
Write-Host "  ██╗   ██╗██╗   ██╗██╗  ██╗ █████╗ ██████╗  █████╗ ██╗   ██╗" -ForegroundColor Cyan
Write-Host "  ██║   ██║██║   ██║██║ ██╔╝██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝" -ForegroundColor Cyan
Write-Host "  ██║   ██║██║   ██║█████╔╝ ███████║██████╔╝███████║ ╚████╔╝ " -ForegroundColor Cyan
Write-Host "  ╚██╗ ██╔╝██║   ██║██╔═██╗ ██╔══██║██╔═══╝ ██╔══██║  ╚██╔╝  " -ForegroundColor Cyan
Write-Host "   ╚████╔╝ ╚██████╔╝██║  ██╗██║  ██║██║     ██║  ██║   ██║   " -ForegroundColor Cyan
Write-Host "    ╚═══╝   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝   ╚═╝   " -ForegroundColor Cyan
Write-Host ""
Write-Host "  BUILD AND RELEASE AUTOMATICO" -ForegroundColor Yellow
Write-Host "  ─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ── Validar que estamos na pasta certa ───────────────────────
if (-not (Test-Path "package.json")) {
    Write-Host "  [ERRO] Executa este script a partir da raiz do projeto VukaPay." -ForegroundColor Red
    exit 1
}

# ── Ler versao atual ─────────────────────────────────────────
$pkg = Get-Content -Raw "package.json" | ConvertFrom-Json
$version = $pkg.version
Write-Host "  Versao detectada: v$version" -ForegroundColor White

# ── Configurar variaveis de ambiente de assinatura ───────────
Write-Host ""
Write-Host "  [1/4] A configurar chaves de assinatura..." -ForegroundColor Cyan

# Chave privada Windows (gerada com: npx @tauri-apps/cli signer generate)
$privateKeyPath = "src-tauri\vukapay-2026.key"
if (-not (Test-Path $privateKeyPath)) {
    Write-Host "  [AVISO] Chave privada nao encontrada em: $privateKeyPath" -ForegroundColor Yellow
    Write-Host "  Gera a chave com: npm run tauri -- signer generate -w C:\Users\narci\.tauri\vukapay.key" -ForegroundColor DarkGray
    $continuar = Read-Host "  Continuar sem assinatura? (s/n)"
    if ($continuar -ne "s" -and $continuar -ne "S") { exit 1 }
} else {
    $env:TAURI_SIGNING_PRIVATE_KEY = (Get-Content $privateKeyPath -Raw).Trim()
    $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "VukaPayAdmin2026!"
    Write-Host "  Chave privada carregada com sucesso a partir de: $privateKeyPath" -ForegroundColor Green
}

# Android
$env:ANDROID_HOME      = "C:\Users\narci\AppData\Local\Android\Sdk"
$env:NDK_HOME          = "C:\Users\narci\AppData\Local\Android\Sdk\ndk\30.0.14904198"

$androidKeystorePath = "src-tauri\vukapay-android.jks"
if (Test-Path $androidKeystorePath) {
    $env:TAURI_ANDROID_KEYSTORE          = (Resolve-Path $androidKeystorePath).Path
    $env:TAURI_ANDROID_KEYSTORE_PASSWORD = "VukaPayAdmin2026!"
    $env:TAURI_ANDROID_KEY_ALIAS         = "vukapay"
    $env:TAURI_ANDROID_KEY_PASSWORD      = "VukaPayAdmin2026!"
}

$startTime = Get-Date

# ── Compilar Windows ─────────────────────────────────────────
if (-not $SkipWindows) {
    Write-Host ""
    Write-Host "  [2/4] A compilar versao Windows (NSIS + MSI)..." -ForegroundColor Cyan
    Write-Host "  Isto pode demorar alguns minutos. Por favor aguarde..." -ForegroundColor DarkGray
    Write-Host ""

    npm run tauri build

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "  [ERRO] O build Windows falhou com codigo $LASTEXITCODE." -ForegroundColor Red
        Write-Host "  Verifica os erros acima e tenta novamente." -ForegroundColor Yellow
        exit $LASTEXITCODE
    }

    Write-Host ""
    Write-Host "  Build Windows concluido com sucesso!" -ForegroundColor Green

    # Localizar ficheiros gerados
    $nsisExe = Get-ChildItem -Path "src-tauri\target\release\bundle\nsis" -Filter "*.exe" -ErrorAction SilentlyContinue |
               Sort-Object LastWriteTime -Descending | Select-Object -First 1
    $nsisSig = Get-ChildItem -Path "src-tauri\target\release\bundle\nsis" -Filter "*.exe.sig" -ErrorAction SilentlyContinue |
               Sort-Object LastWriteTime -Descending | Select-Object -First 1
    $msiFile = Get-ChildItem -Path "src-tauri\target\release\bundle\msi" -Filter "*.msi" -ErrorAction SilentlyContinue |
               Sort-Object LastWriteTime -Descending | Select-Object -First 1

    if ($nsisExe) {
        Write-Host "  Instalador NSIS : $($nsisExe.FullName)" -ForegroundColor White
        $tamMB = [math]::Round($nsisExe.Length / 1MB, 1)
        Write-Host "  Tamanho         : ${tamMB} MB" -ForegroundColor DarkGray
    }
    if ($nsisSig) {
        Write-Host "  Assinatura .sig : $($nsisSig.FullName)" -ForegroundColor White
    }
    if ($msiFile) {
        Write-Host "  Instalador MSI  : $($msiFile.FullName)" -ForegroundColor White
    }
}

# ── Compilar Android ─────────────────────────────────────────
if (-not $SkipAndroid) {
    Write-Host ""
    Write-Host "  [3/4] A compilar versao Android (APK Universal)..." -ForegroundColor Cyan
    Write-Host "  Isto pode demorar varios minutos. Por favor aguarde..." -ForegroundColor DarkGray
    Write-Host ""

    npm run tauri android build -- --apk

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "  [AVISO] O build Android falhou com codigo $LASTEXITCODE." -ForegroundColor Yellow
        Write-Host "  O build Windows foi concluido com sucesso. Podes publicar sem o APK." -ForegroundColor DarkGray
    } else {
        $apkPath = "src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release.apk"
        if (Test-Path $apkPath) {
            $tamMBApk = [math]::Round((Get-Item $apkPath).Length / 1MB, 1)
            Write-Host ""
            Write-Host "  Build Android concluido com sucesso!" -ForegroundColor Green
            Write-Host "  APK : $apkPath" -ForegroundColor White
            Write-Host "  Tamanho: ${tamMBApk} MB" -ForegroundColor DarkGray
        }
    }
}

# ── Resumo Final ─────────────────────────────────────────────
$elapsed = [math]::Round(((Get-Date) - $startTime).TotalMinutes, 1)

Write-Host ""
Write-Host "  ════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "   BUILD CONCLUIDO em ${elapsed} minutos!" -ForegroundColor Green
Write-Host "  ════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Proximo passo: executa o script de publicacao:" -ForegroundColor Yellow
Write-Host "  .\publish-firebase.ps1" -ForegroundColor White
Write-Host ""
