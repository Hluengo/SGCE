/**
 * ExpedienteResumenModal.tsx - Resumen Profesional de Expediente
 * Muestra un resumen moderno y completo del expediente en un modal
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, 
  Clock, 
  FileText, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Send
} from 'lucide-react';
import { safeSupabase } from '@/shared/lib/supabaseClient';
import { useTenantClient } from '@/shared/hooks/useTenantClient';
import { formatearFecha, calcularDiasRestantes } from '@/shared/utils/plazos';
import AssistantButton from '@/shared/components/AssistantButton';
import { isUuid } from '@/shared/utils/expedienteRef';
import { AsyncState } from '@/shared/components/ui';

interface ExpedienteResumenProps {
  expedienteId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ResumenData {
  // Datos del expediente
  folio: string;
  tipo_falta: string;
  estado_legal: string;
  etapa_proceso: string;
  fecha_inicio: string;
  plazo_fatal: string;
  descripcion_hechos: string;
  es_proceso_expulsion: boolean;
  curso: string;
  
  // Estudiante
  estudiante_nombre: string;
  estudiante_id: string | null;
  estudiante_rut: string;
  
  // Conteo de registros
  actualizaciones_count: number;
  total_registros: number;
  hitos_completados: number;
  hitos_totales: number;
  evidencias_count: number;
  medidas_count: number;
  
  // Último movimiento
  ultimo_movimiento: {
    fecha: string;
    tipo: string;
    descripcion: string;
  } | null;
}

const ResumenHeader: React.FC<{
  data: ResumenData | null;
  expedienteId: string;
  onClose: () => void;
}> = ({ data, expedienteId, onClose }) => (
  <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white">
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-xs font-black uppercase tracking-widest opacity-80">Expediente</span>
          {data?.es_proceso_expulsion && (
            <span className="px-2 py-0.5 bg-red-500/20 border border-red-400/30 rounded-full text-xs font-bold text-red-100">
              EXPULSION
            </span>
          )}
        </div>
        <h2 className="text-2xl leading-none font-black">
          {data?.estudiante_nombre || 'Sin nombre'}{data?.curso ? ` • ${data.curso}` : ''}
        </h2>
        <p className="text-xs font-bold opacity-90 mt-1 uppercase tracking-wide">
          Número expediente: {data?.folio || expedienteId || '-'}
        </p>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-white/20 rounded-full transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  </div>
);

const ResumenDataContent: React.FC<{ data: ResumenData; diasRestantes: number | null }> = ({ data, diasRestantes }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-500 uppercase">Estado</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
          data.estado_legal === 'cerrado' ? 'bg-emerald-100 text-emerald-700' :
          data.estado_legal === 'resolucion' ? 'bg-amber-100 text-amber-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {data.estado_legal?.toUpperCase()}
        </span>
      </div>

      <div className={`rounded-xl p-4 border ${
        diasRestantes !== null && diasRestantes <= 3 ? 'bg-red-50 border-red-200' :
        diasRestantes !== null && diasRestantes <= 10 ? 'bg-amber-50 border-amber-200' :
        'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className={`w-4 h-4 ${
            diasRestantes !== null && diasRestantes <= 3 ? 'text-red-500' :
            diasRestantes !== null && diasRestantes <= 10 ? 'text-amber-500' :
            'text-slate-500'
          }`} />
          <span className="text-xs font-bold text-slate-500 uppercase">Plazo</span>
        </div>
        <span className={`text-sm font-bold ${
          diasRestantes !== null && diasRestantes <= 3 ? 'text-red-700' :
          diasRestantes !== null && diasRestantes <= 10 ? 'text-amber-700' :
          'text-slate-700'
        }`}>
          {diasRestantes !== null ? (diasRestantes <= 0 ? 'VENCIDO' : `${diasRestantes} días restantes`) : 'Sin plazo'}
        </span>
      </div>
    </div>

    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 text-slate-500" />
        <span className="text-xs font-bold text-slate-500 uppercase">Clasificación</span>
      </div>
      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
        data.tipo_falta === 'expulsion' ? 'bg-red-100 text-red-700' :
        data.tipo_falta === 'relevante' ? 'bg-amber-100 text-amber-700' :
        'bg-slate-100 text-slate-700'
      }`}>
        FALTA {data.tipo_falta?.toUpperCase()}
      </span>
    </div>

    <div>
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-4 h-4 text-slate-500" />
        <span className="text-xs font-bold text-slate-500 uppercase">Hechos</span>
      </div>
      <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-4 border border-slate-200">
        {data.descripcion_hechos || 'Sin descripción registrada'}
      </p>
    </div>

    <div className="grid grid-cols-4 gap-4">
      <div className="text-center p-4 bg-indigo-50 rounded-xl border border-indigo-100">
        <Activity className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
        <p className="text-xl font-black text-indigo-600">{data.actualizaciones_count}</p>
        <p className="text-xs text-indigo-400 uppercase font-bold">Actualizaciones</p>
      </div>
      <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
        <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
        <p className="text-xl font-black text-emerald-600">{data.hitos_completados}/{data.hitos_totales}</p>
        <p className="text-xs text-emerald-400 uppercase font-bold">Hitos</p>
      </div>
      <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-100">
        <FileText className="w-5 h-5 text-amber-600 mx-auto mb-1" />
        <p className="text-xl font-black text-amber-600">{data.evidencias_count}</p>
        <p className="text-xs text-amber-400 uppercase font-bold">Evidencias</p>
      </div>
      <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-100">
        <Shield className="w-5 h-5 text-purple-600 mx-auto mb-1" />
        <p className="text-xl font-black text-purple-600">{data.medidas_count}</p>
        <p className="text-xs text-purple-400 uppercase font-bold">Medidas</p>
      </div>
    </div>

    {data.ultimo_movimiento && (
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <Send className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-500 uppercase">Último Movimiento</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-700">{data.ultimo_movimiento.tipo}</p>
            <p className="text-xs text-slate-500">{data.ultimo_movimiento.descripcion}</p>
          </div>
          <span className="text-xs text-slate-400">
            {formatearFecha(data.ultimo_movimiento.fecha)}
          </span>
        </div>
      </div>
    )}

    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span className="text-slate-500">Fecha de inicio: </span>
        <span className="font-bold text-slate-700">{data.fecha_inicio ? formatearFecha(data.fecha_inicio) : '-'}</span>
      </div>
      <div>
        <span className="text-slate-500">Plazo fatal: </span>
        <span className="font-bold text-slate-700">{data.plazo_fatal ? formatearFecha(data.plazo_fatal) : '-'}</span>
      </div>
    </div>
  </div>
);

export const ExpedienteResumenModal: React.FC<ExpedienteResumenProps> = ({
  expedienteId,
  isOpen,
  onClose
}) => {
  const { client: tenantClient } = useTenantClient();
  const [data, setData] = useState<ResumenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestSeq = useRef(0);

  const loadResumen = useCallback(async (showLoading = true) => {
    if (!expedienteId) return;
    const requestId = ++requestSeq.current;

    if (showLoading) {
      setIsLoading(true);
    }
    setLoadError(null);

    try {
      const client = tenantClient ?? safeSupabase();
      if (!client) {
        setData(null);
        setLoadError('Cliente de Supabase no disponible.');
        return;
      }
      
      // Cargar expediente por UUID (id) o por folio (id visible en UI).
      // Evitamos `.or(...)` interpolado para no exponer errores por input no esperado.
      const expedienteLookup = client.from('expedientes').select('*');
      const { data: expData, error: expError } = await (
        isUuid(expedienteId)
          ? expedienteLookup.eq('id', expedienteId).maybeSingle()
          : expedienteLookup.eq('folio', expedienteId).maybeSingle()
      );

      if (expError) {
        console.error('Error fetching expediente:', expError);
        throw expError;
      }

      if (!expData) {
        setData(null);
        setLoadError('No se encontró el expediente.');
        return;
      }

      const estudianteId: string | null = expData.estudiante_id ?? null;
      const expedienteDbId = expData.id as string;

      // Carga paralela para bajar latencia total del resumen.
      const [
        estudianteRes,
        hitosRes,
        evidenciasRes,
        medidasExpRes,
        medidasEstRes,
        actualizacionesRes,
        ultimoLogRes,
      ] = await Promise.all([
        estudianteId
          ? client
              .from('estudiantes')
              .select('nombre_completo, rut')
              .eq('id', estudianteId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        client
          .from('hitos_expediente')
          .select('*')
          .eq('expediente_id', expedienteDbId),
        client
          .from('evidencias')
          .select('id')
          .eq('expediente_id', expedienteDbId),
        client
          .from('medidas_apoyo')
          .select('id')
          .eq('expediente_id', expedienteDbId),
        estudianteId
          ? client
              .from('medidas_apoyo')
              .select('id')
              .eq('estudiante_id', estudianteId)
          : Promise.resolve({ data: [], error: null }),
        client
          .from('logs_auditoria')
          .select('id', { count: 'exact', head: true })
          .eq('registro_id', expedienteDbId)
          .eq('accion', 'UPDATE')
          .eq('tabla_afectada', 'expedientes'),
        client
          .from('logs_auditoria')
          .select('created_at, accion, detalle')
          .eq('registro_id', expedienteDbId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const estudianteNombre = estudianteRes.data?.nombre_completo || 'Sin nombre';
      const estudianteRut = estudianteRes.data?.rut || '';
      const hitosData = hitosRes.data || [];
      const evidenciasData = evidenciasRes.data || [];
      const actualizacionesCount = actualizacionesRes.count || 0;
      const ultimoLog = ultimoLogRes.data;
      const medidasMap = new Map<string, { id: string }>();
      for (const m of medidasExpRes.data || []) medidasMap.set(m.id, m);
      for (const m of medidasEstRes.data || []) medidasMap.set(m.id, m);
      const medidasData = Array.from(medidasMap.values());

      if (requestId !== requestSeq.current) return;

      const hitos = hitosData || [];
      const evidencias = evidenciasData || [];
      const medidas = medidasData || [];

      setData({
        folio: expData.folio,
        tipo_falta: expData.tipo_falta,
        estado_legal: expData.estado_legal,
        etapa_proceso: expData.etapa_proceso,
        fecha_inicio: expData.fecha_inicio,
        plazo_fatal: expData.plazo_fatal,
        descripcion_hechos: expData.descripcion_hechos,
        es_proceso_expulsion: expData.es_proceso_expulsion,
        curso: expData.curso,
        estudiante_nombre: estudianteNombre,
        estudiante_id: estudianteId,
        estudiante_rut: estudianteRut,
        actualizaciones_count: actualizacionesCount || 0,
        total_registros: (actualizacionesCount || 0) + hitos.length + evidencias.length + medidas.length,
        hitos_completados: hitos.filter((h: { completado?: boolean }) => Boolean(h.completado)).length,
        hitos_totales: hitos.length,
        evidencias_count: evidencias.length,
        medidas_count: medidas.length,
        ultimo_movimiento: ultimoLog ? {
          fecha: ultimoLog.created_at,
          tipo: ultimoLog.accion,
          descripcion: getDescripcionFromAccion(ultimoLog.accion, ultimoLog.detalle)
        } : null
      });

    } catch (error) {
      if (requestId !== requestSeq.current) return;
      console.error('Error cargando resumen:', error);
      setData(null);
      setLoadError(error instanceof Error ? error.message : 'No se pudo cargar el resumen del expediente.');
    } finally {
      if (showLoading && requestId === requestSeq.current) {
        setIsLoading(false);
      }
    }
  }, [expedienteId, tenantClient]);

  useEffect(() => {
    if (isOpen && expedienteId) {
      void loadResumen(true);
    }
  }, [isOpen, expedienteId, loadResumen]);

  useEffect(() => {
    if (!isOpen || !expedienteId) return;
    const timer = window.setInterval(() => {
      void loadResumen(false);
    }, 60000);
    return () => window.clearInterval(timer);
  }, [isOpen, expedienteId, loadResumen]);

  if (!isOpen) return null;

  const diasRestantes = data ? calcularDiasRestantes(data.plazo_fatal) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClose();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Cerrar resumen de expediente"
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Botón de Asistente IA */}
        <AssistantButton position="top-right" />
        <ResumenHeader data={data} expedienteId={expedienteId} onClose={onClose} />

        {/* Content */}
        <div className="p-6 max-h-screen overflow-y-auto">
          {isLoading ? (
            <AsyncState
              state="loading"
              title="Cargando resumen del expediente"
              message="Recuperando información consolidada."
              compact
            />
          ) : data ? (
            <ResumenDataContent data={data} diasRestantes={diasRestantes} />
          ) : (
            <AsyncState
              state="error"
              title="No se pudo cargar la información del expediente"
              message={loadError ?? 'Intenta nuevamente en unos segundos.'}
              onRetry={() => {
                void loadResumen(true);
              }}
              compact
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

function getDescripcionFromAccion(accion: string, detalle: Record<string, unknown> | null | undefined): string {
  if (!detalle) return accion;
  
  const newData = detalle.new as Record<string, unknown> | undefined;
  if (newData?.estado_legal) {
    return `Cambio de estado a: ${String(newData.estado_legal)}`;
  }
  if (newData?.etapa_proceso) {
    return `Cambio de etapa a: ${String(newData.etapa_proceso)}`;
  }
  
  return accion;
}

export default ExpedienteResumenModal;

