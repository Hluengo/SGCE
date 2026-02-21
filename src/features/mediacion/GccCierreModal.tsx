/**
 * =============================================================================
 * Componente: GccCierreModal
 * FASE 2 - SPRINT 3: Flujo de Cierre Unificado
 * =============================================================================
 * Modal guiado para cerrar una mediación GCC
 * Valida requisitos y procesa el cierre de forma atómica
 * =============================================================================
 */

import React, { useReducer, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useTenant } from '@/shared/context/TenantContext';
import { useToast } from '@/shared/components/Toast/ToastProvider';
import { 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Users, 
  Calendar,
  ArrowRight,
  Save,
  X,
  Loader2
} from 'lucide-react';

/**
 * Tipos
 */
interface Participante {
  id: string;
  nombre: string;
  rol: string;
  tipo: string;
  consentimiento: boolean;
}

interface Compromiso {
  id: string;
  descripcion: string;
  responsable_id?: string;
  tipo_responsable?: string;
  fecha?: string;
  cumplido?: boolean;
  es_nuevo?: boolean;
}

type EscenarioProcedencia = 'SIN_INCUMPLIMIENTO' | 'CON_INCUMPLIMIENTO' | 'RESTAURATIVO';

interface Hito {
  tipo: string;
  descripcion: string;
  fecha: string;
}

interface ResumenCierre {
  error: boolean;
  mediacion: {
    id: string;
    tipo_mecanismo: string;
    estado: string;
    fecha_inicio: string;
    fecha_limite: string;
    efecto_suspensivo: boolean;
  };
  expediente: {
    id: string;
    folio: string;
    estudiante_id: string;
    hechos?: string;
  };
  establecimiento: {
    nombre: string;
    direccion: string;
  };
  participantes: Participante[];
  compromisos_previos: Compromiso[];
  timeline: Hito[];
  dias_transcurridos: number;
  dias_restantes: number;
}

interface ValidacionCierre {
  valido: boolean;
  errores: string[];
  advertencias?: string[];
}

interface Props {
  mediacionId: string;
  onClose: () => void;
  onCierreExitoso: (resultado: { expediente_id: string; estado: string }) => void;
}

interface CierreFormState {
  resultado: 'acuerdo_total' | 'acuerdo_parcial' | 'sin_acuerdo';
  detalleResultado: string;
  compromisos: Compromiso[];
  aceptaParticipacion: boolean;
  escenarioProcedencia: EscenarioProcedencia | '';
  autorizaDivulgacionResultado: boolean;
  consecuenciasIncumplimiento: string;
  fechaSeguimiento: string;
  evaluacionResultado: string;
}

const INITIAL_FORM_STATE: CierreFormState = {
  resultado: 'sin_acuerdo',
  detalleResultado: '',
  compromisos: [],
  aceptaParticipacion: false,
  escenarioProcedencia: '',
  autorizaDivulgacionResultado: false,
  consecuenciasIncumplimiento: '',
  fechaSeguimiento: '',
  evaluacionResultado: '',
};

interface CierreModalState {
  step: number;
  cargando: boolean;
  resumen: ResumenCierre | null;
  validacion: ValidacionCierre | null;
  error: string | null;
  form: CierreFormState;
}

type CierreModalAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_CARGANDO'; payload: boolean }
  | { type: 'SET_RESUMEN'; payload: ResumenCierre | null }
  | { type: 'SET_VALIDACION'; payload: ValidacionCierre | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_FORM'; payload: Partial<CierreFormState> }
  | { type: 'RESET_FOR_MEDIACION' };

const INITIAL_MODAL_STATE: CierreModalState = {
  step: 1,
  cargando: false,
  resumen: null,
  validacion: null,
  error: null,
  form: INITIAL_FORM_STATE,
};

function cierreModalReducer(state: CierreModalState, action: CierreModalAction): CierreModalState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'SET_CARGANDO':
      return { ...state, cargando: action.payload };
    case 'SET_RESUMEN':
      return { ...state, resumen: action.payload };
    case 'SET_VALIDACION':
      return { ...state, validacion: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'UPDATE_FORM':
      return { ...state, form: { ...state.form, ...action.payload } };
    case 'RESET_FOR_MEDIACION':
      return { ...state, step: 1, validacion: null, error: null, form: INITIAL_FORM_STATE };
    default:
      return state;
  }
}

const RESULTADO_OPTIONS = [
  { value: 'acuerdo_total', label: 'Acuerdo Total', desc: 'Las partes llegaron a un acuerdo completo' },
  { value: 'acuerdo_parcial', label: 'Acuerdo Parcial', desc: 'Las partes llegaron a acuerdos en algunos puntos' },
  { value: 'sin_acuerdo', label: 'Sin Acuerdo', desc: 'Las partes no lograron ningún acuerdo' },
] as const;

const STEPS = [
  { num: 1, label: 'Resumen' },
  { num: 2, label: 'Resultado' },
  { num: 3, label: 'Compromisos' },
  { num: 4, label: 'Confirmar' },
];

function ProgressSteps({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center py-4 px-4 border-b bg-gray-50">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.num}>
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s.num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step > s.num ? <CheckCircle className="h-5 w-5" /> : s.num}
            </div>
            <span className="text-xs mt-1 text-gray-600">{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-12 ${step > s.num ? 'bg-blue-600' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function StepResumen({ resumen }: { resumen: ResumenCierre | null }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Datos de la Mediación
        </h4>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-blue-700">Tipo:</span>{' '}
            <span className="font-medium">{resumen?.mediacion.tipo_mecanismo}</span>
          </div>
          <div>
            <span className="text-blue-700">Estado:</span>{' '}
            <span className="font-medium">{resumen?.mediacion.estado}</span>
          </div>
          <div>
            <span className="text-blue-700">Inicio:</span>{' '}
            <span className="font-medium">{resumen?.mediacion.fecha_inicio}</span>
          </div>
          <div>
            <span className="text-blue-700">Límite:</span>{' '}
            <span className="font-medium">{resumen?.mediacion.fecha_limite}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="bg-green-50 p-4 rounded-lg flex-1">
          <h4 className="font-medium text-green-900 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Días Transcurridos
          </h4>
          <p className="text-2xl font-bold text-green-700">{resumen?.dias_transcurridos}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg flex-1">
          <h4 className="font-medium text-orange-900 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Días Restantes
          </h4>
          <p className="text-2xl font-bold text-orange-700">{resumen?.dias_restantes}</p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Participantes ({resumen?.participantes.length || 0})
        </h4>
        <div className="mt-2 space-y-2">
          {resumen?.participantes.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm">
              <span>
                {p.nombre} ({p.tipo})
              </span>
              <span className={`flex items-center gap-1 ${p.consentimiento ? 'text-green-600' : 'text-red-600'}`}>
                {p.consentimiento ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                {p.consentimiento ? 'Con consentimiento' : 'Sin consentimiento'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StepResultadoProps {
  form: CierreFormState;
  validacion: ValidacionCierre | null;
  onUpdateForm: (updates: Partial<CierreFormState>) => void;
  onValidarResultado: (resultado: CierreFormState['resultado']) => Promise<boolean>;
}

function StepResultado({ form, validacion, onUpdateForm, onValidarResultado }: StepResultadoProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="block text-sm font-medium mb-2">Resultado de la Mediación</p>
        <div className="space-y-2">
          {RESULTADO_OPTIONS.map((option) => (
            <label
              key={option.value}
              aria-label={option.label}
              className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                form.resultado === option.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="resultado"
                value={option.value}
                checked={form.resultado === option.value}
                onChange={(e) => {
                  const nextResultado = e.target.value as CierreFormState['resultado'];
                  onUpdateForm({ resultado: nextResultado });
                  void onValidarResultado(nextResultado);
                }}
                className="mt-1"
              />
              <div className="ml-2">
                <span className="font-medium">{option.label}</span>
                <p className="text-sm text-gray-500">{option.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="gcc-detalle-resultado" className="block text-sm font-medium mb-2">
          Detalle del Resultado
        </label>
        <textarea
          id="gcc-detalle-resultado"
          value={form.detalleResultado}
          onChange={(e) => onUpdateForm({ detalleResultado: e.target.value })}
          placeholder="Describa los términos del acuerdo o las razones por las que no se llegó a acuerdo..."
          className="min-h-24 w-full rounded-lg border p-3"
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
        <h5 className="text-sm font-semibold text-slate-900">Conformidad Circular 782</h5>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.aceptaParticipacion}
            onChange={(e) => onUpdateForm({ aceptaParticipacion: e.target.checked })}
          />
          Participación voluntaria explícita registrada
        </label>
        <div>
          <label htmlFor="gcc-escenario-procedencia" className="block text-sm font-medium mb-1">
            Escenario de procedencia
          </label>
          <select
            id="gcc-escenario-procedencia"
            value={form.escenarioProcedencia}
            onChange={(e) => onUpdateForm({ escenarioProcedencia: e.target.value as EscenarioProcedencia | '' })}
            className="w-full rounded-lg border p-2 text-sm"
          >
            <option value="">Seleccione escenario...</option>
            <option value="SIN_INCUMPLIMIENTO">Sin incumplimiento</option>
            <option value="CON_INCUMPLIMIENTO">Con incumplimiento</option>
            <option value="RESTAURATIVO">Restaurativo</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.autorizaDivulgacionResultado}
            onChange={(e) => onUpdateForm({ autorizaDivulgacionResultado: e.target.checked })}
          />
          Existe autorización de divulgación del resultado
        </label>
      </div>

      {validacion && !validacion.valido && (
        <div className="bg-red-50 p-4 rounded-lg">
          <h4 className="font-medium text-red-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Errores de Validación
          </h4>
          <ul className="mt-2 text-sm text-red-700 space-y-1">
            {validacion.errores.map((err) => (
              <li key={err}>• {err}</li>
            ))}
          </ul>
        </div>
      )}

      {validacion && validacion.valido && validacion.advertencias && validacion.advertencias.length > 0 && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Advertencias
          </h4>
          <ul className="mt-2 text-sm text-yellow-700 space-y-1">
            {validacion.advertencias.map((adv) => (
              <li key={adv}>• {adv}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface StepCompromisosProps {
  form: CierreFormState;
  onAgregarCompromiso: () => void;
  onEliminarCompromiso: (id: string) => void;
  onActualizarCompromiso: (id: string, campo: string, valor: unknown) => void;
}

function StepCompromisos({
  form,
  onAgregarCompromiso,
  onEliminarCompromiso,
  onActualizarCompromiso,
}: StepCompromisosProps) {
  return (
    <div className="space-y-4">
      {form.resultado === 'acuerdo_total' || form.resultado === 'acuerdo_parcial' ? (
        <>
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Compromisos</h4>
            <button type="button" onClick={onAgregarCompromiso} className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
              + Agregar Compromiso
            </button>
          </div>

          {form.compromisos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay compromisos registrados.</p>
              <p className="text-sm">Para acuerdos es necesario registrar al menos un compromiso.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {form.compromisos.map((compromiso) => (
                <div key={compromiso.id} className="p-3 border rounded-lg bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div>
                        <label htmlFor={`compromiso-desc-${compromiso.id}`} className="text-xs text-gray-500">
                          Descripción
                        </label>
                        <input
                          id={`compromiso-desc-${compromiso.id}`}
                          type="text"
                          value={compromiso.descripcion}
                          onChange={(e) => onActualizarCompromiso(compromiso.id, 'descripcion', e.target.value)}
                          placeholder="Descripción del compromiso..."
                          className="w-full p-2 border rounded text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label htmlFor={`compromiso-resp-${compromiso.id}`} className="text-xs text-gray-500">
                            Responsable
                          </label>
                          <input
                            id={`compromiso-resp-${compromiso.id}`}
                            type="text"
                            value={compromiso.responsable_id || ''}
                            onChange={(e) => onActualizarCompromiso(compromiso.id, 'responsable_id', e.target.value)}
                            placeholder="Nombre del responsable..."
                            className="w-full p-2 border rounded text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor={`compromiso-fecha-${compromiso.id}`} className="text-xs text-gray-500">
                            Fecha Límite
                          </label>
                          <input
                            id={`compromiso-fecha-${compromiso.id}`}
                            type="date"
                            value={compromiso.fecha || ''}
                            onChange={(e) => onActualizarCompromiso(compromiso.id, 'fecha', e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={() => onEliminarCompromiso(compromiso.id)} className="ml-2 text-red-500 hover:text-red-700">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No se requieren compromisos para "Sin Acuerdo"</p>
          <p className="text-sm">Continúe al siguiente paso.</p>
        </div>
      )}
    </div>
  );
}

interface StepConfirmarProps {
  form: CierreFormState;
  resumen: ResumenCierre | null;
  error: string | null;
  onUpdateForm: (updates: Partial<CierreFormState>) => void;
}

function StepConfirmar({ form, resumen, error, onUpdateForm }: StepConfirmarProps) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Resumen del Cierre</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Resultado:</span>
            <span className="font-medium capitalize">{form.resultado.replace('_', ' ')}</span>
          </div>

          {form.detalleResultado && (
            <div>
              <span className="text-gray-600">Detalle:</span>
              <p className="mt-1 p-2 bg-white rounded border">{form.detalleResultado}</p>
            </div>
          )}

          {(form.resultado === 'acuerdo_total' || form.resultado === 'acuerdo_parcial') && (
            <div className="flex justify-between">
              <span className="text-gray-600">Compromisos:</span>
              <span className="font-medium">{form.compromisos.filter((c) => c.descripcion).length}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Escenario 782:</span>
            <span className="font-medium">{form.escenarioProcedencia || 'No definido'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Divulgación:</span>
            <span className="font-medium">{form.autorizaDivulgacionResultado ? 'Autorizada' : 'Privada'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Expediente:</span>
            <span className="font-medium">{resumen?.expediente.folio || resumen?.expediente.id}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="gcc-consecuencias-incumplimiento" className="block text-sm font-medium">
          Consecuencias de incumplimiento de compromisos
        </label>
        <textarea
          id="gcc-consecuencias-incumplimiento"
          value={form.consecuenciasIncumplimiento}
          onChange={(e) => onUpdateForm({ consecuenciasIncumplimiento: e.target.value })}
          placeholder="Describa las consecuencias y siguiente ruta disciplinaria/formativa."
          className="min-h-20 w-full rounded-lg border p-3"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <label htmlFor="gcc-fecha-seguimiento" className="block text-sm font-medium mb-1">
            Fecha de seguimiento
          </label>
          <input
            id="gcc-fecha-seguimiento"
            type="date"
            value={form.fechaSeguimiento}
            onChange={(e) => onUpdateForm({ fechaSeguimiento: e.target.value })}
            className="w-full rounded-lg border p-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="gcc-evaluacion-resultado" className="block text-sm font-medium mb-1">
            Evaluación esperada
          </label>
          <input
            id="gcc-evaluacion-resultado"
            type="text"
            value={form.evaluacionResultado}
            onChange={(e) => onUpdateForm({ evaluacionResultado: e.target.value })}
            placeholder="Criterio de eficacia del acuerdo"
            className="w-full rounded-lg border p-2 text-sm"
          />
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <h4 className="font-medium text-yellow-900 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Confirmar Cierre
        </h4>
        <p className="text-sm text-yellow-800 mt-1">
          Esta acción cerrará la mediación y actualizará el estado del expediente. ¿Está seguro de continuar?
        </p>
      </div>

      {error && <div className="bg-red-50 p-4 rounded-lg text-red-700">{error}</div>}
    </div>
  );
}


/**
 * Componente principal
 */
export function GccCierreModal({ mediacionId, onClose, onCierreExitoso }: Props) {
  const { establecimiento } = useTenant();
  const { showToast } = useToast();
  const [state, dispatch] = useReducer(cierreModalReducer, INITIAL_MODAL_STATE);
  const { step, cargando, resumen, validacion, error, form } = state;
  const updateForm = useCallback((updates: Partial<CierreFormState>) => {
    dispatch({ type: 'UPDATE_FORM', payload: updates });
  }, []);
  const isCompromisoValido = (compromiso: Compromiso) =>
    Boolean(compromiso.descripcion?.trim()) && Boolean(compromiso.fecha);
  const validarCircular782 = (): string[] => {
    const errores: string[] = [];
    if (!form.aceptaParticipacion) {
      errores.push('Debe registrar participación voluntaria explícita.');
    }
    if (!form.escenarioProcedencia) {
      errores.push('Debe seleccionar escenario de procedencia.');
    }
    if (!form.consecuenciasIncumplimiento.trim()) {
      errores.push('Debe especificar consecuencias de incumplimiento de compromisos.');
    }
    if (!form.fechaSeguimiento) {
      errores.push('Debe definir fecha de seguimiento del acuerdo.');
    }
    if (form.resultado === 'acuerdo_total' || form.resultado === 'acuerdo_parcial') {
      const compromisosConDatos = form.compromisos.filter((c) => c.descripcion?.trim());
      if (compromisosConDatos.length === 0) {
        errores.push('Para acuerdos debe registrar al menos un compromiso.');
      }
      if (compromisosConDatos.some((c) => !isCompromisoValido(c))) {
        errores.push('Todos los compromisos deben incluir descripción y fecha de exigibilidad.');
      }
    }
    return errores;
  };
  const cargarResumen = useCallback(async () => {
    if (!mediacionId) return;
    dispatch({ type: 'RESET_FOR_MEDIACION' });
    if (!supabase) {
      dispatch({ type: 'SET_ERROR', payload: 'Cliente de base de datos no disponible' });
      return;
    }
    dispatch({ type: 'SET_CARGANDO', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const { data, error: rpcError } = await supabase.rpc('gcc_obtener_resumen_cierre', {
        p_mediacion_id: mediacionId,
      });
      if (rpcError) throw rpcError;
      if (data.error) {
        throw new Error(data.mensaje);
      }
      dispatch({ type: 'SET_RESUMEN', payload: data });
      dispatch({
        type: 'UPDATE_FORM',
        payload: {
          compromisos: (data.compromisos_previos || []).map((c: Compromiso) => ({ ...c, es_nuevo: false })),
        },
      });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Error al cargar datos' });
    } finally {
      dispatch({ type: 'SET_CARGANDO', payload: false });
    }
  }, [mediacionId]);
  const validarCierre = useCallback(async (resultadoSeleccionado: string) => {
    if (!mediacionId) return;
    if (!supabase) return false;
    try {
      const { data, error: rpcError } = await supabase.rpc('gcc_validar_cierre', {
        p_mediacion_id: mediacionId,
        p_resultado: resultadoSeleccionado,
      });
      if (rpcError) throw rpcError;
      dispatch({ type: 'SET_VALIDACION', payload: data });
      return data.valido;
    } catch (err) {
      console.error('Error validando:', err);
      return false;
    }
  }, [mediacionId]);
  const agregarCompromiso = () => {
    dispatch({
      type: 'UPDATE_FORM',
      payload: {
        compromisos: [
          ...form.compromisos,
          {
            id: crypto.randomUUID(),
            descripcion: '',
            es_nuevo: true,
          },
        ],
      },
    });
  };
  const eliminarCompromiso = (id: string) => {
    dispatch({
      type: 'UPDATE_FORM',
      payload: {
        compromisos: form.compromisos.filter((c) => c.id !== id),
      },
    });
  };
  const actualizarCompromiso = (id: string, campo: string, valor: unknown) => {
    dispatch({
      type: 'UPDATE_FORM',
      payload: {
        compromisos: form.compromisos.map((c) =>
        c.id === id ? { ...c, [campo]: valor } : c
      ),
      },
    });
  };
  const procesarCierre = async () => {
    if (!mediacionId || !establecimiento) return;
    if (!supabase) {
      dispatch({ type: 'SET_ERROR', payload: 'Cliente de base de datos no disponible' });
      return;
    }
    dispatch({ type: 'SET_CARGANDO', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');
      const errores782 = validarCircular782();
      if (errores782.length > 0) {
        throw new Error(errores782.join(' '));
      }
      const compromisosNuevos = form.compromisos
        .filter((c) => c.es_nuevo && isCompromisoValido(c))
        .map((c) => ({
          descripcion: c.descripcion,
          responsable_id: c.responsable_id || null,
          tipo_responsable: c.tipo_responsable || null,
          fecha_compromiso: c.fecha || null,
        }));
      const actaContenido: Record<string, unknown> = {
        resultado: form.resultado,
        detalleResultado: form.detalleResultado,
        compromisos: compromisosNuevos,
        circular782: {
          aceptaParticipacion: form.aceptaParticipacion,
          escenarioProcedencia: form.escenarioProcedencia,
          privacidadAcuerdos: !form.autorizaDivulgacionResultado,
          autorizaDivulgacionResultado: form.autorizaDivulgacionResultado,
          consecuenciasIncumplimiento: form.consecuenciasIncumplimiento,
          fechaSeguimiento: form.fechaSeguimiento,
          evaluacionResultado: form.evaluacionResultado,
          registroDialogoEscrito: true,
        },
      };
      const { data, error: rpcError } = await supabase.rpc('gcc_procesar_cierre_completo', {
        p_mediacion_id: mediacionId,
        p_resultado: form.resultado,
        p_detalle_resultado: form.detalleResultado,
        p_compromisos: compromisosNuevos,
        p_acta_contenido: actaContenido,
        p_usuario_id: user.id,
      });
      if (rpcError) throw rpcError;
      if (!data.success) {
        throw new Error(data.mensaje);
      }
      showToast('success', 'Mediación cerrada correctamente');
      onCierreExitoso({
        expediente_id: data.expediente_id,
        estado: data.estado,
      });
      onClose();
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Error al procesar cierre' });
      showToast('error', 'Error al procesar cierre', err instanceof Error ? err.message : 'Error al procesar cierre');
    } finally {
      dispatch({ type: 'SET_CARGANDO', payload: false });
    }
  };
  useEffect(() => {
    void cargarResumen();
  }, [cargarResumen]);

  const contentByStep: Record<number, React.ReactNode> = {
    1: <StepResumen resumen={resumen} />,
    2: (
      <StepResultado
        form={form}
        validacion={validacion}
        onUpdateForm={updateForm}
        onValidarResultado={validarCierre}
      />
    ),
    3: (
      <StepCompromisos
        form={form}
        onAgregarCompromiso={agregarCompromiso}
        onEliminarCompromiso={eliminarCompromiso}
        onActualizarCompromiso={actualizarCompromiso}
      />
    ),
    4: <StepConfirmar form={form} resumen={resumen} error={error} onUpdateForm={updateForm} />,
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl max-h-screen overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cierre de Mediación GCC</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Cerrar modal">
            <X className="h-5 w-5" />
          </button>
        </div>

        <ProgressSteps step={step} />

        {/* Contenido del paso */}
        <div className="p-4">
          {cargando && !resumen ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            contentByStep[step] ?? null
          )}
        </div>

        {/* Navigation */}
        <div className="p-4 border-t flex justify-between">
          {step > 1 ? (
            <button
              onClick={() => dispatch({ type: 'SET_STEP', payload: step - 1 })}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Atrás
            </button>
          ) : (
            <div />
          )}
          
          {step < 4 ? (
            <button
              onClick={() => dispatch({ type: 'SET_STEP', payload: step + 1 })}
              disabled={cargando}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              Siguiente <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button 
              onClick={procesarCierre} 
              disabled={cargando || (!!validacion && !validacion.valido)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
            >
              {cargando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Confirmar Cierre
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default GccCierreModal;

