// Script para auditar el Supabase real desde .env.local
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) envVars[key.trim()] = value.trim();
});

const SUPABASE_URL = envVars['VITE_SUPABASE_URL'];
const SUPABASE_KEY = envVars['VITE_SUPABASE_SERVICE_ROLE_KEY'];

console.log('='.repeat(80));
console.log('AUDITORÍA DE SUPABASE - PROYECTO REAL');
console.log('='.repeat(80));
console.log(`Project: ${SUPABASE_URL}`);
console.log('');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function auditSupabase() {
  try {
    // 1. Listar todas las tablas con RLS
    console.log('1️⃣  TABLAS Y ESTADO RLS');
    console.log('-'.repeat(80));
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables_with_rls')
      .catch(() => null);
    
    if (tablesError || !tables) {
      // Si la función no existe, usar query SQL directo
      console.log('Intentando consulta SQL directa...');
      const { data, error } = await supabase
        .from('pg_tables')
        .select('*')
        .eq('schemaname', 'public')
        .catch(() => ({data: null}));
      
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log('⚠️  No se pueden listar tablas via API. Necesitaría acceso de base de datos.');
      }
    } else {
      console.log(JSON.stringify(tables, null, 2));
    }

    console.log('\n2️⃣  VERIFICAR DATOS DE EJEMPLO');
    console.log('-'.repeat(80));
    
    // Intentar leer de una tabla conocida
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select('count()', { count: 'exact' })
      .limit(1);
    
    if (casesError) {
      console.log(`Error: ${casesError.message}`);
    } else {
      console.log(`✅ Tabla 'cases' existe y es accesible`);
      if (cases) console.log(`   Primeros registros: ${JSON.stringify(cases, null, 2)}`);
    }

    // Intentar otras tablas
    const tablesToCheck = ['students', 'tenants', 'tenant_profiles', 'case_messages'];
    for (const table of tablesToCheck) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log(`✅ Tabla '${table}' existe`);
      } else {
        console.log(`❌ Tabla '${table}': ${error.message}`);
      }
    }

    console.log('\n3️⃣  FUNCIONES DISPONIBLES');
    console.log('-'.repeat(80));
    const functions = ['current_tenant_id', 'is_platform_admin', 'is_tenant_admin'];
    for (const func of functions) {
      const { data, error } = await supabase
        .rpc(func)
        .catch(e => ({ error: e }));
      
      if (!error) {
        console.log(`✅ Función '${func}()' existe - Resultado: ${JSON.stringify(data)}`);
      }
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

auditSupabase();
