/**
 * =============================================================================
 * Componente: GccCierreModal
 * FASE 2 - SPRINT 3: Flujo de Cierre Unificado
 * =============================================================================
 * Modal guiado para cerrar una mediación GCC
 * Valida requisitos y procesa el cierre de forma atómica
 * =============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
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

/**
 * Componente principal
 */
export function GccCierreModal({ mediacionId, onClose, onCierreExitoso }: Props) {
  const { establecimiento } = useTenant();
  const { showToast } = useToast();
  
  // Estados
  const [step, setStep] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [resumen, setResumen] = useState<ResumenCierre | null>(null);
  const [validacion, setValidacion] = useState<ValidacionCierre | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Datos del formulario
  const [resultado, setResultado] = useState<'acuerdo_total' | 'acuerdo_parcial' | 'sin_acuerdo'>('sin_acuerdo');
  const [detalleResultado, setDetalleResultado] = useState('');
  const [compromisos, setCompromisos] = useState<Compromiso[]>([]);
  const [actaContenido] = useState<Record<string, unknown>>({});

  // Cargar resumen de cierre
  const cargarResumen = useCallback(async () => {
    if (!mediacionId) return;
    if (!supabase) {
      setError('Cliente de base de datos no disponible');
      return;
    }
    
    setCargando(true);
    setError(null);
    
    try {
      const { data, error: rpcError } = await supabase.rpc('gcc_obtener_resumen_cierre', {
        p_mediacion_id: mediacionId,
      });

      if (rpcError) throw rpcError;
      
      if (data.error) {
        throw new Error(data.mensaje);
      }
      
      setResumen(data);
      setCompromisos((data.compromisos_previos || []).map((c: Compromiso) => ({ ...c, es_nuevo: false })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setCargando(false);
    }
  }, [mediacionId]);

  // Validar cierre
  const validarCierre = useCallback(async (resultadoSeleccionado: string) => {
    if (!mediacionId) return;
    if (!supabase) return false;
    
    try {
      const { data, error: rpcError } = await supabase.rpc('gcc_validar_cierre', {
        p_mediacion_id: mediacionId,
        p_resultado: resultadoSeleccionado,
      });

      if (rpcError) throw rpcError;
      
      setValidacion(data);
      return data.valido;
    } catch (err) {
      console.error('Error validando:', err);
      return false;
    }
  }, [mediacionId]);

  // Agregar nuevo compromiso
  const agregarCompromiso = () => {
    setCompromisos([
      ...compromisos,
      {
        id: crypto.randomUUID(),
        descripcion: '',
        es_nuevo: true,
      },
    ]);
  };

  // Eliminar compromiso
  const eliminarCompromiso = (id: string) => {
    setCompromisos(compromisos.filter(c => c.id !== id));
  };

  // Actualizar compromiso
  const actualizarCompromiso = (id: string, campo: string, valor: unknown) => {
    setCompromisos(
      compromisos.map(c => 
        c.id === id ? { ...c, [campo]: valor } : c
      )
    );
  };

  // Procesar cierre
  const procesarCierre = async () => {
    if (!mediacionId || !establecimiento) return;
    if (!supabase) {
      setError('Cliente de base de datos no disponible');
      return;
    }
    
    setCargando(true);
    setError(null);
    
    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Filtrar solo compromisos nuevos
      const compromisosNuevos = compromisos
        .filter(c => c.es_nuevo && c.descripcion)
        .map(c => ({
          descripcion: c.descripcion,
          responsable_id: c.responsable_id || null,
          tipo_responsable: c.tipo_responsable || null,
          fecha_compromiso: c.fecha || null,
        }));

      // Procesar cierre
      const { data, error: rpcError } = await supabase.rpc('gcc_procesar_cierre_completo', {
        p_mediacion_id: mediacionId,
        p_resultado: resultado,
        p_detalle_resultado: detalleResultado,
        p_compromisos: JSON.stringify(compromisosNuevos),
        p_acta_contenido: JSON.stringify(actaContenido),
        p_usuario_id: user.id,
      });

      if (rpcError) throw rpcError;
      
      if (!data.success) {
        throw new Error(data.mensaje);
      }

      showToast('success', 'Mediación cerrada correctamente');
      
      // Notificar éxito
      onCierreExitoso({
        expediente_id: data.expediente_id,
        estado: data.estado,
      });
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar cierre');
      showToast('error', 'Error al procesar cierre', err instanceof Error ? err.message : 'Error al procesar cierre');
    } finally {
      setCargando(false);
    }
  };

  // Validar al cambiar resultado
  useEffect(() => {
    if (resultado) {
      validarCierre(resultado);
    }
  }, [resultado, validarCierre]);

  // Cargar datos al abrir
  useEffect(() => {
    if (mediacionId) {
      cargarResumen();
      setStep(1);
      setResultado('sin_acuerdo');
      setDetalleResultado('');
    }
  }, [mediacionId, cargarResumen]);

  // Renderizar pasos
  const renderStep = () => {
    if (cargando && !resumen) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      );
    }

    switch (step) {
      case 1:
        return renderStepResumen();
      case 2:
        return renderStepResultado();
      case 3:
        return renderStepCompromisos();
      case 4:
        return renderStepConfirmar();
      default:
        return null;
    }
  };

  // Paso 1: Resumen de la mediación
  const renderStepResumen = () => (
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
          {resumen?.participantes.map((p, i) => (
            <div key={`participante-${p.tipo}-${i}`} className="flex items-center justify-between text-sm">
              <span>{p.nombre} ({p.tipo})</span>
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

  // Paso 2: Seleccionar resultado
  const renderStepResultado = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Resultado de la Mediación
        </label>
        <div className="space-y-2">
          {[
            { value: 'acuerdo_total', label: 'Acuerdo Total', desc: 'Las partes llegaron a un acuerdo completo' },
            { value: 'acuerdo_parcial', label: 'Acuerdo Parcial', desc: 'Las partes llegaron a acuerdos en algunos puntos' },
            { value: 'sin_acuerdo', label: 'Sin Acuerdo', desc: 'Las partes no lograron ningún acuerdo' },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                resultado === option.value 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="resultado"
                value={option.value}
                checked={resultado === option.value}
                onChange={(e) => setResultado(e.target.value as typeof resultado)}
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
        <label className="block text-sm font-medium mb-2">
          Detalle del Resultado
        </label>
        <textarea
          value={detalleResultado}
          onChange={(e) => setDetalleResultado(e.target.value)}
          placeholder="Describa los términos del acuerdo o las razones por las que no se llegó a acuerdo..."
          className="min-h-24 w-full rounded-lg border p-3"
        />
      </div>

      {validacion && !validacion.valido && (
        <div className="bg-red-50 p-4 rounded-lg">
          <h4 className="font-medium text-red-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Errores de Validación
          </h4>
          <ul className="mt-2 text-sm text-red-700 space-y-1">
            {validacion.errores.map((err, i) => (
              <li key={`error-${i}`}>• {err}</li>
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
            {validacion.advertencias.map((adv, i) => (
              <li key={`warning-${i}`}>• {adv}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  // Paso 3: Compromisos
  const renderStepCompromisos = () => (
    <div className="space-y-4">
      {(resultado === 'acuerdo_total' || resultado === 'acuerdo_parcial') ? (
        <>
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Compromisos</h4>
            <button
              type="button"
              onClick={agregarCompromiso}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            >
              + Agregar Compromiso
            </button>
          </div>

          {compromisos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay compromisos registrados.</p>
              <p className="text-sm">Para acuerdos es necesario registrar al menos un compromiso.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {compromisos.map((compromiso) => (
                <div key={compromiso.id} className="p-3 border rounded-lg bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div>
                        <label className="text-xs text-gray-500">Descripción</label>
                        <input
                          type="text"
                          value={compromiso.descripcion}
                          onChange={(e) => actualizarCompromiso(compromiso.id, 'descripcion', e.target.value)}
                          placeholder="Descripción del compromiso..."
                          className="w-full p-2 border rounded text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500">Responsable</label>
                          <input
                            type="text"
                            value={compromiso.responsable_id || ''}
                            onChange={(e) => actualizarCompromiso(compromiso.id, 'responsable_id', e.target.value)}
                            placeholder="Nombre del responsable..."
                            className="w-full p-2 border rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Fecha Límite</label>
                          <input
                            type="date"
                            value={compromiso.fecha || ''}
                            onChange={(e) => actualizarCompromiso(compromiso.id, 'fecha', e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarCompromiso(compromiso.id)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
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

  // Paso 4: Confirmar
  const renderStepConfirmar = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Resumen del Cierre</h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Resultado:</span>
            <span className="font-medium capitalize">{resultado.replace('_', ' ')}</span>
          </div>
          
          {detalleResultado && (
            <div>
              <span className="text-gray-600">Detalle:</span>
              <p className="mt-1 p-2 bg-white rounded border">{detalleResultado}</p>
            </div>
          )}
          
          {(resultado === 'acuerdo_total' || resultado === 'acuerdo_parcial') && (
            <div className="flex justify-between">
              <span className="text-gray-600">Compromisos:</span>
              <span className="font-medium">{compromisos.filter(c => c.descripcion).length}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-600">Expediente:</span>
            <span className="font-medium">{resumen?.expediente.folio || resumen?.expediente.id}</span>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <h4 className="font-medium text-yellow-900 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Confirmar Cierre
        </h4>
        <p className="text-sm text-yellow-800 mt-1">
          Esta acción cerrará la mediación y actualizará el estado del expediente. 
          ¿Está seguro de continuar?
        </p>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg text-red-700">
          {error}
        </div>
      )}
    </div>
  );

  // Números de paso
  const steps = [
    { num: 1, label: 'Resumen' },
    { num: 2, label: 'Resultado' },
    { num: 3, label: 'Compromisos' },
    { num: 4, label: 'Confirmar' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl max-h-screen overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cierre de Mediación GCC</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Cerrar modal">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center py-4 px-4 border-b bg-gray-50">
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s.num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s.num ? <CheckCircle className="h-5 w-5" /> : s.num}
                </div>
                <span className="text-xs mt-1 text-gray-600">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-12 ${step > s.num ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Contenido del paso */}
        <div className="p-4">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="p-4 border-t flex justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Atrás
            </button>
          ) : (
            <div />
          )}
          
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
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
