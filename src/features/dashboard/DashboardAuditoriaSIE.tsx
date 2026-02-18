
import React, { useMemo, useState } from 'react';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { 
  ShieldCheck, 
  AlertOctagon, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Download, 
  ArrowUpRight,
  ShieldAlert,
  Gavel
} from 'lucide-react';

const DashboardAuditoriaSIE: React.FC = () => {
  const { expedientes, setExpedienteSeleccionado } = useConvivencia();
  const [filterRiesgo, setFilterRiesgo] = useState<'ALL' | 'NULIDAD' | 'PROPORCIONALIDAD'>('ALL');

  // Lógica de Auditoría por Expediente
  const auditResults = useMemo(() => {
    return expedientes.map(exp => {
      const isExpulsion = exp.gravedad === 'GRAVISIMA_EXPULSION';
      
      const checks = {
        notificacion: exp.etapa !== 'INICIO',
        descargos: exp.etapa !== 'INICIO' && exp.etapa !== 'NOTIFICADO',
        evidencias: exp.hitos.filter(h => h.requiereEvidencia).every(h => h.completado || !h.requiereEvidencia), // Simplificado
        resolucion: exp.etapa === 'RESOLUCION_PENDIENTE' || exp.etapa.startsWith('CERRADO'),
        reconsideracion: exp.etapa === 'RECONSIDERACION' || exp.etapa.startsWith('CERRADO'),
        gradualidad: !isExpulsion || exp.accionesPrevias
      };

      const score = Object.values(checks).filter(Boolean).length / Object.values(checks).length;
      
      let status: 'READY' | 'INCOMPLETE' | 'RISK' = 'READY';
      if (!checks.gradualidad && isExpulsion) status = 'RISK';
      else if (score < 0.6) status = 'INCOMPLETE';

      return { ...exp, audit: checks, score, status };
    });
  }, [expedientes]);

  const filteredAudit = auditResults.filter(item => {
    if (filterRiesgo === 'NULIDAD') return item.gravedad === 'GRAVISIMA_EXPULSION' && !item.accionesPrevias;
    if (filterRiesgo === 'PROPORCIONALIDAD') return item.etapa === 'RESOLUCION_PENDIENTE' && item.score < 0.8;
    return true;
  });

  const kpis = useMemo(() => {
    const ahora = new Date().getTime();
    const cuarentaYOchoHoras = 48 * 60 * 60 * 1000;

    return {
      saludGlobal: Math.round((auditResults.reduce((acc, curr) => acc + curr.score, 0) / auditResults.length) * 100) || 0,
      alertasNulidad: auditResults.filter(e => e.gravedad === 'GRAVISIMA_EXPULSION' && !e.accionesPrevias).length,
      plazosCriticos: auditResults.filter(e => {
        const diff = new Date(e.plazoFatal).getTime() - ahora;
        return diff > 0 && diff < cuarentaYOchoHoras;
      }).length
    };
  }, [auditResults]);

  return (
    <main className="flex-1 p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50 overflow-y-auto">
      {/* Header Auditoría */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
             <ShieldCheck className="w-5 h-5 text-blue-600" />
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">Auditoría Técnica SIE</h2>
          </div>
          <p className="text-slate-500 font-medium text-sm">Control de Calidad Normativa - Circulares 781 & 782</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all shadow-sm">
            <Download className="w-4 h-4" />
            <span>Exportar Informe de Brechas</span>
          </button>
        </div>
      </header>

      {/* Métricas de Auditoría */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-150 transition-all"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${kpis.saludGlobal > 85 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
              Nivel de Cumplimiento
            </div>
          </div>
          <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{kpis.saludGlobal}%</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Índice de Salud Legal Global</p>
        </div>

        <div className={`bg-white p-6 rounded-[2rem] border shadow-sm relative overflow-hidden group ${kpis.alertasNulidad > 0 ? 'border-red-200 bg-red-50/20' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${kpis.alertasNulidad > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
              <AlertOctagon className="w-6 h-6" />
            </div>
            {kpis.alertasNulidad > 0 && (
              <div className="px-3 py-1 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-200">
                Acción Inmediata
              </div>
            )}
          </div>
          <h3 className={`text-4xl font-black tracking-tighter ${kpis.alertasNulidad > 0 ? 'text-red-600' : 'text-slate-800'}`}>{kpis.alertasNulidad}</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Alertas de Nulidad (Gradualidad)</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{kpis.plazosCriticos}</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Vencimientos &lt; 48 Horas</p>
        </div>
      </section>

      {/* Tabla de Auditoría Detallada */}
      <section className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col">
        <div className="p-4 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/40">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-8 bg-slate-900 rounded-full"></div>
            <h3 className="font-black text-slate-800 text-xl tracking-tight uppercase">Audit Log: Requisitos Obligatorios</h3>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-inner">
              <button 
                onClick={() => setFilterRiesgo('ALL')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filterRiesgo === 'ALL' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Todos
              </button>
              <button 
                onClick={() => setFilterRiesgo('NULIDAD')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filterRiesgo === 'NULIDAD' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Riesgo Nulidad
              </button>
              <button 
                onClick={() => setFilterRiesgo('PROPORCIONALIDAD')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filterRiesgo === 'PROPORCIONALIDAD' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Baja Salud Legal
              </button>
            </div>
          </div>
        </div>

        <div className="md:hidden p-4 space-y-4">
          {filteredAudit.map((item) => (
            <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Expediente</p>
                  <p className="text-xs font-black text-slate-800 uppercase">{item.nnaNombre}</p>
                  <p className="font-mono text-[9px] text-blue-500 font-bold">{item.id}</p>
                </div>
                <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                  item.status === 'READY' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  item.status === 'RISK' ? 'bg-red-50 text-red-700 border border-red-200' :
                  'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {item.status === 'READY' ? 'Listo' : item.status === 'RISK' ? 'Riesgo' : 'Incompleto'}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-black uppercase">
                <div className={`px-2 py-1 rounded ${item.audit.notificacion ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>Notificación</div>
                <div className={`px-2 py-1 rounded ${item.audit.descargos ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>Descargos</div>
                <div className={`px-2 py-1 rounded ${item.audit.evidencias ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>Evidencias</div>
                <div className={`px-2 py-1 rounded ${item.audit.resolucion ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>Resolución</div>
              </div>
              <button
                onClick={() => setExpedienteSeleccionado(item)}
                className="w-full mt-2 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600"
              >
                Ver detalle
              </button>
            </div>
          ))}
          {filteredAudit.length === 0 && (
            <div className="py-12 text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-slate-200 mx-auto" />
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic">No hay resultados.</p>
            </div>
          )}
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="text-[9px] text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50 border-b border-slate-100">
                <th className="px-4 md:px-8 py-5 font-black">Expediente</th>
                <th className="px-4 md:px-8 py-5 font-black text-center">Notificación</th>
                <th className="px-4 md:px-8 py-5 font-black text-center">Acta Escucha</th>
                <th className="px-4 md:px-8 py-5 font-black text-center">Evidencias</th>
                <th className="px-4 md:px-8 py-5 font-black text-center">Resolución</th>
                <th className="px-4 md:px-8 py-5 font-black text-center">Reconsideración</th>
                <th className="px-4 md:px-8 py-5 font-black">Estado SIE</th>
                <th className="px-4 md:px-8 py-5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAudit.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-4 md:px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 text-xs uppercase">{item.nnaNombre}</span>
                      <span className="font-mono text-[9px] text-blue-500 font-bold">{item.id}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-8 py-6 text-center">
                    {item.audit.notificacion ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-300 mx-auto" />}
                  </td>
                  <td className="px-4 md:px-8 py-6 text-center">
                    {item.audit.descargos ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-300 mx-auto" />}
                  </td>
                  <td className="px-4 md:px-8 py-6 text-center">
                    {item.audit.evidencias ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-amber-400 mx-auto" />}
                  </td>
                  <td className="px-4 md:px-8 py-6 text-center">
                    {item.audit.resolucion ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-200 mx-auto" />}
                  </td>
                  <td className="px-4 md:px-8 py-6 text-center">
                    {item.audit.reconsideracion ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-200 mx-auto" />}
                  </td>
                  <td className="px-4 md:px-8 py-6">
                    <div className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                      item.status === 'READY' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      item.status === 'RISK' ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {item.status === 'READY' ? 'Listo para Fiscalización' : 
                       item.status === 'RISK' ? 'Riesgo Administrativo' : 'Incompleto'}
                    </div>
                  </td>
                  <td className="px-4 md:px-8 py-6 text-right">
                    <button 
                      onClick={() => setExpedienteSeleccionado(item)}
                      className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-900 hover:text-white transition-all group-hover:scale-110"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredAudit.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <ShieldAlert className="w-12 h-12 text-slate-200 mx-auto" />
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic">No se encontraron expedientes con este nivel de riesgo.</p>
            </div>
          )}
        </div>
      </section>

      {/* Panel Inferior de Ayuda Técnica */}
      <section className="bg-slate-900 rounded-[2.5rem] p-4 md:p-10 text-white relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-blue-600/20 transition-all"></div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 relative z-10">
          <div className="space-y-4 max-w-2xl">
            <h4 className="text-2xl font-black tracking-tight uppercase">Sugerencia de Mitigación SIE</h4>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Se han detectado {kpis.alertasNulidad} casos de Aula Segura que carecen de validación de gradualidad. Recomendamos adjuntar inmediatamente las advertencias escritas previas o derivar a Mediación GCC para evitar multas de la Superintendencia de Educación.
            </p>
            <div className="flex space-x-4 pt-4">
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                Revisar Alertas Críticas
              </button>
              <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                Ver Normativa 782
              </button>
            </div>
          </div>
          <div className="shrink-0 p-8 border border-white/10 rounded-[2rem] bg-white/5 backdrop-blur-sm">
             <Gavel className="w-16 h-16 text-blue-400 mb-4 mx-auto" />
             <p className="text-[10px] font-black uppercase tracking-widest text-center">Compliance Escolar v2.5</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default DashboardAuditoriaSIE;
