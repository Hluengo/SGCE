/**
 * BitacoraList - Módulo de Historial y Bitácora de Acciones
 * Cumple con Circular 781 - Registro de Auditoría
 *
 * Funcionalidades:
 * - Listado de acciones realizadas sobre el expediente
 * - Registro con usuario responsable, timestamp y justificación
 * - Indicadores de acciones críticas
 */

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import {
  History,
  Clock,
  User,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Download
} from 'lucide-react';

/**
 * Tipo de acción en la bitácora
 */
interface BitacoraEntry {
  id: string;
  timestamp: string;
  tipoAccion: string;
  descripcion: string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioRol: string;
  datosAdicionales?: Record<string, unknown>;
  esCritica: boolean;
  ipUsuario?: string;
}

/**
 * Iconos por tipo de acción
 */
const ACCION_ICONS: Record<string, React.ElementType> = {
  CREACION: FileText,
  TRANSICION_ETAPA: History,
  ACTUALIZACION: AlertTriangle,
  ELIMINACION: XCircle,
  CARGA_DOCUMENTO: FileText,
  CIERRE: CheckCircle,
  APERTURA: History,
  NOTIFICACION: Shield,
  default: History
};

/**
 * Colores por tipo de acción
 */
const ACCION_COLORS: Record<string, string> = {
  CREACION: 'bg-blue-100 text-blue-600 border-blue-200',
  TRANSICION_ETAPA: 'bg-purple-100 text-purple-600 border-purple-200',
  ACTUALIZACION: 'bg-yellow-100 text-yellow-600 border-yellow-200',
  ELIMINACION: 'bg-red-100 text-red-600 border-red-200',
  CARGA_DOCUMENTO: 'bg-emerald-100 text-emerald-600 border-emerald-200',
  CIERRE: 'bg-emerald-100 text-emerald-600 border-emerald-200',
  APERTURA: 'bg-blue-100 text-blue-600 border-blue-200',
  NOTIFICACION: 'bg-indigo-100 text-indigo-600 border-indigo-200',
  default: 'bg-slate-100 text-slate-600 border-slate-200'
};

interface BitacoraListProps {
  expedienteId: string;
}

/**
 * Componente principal de bitácora
 */
const BitacoraList: React.FC<BitacoraListProps> = ({ expedienteId }) => {
  const { expedientes } = useConvivencia();
  const [bitacora, setBitacora] = useState<BitacoraEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const expedienteDbId = useMemo(
    () => expedientes.find((exp) => exp.id === expedienteId)?.dbId ?? expedienteId,
    [expedientes, expedienteId]
  );

  // Cargar bitácora
  useEffect(() => {
    const cargarBitacora = async () => {
      if (!supabase) {
        setError('Conexión a base de datos no disponible');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('bitacora_expediente')
          .select('*')
          .eq('expediente_id', expedienteDbId)
          .order('timestamp', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          setBitacora(data as BitacoraEntry[]);
        }
      } catch (err) {
        console.error('Error al cargar bitácora:', err);
        setError('No se pudo cargar el historial de acciones');
      } finally {
        setIsLoading(false);
      }
    };

    cargarBitacora();
  }, [expedienteDbId]);

  // Filtrar bitácora
  const bitacoraFiltrada = useMemo(() => {
    let result = [...bitacora];

    // Filtrar por tipo
    if (filtroTipo !== 'TODOS') {
      result = result.filter(entry => entry.tipoAccion === filtroTipo);
    }

    // Filtrar por búsqueda
    if (busqueda) {
      const term = busqueda.toLowerCase();
      result = result.filter(entry =>
        entry.descripcion.toLowerCase().includes(term) ||
        entry.usuarioNombre.toLowerCase().includes(term) ||
        entry.tipoAccion.toLowerCase().includes(term)
      );
    }

    return result;
  }, [bitacora, filtroTipo, busqueda]);

  // Obtener tipos únicos de acción
  const tiposAccion = useMemo(() => {
    const tipos = new Set(bitacora.map(entry => entry.tipoAccion));
    return ['TODOS', ...Array.from(tipos)];
  }, [bitacora]);

  // Toggle expandir item
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Formatear timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener tiempo relativo
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    return formatTimestamp(timestamp);
  };

  // Exportar bitácora a JSON
  const exportarBitacora = () => {
    const blob = new Blob([JSON.stringify(bitacoraFiltrada, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bitacora_${expedienteId}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Renderizar icono de acción
  const renderAccionIcon = (tipo: string) => {
    const Icon = ACCION_ICONS[tipo] || ACCION_ICONS.default;
    const colorClass = ACCION_COLORS[tipo] || ACCION_COLORS.default;

    return (
      <div className={`p-2 rounded-xl border-2 ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-[1.5rem] border border-slate-200 p-8 text-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Cargando historial...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
        <p className="text-sm font-bold text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-lg shadow-slate-200/20 overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Historial de Acciones
              </h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {bitacoraFiltrada.length} registro(s)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={exportarBitacora}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-all flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar en bitácora..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 focus:outline-none"
            />
          </div>

          {/* Filtro por tipo */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 focus:outline-none appearance-none"
            >
              {tiposAccion.map(tipo => (
                <option key={tipo} value={tipo}>
                  {tipo === 'TODOS' ? 'Todos los tipos' : tipo.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de acciones */}
      <div className="divide-y divide-slate-100">
        {bitacoraFiltrada.length === 0 ? (
          <div className="p-8 text-center">
            <History className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No hay registros en la bitácora</p>
          </div>
        ) : (
          bitacoraFiltrada.map((entry) => {
            const isExpanded = expandedItems.has(entry.id);
            const hasDetails = entry.datosAdicionales && Object.keys(entry.datosAdicionales).length > 0;

            return (
              <div key={entry.id} className="p-4 md:p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start space-x-4">
                  {/* Icono de acción */}
                  {renderAccionIcon(entry.tipoAccion)}

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {entry.esCritica && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black uppercase rounded-full">
                              Crítico
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-full">
                            {entry.tipoAccion.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-800">
                          {entry.descripcion}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => toggleExpand(entry.id)}
                          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Metadatos */}
                    <div className="flex items-center space-x-4 mt-3 text-xs text-slate-500">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{entry.usuarioNombre}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span title={formatTimestamp(entry.timestamp)}>
                          {getRelativeTime(entry.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Shield className="w-3 h-3" />
                        <span>{entry.usuarioRol.replace(/_/g, ' ')}</span>
                      </div>
                    </div>

                    {/* Detalles expandibles */}
                    {isExpanded && hasDetails && (
                      <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                          Detalles Adicionales
                        </p>
                        <pre className="text-xs font-mono text-slate-700 overflow-x-auto">
                          {JSON.stringify(entry.datosAdicionales, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BitacoraList;
