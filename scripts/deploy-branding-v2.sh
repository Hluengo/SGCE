#!/bin/bash
# deploy-branding-v2.sh
# Script para desplegar la solución de branding storage RLS (v2)
#
# USO:
#   bash scripts/deploy-branding-v2.sh
#
# Este script:
# 1. ✅ Valida que el proyecto esté limpio (git)
# 2. ✅ Ejecuta builds de TypeScript
# 3. ✅ Muestra instrucciones para aplicar migraciones en Supabase
# 4. ✅ Despliega el frontend

set -e  # Salir si hay error

echo "========================================="
echo "  BRANDING STORAGE RLS v2 - Deployment"
echo "========================================="
echo ""

# Paso 1: Validar status de git
echo "📋 Paso 1: Validar estado del repositorio..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Hay cambios sin commitear:"
    git status --short
    echo ""
    read -p "¿Continuar? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "❌ Deployment cancelado"
        exit 1
    fi
fi

# Paso 2: Build TypeScript
echo ""
echo "🔨 Paso 2: Compilar TypeScript..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build exitoso"
else
    echo "❌ Build falló"
    exit 1
fi

# Paso 3: Validar migraciones
echo ""
echo "📋 Paso 3: Validar archivos de migración..."
if [ ! -f "supabase/migrations/032_tenant_branding.sql" ]; then
    echo "❌ Falta: supabase/migrations/032_tenant_branding.sql"
    exit 1
fi
if [ ! -f "supabase/migrations/033_setup_branding_storage.sql" ]; then
    echo "❌ Falta: supabase/migrations/033_setup_branding_storage.sql"
    exit 1
fi
echo "✅ Migraciones presentes"

# Paso 4: Imprimir instrucciones de Supabase
echo ""
echo "========================================="
echo "  SIGUIENTE: Aplicar Migraciones"
echo "========================================="
echo ""
echo "📌 Ir a: Supabase Dashboard > SQL Editor"
echo ""
echo "1️⃣  Copiar y ejecutar MIGRATION 032:"
echo ""
cat supabase/migrations/032_tenant_branding.sql | head -50
echo ""
echo "    [... continúa en archivo 032_tenant_branding.sql ...]"
echo ""
echo ""
echo "2️⃣  Copiar y ejecutar MIGRATION 033:"
echo ""
cat supabase/migrations/033_setup_branding_storage.sql
echo ""
echo ""

# Paso 5: Instrucciones de validación
echo "========================================="
echo "  VALIDACIÓN"
echo "========================================="
echo ""
echo "Después de aplicar las migraciones, ejecuta en SQL Editor:"
echo ""
echo "-- Verificar tabla configuracion_branding"
echo "SELECT COUNT(*) FROM configuracion_branding;"
echo ""
echo "-- Verificar bucket storage"
echo "SELECT * FROM storage.buckets WHERE id = 'branding-assets';"
echo ""
echo "-- Verificar RLS policies"
echo "SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE 'branding%';"
echo ""
echo ""

# Paso 6: Instrucciones de testing
echo "========================================="
echo "  TESTING"
echo "========================================="
echo ""
echo "📋 Checklist de Testing:"
echo ""
echo "  [ ] Login como SUPERADMIN"
echo "  [ ] Ir a Admin > Colegios"
echo "  [ ] Hacer click en botón 🎨 (Palette)"
echo "  [ ] Descargar logo de prueba:"
echo "      curl -o test-logo.png 'https://via.placeholder.com/200/0000FF/FFFFFF?text=Logo'"
echo "  [ ] Subir logo (< 5MB, PNG/JPEG/GIF/WebP/SVG)"
echo "  [ ] Verificar: Archivo en Supabase Storage"
echo "  [ ] Verificar: URL pública funciona"
echo "  [ ] Verificar: Imagen aparece en formulario"
echo "  [ ] Click 'Guardar'"
echo "  [ ] Recargar página: Logo persiste"
echo ""
echo "📊 Ver logs en: F12 > Console"
echo ""
echo ""

# Paso 7: Despliegue de frontend
echo "========================================="
echo "  DESPLIEGUE DE FRONTEND"
echo "========================================="
echo ""
echo "⏳ Opciones:"
echo ""
echo "  a) npm run dev      (desarrollo local)"
echo "  b) npm run preview  (preview de build)"
echo "  c) npm deploy       (desplegar a producción)"
echo ""
read -p "¿Qué opción deseas? (a/b/c) " -n 1 -r
echo

case $REPLY in
    a)
        echo "🚀 Iniciando dev server..."
        npm run dev
        ;;
    b)
        echo "🚀 Iniciando preview..."
        npm run preview
        ;;
    c)
        echo "🚀 Desplegando a producción..."
        npm run deploy
        ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment completo!"
echo ""
echo "Documentación: docs/BRANDING_STORAGE_FIX_v2.md"
echo "Testing Plan: docs/BRANDING_TESTING_PLAN.md"
echo ""
