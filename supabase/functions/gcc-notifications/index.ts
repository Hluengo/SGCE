/**
 * =============================================================================
 * Edge Function: gcc-notifications
 * =============================================================================
 * Envía notificaciones automáticas para GCC
 * - Mediaciones por vencer
 * - Compromisos pendientes
 * =============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificacionPayload {
  tipo: 'PLAZO_VENCIDO' | 'PLAZO_PROXIMO' | 'COMPROMISO_PENDIENTE';
  establecimiento_id: string;
  mediacion_id?: string;
  destinatario_id?: string;
  mensaje: string;
}

async function sendEmail(supabaseAdmin: any, email: string, subject: string, body: string) {
  // Implementar según el proveedor de email configurado
  // Por ejemplo, usando Resend, SendGrid, etc.
  console.log(`[EMAIL] Enviando a ${email}: ${subject}`);
  return { success: true };
}

async function sendPushNotification(userId: string, title: string, body: string) {
  // Implementar notificaciones push si está configurado
  console.log(`[PUSH] Enviando a usuario ${userId}: ${title}`);
  return { success: true };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Obtener establecimientos activos
    const { data: establecimientos, error: estError } = await supabase
      .from('establecimientos')
      .select('id, nombre')
      .eq('activo', true)

    if (estError) throw estError

    // Procesar un establecimiento: mediaciones por vencer + compromisos pendientes
    async function processEstablecimiento(establecimiento: { id: string; nombre: string }) {
      const results: any[] = []

      // 1. Verificar mediaciones por vencer (próximos 3 días)
      const { data: mediacionesPorVencer } = await supabase.rpc(
        'gcc_obtener_mediaciones_por_vencer',
        {
          p_establecimiento_id: establecimiento.id,
          p_dias_antelacion: 3
        }
      )

      if (mediacionesPorVencer && mediacionesPorVencer.length > 0) {
        for (const mediacion of mediacionesPorVencer) {
          const { data: notificacion } = await supabase
            .from('gcc_notificaciones_log')
            .insert({
              establecimiento_id: establecimiento.id,
              mediacion_id: mediacion.id,
              tipo_notificacion: mediacion.dias_restantes <= 0 ? 'PLAZO_VENCIDO' : 'PLAZO_PROXIMO',
              mensaje: `La mediación ${mediacion.tipo_mecanismo} del expediente ${mediacion.expediente_id} ${
                mediacion.dias_restantes <= 0
                  ? 'ha vencido'
                  : `vence en ${mediacion.dias_restantes} días`
              }`,
              creada: false
            })
            .select()
            .single()

          if (mediacion.facilitador_id) {
            const { data: facilitador } = await supabase
              .from('usuarios')
              .select('email, nombre')
              .eq('id', mediacion.facilitador_id)
              .single()

            if (facilitador) {
              await sendEmail(
                supabase,
                facilitador.email,
                'Alerta: Mediación por vencer',
                `La mediación ${mediacion.tipo_mecanismo} del expediente ${mediacion.expediente_id} ${
                  mediacion.dias_restantes <= 0
                    ? 'ha vencido'
                    : `vence en ${mediacion.dias_restantes} días`
                }. Por favor revise el caso a la brevedad.`
              )
            }
          }

          results.push({
            establecimiento: establecimiento.nombre,
            tipo: 'MEDIACION_POR_VENCER',
            mediacion_id: mediacion.id,
            dias_restantes: mediacion.dias_restantes
          })
        }
      }

      // 2. Verificar compromisos pendientes
      const { data: compromisosPendientes } = await supabase.rpc(
        'gcc_obtener_compromisos_pendientes',
        {
          p_establecimiento_id: establecimiento.id,
          p_dias_antelacion: 2
        }
      )

      if (compromisosPendientes && compromisosPendientes.length > 0) {
        for (const compromiso of compromisosPendientes) {
          await supabase
            .from('gcc_notificaciones_log')
            .insert({
              establecimiento_id: establecimiento.id,
              mediacion_id: compromiso.mediacion_id,
              tipo_notificacion: 'COMPROMISO_PENDIENTE',
              mensaje: `El compromiso "${compromiso.descripcion}" ${
                compromiso.dias_restantes <= 0
                  ? 'ha vencido'
                  : `vence en ${compromiso.dias_restantes} días`
              }`,
              creada: false
            })

          results.push({
            establecimiento: establecimiento.nombre,
            tipo: 'COMPROMISO_PENDIENTE',
            compromiso_id: compromiso.id,
            dias_restantes: compromiso.dias_restantes
          })
        }
      }

      return results
    }

    // Procesar establecimientos en chunks paralelos (máx 5 concurrentes)
    const CHUNK_SIZE = 5
    const allEstablecimientos = establecimientos || []
    const resultados: any[] = []

    for (let i = 0; i < allEstablecimientos.length; i += CHUNK_SIZE) {
      const chunk = allEstablecimientos.slice(i, i + CHUNK_SIZE)
      const chunkResults = await Promise.all(
        chunk.map((est) => processEstablecimiento(est))
      )
      resultados.push(...chunkResults.flat())
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificaciones_enviadas: resultados.length,
        detalles: resultados
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
