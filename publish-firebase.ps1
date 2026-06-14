# ============================================================
#  VukaPay — Script de Publicacao no Firebase
#  Uso: .\publish-firebase.ps1
#  Pre-requisito: Executar primeiro .\build-release.ps1
# ============================================================

param(
    [string]$NotasRelease = ""
)

# ── Cabecalho ────────────────────────────────────────────────
Clear-Host
Write-Host ""
Write-Host "  ██╗   ██╗██╗   ██╗██╗  ██╗ █████╗ ██████╗  █████╗ ██╗   ██╗" -ForegroundColor Magenta
Write-Host "  ██║   ██║██║   ██║██║ ██╔╝██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝" -ForegroundColor Magenta
Write-Host "  ██║   ██║██║   ██║█████╔╝ ███████║██████╔╝███████║ ╚████╔╝ " -ForegroundColor Magenta
Write-Host "  ╚██╗ ██╔╝██║   ██║██╔═██╗ ██╔══██║██╔═══╝ ██╔══██║  ╚██╔╝  " -ForegroundColor Magenta
Write-Host "   ╚████╔╝ ╚██████╔╝██║  ██╗██║  ██║██║     ██║  ██║   ██║   " -ForegroundColor Magenta
Write-Host "    ╚═══╝   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝   ╚═╝   " -ForegroundColor Magenta
Write-Host ""
Write-Host "  PUBLICACAO NO FIREBASE — AUTO-UPDATER" -ForegroundColor Yellow
Write-Host "  ─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ── Validar pasta do projeto ──────────────────────────────────
if (-not (Test-Path "package.json")) {
    Write-Host "  [ERRO] Executa este script a partir da raiz do projeto VukaPay." -ForegroundColor Red
    exit 1
}

# ── Ler versao do package.json ───────────────────────────────
$pkg = Get-Content -Raw "package.json" | ConvertFrom-Json
$version = $pkg.version
$pubDate = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")

Write-Host "  Versao : v$version" -ForegroundColor White
Write-Host "  Data   : $pubDate" -ForegroundColor DarkGray
Write-Host ""

# ── [1/6] Localizar ficheiros do build Windows ───────────────
Write-Host "  [1/6] A localizar ficheiros do build..." -ForegroundColor Cyan

$nsisDir = "src-tauri\target\release\bundle\nsis"
$nsisExe = Get-ChildItem -Path $nsisDir -Filter "*.exe" -ErrorAction SilentlyContinue |
           Sort-Object LastWriteTime -Descending | Select-Object -First 1
$nsisSig = Get-ChildItem -Path $nsisDir -Filter "*.exe.sig" -ErrorAction SilentlyContinue |
           Sort-Object LastWriteTime -Descending | Select-Object -First 1

$apkPath = "src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release.apk"
$hasApk  = Test-Path $apkPath

if (-not $nsisExe -or -not $nsisSig) {
    Write-Host ""
    Write-Host "  [ERRO] Instalador Windows (.exe) ou assinatura (.sig) nao encontrados." -ForegroundColor Red
    Write-Host "  Caminho procurado: $nsisDir" -ForegroundColor DarkGray
    Write-Host "  Executa primeiro: .\build-release.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "  Instalador : $($nsisExe.Name)" -ForegroundColor Green
Write-Host "  Assinatura : $($nsisSig.Name)" -ForegroundColor Green
if ($hasApk) {
    Write-Host "  APK Android: $apkPath" -ForegroundColor Green
} else {
    Write-Host "  APK Android: nao encontrado (serao usados links antigos)" -ForegroundColor DarkGray
}

# ── [2/6] Ler assinatura ─────────────────────────────────────
Write-Host ""
Write-Host "  [2/6] A ler assinatura do instalador..." -ForegroundColor Cyan

$signatureContent = (Get-Content -Raw -Path $nsisSig.FullName).Trim()

if (-not $signatureContent) {
    Write-Host "  [ERRO] Ficheiro de assinatura esta vazio." -ForegroundColor Red
    exit 1
}
Write-Host "  Assinatura lida com sucesso." -ForegroundColor Green

# ── [3/6] Fazer upload dos ficheiros para o Firebase Storage ─
Write-Host ""
Write-Host "  [3/6] A fazer upload dos ficheiros para o Firebase Storage..." -ForegroundColor Cyan
Write-Host "  (requer Firebase CLI com permissao de Storage)" -ForegroundColor DarkGray

# Upload do instalador Windows (sempre renomeado para o mesmo nome fixo)
Write-Host "  A enviar instalador Windows..." -ForegroundColor White
npx firebase-tools storage:cp "$($nsisExe.FullName)" "gs://controle-financeiro-pess-45a60.appspot.com/updates/VukaPay_x64-setup.exe" --force 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Windows .exe enviado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "  [AVISO] Nao foi possivel usar Firebase CLI para Storage." -ForegroundColor Yellow
    Write-Host "  Faz o upload MANUAL em: https://console.firebase.google.com/project/controle-financeiro-pess-45a60/storage" -ForegroundColor DarkGray
    Write-Host "  Ficheiro: $($nsisExe.FullName)  ->  updates/VukaPay_x64-setup.exe" -ForegroundColor DarkGray
    Write-Host "  (Prima qualquer tecla para continuar com a publicacao do Hosting...)" -ForegroundColor DarkGray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Upload do APK Android (se existir)
if ($hasApk) {
    Write-Host "  A enviar APK Android..." -ForegroundColor White
    npx firebase-tools storage:cp "$apkPath" "gs://controle-financeiro-pess-45a60.appspot.com/updates/app-universal-release.apk" --force 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  APK Android enviado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "  [AVISO] Upload do APK falhou. Faz o upload manual se necessario." -ForegroundColor Yellow
    }
}

# ── [4/6] Pedir notas de release ─────────────────────────────
Write-Host ""
Write-Host "  [4/6] Notas de release" -ForegroundColor Cyan
if (-not $NotasRelease) {
    Write-Host "  (deixa em branco para usar a mensagem padrao)" -ForegroundColor DarkGray
    $NotasRelease = Read-Host "  Notas desta versao"
}
if (-not $NotasRelease) {
    $NotasRelease = "Versao $version: Melhorias de desempenho, novas funcionalidades e correcoes de bugs. Atualize para a melhor experiencia com o VukaPay."
}

# ── [5/6] Gerar updater.json ─────────────────────────────────
Write-Host ""
Write-Host "  [5/6] A gerar updater.json..." -ForegroundColor Cyan

$updaterJson = @{
    version  = $version
    notes    = $NotasRelease
    pub_date = $pubDate
    platforms = @{
        "windows-x86_64" = @{
            signature = $signatureContent
            url       = "https://firebasestorage.googleapis.com/v0/b/controle-financeiro-pess-45a60.appspot.com/o/updates%2FVukaPay_x64-setup.exe?alt=media"
        }
        "android-aarch64" = @{
            url = "https://firebasestorage.googleapis.com/v0/b/controle-financeiro-pess-45a60.appspot.com/o/updates%2Fapp-universal-release.apk?alt=media"
        }
    }
} | ConvertTo-Json -Depth 5

# Guardar em dois locais:
# 1. updater.json na raiz (sincronizado com o GitHub para Android usar o raw link)
$updaterJson | Set-Content -Encoding UTF8 "updater.json"
Write-Host "  Gerado: updater.json (raiz do projeto)" -ForegroundColor Green

# 2. public/updater.json para ser servido pelo Firebase Hosting
if (-not (Test-Path "public")) { New-Item -ItemType Directory -Path "public" | Out-Null }
$updaterJson | Set-Content -Encoding UTF8 "public/updater.json"
Write-Host "  Gerado: public/updater.json (para Firebase Hosting)" -ForegroundColor Green

# ── [6/6] Publicar no Firebase Hosting ───────────────────────
Write-Host ""
Write-Host "  [6/6] A publicar no Firebase Hosting..." -ForegroundColor Cyan
Write-Host "  (Compilar frontend e fazer deploy do site + updater.json)" -ForegroundColor DarkGray
Write-Host ""

# Compilar o frontend React/Vite
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERRO] O build do frontend falhou." -ForegroundColor Red
    exit 1
}

# Copiar o updater.json para a pasta dist/ (a pasta que o Firebase Hosting serve)
Copy-Item "public/updater.json" "dist/updater.json" -Force
Write-Host "  updater.json copiado para dist/" -ForegroundColor Green

# Fazer deploy no Firebase
npx firebase-tools deploy --only hosting
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERRO] O deploy Firebase falhou." -ForegroundColor Red
    Write-Host "  Verifica se estas autenticado: npx firebase-tools login" -ForegroundColor Yellow
    exit 1
}

# ── Sumario Final ─────────────────────────────────────────────
Write-Host ""
Write-Host "  ════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "   PUBLICACAO CONCLUIDA COM SUCESSO! v$version" -ForegroundColor Green
Write-Host "  ════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  URLs do updater (os clientes serao avisados automaticamente):" -ForegroundColor Yellow
Write-Host "  Firebase : https://controle-financeiro-pess-45a60.web.app/updater.json" -ForegroundColor White
Write-Host "  Backup   : https://raw.githubusercontent.com/marcosdc20/sistema-de-controle-financeiro-pessoal-financer/main/updater.json" -ForegroundColor White
Write-Host ""
Write-Host "  O que acontece agora:" -ForegroundColor Yellow
Write-Host "  - Usuarios com VukaPay aberto serao notificados ao reiniciar o app" -ForegroundColor White
Write-Host "  - O download e instalacao sao feitos automaticamente em segundo plano" -ForegroundColor White
Write-Host ""
Write-Host "  Faz o commit do updater.json atualizado:" -ForegroundColor DarkGray
Write-Host "  git add updater.json; git commit -m `"release: v$version`"; git push" -ForegroundColor DarkGray
Write-Host ""
