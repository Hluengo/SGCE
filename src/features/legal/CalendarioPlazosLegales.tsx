
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
import { AsyncState } from '@/shared/components/ui';

interface Evento {
  date: string;
  type: 'FATAL' | 'DESCARGOS' | 'INTERNO' | 'GCC';
  title: string;
  expedienteId: string;
  nna: string;
}
type ExpedienteItem = ReturnType<typeof useConvivencia>['expedientes'][number];

const CalendarDayCell: React.FC<{
  dayNumber: number;
  year: number;
  month: number;
  eventos: Evento[];
  expedientes: ExpedienteItem[];
  setExpedienteSeleccionado: ReturnType<typeof useConvivencia>['setExpedienteSeleccionado'];
  feriadosItems: Map<string, Feriado>;
}> = ({ dayNumber, year, month, eventos, expedientes, setExpedienteSeleccionado, feriadosItems }) => {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
  const dayEvents = eventos.filter(e => e.date === dateStr);
  const isToday = new Date().toISOString().split('T')[0] === dateStr;
  const isHoliday = esFeriado(dateStr, feriadosItems);
  const nombreFeriado = obtenerDescripcionFeriado(dateStr, feriadosItems);
  const isWeekend = esFinDeSemana(dateStr);

  if (isHoliday) {
    return (
      <div
        key={dayNumber}
        className="min-h-28 bg-red-50 border-2 border-red-300 p-2 flex flex-col space-y-1 transition-all hover:bg-red-100/50 shadow-md"
        title={nombreFeriado || 'Feriado'}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-black text-red-700">{dayNumber}</span>
          <AlertCircle className="w-4 h-4 text-red-500" />
        </div>
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <span className="text-xs font-black uppercase text-red-600 leading-tight px-1">
            {nombreFeriado}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      key={dayNumber}
      className={`min-h-28 border p-2 flex flex-col space-y-1 transition-all ${
        isToday
          ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/30 border-blue-200'
          : isWeekend
            ? 'bg-slate-100 border-slate-200'
            : 'bg-white border-slate-100'
      } hover:bg-opacity-70`}
    >
      <div className="flex justify-between items-center mb-1">
        <span className={`text-xs font-black ${isToday ? 'text-blue-600' : isWeekend ? 'text-slate-500' : 'text-slate-400'}`}>
          {dayNumber}
        </span>
        {isToday && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
        {isWeekend && <span className="text-xs font-black text-slate-400 uppercase">F.S.</span>}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col space-y-1">
        {dayEvents.map((ev) => (
          <button
            key={`${ev.expedienteId}-${ev.type}-${ev.title}`}
            onClick={() => {
              const exp = expedientes.find(e => e.id === ev.expedienteId);
              if (exp) setExpedienteSeleccionado(exp);
            }}
            className={`text-xs font-black uppercase p-1.5 rounded-lg border text-left truncate transition-transform active:scale-95 ${
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

const UrgenciasSidebar: React.FC<{
  eventosLoading: boolean;
  urgenciasHoy: Evento[];
  expedientes: ReturnType<typeof useConvivencia>['expedientes'];
  setExpedienteSeleccionado: ReturnType<typeof useConvivencia>['setExpedienteSeleccionado'];
  monthName: string;
  year: number;
  month: number;
  feriadosLoading: boolean;
  feriadosItems: Map<string, Feriado>;
}> = ({
  eventosLoading,
  urgenciasHoy,
  expedientes,
  setExpedienteSeleccionado,
  monthName,
  year,
  month,
  feriadosLoading,
  feriadosItems,
}) => (
  <aside className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-4 md:p-8 flex flex-col shrink-0 overflow-y-auto space-y-8">
    <div>
      <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center">
        <Bell className="w-5 h-5 mr-3 text-red-500 animate-bounce" />
        Urgencias para Hoy
      </h3>

      <div className="space-y-4">
        {eventosLoading ? (
          <AsyncState
            state="loading"
            title="Cargando urgencias"
            message="Verificando vencimientos para hoy."
            compact
          />
        ) : urgenciasHoy.length > 0 ? urgenciasHoy.map((urg) => (
          <div
            key={`${urg.expedienteId}-${urg.type}-${urg.title}`}
            className="bg-white border-2 border-slate-100 p-5 rounded-2xl hover:border-red-200 hover:bg-red-50/10 transition-all cursor-pointer group"
            onClick={() => {
              const exp = expedientes.find(e => e.id === urg.expedienteId);
              if (exp) setExpedienteSeleccionado(exp);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const exp = expedientes.find(item => item.id === urg.expedienteId);
                if (exp) setExpedienteSeleccionado(exp);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex justify-between items-start mb-3">
              <span className={`px-2 py-0.5 rounded-lg text-xs font-black uppercase ${urg.type === 'FATAL' ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
                {urg.type}
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono">{urg.expedienteId}</span>
            </div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1 group-hover:text-red-700 transition-colors">{urg.title}</h4>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{urg.nna}</p>
            <div className="mt-4 flex items-center justify-end text-xs font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
              <span>Ir al expediente</span>
              <ChevronRight className="w-3 h-3 ml-1" />
            </div>
          </div>
        )) : (
          <AsyncState
            state="empty"
            title="Sin urgencias para hoy"
            message="No se registran vencimientos legales para la fecha actual."
            compact
          />
        )}
      </div>
    </div>

    <div className="bg-gradient-to-br from-orange-50 to-red-50/30 border border-orange-200 p-6 rounded-2xl">
      <h4 className="text-xs font-black text-orange-900 uppercase tracking-widest mb-4 flex items-center">
        <CalendarIcon className="w-4 h-4 mr-2 text-orange-600" />
        Feriados de {monthName.charAt(0).toUpperCase() + monthName.slice(1)} {year}
      </h4>

      {feriadosLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {(() => {
            const feriadosDelMes = obtenerFeriadosDelMes(year, month, feriadosItems);
            if (feriadosDelMes.length === 0) {
              return (
                <AsyncState
                  state="empty"
                  title="Sin feriados este mes"
                  message="No hay feriados oficiales cargados para este período."
                  compact
                />
              );
            }

            return feriadosDelMes.map((f) => {
              const fecha = new Date(f.fecha);
              const dia = fecha.getDate();
              return (
                <div key={f.fecha} className="bg-white border border-orange-100 rounded-lg p-2 hover:bg-orange-50/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-xs font-black text-slate-800 truncate pr-2">{f.descripcion}</p>
                      <p className="text-xs text-slate-500 font-semibold mt-1">{dia} de {monthName}</p>
                    </div>
                    {f.esIrrenunciable && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-black uppercase rounded whitespace-nowrap">
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

    <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
      <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:scale-150 transition-all duration-700"></div>
      <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center">
        <AlertTriangle className="w-4 h-4 mr-2" />
        Alerta Preventiva
      </h4>
      <div className="space-y-4">
        {expedientes.filter(e => e.gravedad === 'GRAVISIMA_EXPULSION' && e.etapa === 'NOTIFICADO').map(e => (
          <div key={e.id} className="border-l-2 border-red-500 pl-4 py-1">
            <p className="text-xs font-black uppercase leading-tight">Faltan 48h para Cierre Descargos</p>
            <p className="text-xs text-slate-400 font-bold mt-1">NNA: {e.nnaNombre}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="mt-auto p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-start space-x-4">
      <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
      <p className="text-xs text-blue-700 font-medium leading-relaxed uppercase tracking-tighter">
        * Los plazos de 5 días para notificación SIE y 15 días para Reconsideración son fatales. El incumplimiento genera riesgo de multa administrativa.
      </p>
    </div>
  </aside>
);

const CalendarioPlazosLegales: React.FC = () => {
  const { expedientes, setExpedienteSeleccionado } = useConvivencia();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventosState, setEventosState] = useState<{ items: Evento[]; loading: boolean }>({
    items: [],
    loading: true
  });
  const [feriadosState, setFeriadosState] = useState<{ items: Map<string, Feriado>; loading: boolean }>({
    items: new Map(),
    loading: true
  });
  const [filters, setFilters] = useState({
    expulsion: true,
    reconsideracion: true,
    mediaciones: true,
    internos: true
  });

  // Cargar feriados de Chile al montar
  useEffect(() => {
    const loadFeriados = async () => {
      const feriadosMap = await cargarFeriados();
      setFeriadosState({ items: feriadosMap, loading: false });
    };

    loadFeriados();
  }, []);

  useEffect(() => {
    setEventosState(prev => ({ ...prev, loading: true }));
  }, [expedientes, filters]);

  useEffect(() => {
    const generarEventos = async () => {
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

      setEventosState(prev => ({ ...prev, items: list, loading: false }));
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
    return eventosState.items.filter(e => e.date === todayStr);
  }, [eventosState.items]);

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
            <p className="text-slate-500 font-bold text-xs md:text-xs uppercase tracking-widest flex items-center">
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
        <section className="flex flex-wrap gap-4 items-center bg-white p-4 md:p-6 rounded-3xl border border-slate-200 shadow-sm">
           <div className="flex items-center space-x-6 pr-6 border-r border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs font-black uppercase text-slate-500">Plazo Fatal</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-xs font-black uppercase text-slate-500">Descargos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs font-black uppercase text-slate-500">Hito Interno</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-100 border-2 border-red-300"></div>
                <span className="text-xs font-black uppercase text-slate-500">Feriado</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-slate-100 border border-slate-300"></div>
                <span className="text-xs font-black uppercase text-slate-500">Fin de Semana</span>
              </div>
           </div>

           <div className="flex items-center flex-wrap gap-4">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" checked={filters.expulsion} onChange={e => setFilters({...filters, expulsion: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                <span className="text-xs font-black uppercase text-slate-400 group-hover:text-slate-600 transition-colors">Expulsiones</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" checked={filters.reconsideracion} onChange={e => setFilters({...filters, reconsideracion: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                <span className="text-xs font-black uppercase text-slate-400 group-hover:text-slate-600 transition-colors">Reconsideración</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" checked={filters.mediaciones} onChange={e => setFilters({...filters, mediaciones: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                <span className="text-xs font-black uppercase text-slate-400 group-hover:text-slate-600 transition-colors">Mediaciones</span>
              </label>
           </div>

           {feriadosState.loading && (
            <div className="ml-auto flex items-center space-x-2 text-xs text-slate-400 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span className="font-semibold">Cargando feriados...</span>
            </div>
           )}

           {!feriadosState.loading && feriadosState.items.size === 0 && (
            <div className="ml-auto flex items-center space-x-2 text-xs text-amber-600">
              <AlertCircle className="w-3 h-3" />
              <span className="font-semibold">Sin feriados en BD</span>
            </div>
           )}

           {!feriadosState.loading && feriadosState.items.size > 0 && (
            <div className="ml-auto flex items-center space-x-2 text-xs text-emerald-600">
              <CheckCircle2 className="w-3 h-3" />
              <span className="font-semibold">{feriadosState.items.size} feriados cargados</span>
            </div>
           )}
        </section>

        {/* Cuadrícula del Calendario */}
        <div className="overflow-x-auto">
          {eventosState.loading ? (
            <div className="flex min-h-96 items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 shadow-2xl">
              <AsyncState
                state="loading"
                title="Calculando plazos legales"
                message="Estamos considerando días hábiles y feriados."
                compact
              />
            </div>
          ) : (
            <div className="bg-slate-200 grid grid-cols-7 gap-px rounded-3xl border border-slate-200 overflow-hidden shadow-2xl min-w-full">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="bg-slate-50 py-4 text-center text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                  {day}
                </div>
              ))}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-slate-50/50 min-h-28"></div>
              ))}
              {Array.from({ length: totalDays }).map((_, i) => (
                <CalendarDayCell
                  key={i + 1}
                  dayNumber={i + 1}
                  year={year}
                  month={month}
                  eventos={eventosState.items}
                  expedientes={expedientes}
                  setExpedienteSeleccionado={setExpedienteSeleccionado}
                  feriadosItems={feriadosState.items}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <UrgenciasSidebar
        eventosLoading={eventosState.loading}
        urgenciasHoy={urgenciasHoy}
        expedientes={expedientes}
        setExpedienteSeleccionado={setExpedienteSeleccionado}
        monthName={monthName}
        year={year}
        month={month}
        feriadosLoading={feriadosState.loading}
        feriadosItems={feriadosState.items}
      />
    </main>
  );
};

export default CalendarioPlazosLegales;


