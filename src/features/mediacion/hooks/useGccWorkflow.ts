import { useCallback, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Expediente } from '@/types';
import { useToast } from '@/shared/components/Toast/ToastProvider';
import { useGccDerivacion } from '@/shared/hooks/useGccDerivacion';
import type { GccFormState, MecanismoGCC } from '@/shared/hooks/useGccForm';
import { useGccProcessActions } from './useGccProcessActions';
import type { DerivacionCompletaPayload, ResultadoCompletoPayload } from '../types';
import { trackAsyncInteraction } from '@/shared/utils/perfProfiler';

interface UseGccWorkflowParams {
  expedientes: Expediente[];
  setExpedientes: Dispatch<SetStateAction<Expediente[]>>;
  setExpedienteSeleccionado: (exp: Expediente | null) => void;
  selectedCaseId: string | null;
  selectedMediacionId: string | null;
  mecanismoSeleccionado: MecanismoGCC;
  selectCase: (caseId: string | null) => void;
  setMediacionId: (id: string | null) => void;
  cambiarMecanismo: (mecanismo: MecanismoGCC) => void;
  cambiarStatus: (status: 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO') => void;
  toggleModal: (modal: keyof GccFormState['uiState']) => void;
  refreshGccMetrics: () => Promise<void> | void;
}

export function useGccWorkflow({
  expedientes,
  setExpedientes,
  setExpedienteSeleccionado,
  selectedCaseId,
  selectedMediacionId,
  mecanismoSeleccionado,
  selectCase,
  setMediacionId,
  cambiarMecanismo,
  cambiarStatus,
  toggleModal,
  refreshGccMetrics,
}: UseGccWorkflowParams) {
  const toast = useToast();
  const { handleDerivacionCompleta } = useGccDerivacion();
  const { fetchMediacionActiva, registrarResultado, estadoProcesoToStatus } = useGccProcessActions();

  const casoSeleccionado = useMemo(
    () => (selectedCaseId ? expedientes.find((e) => e.id === selectedCaseId) ?? null : null),
    [selectedCaseId, expedientes]
  );

  const handleSelectCase = useCallback(
    async (caseId: string) => {
      await trackAsyncInteraction('GCC:select_case', async () => {
        selectCase(caseId);
        const exp = expedientes.find((e) => e.id === caseId);
        if (!exp) return;

        setExpedienteSeleccionado(exp);
        try {
          const mediacion = await fetchMediacionActiva(exp.dbId);
          if (mediacion?.id) {
            setMediacionId(mediacion.id);
            if (
              mediacion.tipo_mecanismo === 'MEDIACION' ||
              mediacion.tipo_mecanismo === 'CONCILIACION' ||
              mediacion.tipo_mecanismo === 'ARBITRAJE_PEDAGOGICO'
            ) {
              cambiarMecanismo(mediacion.tipo_mecanismo);
            }
            cambiarStatus(estadoProcesoToStatus(mediacion.estado_proceso));
          } else {
            setMediacionId(null);
          }
        } catch (err) {
          console.error('Error cargando mediación activa:', err);
          toast.showToast('error', 'GCC', 'Error al cargar mediación activa');
        }
      });
    },
    [
      selectCase,
      expedientes,
      setExpedienteSeleccionado,
      fetchMediacionActiva,
      setMediacionId,
      cambiarMecanismo,
      cambiarStatus,
      estadoProcesoToStatus,
      toast,
    ]
  );

  const handleDerivacionCompletaInternal = useCallback(
    async (payload: DerivacionCompletaPayload) => {
      await trackAsyncInteraction('GCC:derivacion', async () => {
        if (!selectedCaseId) return;
        const target = expedientes.find((e) => e.id === selectedCaseId);
        if (!target) {
          toast.showToast('error', 'GCC', 'Expediente no encontrado');
          return;
        }

        try {
          const resultado = await handleDerivacionCompleta(target, {
            motivo: payload.motivo,
            objetivos: payload.objetivos,
            mediadorAsignado: payload.mediadorAsignado,
            fechaMediacion: payload.fechaMediacion,
            mecanismoSeleccionado,
          });

          setMediacionId(resultado.mediacionId);
          setExpedientes((prev) =>
            prev.map((e) =>
              e.id === selectedCaseId ? { ...e, etapa: 'CERRADO_GCC' as const } : e
            )
          );

          toggleModal('showDerivacionForm');
          await refreshGccMetrics();
        } catch (err) {
          console.error('Error en derivación:', err);
        }
      });
    },
    [
      selectedCaseId,
      expedientes,
      toast,
      handleDerivacionCompleta,
      mecanismoSeleccionado,
      setMediacionId,
      setExpedientes,
      toggleModal,
      refreshGccMetrics,
    ]
  );

  const handleResultadoCompleto = useCallback(
    async (payload: ResultadoCompletoPayload) => {
      await trackAsyncInteraction('GCC:resultado', async () => {
        if (!selectedMediacionId) {
          toast.showToast('error', 'GCC', 'No hay mediacion activa para registrar resultado.');
          return;
        }

        try {
          const status = await registrarResultado({
            mediacionId: selectedMediacionId,
            mecanismoSeleccionado,
            payload,
          });

          cambiarStatus(status);
          toggleModal('showResultadoForm');
          await refreshGccMetrics();
          toast.showToast('success', 'GCC', 'Resultado registrado correctamente.');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al registrar resultado.';
          toast.showToast('error', 'GCC', message);
        }
      });
    },
    [
      selectedMediacionId,
      toast,
      registrarResultado,
      mecanismoSeleccionado,
      cambiarStatus,
      toggleModal,
      refreshGccMetrics,
    ]
  );

  return {
    casoSeleccionado,
    handleSelectCase,
    handleDerivacionCompletaInternal,
    handleResultadoCompleto,
  };
}
