/**
 * ExpedienteTransitions - Sistema de Gestión del Ciclo de Vida del Expediente
 * Cumple con Circular 782 - Transiciones de Estado Validadas
 *
 * Funcionalidades:
 * - Transiciones de estado entre etapas
 * - Validación de requisitos documentales por etapa
 * - Registro en bitácora automático
 */

import React, { useMemo, useReducer } from 'react';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { supabase } from '@/shared/lib/supabaseClient';
import { useAuth } from '@/shared/hooks/useAuth';
import {
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Clock,
  FileText,
  ShieldCheck,
  Info
} from 'lucide-react';
import { EtapaProceso } from '@/types';
import { calcularDiasRestantes } from '@/shared/utils/plazos';
import { AsyncState } from '@/shared/components/ui';

/**
 * Definición de transiciones permitidas
 */
interface Transicion {
  desde: EtapaProceso[];
  hacia: EtapaProceso;
  label: string;
  description: string;
  requisitos: string[];
  icon: React.ElementType;
  color: string;
}

/**
 * Transiciones predefinidas según Circular 782
 */
const TRANSICIONES: Transicion[] = [
  {
    desde: ['INICIO'],
    hacia: 'NOTIFICADO',
    label: 'Notificar a Apoderados',
    description: 'Comunicar formalmente el inicio del proceso disciplinario',
    requisitos: [
      'Datos del estudiante completos',
      'Tipo y gravedad de falta clasificada',
      'Carta de notificación preparada'
    ],
    icon: FileText,
    color: 'bg-blue-500'
  },
  {
    desde: ['NOTIFICADO'],
    hacia: 'DESCARGOS',
    label: 'Recepción de Descargos',
    description: 'Recibir versión del estudiante y su familia',
    requisitos: [
      'Notificación cursada (24h)',
      'Copia de notificación guardada',
      'Fecha de audiencia programada'
    ],
    icon: ShieldCheck,
    color: 'bg-purple-500'
  },
  {
    desde: ['DESCARGOS'],
    hacia: 'INVESTIGACION',
    label: 'Abrir Investigación',
    description: 'Recopilar pruebas y testimonios adicionales',
    requisitos: [
      'Acta de descargos firmada',
      'Testimonios recopilados',
      'Evidencias digitales guardadas'
    ],
    icon: AlertTriangle,
    color: 'bg-orange-500'
  },
  {
    desde: ['INVESTIGACION'],
    hacia: 'RESOLUCION_PENDIENTE',
    label: 'Emitir Resolución',
    description: 'Determinar medida formativa o disciplinaria',
    requisitos: [
      'Informe de investigación completo',
      'Contradicción de pruebas verificada',
      'Conocimiento del estudiante verificado'
    ],
    icon: CheckCircle,
    color: 'bg-emerald-500'
  },
  {
    desde: ['RESOLUCION_PENDIENTE'],
    hacia: 'CERRADO_SANCION',
    label: 'Cerrar con Sanción',
    description: 'Finalizar proceso con medida disciplinaria aplicada',
    requisitos: [
      'Resolución de директора firmada',
      'Carta de notificación de resolución',
      'Registro en libro de sanciones'
    ],
    icon: Lock,
    color: 'bg-slate-500'
  },
  {
    desde: ['NOTIFICADO', 'DESCARGOS', 'INVESTIGACION'],
    hacia: 'CERRADO_GCC',
    label: 'Derivar a GCC',
    description: 'Cerrar por vía formativa mediante mediación',
    requisitos: [
      'Acuerdo de mediación firmado',
      'Compromisos reparatorios registrados',
      'Acta de mediación en expediente'
    ],
    icon: Unlock,
    color: 'bg-teal-500'
  },
  {
    desde: ['RESOLUCION_PENDIENTE'],
    hacia: 'RECONSIDERACION',
    label: 'Abrir Reconsideración',
    description: 'Recibir solicitud de apelación del apoderado',
    requisitos: [
      'Solicitud escrita del apoderado',
      'Plazo de 15 días hábiles vigente',
      'Documentación completa del caso'
    ],
    icon: Clock,
    color: 'bg-amber-500'
  },
  {
    desde: ['RECONSIDERACION'],
    hacia: 'CERRADO_SANCION',
    label: 'Confirmar Sanción',
    description: 'Resolución final tras reconsideración',
    requisitos: [
      'Informe de reconsideración',
      'Respuesta del sostenedor',
      'Resolución final ejecutada'
    ],
    icon: CheckCircle,
    color: 'bg-emerald-500'
  }
];

interface ExpedienteTransitionsProps {
  expedienteId: string;
  onTransicionCompleta?: (nuevaEtapa: EtapaProceso) => void;
}

interface TransitionsUiState {
  isLoading: boolean;
  error: string | null;
  showConfirmDialog: boolean;
  transicionSeleccionada: Transicion | null;
  requisitosVerificados: Record<number, boolean>;
}

type TransitionsUiAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'OPEN_CONFIRM'; payload: { transicion: Transicion; requisitos: Record<number, boolean> } }
  | { type: 'CLOSE_CONFIRM' }
  | { type: 'TOGGLE_REQUISITO'; payload: number };

const initialUiState: TransitionsUiState = {
  isLoading: false,
  error: null,
  showConfirmDialog: false,
  transicionSeleccionada: null,
  requisitosVerificados: {}
};

function transitionsUiReducer(state: TransitionsUiState, action: TransitionsUiAction): TransitionsUiState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'OPEN_CONFIRM':
      return {
        ...state,
        showConfirmDialog: true,
        transicionSeleccionada: action.payload.transicion,
        requisitosVerificados: action.payload.requisitos,
        error: null
      };
    case 'CLOSE_CONFIRM':
      return {
        ...state,
        showConfirmDialog: false,
        transicionSeleccionada: null,
        requisitosVerificados: {},
        error: null
      };
    case 'TOGGLE_REQUISITO':
      return {
        ...state,
        requisitosVerificados: {
          ...state.requisitosVerificados,
          [action.payload]: !state.requisitosVerificados[action.payload]
        }
      };
    default:
      return state;
  }
}

const LifecycleProgressCard: React.FC<{
  indiceActual: number;
  expediente: NonNullable<ReturnType<typeof useConvivencia>['expedientes'][number]>;
  progressSteps: EtapaProceso[];
}> = ({ indiceActual, expediente, progressSteps }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6">
    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center">
      <Clock className="w-5 h-5 mr-3 text-indigo-600" />
      Progreso del Ciclo de Vida
    </h3>

    <div className="relative">
      <div className="absolute top-5 left-0 right-0 h-1 bg-slate-100 rounded" />
      <div
        className="absolute top-5 left-0 h-1 bg-indigo-500 rounded transition-all duration-500"
        style={{ width: `${(indiceActual / (progressSteps.length - 1)) * 100}%` }}
      />

      <div className="relative flex justify-between">
        {progressSteps.map((etapa, index) => {
          const Icon = index <= indiceActual ? CheckCircle : FileText;
          const isActive = index === indiceActual;
          const isCompleted = index < indiceActual;

          return (
            <div key={etapa} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : isCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`mt-2 text-xs font-black uppercase tracking-widest text-center ${
                  isActive ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                {etapa.replace('_', ' ')}
              </span>
            </div>
          );
        })}
      </div>
    </div>

    <div className="mt-6 p-4 bg-slate-50 rounded-xl flex items-center justify-between">
      <div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Plazo Legal Fatal
        </p>
        <p className="text-sm font-bold text-slate-700">
          {new Date(expediente.plazoFatal).toLocaleDateString()}
        </p>
      </div>
      <div className={`px-4 py-2 rounded-xl font-black text-xs uppercase ${
        calcularDiasRestantes(expediente.plazoFatal) <= 3
          ? 'bg-red-100 text-red-600'
          : calcularDiasRestantes(expediente.plazoFatal) <= 7
          ? 'bg-orange-100 text-orange-600'
          : 'bg-emerald-100 text-emerald-600'
      }`}>
        {calcularDiasRestantes(expediente.plazoFatal)} días restantes
      </div>
    </div>
  </div>
);

const AvailableTransitionsCard: React.FC<{
  transicionesDisponibles: Transicion[];
  iniciarTransicion: (transicion: Transicion) => void;
}> = ({ transicionesDisponibles, iniciarTransicion }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6">
    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center">
      <ArrowRight className="w-5 h-5 mr-3 text-indigo-600" />
      Acciones Disponibles
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {transicionesDisponibles.map((transicion) => {
        const Icon = transicion.icon;

        return (
          <button
            key={transicion.hacia}
            onClick={() => iniciarTransicion(transicion)}
            className="p-4 bg-slate-50 hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all group"
          >
            <div className="flex items-start space-x-4">
              <div className={`p-2 rounded-xl ${transicion.color} text-white`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-black text-sm text-slate-900 uppercase group-hover:text-indigo-700">
                  {transicion.label}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {transicion.description}
                </p>
                <p className="text-xs font-bold text-slate-400 mt-2">
                  {transicion.requisitos.length} requisito(s) necesario(s)
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

const TransitionConfirmDialog: React.FC<{
  ui: TransitionsUiState;
  dispatch: React.Dispatch<TransitionsUiAction>;
  toggleRequisito: (index: number) => void;
  ejecutarTransicion: () => Promise<void>;
}> = ({ ui, dispatch, toggleRequisito, ejecutarTransicion }) => {
  if (!ui.showConfirmDialog || !ui.transicionSeleccionada) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className={`p-4 ${ui.transicionSeleccionada.color} text-white`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ui.transicionSeleccionada.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black uppercase tracking-wide">
                {ui.transicionSeleccionada.label}
              </p>
              <p className="text-xs opacity-90">
                {ui.transicionSeleccionada.description}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-blue-800">Verificación de Requisitos</p>
              <p className="text-xs text-blue-600 mt-1">
                Confirme que se han completado todos los requisitos antes de continuar.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {ui.transicionSeleccionada.requisitos.map((requisito, index) => (
              <label
                key={requisito}
                className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  ui.requisitosVerificados[index]
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-white border-slate-200 hover:border-emerald-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={ui.requisitosVerificados[index] || false}
                  onChange={() => toggleRequisito(index)}
                  className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className={`text-sm font-medium ${
                  ui.requisitosVerificados[index] ? 'text-emerald-700' : 'text-slate-700'
                }`}>
                  {requisito}
                </span>
              </label>
            ))}
          </div>

          {ui.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <AsyncState
                state="error"
                title="No se pudo ejecutar la transición"
                message={ui.error}
                compact
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end space-x-3">
          <button
            onClick={() => {
              dispatch({ type: 'CLOSE_CONFIRM' });
            }}
            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={ejecutarTransicion}
            disabled={ui.isLoading || !Object.values(ui.requisitosVerificados).every(v => v)}
            className={`px-6 py-3 rounded-xl font-bold text-xs uppercase transition-all flex items-center space-x-2 ${
              ui.isLoading || !Object.values(ui.requisitosVerificados).every(v => v)
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : `${ui.transicionSeleccionada.color} text-white hover:opacity-90`
            }`}
          >
            {ui.isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Ejecutando...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Confirmar Transición</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente principal de transiciones
 */
const ExpedienteTransitions: React.FC<ExpedienteTransitionsProps> = ({
  expedienteId,
  onTransicionCompleta
}) => {
  const { user } = useAuth();
  const { expedientes, actualizarEtapa } = useConvivencia();

  const [ui, dispatch] = useReducer(transitionsUiReducer, initialUiState);

  // Obtener expediente actual
  const expediente = useMemo(() =>
    expedientes.find((e: { id: string }) => e.id === expedienteId),
    [expedientes, expedienteId]
  );
  const expedienteDbId = expediente?.dbId ?? expedienteId;

  // Obtener etapa actual
  const etapaActual = expediente?.etapa || 'INICIO';

  // Obtener transiciones disponibles
  const transicionesDisponibles = useMemo(() => {
    return TRANSICIONES.filter(t =>
      t.desde.includes(etapaActual) &&
      !etapaActual.startsWith('CERRADO')
    );
  }, [etapaActual]);

  // Manejar cambio de verificación de requisito
  const toggleRequisito = (index: number) => {
    dispatch({ type: 'TOGGLE_REQUISITO', payload: index });
  };

  // Iniciar transición
  const iniciarTransicion = (transicion: Transicion) => {
    const inicial: Record<number, boolean> = {};
    transicion.requisitos.forEach((_, i) => { inicial[i] = false; });
    dispatch({ type: 'OPEN_CONFIRM', payload: { transicion, requisitos: inicial } });
  };

  // Ejecutar transición
  const ejecutarTransicion = async () => {
    if (!ui.transicionSeleccionada || !expediente) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Verificar que todos los requisitos estén completados
      const requisitosCompletados = ui.transicionSeleccionada.requisitos.every(
        (_, i) => ui.requisitosVerificados[i]
      );

      if (!requisitosCompletados) {
        throw new Error('Debe verificar todos los requisitos antes de continuar');
      }

      const nuevaEtapa = ui.transicionSeleccionada.hacia;

      // Registrar en Supabase
      if (supabase) {
        // Actualizar expediente
        await supabase
          .from('expedientes')
          .update({
            etapa: nuevaEtapa,
            updated_at: new Date().toISOString()
          })
          .eq('id', expedienteDbId);

        // Registrar en bitácora
        await supabase
          .from('bitacora_expediente')
          .insert({
            expediente_id: expedienteDbId,
            tipo_accion: 'TRANSICION_ETAPA',
            descripcion: `Cambio de etapa: ${etapaActual} → ${nuevaEtapa}`,
            usuario_id: user?.id || 'unknown',
            usuario_nombre: user?.email || 'Sistema',
            usuario_rol: 'ENCARGADO_CONVIVENCIA',
            datos_adicionales: {
              etapa_anterior: etapaActual,
              etapa_nueva: nuevaEtapa,
              transicion: ui.transicionSeleccionada.label,
              requisitos_verificados: ui.transicionSeleccionada.requisitos.filter((_, i) => ui.requisitosVerificados[i])
            },
            es_critica: true
          });
      }

      // Actualizar contexto local
      actualizarEtapa(expedienteId, nuevaEtapa);

      // Callback
      if (onTransicionCompleta) {
        onTransicionCompleta(nuevaEtapa);
      }

      dispatch({ type: 'CLOSE_CONFIRM' });

    } catch (err) {
      console.error('Error al ejecutar transición:', err);
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Error al ejecutar transición' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Indicador visual del progreso
  const PROGRESS_STEPS: EtapaProceso[] = [
    'INICIO', 'NOTIFICADO', 'DESCARGOS', 'INVESTIGACION',
    'RESOLUCION_PENDIENTE', 'CERRADO_SANCION'
  ];

  const indiceActual = PROGRESS_STEPS.indexOf(etapaActual);
  const estaCerradoGCC = etapaActual === 'CERRADO_GCC' || etapaActual === 'RECONSIDERACION';

  if (!expediente) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <AsyncState
          state="error"
          title="Expediente no encontrado"
          message="No fue posible cargar el expediente para transiciones."
          compact
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra de progreso del ciclo de vida */}
      {!estaCerradoGCC && (
        <LifecycleProgressCard
          indiceActual={indiceActual}
          expediente={expediente}
          progressSteps={PROGRESS_STEPS}
        />
      )}

      {/* Transiciones disponibles */}
      {transicionesDisponibles.length > 0 && !etapaActual.startsWith('CERRADO') && (
        <AvailableTransitionsCard
          transicionesDisponibles={transicionesDisponibles}
          iniciarTransicion={iniciarTransicion}
        />
      )}

      {/* Diálogo de confirmación */}
      <TransitionConfirmDialog
        ui={ui}
        dispatch={dispatch}
        toggleRequisito={toggleRequisito}
        ejecutarTransicion={ejecutarTransicion}
      />

      {/* Expediente cerrado */}
      {etapaActual.startsWith('CERRADO') && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-emerald-500 text-white rounded-2xl">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black text-emerald-800 uppercase">
                Expediente Cerrado
              </p>
              <p className="text-sm font-bold text-emerald-600">
                Estado: {etapaActual.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpedienteTransitions;

