/**
 * Centro de Mediación GCC - Gestión Colaborativa de Conflictos
 * Cumple con Circular 782, Artículo 8 - Mecanismos de Resolución Pacífica
 *
 * Funcionalidades:
 * - Derivación automática de expedientes a GCC
 * - Registro de procesos de mediación
 * - Seguimiento de compromisos reparatorios
 * - Cierre formativo de expedientes
 */

import React, { useMemo, useState, useEffect } from 'react';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { useTenant } from '@/shared/context/TenantContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/shared/lib/supabaseClient';
import {
  Handshake,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  Users,
  FileText,
  Info,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Send,
  X,
  FileCheck
} from 'lucide-react';
import {
  ResultadoMediacion,
} from '@/types';
import { useAuth } from '@/shared/hooks/useAuth';
import { useGccMetrics } from '@/shared/hooks';
import { useToast } from '@/shared/components/Toast/ToastProvider';

type MecanismoGCC = 'MEDIACION' | 'CONCILIACION' | 'ARBITRAJE_PEDAGOGICO' | 'NEGOCIACION_ASISTIDA';

type AlertaPlazo = 'OK' | 'T2' | 'T1' | 'VENCIDO';

const mecanismoLabel: Record<MecanismoGCC, string> = {
  MEDIACION: 'Mediacion',
  CONCILIACION: 'Conciliacion',
  ARBITRAJE_PEDAGOGICO: 'Arbitraje Pedagogico',
  NEGOCIACION_ASISTIDA: 'Negociacion Asistida'
};

const parseFecha = (value?: string | null): Date | null => {
  if (!value) return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;
  const parts = value.split('-');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const parsed = new Date(`${y}-${m}-${d}`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

const diffDias = (target: Date): number => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

const getAlertaPlazo = (fecha?: string | null): AlertaPlazo => {
  const parsed = parseFecha(fecha);
  if (!parsed) return 'OK';
  const days = diffDias(parsed);
  if (days < 0) return 'VENCIDO';
  if (days <= 1) return 'T1';
  if (days <= 2) return 'T2';
  return 'OK';
};

const formatUpdatedAgo = (iso: string | null): string => {
  if (!iso) return 'Sin actualización';
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) return `Actualizado hace ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  return `Actualizado hace ${diffMin}m`;
};

/**
 * Compromiso reparatorio
 */
interface Compromiso {
  id: string;
  descripcion: string;
  fechaCumplimiento: string;
  responsable: string;
  completado: boolean;
}

/**
 * Componente de Derivación a GCC
 */
interface DerivacionFormProps {
  expedienteId: string;
  estudianteNombre: string;
  mecanismo: MecanismoGCC;
  onMecanismoChange: (value: MecanismoGCC) => void;
  plazoFatal?: string | null;
  onDerivacionCompleta: (payload: {
    motivo: string;
    objetivos: string[];
    mediadorAsignado: string;
    fechaMediacion: string;
  }) => void;
  onCancelar: () => void;
}

const DerivacionForm: React.FC<DerivacionFormProps> = ({
  expedienteId,
  estudianteNombre,
  mecanismo,
  onMecanismoChange,
  plazoFatal,
  onDerivacionCompleta,
  onCancelar
}) => {
  const [motivo, setMotivo] = useState('');
  const [objetivos, setObjetivos] = useState<string[]>(['']);
  const [mediadorAsignado, setMediadorAsignado] = useState('');
  const [fechaMediacion, setFechaMediacion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediadores = [
    'Psicóloga Ana María González',
    'Psicólogo Roberto Martínez',
    'Educadora Carla Herrera',
    'Orientador Luis Vega'
  ];

  const alertaPlazo = getAlertaPlazo(plazoFatal);

  const agregarObjetivo = () => setObjetivos([...objetivos, '']);

  const actualizarObjetivo = (index: number, valor: string) => {
    const nuevos = [...objetivos];
    nuevos[index] = valor;
    setObjetivos(nuevos);
  };

  const eliminarObjetivo = (index: number) => {
    setObjetivos(objetivos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Simular creación de derivación
      await new Promise(resolve => setTimeout(resolve, 1000));
      onDerivacionCompleta({
        motivo,
        objetivos: objetivos.filter(o => o.trim() !== ''),
        mediadorAsignado,
        fechaMediacion
      });
    } catch (err) {
      setError('Error al crear derivación');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-emerald-100 shadow-xl shadow-emerald-200/20 p-4 md:p-10 animate-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center">
          <Send className="w-6 h-6 mr-3 text-emerald-600" />
          Derivación a Centro de Mediación GCC
        </h3>
        <button onClick={onCancelar} className="p-2 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl">
        <p className="text-sm font-bold text-blue-800">
          Derivando a: <span className="font-black uppercase">{estudianteNombre}</span>
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Folio: {expedienteId}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Mecanismo GCC
          </label>
          <select
            value={mecanismo}
            onChange={(e) => onMecanismoChange(e.target.value as MecanismoGCC)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-300 focus:outline-none"
          >
            <option value="MEDIACION">Mediacion (formal)</option>
            <option value="CONCILIACION">Conciliacion (formal)</option>
            <option value="ARBITRAJE_PEDAGOGICO">Arbitraje Pedagogico (formal)</option>
            <option value="NEGOCIACION_ASISTIDA">Negociacion Asistida (gestion previa)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Motivo de Derivación *
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
            rows={4}
            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-300 focus:outline-none resize-none"
            placeholder="Describa brevemente el conflicto que será derivado a mediación..."
          />
        </div>

        {plazoFatal && (
          <div className={`rounded-2xl border px-4 py-3 ${
            alertaPlazo === 'VENCIDO'
              ? 'bg-red-50 border-red-200'
              : alertaPlazo === 'T1'
                ? 'bg-rose-50 border-rose-200'
                : alertaPlazo === 'T2'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-emerald-50 border-emerald-200'
          }`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">
              Control de Plazo GCC
            </p>
            <p className="text-xs font-bold mt-1 text-slate-700">
              {alertaPlazo === 'VENCIDO' && 'Caso GCC vencido, requiere accion inmediata.'}
              {alertaPlazo === 'T1' && 'Caso GCC vence manana (alerta alta).'}
              {alertaPlazo === 'T2' && 'Caso GCC próximo al vencimiento (faltan 2 días).'}
              {alertaPlazo === 'OK' && 'Plazo en rango normal.'}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Objetivos de la Mediación
          </label>
          {objetivos.map((obj, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={obj}
                onChange={(e) => actualizarObjetivo(index, e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-300 focus:outline-none"
                placeholder={`Objetivo ${index + 1}`}
              />
              {objetivos.length > 1 && (
                <button
                  type="button"
                  onClick={() => eliminarObjetivo(index)}
                  className="p-2 text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={agregarObjetivo}
            className="flex items-center space-x-2 text-sm font-bold text-emerald-600 hover:text-emerald-700"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Objetivo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Mediador Asignado
            </label>
            <select
              value={mediadorAsignado}
              onChange={(e) => setMediadorAsignado(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-300 focus:outline-none"
            >
              <option value="">Seleccionar mediador...</option>
              {mediadores.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Fecha Programada
            </label>
            <input
              type="date"
              value={fechaMediacion}
              onChange={(e) => setFechaMediacion(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-300 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancelar}
            className="flex-1 py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || !motivo.trim()}
            className="flex-[2] py-4 rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Derivando...' : 'Confirmar Derivación'}
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * Componente de Resultado de Mediación
 */
interface ResultadoFormProps {
  onCompleto: (payload: {
    resultado: ResultadoMediacion;
    acuerdos: string[];
    compromisos: string[];
    observaciones: string;
  }) => void;
}

const ResultadoForm: React.FC<ResultadoFormProps> = ({
  onCompleto
}) => {
  const [resultado, setResultado] = useState<ResultadoMediacion>('sin_acuerdo');
  const [acuerdos, setAcuerdos] = useState<string[]>(['']);
  const [compromisos, setCompromisos] = useState<string[]>(['']);
  const [observaciones, setObservaciones] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const agregarAcuerdo = () => setAcuerdos([...acuerdos, '']);
  const agregarCompromiso = () => setCompromisos([...compromisos, '']);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      onCompleto({
        resultado,
        acuerdos: acuerdos.filter((item) => item.trim() !== ''),
        compromisos: compromisos.filter((item) => item.trim() !== ''),
        observaciones
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resultados: { value: ResultadoMediacion; label: string; color: string }[] = [
    { value: 'acuerdo_total', label: 'Acuerdo Total', color: 'bg-emerald-500' },
    { value: 'acuerdo_parcial', label: 'Acuerdo Parcial', color: 'bg-yellow-500' },
    { value: 'sin_acuerdo', label: 'Sin Acuerdo', color: 'bg-orange-500' },
    { value: 'no_conciliables', label: 'No Conciliables', color: 'bg-red-500' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
          Resultado de la Mediación *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {resultados.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setResultado(r.value)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                resultado === r.value
                  ? `${r.color} text-white border-transparent shadow-lg`
                  : 'border-slate-200 text-slate-600 hover:border-emerald-300'
              }`}
            >
              <span className="text-xs font-black uppercase">{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
          Acuerdos Alcanzados
        </label>
        {acuerdos.map((a, i) => (
          <textarea
            key={i}
            value={a}
            onChange={(e) => {
              const nuevos = [...acuerdos];
              nuevos[i] = e.target.value;
              setAcuerdos(nuevos);
            }}
            rows={2}
            className="w-full px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-300 focus:outline-none resize-none"
            placeholder={`Acuerdo ${i + 1}`}
          />
        ))}
        <button
          type="button"
          onClick={agregarAcuerdo}
          className="flex items-center space-x-2 text-sm font-bold text-emerald-600 hover:text-emerald-700"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Acuerdo</span>
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
          Compromisos Reparatorios
        </label>
        {compromisos.map((c, i) => (
          <input
            key={i}
            type="text"
            value={c}
            onChange={(e) => {
              const nuevos = [...compromisos];
              nuevos[i] = e.target.value;
              setCompromisos(nuevos);
            }}
            className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 focus:outline-none"
            placeholder={`Compromiso ${i + 1}`}
          />
        ))}
        <button
          type="button"
          onClick={agregarCompromiso}
          className="flex items-center space-x-2 text-sm font-bold text-blue-600 hover:text-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Compromiso</span>
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
          Observaciones
        </label>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-300 focus:outline-none resize-none"
          placeholder="Observaciones adicionales..."
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all disabled:opacity-50"
      >
        {isLoading ? 'Guardando...' : 'Registrar Resultado'}
      </button>
    </form>
  );
};

/**
 * Componente Principal: Centro de Mediación GCC
 */
const CentroMediacionGCC: React.FC = () => {
  const navigate = useNavigate();
  const { expedientes, setExpedientes, setExpedienteSeleccionado } = useConvivencia();
  const { tenantId } = useTenant();
  const { usuario } = useAuth();
  const { metrics: gccMetrics, refresh: refreshGccMetrics, isLoading: isLoadingGcc, lastUpdatedAt, freshness } = useGccMetrics();
  const toast = useToast();

  // Estados
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showDerivacionForm, setShowDerivacionForm] = useState(false);
  const [showResultadoForm, setShowResultadoForm] = useState(false);
  const [showActaPreview, setShowActaPreview] = useState(false);
  const [compromisos, setCompromisos] = useState<Compromiso[]>([]);
  const [statusGCC, setStatusGCC] = useState<'PROCESO' | 'LOGRADO' | 'NO_ACUERDO'>('PROCESO');
  const [mecanismoSeleccionado, setMecanismoSeleccionado] = useState<MecanismoGCC>('MEDIACION');
  const [selectedMediacionId, setSelectedMediacionId] = useState<string | null>(null);

  // Datos del formulario
  const [facilitador, setFacilitador] = useState('Psicóloga Ana María González');
  const [nuevoCompromiso, setNuevoCompromiso] = useState({
    descripcion: '',
    fecha: '',
    responsable: ''
  });

  useEffect(() => {
    // Cargar mediaciones al montar
    console.log('Cargando mediaciones...');
  }, []);

  // Filtrar casos disponibles para GCC (usando valores de EtapaProceso正确os)
  const casosParaGCC = expedientes.filter(e =>
    e.etapa === 'INVESTIGACION' ||
    e.etapa === 'NOTIFICADO' ||
    e.etapa === 'DESCARGOS'
  );

  const casosConDerivacion = expedientes.filter(e =>
    e.etapa === 'CERRADO_GCC'
  );

  const estadoProcesoToStatus = (estadoProceso?: string | null): 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO' => {
    if (estadoProceso === 'acuerdo_total' || estadoProceso === 'acuerdo_parcial') return 'LOGRADO';
    if (estadoProceso === 'sin_acuerdo') return 'NO_ACUERDO';
    return 'PROCESO';
  };

  const statusToEstadoProceso = (value: 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO') => {
    if (value === 'LOGRADO') return 'acuerdo_total';
    if (value === 'NO_ACUERDO') return 'sin_acuerdo';
    return 'en_proceso';
  };

  const fetchMediacionActiva = async (expedienteDbId?: string) => {
    if (!supabase || !tenantId || !expedienteDbId) return null;
    const { data, error } = await supabase
      .from('mediaciones_gcc_v2')
      .select('id, tipo_mecanismo, estado_proceso')
      .eq('establecimiento_id', tenantId)
      .eq('expediente_id', expedienteDbId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data;
  };

  // Seleccionar caso
  const handleSelectCase = async (caseId: string) => {
    setSelectedCaseId(caseId);
    const exp = expedientes.find(e => e.id === caseId);
    if (exp) {
      setExpedienteSeleccionado(exp);
      const mediacion = await fetchMediacionActiva(exp.dbId);
      if (mediacion?.id) {
        setSelectedMediacionId(mediacion.id);
        if (
          mediacion.tipo_mecanismo === 'MEDIACION' ||
          mediacion.tipo_mecanismo === 'CONCILIACION' ||
          mediacion.tipo_mecanismo === 'ARBITRAJE_PEDAGOGICO'
        ) {
          setMecanismoSeleccionado(mediacion.tipo_mecanismo);
        }
        setStatusGCC(estadoProcesoToStatus(mediacion.estado_proceso));
      } else {
        setSelectedMediacionId(null);
      }
    }
    setShowDerivacionForm(false);
    setShowResultadoForm(false);
    setShowActaPreview(false);
  };

  // Manejar derivación completa
  const handleDerivacionCompleta = async (payload: {
    motivo: string;
    objetivos: string[];
    mediadorAsignado: string;
    fechaMediacion: string;
  }) => {
    if (!selectedCaseId) return;
    const target = expedientes.find((e) => e.id === selectedCaseId);
    if (!target?.dbId || !tenantId || !usuario?.id || !supabase) {
      toast?.showToast('error', 'GCC', 'Falta contexto para guardar la derivacion.');
      return;
    }
    setShowDerivacionForm(false);
    const fechaLimite = target.plazoFatal ? new Date(target.plazoFatal) : new Date(Date.now() + (5 * 24 * 60 * 60 * 1000));
    const { data: mediacion, error: mediacionError } = await supabase
      .from('mediaciones_gcc_v2')
      .insert({
        establecimiento_id: tenantId,
        expediente_id: target.dbId,
        tipo_mecanismo: mecanismoSeleccionado === 'NEGOCIACION_ASISTIDA' ? 'MEDIACION' : mecanismoSeleccionado,
        estado_proceso: 'abierta',
        efecto_suspensivo_activo: true,
        fecha_inicio: new Date().toISOString(),
        fecha_limite_habil: fechaLimite.toISOString().slice(0, 10),
        motivo_derivacion: [payload.motivo, ...payload.objetivos].filter(Boolean).join(' | '),
        created_by: usuario.id,
        facilitador_id: usuario.id
      })
      .select('id')
      .single();

    if (mediacionError || !mediacion?.id) {
      toast?.showToast('error', 'GCC', `No se pudo crear la mediacion: ${mediacionError?.message ?? 'sin detalle'}`);
      return;
    }

    setSelectedMediacionId(mediacion.id);

    const { error: hitoError } = await supabase
      .from('hitos_gcc_v2')
      .insert({
        establecimiento_id: tenantId,
        mediacion_id: mediacion.id,
        tipo_hito: 'INICIO',
        descripcion: `Inicio ${mecanismoLabel[mecanismoSeleccionado]}${payload.mediadorAsignado ? ` - Facilitador: ${payload.mediadorAsignado}` : ''}`,
        registrado_por: usuario.id,
        datos_adicionales: {
          fecha_programada: payload.fechaMediacion || null,
          objetivos: payload.objetivos
        }
      });

    if (hitoError) {
      toast?.showToast('warning', 'GCC', `Mediacion creada, pero hito no guardado: ${hitoError.message}`);
    }

    const { error: expError } = await supabase
      .from('expedientes')
      .update({ etapa_proceso: 'CERRADO_GCC', estado_legal: 'pausa_legal' })
      .eq('id', target.dbId);

    if (expError) {
      toast?.showToast('error', 'GCC', `Mediacion creada, pero no se pudo pausar el expediente: ${expError.message}`);
      return;
    }

    setExpedientes(prev => prev.map(e =>
      e.id === selectedCaseId ? { ...e, etapa: 'CERRADO_GCC' as const } : e
    ));
    await refreshGccMetrics();
    toast?.showToast('success', 'GCC', `Derivacion creada (${mecanismoLabel[mecanismoSeleccionado]}).`);
  };

  // Agregar compromiso
  const agregarCompromiso = () => {
    if (!nuevoCompromiso.descripcion || !nuevoCompromiso.fecha) return;

    const compromiso: Compromiso = {
      id: Math.random().toString(36).substr(2, 9),
      descripcion: nuevoCompromiso.descripcion,
      fechaCumplimiento: nuevoCompromiso.fecha,
      responsable: nuevoCompromiso.responsable || 'Estudiante',
      completado: false
    };

    setCompromisos(prev => [...prev, compromiso]);
    setNuevoCompromiso({ descripcion: '', fecha: '', responsable: '' });

    if (supabase && tenantId && selectedMediacionId && usuario?.id) {
      void supabase.from('compromisos_gcc_v2').insert({
        establecimiento_id: tenantId,
        mediacion_id: selectedMediacionId,
        descripcion: compromiso.descripcion,
        responsable_id: usuario.id,
        tipo_responsable: compromiso.responsable || 'FACILITADOR',
        fecha_compromiso: compromiso.fechaCumplimiento,
        cumplimiento_verificado: false
      });
    }
  };

  // Eliminar compromiso
  const eliminarCompromiso = (id: string) => {
    setCompromisos(prev => prev.filter(c => c.id !== id));
  };

  // Toggle cumplimiento
  const toggleCumplimiento = (id: string) => {
    setCompromisos(prev => {
      const target = prev.find((c) => c.id === id);
      const updated = prev.map(c =>
        c.id === id ? { ...c, completado: !c.completado } : c
      );
      if (target && supabase && tenantId && selectedMediacionId) {
        void supabase
          .from('compromisos_gcc_v2')
          .update({
            cumplimiento_verificado: !target.completado,
            fecha_verificacion: !target.completado ? new Date().toISOString().slice(0, 10) : null
          })
          .eq('establecimiento_id', tenantId)
          .eq('mediacion_id', selectedMediacionId)
          .eq('descripcion', target.descripcion);
      }
      return updated;
    });
  };

  const handleResultadoCompleto = async (payload: {
    resultado: ResultadoMediacion;
    acuerdos: string[];
    compromisos: string[];
    observaciones: string;
  }) => {
    if (!selectedMediacionId || !tenantId || !usuario?.id || !supabase) {
      toast?.showToast('error', 'GCC', 'No hay mediacion activa para registrar resultado.');
      return;
    }

    const estadoProceso =
      payload.resultado === 'acuerdo_total'
        ? 'acuerdo_total'
        : payload.resultado === 'acuerdo_parcial'
          ? 'acuerdo_parcial'
          : payload.resultado === 'sin_acuerdo' || payload.resultado === 'no_conciliables'
            ? 'sin_acuerdo'
            : 'en_proceso';

    const { error: updError } = await supabase
      .from('mediaciones_gcc_v2')
      .update({
        estado_proceso: estadoProceso,
        resultado_final: payload.resultado
      })
      .eq('id', selectedMediacionId)
      .eq('establecimiento_id', tenantId);

    if (updError) {
      toast?.showToast('error', 'GCC', `No se pudo guardar resultado: ${updError.message}`);
      return;
    }

    const tipoActa =
      payload.resultado === 'sin_acuerdo' || payload.resultado === 'no_conciliables'
        ? 'CONSTANCIA'
        : mecanismoSeleccionado === 'CONCILIACION'
          ? 'ACTA_CONCILIACION'
          : mecanismoSeleccionado === 'ARBITRAJE_PEDAGOGICO'
            ? 'ACTA_ARBITRAJE'
            : 'ACTA_MEDIACION';

    await supabase.from('actas_gcc_v2').insert({
      establecimiento_id: tenantId,
      mediacion_id: selectedMediacionId,
      tipo_acta: tipoActa,
      contenido_json: {
        resultado: payload.resultado,
        acuerdos: payload.acuerdos,
        observaciones: payload.observaciones
      },
      fecha_emision: new Date().toISOString().slice(0, 10),
      observaciones: payload.observaciones
    });

    if (payload.compromisos.length > 0) {
      await supabase.from('compromisos_gcc_v2').insert(
        payload.compromisos.map((descripcion) => ({
          establecimiento_id: tenantId,
          mediacion_id: selectedMediacionId,
          descripcion,
          responsable_id: usuario.id,
          tipo_responsable: 'FACILITADOR',
          fecha_compromiso: new Date().toISOString().slice(0, 10),
          cumplimiento_verificado: false
        }))
      );
    }

    await supabase.from('hitos_gcc_v2').insert({
      establecimiento_id: tenantId,
      mediacion_id: selectedMediacionId,
      tipo_hito: payload.resultado === 'acuerdo_total' || payload.resultado === 'acuerdo_parcial' ? 'ACUERDO_FINAL' : 'SIN_ACUERDO',
      descripcion: `Resultado GCC: ${payload.resultado}`,
      registrado_por: usuario.id,
      datos_adicionales: { acuerdos: payload.acuerdos.length, compromisos: payload.compromisos.length }
    });

    setStatusGCC(estadoProcesoToStatus(estadoProceso));
    setShowResultadoForm(false);
    await refreshGccMetrics();
    toast?.showToast('success', 'GCC', 'Resultado registrado correctamente.');
  };

  // Cierre exitoso
  const handleCierreExitoso = async () => {
    if (!selectedCaseId) return;
    const target = expedientes.find((e) => e.id === selectedCaseId);
    if (!target?.dbId || !tenantId || !usuario?.id || !selectedMediacionId || !supabase) {
      toast?.showToast('error', 'GCC', 'No hay contexto para cerrar el proceso.');
      return;
    }

    const { error: mediacionError } = await supabase
      .from('mediaciones_gcc_v2')
      .update({
        estado_proceso: statusToEstadoProceso(statusGCC),
        fecha_cierre: new Date().toISOString(),
        efecto_suspensivo_activo: false
      })
      .eq('id', selectedMediacionId)
      .eq('establecimiento_id', tenantId);

    if (mediacionError) {
      toast?.showToast('error', 'GCC', `No se pudo cerrar mediacion: ${mediacionError.message}`);
      return;
    }

    const { error: hitoError } = await supabase.from('hitos_gcc_v2').insert({
      establecimiento_id: tenantId,
      mediacion_id: selectedMediacionId,
      tipo_hito: 'CIERRE',
      descripcion: `Cierre GCC (${statusGCC})`,
      registrado_por: usuario.id,
      datos_adicionales: { estado_final: statusGCC }
    });
    if (hitoError) {
      toast?.showToast('warning', 'GCC', `Cierre guardado sin hito final: ${hitoError.message}`);
    }

    if (statusGCC === 'NO_ACUERDO') {
      await supabase
        .from('expedientes')
        .update({ etapa_proceso: 'INVESTIGACION', estado_legal: 'investigacion' })
        .eq('id', target.dbId);

      setExpedientes(prev => prev.map(e =>
        e.id === selectedCaseId ? { ...e, etapa: 'INVESTIGACION' as const } : e
      ));
    } else {
      setExpedientes(prev => prev.map(e =>
        e.id === selectedCaseId ? { ...e, etapa: 'CERRADO_GCC' as const } : e
      ));
    }
    await refreshGccMetrics();
    toast?.showToast('success', 'GCC', 'Proceso GCC cerrado correctamente.');
  };

  const handleDestrabarDesdeGCC = async () => {
    if (!selectedCaseId) return;
    const targetExp = expedientes.find(e => e.id === selectedCaseId);
    if (!targetExp) return;
    if (!supabase || !tenantId || !targetExp.dbId) {
      toast?.showToast('error', 'GCC', 'No hay contexto para destrabar el expediente.');
      return;
    }

    if (selectedMediacionId) {
      await supabase
        .from('mediaciones_gcc_v2')
        .update({
          estado_proceso: 'sin_acuerdo',
          fecha_cierre: new Date().toISOString(),
          efecto_suspensivo_activo: false
        })
        .eq('id', selectedMediacionId)
        .eq('establecimiento_id', tenantId);
    }

    const { error } = await supabase
      .from('expedientes')
      .update({
        etapa_proceso: 'INVESTIGACION',
        estado_legal: 'investigacion'
      })
      .eq('id', targetExp.dbId);
    if (error) {
      toast?.showToast('error', 'GCC', `No se pudo sacar de GCC: ${error.message}`);
      return;
    }

    setExpedientes(prev =>
      prev.map(e => (e.id === selectedCaseId ? { ...e, etapa: 'INVESTIGACION' as const } : e))
    );
    const updated = { ...targetExp, etapa: 'INVESTIGACION' as const };
    setExpedienteSeleccionado(updated);
    await refreshGccMetrics();
    toast?.showToast('success', 'GCC', 'Caso destrabado. Puedes continuar en la ruta del expediente.');
    navigate(`/expedientes/${selectedCaseId}`);
  };

  // Caso seleccionado
  const casoSeleccionado = selectedCaseId
    ? expedientes.find(e => e.id === selectedCaseId)
    : null;

  const actaTemplate = useMemo(() => {
    if (!casoSeleccionado) return '';
    const templateId = statusGCC === 'NO_ACUERDO'
      ? 'CONSTANCIA_SIN_ACUERDO'
      : mecanismoSeleccionado === 'CONCILIACION'
        ? 'ACTA_CONCILIACION'
        : mecanismoSeleccionado === 'ARBITRAJE_PEDAGOGICO'
          ? 'ACTA_ARBITRAJE'
          : 'ACTA_MEDIACION';
    return [
      `Template: ${templateId}`,
      `Folio: ${casoSeleccionado.id}`,
      `Estudiante: ${casoSeleccionado.nnaNombre}`,
      `Mecanismo: ${mecanismoLabel[mecanismoSeleccionado]}`,
      `Estado GCC: ${statusGCC.replace('_', ' ')}`,
      `Facilitador: ${facilitador}`,
      `Compromisos: ${compromisos.length}`,
      '',
      'Resumen de acuerdos y acciones reparatorias:',
      '- '
    ].join('\n');
  }, [casoSeleccionado, statusGCC, mecanismoSeleccionado, facilitador, compromisos.length]);

  return (
    <main className="flex-1 p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-emerald-50/30 overflow-y-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center flex-wrap gap-4">
          <div className="p-4 bg-emerald-600 text-white rounded-[1.5rem] shadow-xl shadow-emerald-200">
            <Handshake className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Centro de Mediación Escolar (GCC)
            </h2>
            <p className="text-emerald-700 font-bold text-xs md:text-sm">
              Gestión de Conflictos con Enfoque Formativo - Circular 782
            </p>
          </div>
        </div>
        <div className="bg-white px-4 md:px-6 py-3 rounded-2xl border border-emerald-100 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 min-w-[300px]">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase">Activos</p>
            <p className="text-sm font-black text-slate-800">{gccMetrics.activos}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase">Vence en 2 días</p>
            <p className="text-sm font-black text-amber-700">{gccMetrics.t2}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase">Vence mañana</p>
            <p className="text-sm font-black text-rose-700">{gccMetrics.t1}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase">Vencidos</p>
            <p className="text-sm font-black text-red-700">{gccMetrics.vencidos}</p>
          </div>
          <div className="col-span-2 md:col-span-4">
            <p className="text-[10px] font-bold text-slate-500 text-right inline-flex items-center gap-1 justify-end w-full">
              <span className={`inline-block h-2 w-2 rounded-full ${
                freshness === 'fresh'
                  ? 'bg-emerald-500'
                  : freshness === 'stale'
                    ? 'bg-amber-500'
                    : freshness === 'old'
                      ? 'bg-red-500'
                      : 'bg-slate-400'
              }`} />
              {isLoadingGcc ? 'Actualizando...' : formatUpdatedAgo(lastUpdatedAt)}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Casos */}
        <section className="space-y-6">
          {/* Casos para derivar */}
          <div className="bg-white rounded-[2.5rem] border border-emerald-100 shadow-xl shadow-emerald-200/20 p-4 md:p-8">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center">
              <Users className="w-5 h-5 mr-3 text-emerald-600" />
              Casos Disponibles para GCC
            </h3>
            {casosParaGCC.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No hay casos disponibles para derivación
              </p>
            ) : (
              <div className="space-y-3">
                {casosParaGCC.map(exp => (
                  <button
                    key={exp.id}
                    onClick={() => handleSelectCase(exp.id)}
                    className={`w-full p-4 md:p-6 rounded-[1.5rem] border-2 transition-all text-left ${
                      selectedCaseId === exp.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-50 bg-white hover:border-emerald-200 hover:bg-emerald-50/30'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className={`text-xs font-black uppercase tracking-tight ${
                        selectedCaseId === exp.id ? 'text-emerald-700' : 'text-slate-800'
                      }`}>
                        {exp.nnaNombre}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 font-mono mt-1">
                        Folio: {exp.id}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Casos en proceso */}
          <div className="bg-white rounded-[2.5rem] border border-blue-100 shadow-xl shadow-blue-200/20 p-4 md:p-8">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center">
              <Clock className="w-5 h-5 mr-3 text-blue-600" />
              Procesos GCC Activos
            </h3>
            {casosConDerivacion.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No hay procesos activos
              </p>
            ) : (
              <div className="space-y-3">
                {casosConDerivacion.map(exp => (
                  (() => {
                    const alerta = getAlertaPlazo(exp.plazoFatal);
                    return (
                  <button
                    key={exp.id}
                    onClick={() => handleSelectCase(exp.id)}
                    className="w-full p-4 md:p-6 rounded-[1.5rem] border-2 border-blue-50 bg-blue-50/30 text-left hover:border-blue-200 transition-all"
                  >
                    <p className="text-xs font-black uppercase tracking-tight text-slate-800">
                      {exp.nnaNombre}
                    </p>
                    <p className="text-[10px] font-bold text-blue-600 uppercase mt-1">
                      En proceso GCC
                    </p>
                    {alerta !== 'OK' && (
                      <p className={`text-[10px] font-black uppercase mt-1 ${
                        alerta === 'VENCIDO'
                          ? 'text-red-700'
                          : alerta === 'T1'
                            ? 'text-rose-700'
                            : 'text-amber-700'
                      }`}>
                        {alerta === 'VENCIDO' ? 'Vencido' : alerta === 'T1' ? 'Vence mañana' : 'Vence en 2 días'}
                      </p>
                    )}
                  </button>
                    );
                  })()
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-emerald-600 text-white p-4 md:p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-500/20 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-all duration-700" />
            <h4 className="text-lg md:text-xl font-black uppercase tracking-tight mb-4">
              ¿Por qué GCC?
            </h4>
            <p className="text-[10px] md:text-[11px] text-emerald-100 font-medium leading-relaxed mb-6">
              La Circular 782 prioriza la resolución pacífica. Un acuerdo logrado mediante GCC
              extingue la necesidad de medidas punitivas y fomenta la reparación real del daño.
            </p>
          </div>
        </section>

        {/* Columna Derecha: Panel de Trabajo */}
        <section className="lg:col-span-2 space-y-8">
          {showDerivacionForm && casoSeleccionado ? (
            <DerivacionForm
              expedienteId={casoSeleccionado.id}
              estudianteNombre={casoSeleccionado.nnaNombre}
              mecanismo={mecanismoSeleccionado}
              onMecanismoChange={setMecanismoSeleccionado}
              plazoFatal={casoSeleccionado.plazoFatal}
              onDerivacionCompleta={handleDerivacionCompleta}
              onCancelar={() => setShowDerivacionForm(false)}
            />
          ) : showResultadoForm && selectedCaseId ? (
            <div className="bg-white rounded-[2.5rem] border border-emerald-100 shadow-xl shadow-emerald-200/20 p-4 md:p-10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center">
                  <FileCheck className="w-6 h-6 mr-3 text-emerald-600" />
                  Registrar Resultado de Mediación
                </h3>
                <button onClick={() => setShowResultadoForm(false)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ResultadoForm
                onCompleto={(payload) => void handleResultadoCompleto(payload)}
              />
            </div>
          ) : casoSeleccionado ? (
            <div className="bg-white rounded-[2.5rem] border border-emerald-100 shadow-xl shadow-emerald-200/20 p-4 md:p-10 animate-in zoom-in-95 duration-500">
              {/* Notificación de Suspensión */}
              <div className="mb-10 p-4 md:p-6 bg-blue-50 border-2 border-blue-200 border-dashed rounded-[2rem] flex items-center space-x-6">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">
                    Efecto Suspensivo Activo
                  </h5>
                  <p className="text-[11px] text-blue-600 font-bold leading-tight">
                    Mientras este proceso GCC esté en curso, el procedimiento disciplinario
                    punitivo (Folio {casoSeleccionado.id}) se mantiene en pausa legal.
                  </p>
                </div>
              </div>

              <div className="mb-8 flex flex-wrap gap-3">
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                  Mecanismo: {mecanismoLabel[mecanismoSeleccionado]}
                </span>
                {(() => {
                  const alerta = getAlertaPlazo(casoSeleccionado.plazoFatal);
                  if (alerta === 'OK') {
                    return (
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        Plazo en rango
                      </span>
                    );
                  }
                  if (alerta === 'T2') {
                    return (
                      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">
                        Vence en 2 días
                      </span>
                    );
                  }
                  if (alerta === 'T1') {
                    return (
                      <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-rose-700">
                        Vence mañana
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-700">
                      Vencido
                    </span>
                  );
                })()}
              </div>

              {/* Acciones rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                <button
                  onClick={() => setShowDerivacionForm(true)}
                  className="p-4 md:p-6 bg-emerald-50 border-2 border-emerald-200 rounded-[1.5rem] hover:bg-emerald-100 transition-all flex items-center space-x-4"
                >
                  <Send className="w-6 h-6 text-emerald-600" />
                  <span className="text-sm font-black text-emerald-700 uppercase">
                    Nueva Derivación
                  </span>
                </button>
                <button
                  onClick={() => setShowResultadoForm(true)}
                  className="p-4 md:p-6 bg-blue-50 border-2 border-blue-200 rounded-[1.5rem] hover:bg-blue-100 transition-all flex items-center space-x-4"
                >
                  <FileCheck className="w-6 h-6 text-blue-600" />
                  <span className="text-sm font-black text-blue-700 uppercase">
                    Registrar Resultado
                  </span>
                </button>
              </div>

              {/* Formulario de Participantes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Facilitador Responsable
                  </label>
                  <input
                    type="text"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-300 transition-all"
                    value={facilitador}
                    onChange={e => setFacilitador(e.target.value)}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Estado del Acuerdo
                  </label>
                  <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                    {(['PROCESO', 'LOGRADO', 'NO_ACUERDO'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setStatusGCC(s)}
                        className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${
                          statusGCC === s
                            ? 'bg-emerald-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Panel de Compromisos Reparatorios */}
              <div className="space-y-6 mb-12">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-emerald-600" />
                    Compromisos Reparatorios
                  </h3>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">
                    {compromisos.length} Definidos
                  </span>
                </div>

                <div className="space-y-4">
                  {compromisos.map(c => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-4 md:p-6 bg-emerald-50/50 border border-emerald-100 rounded-[1.5rem] group hover:bg-emerald-50 transition-all"
                    >
                      <div className="flex items-center space-x-6">
                        <button
                          onClick={() => toggleCumplimiento(c.id)}
                          className={`p-2 rounded-xl border-2 transition-all ${
                            c.completado
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <div>
                          <p className={`text-sm font-bold ${c.completado ? 'text-emerald-700 line-through' : 'text-slate-800'}`}>
                            {c.descripcion}
                          </p>
                          <div className="flex items-center mt-1 space-x-4">
                            <span className="text-[10px] font-black text-emerald-600 uppercase flex items-center">
                              <Users className="w-3 h-3 mr-1.5" />
                              {c.responsable}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase flex items-center">
                              <Calendar className="w-3 h-3 mr-1.5" />
                              Plazo: {c.fechaCumplimiento}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => eliminarCompromiso(c.id)}
                        className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Formulario para nuevo compromiso */}
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[1.5rem] p-4 md:p-8 space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Nuevo Compromiso de Mejora
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Ej: Disculpas públicas..."
                      className="md:col-span-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-300 transition-all"
                      value={nuevoCompromiso.descripcion}
                      onChange={e => setNuevoCompromiso({...nuevoCompromiso, descripcion: e.target.value})}
                    />
                    <input
                      type="date"
                      className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-300 transition-all"
                      value={nuevoCompromiso.fecha}
                      onChange={e => setNuevoCompromiso({...nuevoCompromiso, fecha: e.target.value})}
                    />
                    <select
                      className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-300 transition-all"
                      value={nuevoCompromiso.responsable}
                      onChange={e => setNuevoCompromiso({...nuevoCompromiso, responsable: e.target.value})}
                    >
                      <option value="">Responsable...</option>
                      <option value="Estudiante">Estudiante</option>
                      <option value="Apoderado">Apoderado</option>
                      <option value="Docente">Docente</option>
                    </select>
                    <button
                      onClick={agregarCompromiso}
                      disabled={!nuevoCompromiso.descripcion || !nuevoCompromiso.fecha}
                      className="md:col-span-3 flex items-center justify-center space-x-2 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar Compromiso</span>
                    </button>
                  </div>
                </div>
              </div>

              {showActaPreview && (
                <div className="mb-10 p-4 md:p-6 rounded-[1.5rem] border border-slate-200 bg-slate-50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                    Previsualizacion de Acta
                  </p>
                  <textarea
                    readOnly
                    value={actaTemplate}
                    rows={10}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                  />
                </div>
              )}

              {/* Acciones Finales */}
              <div className="flex flex-col md:flex-row gap-6 pt-6 md:pt-10 border-t border-slate-100">
                <button
                  onClick={() => setShowActaPreview((prev) => !prev)}
                  className="flex-1 py-5 rounded-[1.5rem] bg-white border-2 border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:border-emerald-300 hover:text-emerald-600 transition-all flex items-center justify-center space-x-3"
                >
                  <FileText className="w-5 h-5" />
                  <span>{showActaPreview ? 'Ocultar Acta' : 'Previsualizar Acta'}</span>
                </button>
                <button
                  onClick={() => void handleDestrabarDesdeGCC()}
                  className="flex-1 py-5 rounded-[1.5rem] bg-amber-50 border-2 border-amber-200 text-amber-700 font-black text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all flex items-center justify-center space-x-3"
                >
                  <Clock className="w-5 h-5" />
                  <span>Sacar de GCC y Continuar Expediente</span>
                </button>
                <button
                  onClick={handleCierreExitoso}
                  disabled={statusGCC !== 'LOGRADO'}
                  className={`flex-[2] py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center space-x-4 active:scale-95 ${
                    statusGCC === 'LOGRADO'
                      ? 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <ShieldCheck className="w-6 h-6" />
                  <span>Cierre Exitoso por Vía Formativa</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] border border-emerald-100 shadow-xl shadow-emerald-200/10 p-8 md:p-20 flex flex-col items-center justify-center text-center space-y-6 h-full">
              <div className="w-32 h-32 bg-emerald-50 text-emerald-300 rounded-[3rem] flex items-center justify-center mb-4">
                <Handshake className="w-16 h-16" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">
                  Sala de Conciliación GCC
                </h3>
                <p className="text-slate-400 font-bold text-xs md:text-sm mt-2 max-w-sm">
                  Seleccione un proceso del listado izquierdo para iniciar el diseño del acuerdo reparatorio.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full">
                <Info className="w-4 h-4" />
                <span>Solo casos en Etapa de Investigación o Notificación</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default CentroMediacionGCC;
