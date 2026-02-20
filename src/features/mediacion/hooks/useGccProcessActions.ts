import { useCallback } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useTenant } from '@/shared/context/TenantContext';
import { useAuth } from '@/shared/hooks/useAuth';
import type { ResultadoMediacion } from '@/types';
import type { MecanismoGCC } from '@/shared/hooks/useGccForm';

type EstadoStatus = 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO';

interface ResultadoPayload {
  resultado: ResultadoMediacion;
  acuerdos: string[];
  compromisos: string[];
  observaciones: string;
}

interface MediacionActivaRow {
  id: string;
  tipo_mecanismo: MecanismoGCC | null;
  estado_proceso: string | null;
}

const estadoProcesoToStatus = (estadoProceso?: string | null): EstadoStatus => {
  if (estadoProceso === 'acuerdo_total' || estadoProceso === 'acuerdo_parcial') return 'LOGRADO';
  if (estadoProceso === 'sin_acuerdo') return 'NO_ACUERDO';
  return 'PROCESO';
};

const resultadoToEstadoProceso = (resultado: ResultadoMediacion): string => {
  if (resultado === 'acuerdo_total') return 'acuerdo_total';
  if (resultado === 'acuerdo_parcial') return 'acuerdo_parcial';
  if (resultado === 'sin_acuerdo' || resultado === 'no_conciliables') return 'sin_acuerdo';
  return 'en_proceso';
};

const tipoActaFrom = (resultado: ResultadoMediacion, mecanismo: MecanismoGCC): string => {
  if (resultado === 'sin_acuerdo' || resultado === 'no_conciliables') return 'CONSTANCIA';
  if (mecanismo === 'CONCILIACION') return 'ACTA_CONCILIACION';
  if (mecanismo === 'ARBITRAJE_PEDAGOGICO') return 'ACTA_ARBITRAJE';
  return 'ACTA_MEDIACION';
};

export function useGccProcessActions() {
  const { tenantId } = useTenant();
  const { usuario } = useAuth();

  const fetchMediacionActiva = useCallback(
    async (expedienteDbId?: string): Promise<MediacionActivaRow | null> => {
      if (!supabase || !tenantId || !expedienteDbId) return null;
      const { data, error } = await supabase
        .from('mediaciones_gcc_v2')
        .select('id, tipo_mecanismo, estado_proceso')
        .eq('establecimiento_id', tenantId)
        .eq('expediente_id', expedienteDbId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;
      return data as MediacionActivaRow;
    },
    [tenantId]
  );

  const registrarResultado = useCallback(
    async (params: {
      mediacionId: string;
      mecanismoSeleccionado: MecanismoGCC;
      payload: ResultadoPayload;
    }): Promise<EstadoStatus> => {
      if (!supabase || !tenantId || !usuario?.id) {
        throw new Error('No hay mediacion activa para registrar resultado.');
      }

      const { mediacionId, mecanismoSeleccionado, payload } = params;
      const estadoProceso = resultadoToEstadoProceso(payload.resultado);

      const { error: updError } = await supabase
        .from('mediaciones_gcc_v2')
        .update({
          estado_proceso: estadoProceso,
          resultado_final: payload.resultado,
        })
        .eq('id', mediacionId)
        .eq('establecimiento_id', tenantId);

      if (updError) {
        throw new Error(`No se pudo guardar resultado: ${updError.message}`);
      }

      const { error: actaError } = await supabase.from('actas_gcc_v2').insert({
        establecimiento_id: tenantId,
        mediacion_id: mediacionId,
        tipo_acta: tipoActaFrom(payload.resultado, mecanismoSeleccionado),
        contenido_json: {
          resultado: payload.resultado,
          acuerdos: payload.acuerdos,
          observaciones: payload.observaciones,
        },
        fecha_emision: new Date().toISOString().slice(0, 10),
        observaciones: payload.observaciones,
      });

      if (actaError) {
        throw new Error(`No se pudo crear acta: ${actaError.message}`);
      }

      if (payload.compromisos.length > 0) {
        const { error: compromisosError } = await supabase.from('compromisos_gcc_v2').insert(
          payload.compromisos.map((descripcion) => ({
            establecimiento_id: tenantId,
            mediacion_id: mediacionId,
            descripcion,
            responsable_id: usuario.id,
            tipo_responsable: 'FACILITADOR',
            fecha_compromiso: new Date().toISOString().slice(0, 10),
            cumplimiento_verificado: false,
          }))
        );

        if (compromisosError) {
          throw new Error(`No se pudieron guardar compromisos: ${compromisosError.message}`);
        }
      }

      const { error: hitoError } = await supabase.from('hitos_gcc_v2').insert({
        establecimiento_id: tenantId,
        mediacion_id: mediacionId,
        tipo_hito:
          payload.resultado === 'acuerdo_total' || payload.resultado === 'acuerdo_parcial'
            ? 'ACUERDO_FINAL'
            : 'SIN_ACUERDO',
        descripcion: `Resultado GCC: ${payload.resultado}`,
        registrado_por: usuario.id,
        datos_adicionales: {
          acuerdos: payload.acuerdos.length,
          compromisos: payload.compromisos.length,
        },
      });

      if (hitoError) {
        throw new Error(`No se pudo registrar hito final: ${hitoError.message}`);
      }

      return estadoProcesoToStatus(estadoProceso);
    },
    [tenantId, usuario?.id]
  );

  return {
    fetchMediacionActiva,
    registrarResultado,
    estadoProcesoToStatus,
  };
}

