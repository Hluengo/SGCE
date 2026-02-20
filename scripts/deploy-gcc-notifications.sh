#!/bin/bash

# =============================================================================
# Script: deploy-gcc-notifications.sh
# =============================================================================
# Despliega la Edge Function de notificaciones GCC
# 
# Uso: ./scripts/deploy-gcc-notifications.sh
# =============================================================================

set -e

echo "=========================================="
echo "🚀 Desplegando GCC Notifications"
echo "=========================================="

# Verificar que Supabase CLI esté instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI no está instalado"
    echo "   Instala con: npm install -g supabase"
    exit 1
fi

# Verificar que we're in the right directory
if [ ! -d "supabase" ]; then
    echo "❌ Error: No se encontró el directorio supabase/"
    exit 1
fi

# Deploy the function
echo "📦 Desplegando función..."
supabase functions deploy gcc-notifications

# Verify deployment
echo "✅ Verificando despliegue..."
supabase functions list | grep gcc-notifications

echo ""
echo "=========================================="
echo "✅ Despliegue completado"
echo "=========================================="
echo ""
echo "📋 Configuración de webhook:"
echo "   Para ejecutar automáticamente, configura un cron job:"
echo "   supabase functions serve gcc-notifications"
echo ""
echo "🔔 La función puede ejecutarse manualmente con:"
echo "   curl -X POST https://[PROJECT_REF].supabase.co/functions/v1/gcc-notifications"
echo "   -H \"Authorization: Bearer [ANON_KEY]\""
echo "   -H \"Content-Type: application/json\""
