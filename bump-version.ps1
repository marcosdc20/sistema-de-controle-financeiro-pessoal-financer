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

Write-Host "`nPróximos passos recomendados:" -ForegroundColor Cyan
Write-Host "1. Faça commit das alterações: git commit -am 'bump: versao $newVersion'"
Write-Host "2. Envie para o GitHub: git push"
Write-Host "3. Crie e envie a tag para o build automático: git tag v$newVersion; git push origin v$newVersion"
