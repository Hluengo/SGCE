/**
 * =============================================================================
 * Script de Prueba: test-gcc-rpc.ts
 * =============================================================================
 * Prueba las funciones RPC del módulo GCC
 * 
 * Uso: npx tsx scripts/test-gcc-rpc.ts
 * =============================================================================
 */

import { createClient } from '@supabase/supabase-js';

// Configuración - obtener de variables de entorno
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.log('Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  data?: unknown;
}

const results: TestResult[] = [];

/**
 * Ejecutar prueba
 */
async function test(name: string, fn: () => Promise<unknown>) {
  console.log(`\n🧪 Probando: ${name}`);
  try {
    const data = await fn();
    results.push({ name, success: true, data });
    console.log(`   ✅ Éxito`);
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    results.push({ name, success: false, error: message });
    console.log(`   ❌ Error: ${message}`);
    return null;
  }
}

/**
 * Iniciar sesión para pruebas
 */
async function login() {
  const email = process.env.TEST_EMAIL || 'admin@test.com';
  const password = process.env.TEST_PASSWORD || 'password123';
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    console.error('❌ Error de autenticación:', error.message);
    process.exit(1);
  }
  
  console.log('✅ Sesión iniciada como:', data.user?.email);
  return data.user;
}

/**
 * Obtener establecimiento de prueba
 */
async function getEstablecimiento() {
  const { data } = await supabase
    .from('establecimientos')
    .select('id, nombre')
    .limit(1)
    .single();
  
  return data;
}

/**
 * Obtener expediente de prueba
 */
async function getExpediente(establecimientoId: string) {
  const { data } = await supabase
    .from('expedientes')
    .select('id')
    .eq('establecimiento_id', establecimientoId)
    .eq('etapa_proceso', 'INVESTIGACION')
    .limit(1)
    .single();
  
  return data;
}

/**
 * Obtener mediación de prueba
 */
async function getMediacion(establecimientoId: string) {
  const { data } = await supabase
    .from('mediaciones_gcc_v2')
    .select('id, expediente_id, estado_proceso')
    .eq('establecimiento_id', establecimientoId)
    .in('estado_proceso', ['abierta', 'en_proceso', 'acuerdo_parcial'])
    .limit(1)
    .single();
  
  return data;
}

/**
 * Pruebas principales
 */
async function runTests() {
  console.log('='.repeat(50));
  console.log('🧪 PRUEBAS DE FUNCIONES RPC - MÓDULO GCC');
  console.log('='.repeat(50));

  // 1. Autenticarse
  await login();

  // 2. Obtener contexto
  const establecimiento = await getEstablecimiento();
  if (!establecimiento) {
    console.log('⚠️ No hay establecimientos para probar');
    return;
  }
  console.log(`\n📍 Establecimiento: ${establecimiento.nombre}`);

  // ========================================
  // PRUEBA 1: gcc_calcular_fecha_limite
  // ========================================
  await test('gcc_calcular_fecha_limite (5 días)', async () => {
    const { data } = await supabase.rpc('gcc_calcular_fecha_limite', {
      p_fecha_inicio: '2026-02-18',
      p_dias_habiles: 5
    });
    console.log(`   Fecha límite: ${data}`);
    return data;
  });

  // ========================================
  // PRUEBA 2: gcc_validar_expediente
  // ========================================
  const expediente = await getExpediente(establecimiento.id);
  if (expediente) {
    await test('gcc_validar_expediente', async () => {
      const { data } = await supabase.rpc('gcc_validar_expediente', {
        p_expediente_id: expediente.id
      });
      console.log(`   Resultado:`, data);
      return data;
    });
  } else {
    console.log('\n⚠️ No hay expediente en INVESTIGACION para probar');
  }

  // ========================================
  // PRUEBA 3: gcc_obtener_dashboard
  // ========================================
  await test('gcc_obtener_dashboard', async () => {
    const { data } = await supabase.rpc('gcc_obtener_dashboard', {
      p_establecimiento_id: establecimiento.id
    });
    console.log(`   Estadísticas:`, data?.estadisticas?.totales);
    return data;
  });

  // ========================================
  // PRUEBA 4: gcc_obtener_estadisticas
  // ========================================
  await test('gcc_obtener_estadisticas (30 días)', async () => {
    const { data } = await supabase.rpc('gcc_obtener_estadisticas', {
      p_establecimiento_id: establecimiento.id,
      p_fecha_desde: '2026-01-01',
      p_fecha_hasta: '2026-02-18'
    });
    console.log(`   Total mediaciones:`, data?.totales?.mediaciones);
    return data;
  });

  // ========================================
  // PRUEBA 5: gcc_obtener_mediaciones_por_vencer
  // ========================================
  await test('gcc_obtener_mediaciones_por_vencer', async () => {
    const { data } = await supabase.rpc('gcc_obtener_mediaciones_por_vencer', {
      p_establecimiento_id: establecimiento.id,
      p_dias_antelacion: 10
    });
    console.log(`   Mediaciones encontradas: ${Array.isArray(data) ? data.length : 0}`);
    return data;
  });

  // ========================================
  // PRUEBA 6: gcc_obtener_resumen_cierre
  // ========================================
  const mediacion = await getMediacion(establecimiento.id);
  if (mediacion) {
    await test('gcc_obtener_resumen_cierre', async () => {
      const { data } = await supabase.rpc('gcc_obtener_resumen_cierre', {
        p_mediacion_id: mediacion.id
      });
      console.log(`   Estado:`, data?.mediacion?.estado);
      console.log(`   Participantes:`, data?.participantes?.length);
      return data;
    });
  } else {
    console.log('\n⚠️ No hay mediación activa para probar');
  }

  // ========================================
  // PRUEBA 7: gcc_validar_cierre
  // ========================================
  if (mediacion) {
    await test('gcc_validar_cierre (sin_acuerdo)', async () => {
      const { data } = await supabase.rpc('gcc_validar_cierre', {
        p_mediacion_id: mediacion.id,
        p_resultado: 'sin_acuerdo'
      });
      console.log(`   Válido:`, data?.valido);
      console.log(`   Errores:`, data?.errores);
      return data;
    });
  }

  // ========================================
  // RESUMEN
  // ========================================
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('='.repeat(50));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Aprobadas: ${passed}`);
  console.log(`❌ Fallidas: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ Pruebas fallidas:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
  }

  console.log('\n' + '='.repeat(50));
}

// Ejecutar pruebas
runTests().catch(console.error);
