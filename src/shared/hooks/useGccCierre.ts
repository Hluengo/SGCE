/**
 * Hook useGccCierre
 * Encapsula la lógica de cierre de mediación GCC usando RPC
 * Validación, procesamiento atómico y error handling mejorado
 * Usa función RPC: gcc_procesar_cierre_completo (transacción atómica)
 */

import { useCallback, useState } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useTenant } from '@/shared/context/TenantContext';
import { useAuth } from '@/shared/hooks/useAuth';
import { useToast } from '@/shared/components/Toast/ToastProvider';

export interface CierrePayload {
  resultado: 'acuerdo_total' | 'acuerdo_parcial' | 'sin_acuerdo';
  detalleResultado: string;
  compromisos: CompromisoCierreInput[];
  actaContenido?: Record<string, unknown>;
}

export interface CompromisoCierreInput {
  es_nuevo?: boolean;
  descripcion?: string | null;
  responsable_id?: string | null;
  tipo_responsable?: string | null;
  fecha?: string | null;
}

interface CierreResult {
  expedienteId: string;
  estado: string;
  mediacionId: string;
}

interface UseGccCierreReturn {
  handleCierreExitoso: (mediacionId: string, payload: CierrePayload) => Promise<CierreResult>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useGccCierre(): UseGccCierreReturn {
  const { tenantId } = useTenant();
  const { usuario } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleCierreExitoso = useCallback(
    async (mediacionId: string, payload: CierrePayload): Promise<CierreResult> => {
      setIsLoading(true);
      setError(null);

      try {
        // Validar datos requeridos
        if (!mediacionId) {
          throw new Error('Mediación no identificada');
        }
        if (!tenantId) {
          throw new Error('Contexto de tenant no disponible');
        }
        if (!usuario?.id) {
          throw new Error('Usuario no autenticado');
        }
        if (!supabase) {
          throw new Error('Cliente Supabase no inicializado');
        }

        // Validar resultado
        if (!['acuerdo_total', 'acuerdo_parcial', 'sin_acuerdo'].includes(payload.resultado)) {
          throw new Error('Resultado de cierre inválido');
        }

        // Preparar compromisos nuevos (solo los marcados como nuevos)
        const compromisosNuevos = (payload.compromisos || [])
          .filter(c => c.es_nuevo && c.descripcion)
          .map(c => ({
            descripcion: c.descripcion,
            responsable_id: c.responsable_id || null,
            tipo_responsable: c.tipo_responsable || null,
            fecha_compromiso: c.fecha || null
          }));

        // Llamar RPC gcc_procesar_cierre_completo para procesar cierre atomicamente
        // Esta función maneja: actualización de mediación, actas, hitos, expediente, todo en una transacción
        const { data, error: rpcError } = await supabase.rpc(
          'gcc_procesar_cierre_completo',
          {
            p_mediacion_id: mediacionId,
            p_establecimiento_id: tenantId,
            p_resultado: payload.resultado,
            p_detalle_resultado: payload.detalleResultado || '',
            p_compromisos: JSON.stringify(compromisosNuevos),
            p_acta_contenido: JSON.stringify(payload.actaContenido || {}),
            p_usuario_id: usuario.id
          }
        );

        if (rpcError) {
          throw new Error(`Error en RPC de cierre: ${rpcError.message}`);
        }

        if (!data?.success) {
          throw new Error(
            data?.mensaje || 'Error desconocido al procesar cierre'
          );
        }

        showToast('success', 'Mediación cerrada correctamente');

        return {
          expedienteId: data.expediente_id,
          estado: data.estado,
          mediacionId: mediacionId
        };
      } catch (err) {
        const mensaje =
          err instanceof Error ? err.message : 'Error desconocido en cierre';
        setError(mensaje);
        showToast('error', 'Error en cierre', mensaje);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [tenantId, usuario?.id, showToast]
  );

  return {
    handleCierreExitoso,
    isLoading,
    error,
    clearError
  };
}
