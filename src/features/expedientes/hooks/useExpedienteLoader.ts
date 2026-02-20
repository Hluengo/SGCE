import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { Expediente } from '@/types';
import { supabase } from '@/shared/lib/supabaseClient';
import { mapDbEstadoToEtapa, mapDbTipoFaltaToGravedad, type ExpedienteQueryRow } from '@/shared/types/supabase';
import { isUuid } from '@/shared/utils/expedienteRef';
import { hitosBase } from '@/shared/domain/expedientes/hitosBase';

interface UseExpedienteLoaderParams {
  id?: string;
  tenantId?: string | null;
  expedienteSeleccionado: Expediente | null;
  setExpedientes: Dispatch<SetStateAction<Expediente[]>>;
}

export function useExpedienteLoader({
  id,
  tenantId,
  expedienteSeleccionado,
  setExpedientes,
}: UseExpedienteLoaderParams) {
  const [isResolvingExpediente, setIsResolvingExpediente] = useState(false);
  const [resolveAttempted, setResolveAttempted] = useState(false);

  useEffect(() => {
    setResolveAttempted(false);
  }, [id]);

  useEffect(() => {
    let isCancelled = false;

    const resolveExpediente = async () => {
      if (!id || expedienteSeleccionado) {
        if (!isCancelled) setResolveAttempted(true);
        return;
      }
      if (!supabase) {
        if (!isCancelled) setResolveAttempted(true);
        return;
      }

      if (!isCancelled) setIsResolvingExpediente(true);
      try {
        let query = supabase
          .from('expedientes')
          .select(
            'id, folio, tipo_falta, estado_legal, etapa_proceso, fecha_inicio, plazo_fatal, creado_por, estudiante_a:estudiantes!expedientes_estudiante_id_fkey(id, nombre_completo, curso), estudiante_b:estudiantes!expedientes_estudiante_b_id_fkey(id, nombre_completo, curso)'
          )
          .or(`id.eq.${id},folio.eq.${id}`)
          .limit(1);

        if (tenantId && isUuid(tenantId)) {
          query = query.eq('establecimiento_id', tenantId);
        }

        const { data, error } = await query.maybeSingle();
        if (error || !data || isCancelled) return;

        const row = data as ExpedienteQueryRow;
        const gravedad = mapDbTipoFaltaToGravedad(row.tipo_falta);
        const esExpulsion = gravedad === 'GRAVISIMA_EXPULSION';
        const etapaDb = row.etapa_proceso ?? row.estado_legal;
        const estudianteA = Array.isArray(row.estudiante_a) ? row.estudiante_a[0] : row.estudiante_a;
        const estudianteB = Array.isArray(row.estudiante_b) ? row.estudiante_b[0] : row.estudiante_b;

        const mapped: Expediente = {
          id: row.folio ?? row.id,
          dbId: row.id,
          nnaNombre: estudianteA?.nombre_completo ?? 'Sin nombre',
          nnaCurso: estudianteA?.curso ?? null,
          nnaNombreB: estudianteB?.nombre_completo ?? null,
          nnaCursoB: estudianteB?.curso ?? null,
          etapa: mapDbEstadoToEtapa(etapaDb),
          gravedad,
          fechaInicio: row.fecha_inicio ? new Date(row.fecha_inicio).toISOString() : new Date().toISOString(),
          plazoFatal: row.plazo_fatal ? new Date(row.plazo_fatal).toISOString() : new Date().toISOString(),
          encargadoId: row.creado_por ?? '',
          esProcesoExpulsion: esExpulsion,
          accionesPrevias: false,
          hitos: hitosBase(esExpulsion),
        };

        setExpedientes((prev) => {
          if (prev.some((exp) => exp.id === mapped.id || exp.dbId === mapped.dbId)) return prev;
          return [mapped, ...prev];
        });
      } finally {
        if (!isCancelled) {
          setResolveAttempted(true);
          setIsResolvingExpediente(false);
        }
      }
    };

    void resolveExpediente();
    return () => {
      isCancelled = true;
    };
  }, [id, expedienteSeleccionado, setExpedientes, tenantId]);

  const loadHechosFromResumen = useCallback(async (): Promise<string | null> => {
    if (!supabase || !expedienteSeleccionado?.dbId) return null;
    const { data, error } = await supabase
      .from('expedientes')
      .select('descripcion_hechos')
      .eq('id', expedienteSeleccionado.dbId)
      .maybeSingle();
    if (error) return null;
    const initialText = (data?.descripcion_hechos || '').toString().trim();
    return initialText || null;
  }, [expedienteSeleccionado?.dbId]);

  return {
    isResolvingExpediente,
    resolveAttempted,
    loadHechosFromResumen,
  };
}
