/**
 * ExpedienteTransitions - Sistema de Gestión del Ciclo de Vida del Expediente
 * Cumple con Circular 782 - Transiciones de Estado Validadas
 *
 * Funcionalidades:
 * - Transiciones de estado entre etapas
 * - Validación de requisitos documentales por etapa
 * - Registro en bitácora automático
 */

import React, { useState, useMemo } from 'react';
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
  XCircle,
  Info
} from 'lucide-react';
import { EtapaProceso } from '@/types';
import { calcularDiasRestantes } from '@/shared/utils/plazos';

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

/**
 * Componente principal de transiciones
 */
const ExpedienteTransitions: React.FC<ExpedienteTransitionsProps> = ({
  expedienteId,
  onTransicionCompleta
}) => {
  const { user } = useAuth();
  const { expedientes, actualizarEtapa } = useConvivencia();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [transicionSeleccionada, setTransicionSeleccionada] = useState<Transicion | null>(null);
  const [requisitosVerificados, setRequisitosVerificados] = useState<Record<number, boolean>>({});

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
    setRequisitosVerificados(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Iniciar transición
  const iniciarTransicion = (transicion: Transicion) => {
    setTransicionSeleccionada(transicion);
    setShowConfirmDialog(true);
    // Resetear requisitos verificados
    const inicial: Record<number, boolean> = {};
    transicion.requisitos.forEach((_, i) => { inicial[i] = false; });
    setRequisitosVerificados(inicial);
  };

  // Ejecutar transición
  const ejecutarTransicion = async () => {
    if (!transicionSeleccionada || !expediente) return;

    setIsLoading(true);
    setError(null);

    try {
      // Verificar que todos los requisitos estén completados
      const requisitosCompletados = transicionSeleccionada.requisitos.every(
        (_, i) => requisitosVerificados[i]
      );

      if (!requisitosCompletados) {
        throw new Error('Debe verificar todos los requisitos antes de continuar');
      }

      const nuevaEtapa = transicionSeleccionada.hacia;

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
              transicion: transicionSeleccionada.label,
              requisitos_verificados: transicionSeleccionada.requisitos.filter((_, i) => requisitosVerificados[i])
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

      setShowConfirmDialog(false);
      setTransicionSeleccionada(null);

    } catch (err) {
      console.error('Error al ejecutar transición:', err);
      setError(err instanceof Error ? err.message : 'Error al ejecutar transición');
    } finally {
      setIsLoading(false);
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
      <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
        <p className="text-sm font-bold text-red-700">Expediente no encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra de progreso del ciclo de vida */}
      {!estaCerradoGCC && (
        <div className="bg-white rounded-[1.5rem] border border-slate-200 p-4 md:p-6">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-3 text-indigo-600" />
            Progreso del Ciclo de Vida
          </h3>

          <div className="relative">
            {/* Línea de progreso */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-slate-100 rounded" />
            <div
              className="absolute top-5 left-0 h-1 bg-indigo-500 rounded transition-all duration-500"
              style={{ width: `${(indiceActual / (PROGRESS_STEPS.length - 1)) * 100}%` }}
            />

            {/* Pasos */}
            <div className="relative flex justify-between">
              {PROGRESS_STEPS.map((etapa, index) => {
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
                      className={`mt-2 text-[10px] font-black uppercase tracking-widest text-center ${
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

          {/* Plazo fatal */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
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
      )}

      {/* Transiciones disponibles */}
      {transicionesDisponibles.length > 0 && !etapaActual.startsWith('CERRADO') && (
        <div className="bg-white rounded-[1.5rem] border border-slate-200 p-4 md:p-6">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center">
            <ArrowRight className="w-5 h-5 mr-3 text-indigo-600" />
            Acciones Disponibles
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transicionesDisponibles.map((transicion, index) => {
              const Icon = transicion.icon;

              return (
                <button
                  key={index}
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
                      <p className="text-[10px] font-bold text-slate-400 mt-2">
                        {transicion.requisitos.length} requisito(s) necesario(s)
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Diálogo de confirmación */}
      {showConfirmDialog && transicionSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className={`p-4 ${transicionSeleccionada.color} text-white`}>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <transicionSeleccionada.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black uppercase tracking-wide">
                    {transicionSeleccionada.label}
                  </p>
                  <p className="text-xs opacity-90">
                    {transicionSeleccionada.description}
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

              {/* Lista de requisitos */}
              <div className="space-y-3">
                {transicionSeleccionada.requisitos.map((requisito, index) => (
                  <label
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      requisitosVerificados[index]
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-white border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={requisitosVerificados[index] || false}
                      onChange={() => toggleRequisito(index)}
                      className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className={`text-sm font-medium ${
                      requisitosVerificados[index] ? 'text-emerald-700' : 'text-slate-700'
                    }`}>
                      {requisito}
                    </span>
                  </label>
                ))}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <p className="text-sm font-bold text-red-700">{error}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setTransicionSeleccionada(null);
                }}
                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarTransicion}
                disabled={isLoading || !Object.values(requisitosVerificados).every(v => v)}
                className={`px-6 py-3 rounded-xl font-bold text-xs uppercase transition-all flex items-center space-x-2 ${
                  isLoading || !Object.values(requisitosVerificados).every(v => v)
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : `${transicionSeleccionada.color} text-white hover:opacity-90`
                }`}
              >
                {isLoading ? (
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
      )}

      {/* Expediente cerrado */}
      {etapaActual.startsWith('CERRADO') && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-[1.5rem] p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500 text-white rounded-2xl">
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
