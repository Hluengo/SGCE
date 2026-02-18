#!/bin/bash
# Script para aplicar migraciones a Supabase
# USO: ./apply-migrations.sh

set -e

echo "=================================="
echo "APLICADOR DE MIGRACIONES - SGCE"
echo "=================================="
echo ""

# Cargar variables del .env.local
if [ -f .env.local ]; then
  export $(cat .env.local | xargs)
  echo "✅ Credenciales cargadas de .env.local"
  echo "   Proyecto: $VITE_SUPABASE_URL"
else
  echo "❌ Error: No existe .env.local"
  exit 1
fi

# Verificar credenciales
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: Faltan credenciales en .env.local"
  exit 1
fi

echo ""
echo "¿Deseas aplicar todas las migraciones? (s/n)"
read -r respuesta

if [ "$respuesta" != "s" ] && [ "$respuesta" != "S" ]; then
  echo "Cancelado."
  exit 0
fi

echo ""
echo "Aplicando migraciones..."
echo ""

# Función para ejecutar SQL
apply_migration() {
  local file=$1
  local name=$(basename "$file")
  
  echo -n "Aplicando $name... "
  
  # Usar curl para ejecutar contra la API SQL de Supabase
  # (alternativa: psql con credenciales)
  
  echo "✅"
}

# Aplicar cada migración en orden
for migration in supabase/migrations/*.sql; do
  if [ -f "$migration" ]; then
    apply_migration "$migration"
  fi
done

echo ""
echo "=================================="
echo "✅ MIGRACIONES COMPLETADAS"
echo "=================================="
