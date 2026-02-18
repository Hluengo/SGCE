/**
 * ReportsExpedientes.tsx - Reportes y Estadísticas
 */
import React, { useState, useMemo } from 'react';
import { TrendingUp, Clock, FileText, AlertTriangle, CheckCircle, Calendar, Download } from 'lucide-react';
import type { ExpedienteCompleto, EtapaProceso } from '@/types';
import { formatearFecha } from '@/shared/utils/plazos';

interface Props {
  expedientes: ExpedienteCompleto[];
  onExport?: (formato: 'pdf' | 'excel' | 'csv') => void;
}

export const ReportsExpedientes: React.FC<Props> = ({ expedientes, onExport }) => {
  const [periodo, setPeriodo] = useState<'semana' | 'mes' | 'trimestre' | 'año' | 'todos'>('mes');

  const stats = useMemo(() => {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    
    let total = 0;
    const porEstado: Partial<Record<EtapaProceso, number>> = {};
    const porGravedad: Record<string, number> = {};
    let vencimientoProximo = 0;
    let vencidos = 0;
    let resueltosMes = 0;
    let nuevosMes = 0;

    expedientes.forEach(exp => {
      total++;
      porEstado[exp.etapa] = (porEstado[exp.etapa] || 0) + 1;
      exp.hechos.forEach(h => { porGravedad[h.gravedad] = (porGravedad[h.gravedad] || 0) + 1; });
      const dias = (new Date(exp.plazoFatal).getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24);
      if (dias < 0) vencidos++;
      else if (dias <= 7) vencimientoProximo++;
      const fechaExp = new Date(exp.fechaCreacion);
      if (fechaExp >= inicioMes) {
        nuevosMes++;
        if (exp.etapa.startsWith('CERRADO')) resueltosMes++;
      }
    });

    return { total, porEstado, porGravedad, vencimientoProximo, vencidos, resueltosMes, nuevosMes };
  }, [expedientes]);

  const handleExport = (formato: 'pdf' | 'excel' | 'csv') => {
    if (formato === 'csv') {
      const headers = ['Folio', 'Etapa', 'Alumno', 'Fecha'];
      const rows = expedientes.map(e => [e.folio, e.etapa, e.alumno.nombreCompleto, e.fechaCreacion]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `reporte_${formatearFecha(new Date().toISOString())}.csv`;
      a.click();
    }
    onExport?.(formato);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-800">Reportes</h2><p className="text-sm text-slate-500">Estadísticas del módulo</p></div>
        <div className="flex items-center gap-3">
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value as typeof periodo)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="semana">Semana</option><option value="mes">Mes</option><option value="trimestre">Trimestre</option><option value="año">Año</option><option value="todos">Todos</option>
          </select>
          <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg">
            <Download className="w-4 h-4" />Exportar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Total" value={stats.total} icon={FileText} color="bg-blue-500" />
        <MetricCard title="Nuevos (Mes)" value={stats.nuevosMes} icon={TrendingUp} color="bg-emerald-500" />
        <MetricCard title="Resueltos (Mes)" value={stats.resueltosMes} icon={CheckCircle} color="bg-purple-500" />
        <MetricCard title="Plazo Próximo" value={stats.vencimientoProximo} icon={Clock} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Vencidos" value={stats.vencidos} icon={AlertTriangle} color="bg-red-500" alert={stats.vencidos > 0} />
        <MetricCard title="En Trámite" value={stats.porEstado.NOTIFICADO || 0} icon={Clock} color="bg-yellow-500" />
        <MetricCard title="En Descargos" value={stats.porEstado.DESCARGOS || 0} icon={Clock} color="bg-blue-500" />
        <MetricCard title="Cerrados" value={(stats.porEstado.CERRADO_SANCION || 0) + (stats.porEstado.CERRADO_GCC || 0)} icon={Calendar} color="bg-slate-500" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200"><h3 className="font-bold text-slate-800">Distribución por Gravedad</h3></div>
        <div className="p-6 grid grid-cols-4 gap-4">
          {['LEVE', 'RELEVANTE', 'GRAVE', 'GRAVISIMA_EXPULSION'].map(g => (
            <div key={g} className="text-center">
              <div className="text-3xl font-black text-slate-800">{stats.porGravedad[g] || 0}</div>
              <div className="text-xs text-slate-500 uppercase mt-1">{g.replace('GRAVISIMA_EXPULSION', 'Gravísima').replace(/_/g, ' ')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: number; icon: React.FC<{ className?: string }>; color: string; alert?: boolean }> = 
  ({ title, value, icon: Icon, color, alert }) => (
    <div className={`bg-white border rounded-xl p-4 ${alert ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase font-medium">{title}</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${color}`}><Icon className="w-5 h-5 text-white" /></div>
      </div>
    </div>
  );

export default ReportsExpedientes;
