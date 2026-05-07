# Push canónico → GitHub → Vercel (deploy automático si el proyecto está conectado).
# Ejecutar en PowerShell desde Cursor:  .\scripts\push-production.ps1
# Requisitos: git instalado, remoto origin configurado, sesión GitHub (credential helper / SSH).

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $RepoRoot

Write-Host "== AXYNTRAX_AUTOMATION_Suite → git push ==" -ForegroundColor Cyan
Write-Host "Ruta: $RepoRoot"

git add -A
$pending = git status --porcelain
if (-not $pending) {
  Write-Host "No hay cambios para commitear." -ForegroundColor Yellow
  exit 0
}

$msg = "chore: landing operativa — API health, leads Supabase, descargas, webhook WhatsApp"
git commit -m $msg
if ($LASTEXITCODE -ne 0) {
  Write-Host "git commit falló (¿email/user.name de git?)." -ForegroundColor Red
  exit $LASTEXITCODE
}

git push
if ($LASTEXITCODE -ne 0) {
  Write-Host "git push falló — revisá remoto, rama y autenticación GitHub." -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Push OK. Cuando Vercel termine el deploy, probá:" -ForegroundColor Green
Write-Host "  https://www.axyntrax-automation.net/api/health"
Write-Host "  https://www.axyntrax-automation.net/api/installer"
Write-Host ""
Write-Host "Recordatorio (solo vos en el navegador):" -ForegroundColor Yellow
Write-Host "  • Supabase → SQL Editor → pegar y ejecutar scripts/supabase-leads-web.sql"
Write-Host "  • Vercel → Settings → Environment Variables: SUPABASE_URL, SUPABASE_ANON_KEY, WHATSAPP_TOKEN (opcional), META_VERIFY_TOKEN=Axyntrax_2026_Secure (mismo valor que en Meta), GEMINI_API_KEY (Google AI — mismo nombre que axia_logic.py; alias GOOGLE_API_KEY)"
