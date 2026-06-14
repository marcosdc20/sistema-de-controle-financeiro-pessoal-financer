Write-Host "A Preparar o VukaPay Web..." -ForegroundColor Cyan
npm run build

Write-Host "`nA Enviar para a Nuvem da Google (Firebase Hosting)..." -ForegroundColor Cyan
firebase deploy --only hosting

Write-Host "`nSite Web no AR com sucesso! 🚀" -ForegroundColor Green
