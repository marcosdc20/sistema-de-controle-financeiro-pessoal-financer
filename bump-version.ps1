# Script de automação para atualizar versões no VukaPay
$newVersion = Read-Host "Digite a nova versão (ex: 1.0.10)"

if (-not $newVersion) {
    Write-Host "Versão inválida!" -ForegroundColor Red
    exit
}

# 1. Atualizar package.json
$packagePath = "package.json"
if (Test-Path $packagePath) {
    $content = Get-Content $packagePath -Raw | ConvertFrom-Json
    $content.version = $newVersion
    # ConvertTo-Json converts to a JSON string. We set content to it.
    $json = $content | ConvertTo-Json -Depth 100
    # Clean up formatting to match standard spacing
    $json | Set-Content $packagePath
    Write-Host "✓ package.json atualizado para a versão $newVersion" -ForegroundColor Green
}

# 2. Atualizar tauri.conf.json
$tauriPath = "src-tauri/tauri.conf.json"
if (Test-Path $tauriPath) {
    $content = Get-Content $tauriPath -Raw | ConvertFrom-Json
    $content.version = $newVersion
    $json = $content | ConvertTo-Json -Depth 100
    $json | Set-Content $tauriPath
    Write-Host "✓ tauri.conf.json atualizado para a versão $newVersion" -ForegroundColor Green
}

# 3. Nota: DownloadAppModal.tsx busca a versao dinamicamente do updater.json
# Nao e necessario atualizar manualmente — o Firebase serve sempre a versao atual.
Write-Host "  Nota: DownloadAppModal.tsx busca a versao automaticamente do Firebase." -ForegroundColor DarkGray

Write-Host "`nProximos passos recomendados:" -ForegroundColor Cyan
Write-Host "1. Executa o build:   .\build-release.ps1"
Write-Host "2. Publica:           .\publish-firebase.ps1"
Write-Host "3. Commit no GitHub:  git commit -am 'bump: versao $newVersion' && git push"
