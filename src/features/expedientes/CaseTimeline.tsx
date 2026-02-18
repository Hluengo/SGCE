/**
 * CaseTimeline.tsx - Línea Temporal Visual
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, User, FileText, Send, Shield, Calendar, MessageSquare } from 'lucide-react';
import { formatearFecha, formatearHora } from '@/shared/utils/plazos';

interface TimelineItem {
  id: string;
  fecha: string;
  titulo: string;
  descripcion: string;
  tipo: 'creacion' | 'estado' | 'documento' | 'derivacion' | 'medida' | 'comentario' | 'evidencia' | 'hito' | 'investigacion' | string;
  usuario?: string;
}

interface Props {
  items: TimelineItem[];
  initialLimit?: number;
}

const ICON_CONFIG: Record<string, { icon: React.FC<{ className?: string }>; color: string }> = {
  creacion: { icon: Calendar, color: 'text-blue-600' },
  estado: { icon: Clock, color: 'text-yellow-600' },
  documento: { icon: FileText, color: 'text-red-600' },
  derivacion: { icon: Send, color: 'text-purple-600' },
  medida: { icon: Shield, color: 'text-emerald-600' },
  comentario: { icon: MessageSquare, color: 'text-slate-600' },
  evidencia: { icon: FileText, color: 'text-red-600' },
  hito: { icon: Clock, color: 'text-blue-600' },
  investigacion: { icon: Shield, color: 'text-indigo-600' }
};

const TIPO_LABELS: Record<string, string> = {
  creacion: 'Creación',
  estado: 'Cambio Estado',
  documento: 'Documento',
  derivacion: 'Derivación',
  medida: 'Medida',
  comentario: 'Comentario',
  evidencia: 'Evidencia',
  hito: 'Hito',
  investigacion: 'Investigación'
};

export const CaseTimeline: React.FC<Props> = ({ items, initialLimit = 10 }) => {
  const [showAll, setShowAll] = useState(false);
  const [filterTipo, setFilterTipo] = useState('todos');

  const filteredItems = React.useMemo(() => {
    if (filterTipo === 'todos') return items;
    return items.filter(item => item.tipo === filterTipo);
  }, [items, filterTipo]);

  const visibleItems = showAll ? filteredItems : filteredItems.slice(0, initialLimit);

  const counts = React.useMemo(() => {
    const c: Record<string, number> = {};
    items.forEach(item => { c[item.tipo] = (c[item.tipo] || 0) + 1; });
    return c;
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500">No hay eventos registrados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterTipo('todos')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterTipo === 'todos' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
          Todos ({items.length})
        </button>
        {Object.entries(counts).map(([tipo, count]) => (
          <button key={tipo} onClick={() => setFilterTipo(tipo)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterTipo === tipo ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
            {(TIPO_LABELS[tipo] || tipo)} ({count})
          </button>
        ))}
      </div>

      <div className="relative">
        {visibleItems.map((item, index) => {
          const config = ICON_CONFIG[item.tipo] || ICON_CONFIG.comentario;
          const Icon = config.icon;
          return (
            <div key={item.id} className="relative">
              {index < visibleItems.length - 1 && <div className="absolute left-5 top-10 w-0.5 h-full bg-slate-200" />}
              <div className="absolute left-0 top-3 w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 z-10">
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div className="ml-14 pb-6">
                <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {TIPO_LABELS[item.tipo] || item.tipo}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">
                        {formatearFecha(item.fecha)} a las {formatearHora(item.fecha)}
                      </span>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-800">{item.titulo}</h4>
                  {item.usuario && (
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">{item.usuario}</span>
                    </div>
                  )}
                  <p className="text-sm text-slate-600">{item.descripcion}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length > initialLimit && (
        <div className="text-center pt-4">
          <button onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
            {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {showAll ? 'Ver menos' : `Ver más (${filteredItems.length - initialLimit})`}
            </span>
          </button>
        </div>
      )}

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h4 className="text-sm font-bold text-slate-700 mb-3">Resumen</h4>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div><p className="text-2xl font-black text-blue-600">{counts['creacion'] || 0}</p><p className="text-xs text-slate-500">Creaciones</p></div>
          <div><p className="text-2xl font-black text-yellow-600">{counts['estado'] || 0}</p><p className="text-xs text-slate-500">Cambios</p></div>
          <div><p className="text-2xl font-black text-red-600">{counts['documento'] || 0}</p><p className="text-xs text-slate-500">Documentos</p></div>
          <div><p className="text-2xl font-black text-purple-600">{(counts['derivacion'] || 0)}</p><p className="text-xs text-slate-500">Derivaciones</p></div>
        </div>
      </div>
    </div>
  );
};

export default CaseTimeline;
