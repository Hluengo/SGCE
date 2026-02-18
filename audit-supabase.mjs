// Script para auditar el Supabase real desde .env.local (ES Module)
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    console.log('1️⃣  VERIFICAR CONEXIÓN Y DATOS DE EJEMPLO');
    console.log('-'.repeat(80));
    
    // Intentar leer de tabla cases (la más importante)
    const { data: cases, error: casesError, count: casesCount } = await supabase
      .from('cases')
      .select('id, tenant_id, student_id, status, created_at', { count: 'exact' })
      .limit(5);
    
    if (casesError) {
      console.log(`❌ Error al leer tabla 'cases': ${casesError.message}`);
    } else {
      console.log(`✅ Tabla 'cases' existe - Total registros: ${casesCount}`);
      if (cases && cases.length > 0) {
        console.log(`   Primeros registros:`);
        cases.forEach((c, i) => {
          console.log(`   ${i+1}. ID: ${c.id}, Tenant: ${c.tenant_id}, Student: ${c.student_id}, Status: ${c.status}`);
        });
      }
    }

    console.log('\n2️⃣  VERIFICAR OTRAS TABLAS CRÍTICAS');
    console.log('-'.repeat(80));
    
    const tablesToCheck = [
      { name: 'students', select: 'id, tenant_id, first_name, rut' },
      { name: 'tenants', select: 'id, slug, name, is_active' },
      { name: 'tenant_profiles', select: 'id, tenant_id, role, is_active' },
      { name: 'case_messages', select: 'id, case_id, tenant_id, created_at' },
      { name: 'case_followups', select: 'id, case_id, process_stage, due_date' },
      { name: 'conduct_catalog', select: 'conduct_type, conduct_category' },
      { name: 'conduct_types', select: 'key, label' }
    ];

    for (const table of tablesToCheck) {
      const { data, error, count } = await supabase
        .from(table.name)
        .select(table.select, { count: 'exact' })
        .limit(1);
      
      if (!error) {
        console.log(`✅ '${table.name}' - ${count} registros totales`);
        if (data && data.length > 0) {
          console.log(`   Ejemplo: ${JSON.stringify(data[0])}`);
        }
      } else {
        console.log(`❌ '${table.name}': ${error.message}`);
      }
    }

    console.log('\n3️⃣  VERIFICAR TRIGGERS Y FUNCIONES');
    console.log('-'.repeat(80));
    
    // Probar funciones RLS
    const { data: tenantId, error: tenantError } = await supabase
      .rpc('current_tenant_id')
      .catch(e => ({ data: null, error: e }));
    
    if (!tenantError && tenantId) {
      console.log(`✅ Función 'current_tenant_id()' funciona - Retorna: ${tenantId}`);
    } else if (tenantError) {
      console.log(`❌ Función 'current_tenant_id()': ${tenantError.message}`);
    } else {
      console.log(`⚠️  Función 'current_tenant_id()' retorna NULL`);
    }

    const { data: isAdmin, error: adminError } = await supabase
      .rpc('is_platform_admin')
      .catch(e => ({ data: null, error: e }));
    
    if (!adminError) {
      console.log(`✅ Función 'is_platform_admin()' funciona - Retorna: ${isAdmin}`);
    } else {
      console.log(`❌ Función 'is_platform_admin()': ${adminError.message}`);
    }

    console.log('\n4️⃣  ESTADO DE VISTAS');
    console.log('-'.repeat(80));
    
    const views = ['v_control_alertas', 'v_control_unificado'];
    for (const view of views) {
      const { data, error, count } = await supabase
        .from(view)
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (!error) {
        console.log(`✅ Vista '${view}' existe - ${count} registros totales`);
      } else {
        console.log(`❌ Vista '${view}': ${error.message}`);
      }
    }

    console.log('\n5️⃣  TABLAS SIN RLS (Sospecha de vulnerabilidad)');
    console.log('-'.repeat(80));
    
    const tablassWithoutRls = [
      'catalog_staging_batches',
      'conduct_catalog',
      'conduct_types',
      'stage_sla',
      'stg_action_types',
      'stg_conduct_catalog',
      'stg_conduct_types',
      'stg_stage_sla'
    ];

    console.log('Las siguientes tablas podrían no tener RLS:');
    for (const table of tablassWithoutRls) {
      console.log(`  - ${table}`);
    }
    console.log('(Require SQL directo para confirmación)');

  } catch (error) {
    console.error(`Error fatal: ${error.message}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('FIN DE LA AUDITORÍA');
  console.log('='.repeat(80));
}

auditSupabase();
