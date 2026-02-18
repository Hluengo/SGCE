
import React, { useState, useMemo, useEffect } from 'react';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { calcularPlazoConFeriados, BUSINESS_DAYS_EXPULSION, BUSINESS_DAYS_RELEVANTE } from '@/shared/utils/plazos';
import { cargarFeriados, esFeriado, obtenerDescripcionFeriado, esFinDeSemana, obtenerFeriadosDelMes, type Feriado } from '@/shared/utils/feriadosChile';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  Clock, 
  Info, 
  Bell,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Evento {
  date: string;
  type: 'FATAL' | 'DESCARGOS' | 'INTERNO' | 'GCC';
  title: string;
  expedienteId: string;
  nna: string;
}

const CalendarioPlazosLegales: React.FC = () => {
  const { expedientes, setExpedienteSeleccionado } = useConvivencia();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [feriados, setFeriados] = useState<Map<string, Feriado>>(new Map());
  const [loadingFeriados, setLoadingFeriados] = useState(true);
  const [filters, setFilters] = useState({
    expulsion: true,
    reconsideracion: true,
    mediaciones: true,
    internos: true
  });

  // Cargar feriados de Chile al montar
  useEffect(() => {
    const loadFeriados = async () => {
      setLoadingFeriados(true);
      const feriadosMap = await cargarFeriados();
      setFeriados(feriadosMap);
      setLoadingFeriados(false);
    };

    loadFeriados();
  }, []);

  // Cargar y calcular eventos con feriados desde SQL
  useEffect(() => {
    const generarEventos = async () => {
      setLoadingEventos(true);
      const list: Evento[] = [];

      for (const exp of expedientes) {
        try {
          // Plazo Fatal (Vencimiento de Proceso) - calculado con feriados
          if (filters.expulsion && exp.gravedad === 'GRAVISIMA_EXPULSION') {
            const plazoFatal = await calcularPlazoConFeriados(exp.fechaInicio, BUSINESS_DAYS_EXPULSION);
            list.push({
              date: plazoFatal.toISOString().split('T')[0],
              type: 'FATAL',
              title: 'Cierre Aula Segura',
              expedienteId: exp.id,
              nna: exp.nnaNombre
            });
          } else if (filters.reconsideracion) {
            const plazoFatal = await calcularPlazoConFeriados(exp.fechaInicio, BUSINESS_DAYS_RELEVANTE);
            list.push({
              date: plazoFatal.toISOString().split('T')[0],
              type: 'FATAL',
              title: 'Vencimiento Legal',
              expedienteId: exp.id,
              nna: exp.nnaNombre
            });
          }

          // Hito de Descargos (3 días hábiles después del inicio)
          if (exp.etapa === 'NOTIFICADO') {
            const fechaDescargos = await calcularPlazoConFeriados(exp.fechaInicio, 3);
            list.push({
              date: fechaDescargos.toISOString().split('T')[0],
              type: 'DESCARGOS',
              title: 'Cierre Descargos',
              expedienteId: exp.id,
              nna: exp.nnaNombre
            });
          }

          // GCC - Acuerdo Formativo
          if (filters.mediaciones && exp.etapa === 'CERRADO_GCC') {
            list.push({
              date: exp.fechaInicio.split('T')[0],
              type: 'GCC',
              title: 'Acuerdo Formativo',
              expedienteId: exp.id,
              nna: exp.nnaNombre
            });
          }
        } catch (err) {
          console.error(`Error calculando plazos para expediente ${exp.id}:`, err);
          // Fallback: usar fecha original del expediente
          list.push({
            date: exp.plazoFatal.split('T')[0],
            type: 'FATAL',
            title: 'Vencimiento Legal (fallback)',
            expedienteId: exp.id,
            nna: exp.nnaNombre
          });
        }
      }

      setEventos(list);
      setLoadingEventos(false);
    };

    generarEventos();
  }, [expedientes, filters]);

  // Lógica de Calendario
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  // Convertir de domingo-primero (0-6) a lunes-primero (0-6)
  const firstDayOfMonth = (year: number, month: number) => {
    const dayOfWeek = new Date(year, month, 1).getDay();
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0=dom → 6, 1=lun → 0, etc
  };

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);
  
  const monthName = currentDate.toLocaleString('es-CL', { month: 'long' });

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Urgencias de Hoy
  const urgenciasHoy = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return eventos.filter(e => e.date === todayStr);
  }, [eventos]);

  const renderDay = (dayNumber: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    const dayEvents = eventos.filter(e => e.date === dateStr);
    const isToday = new Date().toISOString().split('T')[0] === dateStr;
    const isFeriado = esFeriado(dateStr, feriados);
    const nombreFeriado = obtenerDescripcionFeriado(dateStr, feriados);
    const isWeekend = esFinDeSemana(dateStr);
    
    // Si es feriado, mostrar su tarjeta especial
    if (isFeriado) {
      return (
        <div 
          key={dayNumber} 
          className="min-h-[120px] bg-red-50 border-2 border-red-300 p-2 flex flex-col space-y-1 transition-all hover:bg-red-100/50 shadow-md"
          title={nombreFeriado || 'Feriado'}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black text-red-700">{dayNumber}</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <span className="text-[7px] font-black uppercase text-red-600 leading-tight px-1">
              {nombreFeriado}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div 
        key={dayNumber} 
        className={`min-h-[120px] border p-2 flex flex-col space-y-1 transition-all ${
          isToday 
            ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/30 border-blue-200' 
            : isWeekend
              ? 'bg-slate-100 border-slate-200'
              : 'bg-white border-slate-100'
        } hover:bg-opacity-70`}
      >
        <div className="flex justify-between items-center mb-1">
          <span className={`text-[10px] font-black ${isToday ? 'text-blue-600' : isWeekend ? 'text-slate-500' : 'text-slate-400'}`}>
            {dayNumber}
          </span>
          {isToday && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
          {isWeekend && <span className="text-[7px] font-black text-slate-400 uppercase">F.S.</span>}
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col space-y-1">
          {dayEvents.map((ev, idx) => (
            <button
              key={`${ev.expedienteId}-${idx}`}
              onClick={() => {
                const exp = expedientes.find(e => e.id === ev.expedienteId);
                if (exp) setExpedienteSeleccionado(exp);
              }}
              className={`text-[8px] font-black uppercase p-1.5 rounded-lg border text-left truncate transition-transform active:scale-95 ${
                ev.type === 'FATAL' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' :
                ev.type === 'DESCARGOS' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' :
                ev.type === 'GCC' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' :
                'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              }`}
              title={`${ev.title} - ${ev.nna}`}
            >
              {ev.title} - {ev.nna}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <main className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-50">
      {/* Panel de Calendario */}
      <div className="flex-1 p-4 md:p-8 flex flex-col space-y-6 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">Calendario Normativo</h2>
            </div>
            <p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest flex items-center">
              <Clock className="w-4 h-4 mr-2 text-blue-400" />
              Cálculo basado en días hábiles (feriados de Chile desde BD)
            </p>
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm w-full md:w-auto justify-between">
            <button onClick={handlePrevMonth} className="p-3 hover:bg-slate-100 rounded-xl transition-all"><ChevronLeft className="w-5 h-5" /></button>
            <div className="px-4 md:px-8 text-sm font-black text-slate-900 uppercase tracking-widest w-32 md:w-40 text-center">
              {monthName} {year}
            </div>
            <button onClick={handleNextMonth} className="p-3 hover:bg-slate-100 rounded-xl transition-all"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </header>

        {/* Leyenda y Filtros */}
        <section className="flex flex-wrap gap-4 items-center bg-white p-4 md:p-6 rounded-[2rem] border border-slate-200 shadow-sm">
           <div className="flex items-center space-x-6 pr-6 border-r border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-[9px] font-black uppercase text-slate-500">Plazo Fatal</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-[9px] font-black uppercase text-slate-500">Descargos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-[9px] font-black uppercase text-slate-500">Hito Interno</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-100 border-2 border-red-300"></div>
                <span className="text-[9px] font-black uppercase text-slate-500">Feriado</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-slate-100 border border-slate-300"></div>
                <span className="text-[9px] font-black uppercase text-slate-500">Fin de Semana</span>
              </div>
           </div>

           <div className="flex items-center flex-wrap gap-4">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" checked={filters.expulsion} onChange={e => setFilters({...filters, expulsion: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-slate-600 transition-colors">Expulsiones</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" checked={filters.reconsideracion} onChange={e => setFilters({...filters, reconsideracion: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-slate-600 transition-colors">Reconsideración</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" checked={filters.mediaciones} onChange={e => setFilters({...filters, mediaciones: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-slate-600 transition-colors">Mediaciones</span>
              </label>
           </div>

           {loadingFeriados && (
            <div className="ml-auto flex items-center space-x-2 text-[9px] text-slate-400 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span className="font-semibold">Cargando feriados...</span>
            </div>
           )}

           {!loadingFeriados && feriados.size === 0 && (
            <div className="ml-auto flex items-center space-x-2 text-[9px] text-amber-600">
              <AlertCircle className="w-3 h-3" />
              <span className="font-semibold">Sin feriados en BD</span>
            </div>
           )}

           {!loadingFeriados && feriados.size > 0 && (
            <div className="ml-auto flex items-center space-x-2 text-[9px] text-emerald-600">
              <CheckCircle2 className="w-3 h-3" />
              <span className="font-semibold">{feriados.size} feriados cargados</span>
            </div>
           )}
        </section>

        {/* Cuadrícula del Calendario */}
        <div className="overflow-x-auto">
          {loadingEventos ? (
            <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-2xl flex items-center justify-center min-h-[500px]">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Calculando plazos legales con feriados...</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-200 grid grid-cols-7 gap-[1px] rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl min-w-[720px]">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="bg-slate-50 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                  {day}
                </div>
              ))}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-slate-50/50 min-h-[120px]"></div>
              ))}
              {Array.from({ length: totalDays }).map((_, i) => renderDay(i + 1))}
            </div>
          )}
        </div>
      </div>

      {/* Panel Lateral de Urgencias */}
      <aside className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-4 md:p-8 flex flex-col shrink-0 overflow-y-auto space-y-8">
        <div>
          <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center">
            <Bell className="w-5 h-5 mr-3 text-red-500 animate-bounce" />
            Urgencias para Hoy
          </h3>

          <div className="space-y-4">
            {loadingEventos ? (
              <div className="p-6 text-center space-y-3 bg-blue-50 rounded-[1.5rem] border border-blue-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargando urgencias...</p>
              </div>
            ) : urgenciasHoy.length > 0 ? urgenciasHoy.map((urg, idx) => (
              <div key={idx} className="bg-white border-2 border-slate-100 p-5 rounded-[1.5rem] hover:border-red-200 hover:bg-red-50/10 transition-all cursor-pointer group" onClick={() => {
                const exp = expedientes.find(e => e.id === urg.expedienteId);
                if (exp) setExpedienteSeleccionado(exp);
              }}>
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${urg.type === 'FATAL' ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
                    {urg.type}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 font-mono">{urg.expedienteId}</span>
                </div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1 group-hover:text-red-700 transition-colors">{urg.title}</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{urg.nna}</p>
                <div className="mt-4 flex items-center justify-end text-[9px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                  <span>Ir al expediente</span>
                  <ChevronRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            )) : (
              <div className="p-6 md:p-10 text-center space-y-4 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  No se registran vencimientos legales para la fecha actual.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50/30 border border-orange-200 p-6 rounded-[1.5rem]">
          <h4 className="text-xs font-black text-orange-900 uppercase tracking-widest mb-4 flex items-center">
            <CalendarIcon className="w-4 h-4 mr-2 text-orange-600" />
            Feriados de {monthName.charAt(0).toUpperCase() + monthName.slice(1)} {year}
          </h4>

          {loadingFeriados ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {(() => {
                const feriadosDelMes = obtenerFeriadosDelMes(year, month, feriados);
                
                if (feriadosDelMes.length === 0) {
                  return (
                    <p className="text-[9px] text-orange-600 font-semibold text-center py-3">
                      No hay feriados este mes
                    </p>
                  );
                }

                return feriadosDelMes.map((f) => {
                  const fecha = new Date(f.fecha);
                  const dia = fecha.getDate();
                  
                  return (
                    <div key={f.fecha} className="bg-white border border-orange-100 rounded-lg p-2 hover:bg-orange-50/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-slate-800 truncate pr-2">{f.descripcion}</p>
                          <p className="text-[8px] text-slate-500 font-semibold mt-1">
                            {dia} de {monthName}
                          </p>
                        </div>
                        {f.esIrrenunciable && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[7px] font-black uppercase rounded whitespace-nowrap">
                            Irrenunciable
                          </span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
           <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:scale-150 transition-all duration-700"></div>
           <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400 mb-4 flex items-center">
             <AlertTriangle className="w-4 h-4 mr-2" />
             Alerta Preventiva
           </h4>
           <div className="space-y-4">
             {expedientes.filter(e => e.gravedad === 'GRAVISIMA_EXPULSION' && e.etapa === 'NOTIFICADO').map(e => (
               <div key={e.id} className="border-l-2 border-red-500 pl-4 py-1">
                 <p className="text-[10px] font-black uppercase leading-tight">Faltan 48h para Cierre Descargos</p>
                 <p className="text-[9px] text-slate-400 font-bold mt-1">NNA: {e.nnaNombre}</p>
               </div>
             ))}
           </div>
        </div>

        <div className="mt-auto p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-start space-x-4">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-[9px] text-blue-700 font-medium leading-relaxed uppercase tracking-tighter">
            * Los plazos de 5 días para notificación SIE y 15 días para Reconsideración son fatales. El incumplimiento genera riesgo de multa administrativa.
          </p>
        </div>
      </aside>
    </main>
  );
};

export default CalendarioPlazosLegales;
