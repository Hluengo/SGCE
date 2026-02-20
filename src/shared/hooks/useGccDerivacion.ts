/**
 * Hook useGccDerivacion
 * Encapsula la lógica de derivación a GCC usando RPC
 * Manejo de errores mejorado y async states
 * Usa funciones RPC: gcc_crear_proceso, gcc_agregar_hito, gcc_actualizar_consentimiento
 */

import { useCallback, useState } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useTenant } from '@/shared/context/TenantContext';
import { useAuth } from '@/shared/hooks/useAuth';
import { useToast } from '@/shared/components/Toast/ToastProvider';
import { MecanismoGCC } from './useGccForm';

export interface DerivacionPayload {
  motivo: string;
  objetivos: string[];
  mediadorAsignado: string;
  fechaMediacion: string;
  mecanismoSeleccionado: MecanismoGCC;
  plazoFatal?: string | null;
}

interface DerivacionResult {
  mediacionId: string;
  expedienteId: string;
  mecanismo: MecanismoGCC;
}

interface ExpedienteDerivable {
  dbId?: string;
  plazoFatal?: string | null;
}

interface UseGccDerivacionReturn {
  handleDerivacionCompleta: (expediente: ExpedienteDerivable, payload: DerivacionPayload) => Promise<DerivacionResult>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const mecanismoLabel: Record<MecanismoGCC, string> = {
  MEDIACION: 'Mediacion',
  CONCILIACION: 'Conciliacion',
  ARBITRAJE_PEDAGOGICO: 'Arbitraje Pedagogico',
};

export function useGccDerivacion(): UseGccDerivacionReturn {
  const { tenantId } = useTenant();
  const { usuario } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleDerivacionCompleta = useCallback(
    async (expediente: ExpedienteDerivable, payload: DerivacionPayload): Promise<DerivacionResult> => {
      setIsLoading(true);
      setError(null);

      try {
        // Validar datos requeridos
        if (!expediente?.dbId) {
          throw new Error('Expediente inválido: faltan datos necesarios');
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

        // Calcular fecha límite hábil (Máximo 5 días hábiles pero respetar plazo fatal si existe)
        const fechaLimite = expediente.plazoFatal
          ? new Date(expediente.plazoFatal)
          : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

        const mecanismoFinal = payload.mecanismoSeleccionado;

        // Llamar RPC gcc_crear_proceso para crear mediación de forma transaccional
        const { data: procesoData, error: rpcError } = await supabase.rpc(
          'gcc_crear_proceso',
          {
            p_expediente_id: expediente.dbId,
            p_establecimiento_id: tenantId,
            p_tipo_mecanismo: mecanismoFinal,
            p_fecha_limite: fechaLimite.toISOString().slice(0, 10),
            p_motivo_derivacion: [payload.motivo, ...payload.objetivos]
              .filter(Boolean)
              .join(' | '),
            p_facilitador_id: usuario.id,
            p_usuario_creador: usuario.id
          }
        );

        if (rpcError) {
          throw new Error(
            `Error al crear proceso GCC: ${rpcError.message}`
          );
        }

        if (!procesoData?.mediacion_id) {
          throw new Error('Response inválido al crear proceso: mediacion_id no recibido');
        }

        const mediacionId = procesoData.mediacion_id;

        // Agregar hito de inicio usando RPC gcc_agregar_hito
        const { error: hitoError } = await supabase.rpc('gcc_agregar_hito', {
          p_mediacion_id: mediacionId,
          p_establecimiento_id: tenantId,
          p_tipo_hito: 'INICIO',
          p_descripcion: `Inicio ${mecanismoLabel[mecanismoFinal]}${
            payload.mediadorAsignado ? ` - Facilitador: ${payload.mediadorAsignado}` : ''
          }`,
          p_registrado_por: usuario.id,
          p_datos_adicionales: JSON.stringify({
            fecha_programada: payload.fechaMediacion || null,
            objetivos: payload.objetivos,
            mediador_asignado: payload.mediadorAsignado
          })
        });

        if (hitoError) {
          console.warn('Advertencia: Hito no registrado:', hitoError.message);
          // No es crítico si el hito falla, continuamos
        }

        showToast(
          'success',
          `Derivación creada (${mecanismoLabel[mecanismoFinal]}).`
        );

        return {
          mediacionId,
          expedienteId: expediente.dbId,
          mecanismo: mecanismoFinal
        };
      } catch (err) {
        const mensaje =
          err instanceof Error ? err.message : 'Error desconocido en derivación';
        setError(mensaje);
        showToast('error', 'Error en derivación', mensaje);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [tenantId, usuario?.id, showToast]
  );

  return {
    handleDerivacionCompleta,
    isLoading,
    error,
    clearError
  };
}
