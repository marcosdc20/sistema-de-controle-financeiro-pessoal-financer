# Script de Publicação Automática do VukaPay no GitHub Releases e Atualização do Auto-Updater

Write-Host "A Iniciar o processo de publicação no GitHub..." -ForegroundColor Cyan

# 1. Ler a versão do package.json
$packageJson = Get-Content -Raw -Path "package.json" | ConvertFrom-Json
$version = $packageJson.version
$tagName = "v$version"

Write-Host "Versão detetada: $tagName" -ForegroundColor Yellow

# 2. Caminhos dos ficheiros gerados
$msiPath = Get-ChildItem -Path "src-tauri\target\release\bundle\msi" -Filter "*$version*.msi" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$exePath = Get-ChildItem -Path "src-tauri\target\release\bundle\nsis" -Filter "*$version*.exe" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$sigExePath = Get-ChildItem -Path "src-tauri\target\release\bundle\nsis" -Filter "*$version*.exe.sig" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

$apkPath = "src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release.apk"

# Verificar se os ficheiros existem
$filesToUpload = @()
if ($msiPath) { $filesToUpload += $msiPath.FullName }
if ($exePath) { $filesToUpload += $exePath.FullName }
if ($sigExePath) { $filesToUpload += $sigExePath.FullName }
if (Test-Path $apkPath) { $filesToUpload += $apkPath }

if ($filesToUpload.Count -eq 0) {
    Write-Host "ERRO: Nenhum ficheiro da versão $version foi encontrado." -ForegroundColor Red
    exit 1
}

# 3. Atualizar o ficheiro updater.json
Write-Host "`nA atualizar o updater.json automaticamente..." -ForegroundColor Cyan

if (-not $sigExePath -or -not $exePath) {
    Write-Host "ERRO: Falta o instalador .exe ou a assinatura .sig para o updater!" -ForegroundColor Red
    exit 1
}

$signatureContent = Get-Content -Raw -Path $sigExePath.FullName
$exeFileName = $exePath.Name

$updaterContent = @"
{
  "version": "$version",
  "notes": "Nova versão do VukaPay ($version) disponivel. Instala para receber as novas funcionalidades e correções.",
  "pub_date": "$(Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")",
  "platforms": {
    "windows-x86_64": {
      "signature": "$signatureContent",
      "url": "https://github.com/marcosdc20/sistema-de-controle-financeiro-pessoal-financer/releases/download/$tagName/$exeFileName"
    },
    "android-aarch64": {
      "url": "https://github.com/marcosdc20/sistema-de-controle-financeiro-pessoal-financer/releases/download/$tagName/app-universal-release.apk"
    }
  }
}
"@

$updaterContent | Set-Content "updater.json"
Write-Host "updater.json atualizado. A enviar para o GitHub (main)..." -ForegroundColor Yellow
git add updater.json
git commit -m "chore: atualizar updater.json para $tagName"
git push

# 4. Publicar no GitHub Releases
Write-Host "`nA preparar para publicar $tagName no GitHub Releases..." -ForegroundColor Cyan

$releaseNotes = "Atualização Oficial do VukaPay - Versão $tagName`n`nNovidades:`n- Integração Completa da Comunidade e Desafios.`n- Correção do APK Android e do Sistema de Atualização Automática."
$filesArgs = $filesToUpload -join " "
$releaseExists = (gh release view $tagName 2>&1) -match "title"

if ($releaseExists) {
    Write-Host "A fazer upload dos ficheiros para a release existente..." -ForegroundColor Yellow
    Invoke-Expression "gh release upload $tagName $filesArgs --clobber"
    Write-Host "A publicar a release (removendo estado de rascunho/draft)..." -ForegroundColor Yellow
    Invoke-Expression "gh release edit $tagName --draft=false"
} else {
    Write-Host "A criar nova release $tagName..." -ForegroundColor Yellow
    Invoke-Expression "gh release create $tagName --title `"VukaPay $tagName`" --notes `"$releaseNotes`" $filesArgs"
}

Write-Host "`nPROCESSO CONCLUÍDO! O Auto-Updater já está 100% funcional para todos os utilizadores! 🚀" -ForegroundColor Green
