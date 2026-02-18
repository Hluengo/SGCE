# Script para aplicar migraciones a Supabase (PowerShell)
# USO: .\apply-migrations.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "APLICADOR DE MIGRACIONES - SGCE" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Cargar variables del .env.local
$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
  Write-Host "❌ Error: No existe .env.local" -ForegroundColor Red
  exit 1
}

$envVars = @{}
Get-Content $envFile | ForEach-Object {
  if ($_ -match '(.+?)=(.*)') {
    $envVars[$matches[1]] = $matches[2]
  }
}

$SUPABASE_URL = $envVars['VITE_SUPABASE_URL']
$SUPABASE_KEY = $envVars['VITE_SUPABASE_SERVICE_ROLE_KEY']

Write-Host "✅ Credenciales cargadas de .env.local" -ForegroundColor Green
Write-Host "   Proyecto: $SUPABASE_URL" -ForegroundColor Gray
Write-Host ""

if (-not $SUPABASE_URL -or -not $SUPABASE_KEY) {
  Write-Host "❌ Error: Faltan credenciales en .env.local" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "ADVERTENCIA: Esto aplicará TODAS las migraciones (35 archivos)" -ForegroundColor Yellow
Write-Host "¿Deseas continuar? (S/n)" -ForegroundColor Yellow
$respuesta = Read-Host

if ($respuesta -eq "n" -or $respuesta -eq "N") {
  Write-Host "Cancelado."
  exit 0
}

Write-Host ""
Write-Host "Listando migraciones a aplicar..." -ForegroundColor Cyan
Write-Host ""

$migrations = @(Get-ChildItem "supabase/migrations/*.sql" | Sort-Object Name)

if ($migrations.Count -eq 0) {
  Write-Host "❌ Error: No hay migraciones en supabase/migrations/" -ForegroundColor Red
  exit 1
}

Write-Host "Encontradas $($migrations.Count) migraciones:" -ForegroundColor Green
$migrations | ForEach-Object {
  Write-Host "  ☐ $($_.Name)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "OPCIONES PARA APLICAR MIGRACIONES" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opción A: Usar Supabase CLI" -ForegroundColor Yellow
Write-Host "  1. npm install -g supabase" -ForegroundColor Gray
Write-Host "  2. supabase link --project-ref pfvrgrwlxbqiwatcaoop" -ForegroundColor Gray
Write-Host "  3. supabase db push" -ForegroundColor Gray
Write-Host ""
Write-Host "Opción B: Ejecutar manualmente en SQL Editor" -ForegroundColor Yellow
Write-Host "  1. Ve a: https://app.supabase.com" -ForegroundColor Gray
Write-Host "  2. Selecciona proyecto: pfvrgrwlxbqiwatcaoop" -ForegroundColor Gray
Write-Host "  3. SQL Editor > Abre cada archivo en orden" -ForegroundColor Gray
Write-Host ""
Write-Host "Opción C: Usar script automático (PowerShell)" -ForegroundColor Yellow
Write-Host "  (En desarrollo - usar Opción A o B por ahora)" -ForegroundColor Gray
Write-Host ""
Write-Host "RECOMENDACIÓN: Usa la Opción A con Supabase CLI" -ForegroundColor Cyan
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Documento completo en: docs/DIAGNOSTICO_PROYECTO_VACIO.md" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
