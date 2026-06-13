$env:TAURI_SIGNING_PRIVATE_KEY="C:\Users\narci\Pictures\sistema\sistema-de-controle-financeiro-pessoal-financer\src-tauri\vukapay-2026.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD="VukaPayAdmin2026!"

$env:ANDROID_HOME="C:\Users\narci\AppData\Local\Android\Sdk"
$env:NDK_HOME="C:\Users\narci\AppData\Local\Android\Sdk\ndk\30.0.14904198"

# Novas variáveis da chave Android (Para evitar o erro "App não instalada")
$env:TAURI_ANDROID_KEYSTORE="C:\Users\narci\Pictures\sistema\sistema-de-controle-financeiro-pessoal-financer\src-tauri\vukapay-android.jks"
$env:TAURI_ANDROID_KEYSTORE_PASSWORD="VukaPayAdmin2026!"
$env:TAURI_ANDROID_KEY_ALIAS="vukapay"
$env:TAURI_ANDROID_KEY_PASSWORD="VukaPayAdmin2026!"

Write-Host "Compilando versões Desktop (Windows)..." -ForegroundColor Cyan
npm run tauri build

Write-Host "`nCompilando versão Android (APK com Assinatura Segura)..." -ForegroundColor Cyan
npm run tauri android build -- --apk
