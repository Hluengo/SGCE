
import React, { useState, useMemo, useEffect } from 'react';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { addBusinessDaysWithHolidays, BUSINESS_DAYS_EXPULSION, BUSINESS_DAYS_RELEVANTE } from '@/shared/utils/plazos';
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
  date: string; // YYYY-MM-DD
  type: 'FATAL' | 'DESCARGOS' | 'INTERNO' | 'SIE' | 'RECONSIDERACION' | 'GCC';
  title: string;
  expedienteId: string;
  nna: string;
}
type ExpedienteItem = ReturnType<typeof useConvivencia>['expedientes'][number];

type EventTooltipState = {
  event: Evento;
  x: number;
  y: number;
};

type UrgenciaBucket = {
  hoy: Evento[];
  proximas48h: Evento[];
  vencidas: Evento[];
};

type PreventiveAlertItem = {
  key: string;
  expedienteId: string;
  nna: string;
  titulo: string;
  badge: 'VENCIDO' | 'HOY' | '24H' | '48H';
  descripcion: string;
};

const OPEN_STAGES = new Set([
  'INICIO',
  'NOTIFICADO',
  'DESCARGOS',
  'INVESTIGACION',
  'RESOLUCION_PENDIENTE',
  'RECONSIDERACION',
]);

const toDateKeyLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dateDiffInDays = (fromDateKey: string, toDateKey: string): number => {
  const [fy, fm, fd] = fromDateKey.split('-').map(Number);
  const [ty, tm, td] = toDateKey.split('-').map(Number);
  const from = new Date(fy, fm - 1, fd);
  const to = new Date(ty, tm - 1, td);
  const diffMs = to.getTime() - from.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

const getEventTone = (type: Evento['type']): string => {
  if (type === 'FATAL') return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
  if (type === 'DESCARGOS') return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
  if (type === 'SIE') return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100';
  if (type === 'RECONSIDERACION') return 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100';
  if (type === 'GCC') return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
  return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
};

const CalendarDayCell: React.FC<{
  dayNumber: number;
  year: number;
  month: number;
  eventos: Evento[];
  expedientes: ExpedienteItem[];
  setExpedienteSeleccionado: ReturnType<typeof useConvivencia>['setExpedienteSeleccionado'];
  feriadosItems: Map<string, Feriado>;
  onHoverEvent: (event: Evento, x: number, y: number) => void;
  onLeaveEvent: () => void;
}> = ({ dayNumber, year, month, eventos, expedientes, setExpedienteSeleccionado, feriadosItems, onHoverEvent, onLeaveEvent }) => {
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
            className={`w-full text-xs font-black uppercase p-1.5 rounded-lg border text-left truncate transition-transform active:scale-95 ${getEventTone(ev.type)}`}
            aria-label={`${ev.type}: ${ev.title}. Expediente ${ev.expedienteId}. Estudiante ${ev.nna}`}
            onMouseEnter={(e) => onHoverEvent(ev, e.clientX, e.clientY)}
            onMouseMove={(e) => onHoverEvent(ev, e.clientX, e.clientY)}
            onMouseLeave={onLeaveEvent}
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
  urgencias: UrgenciaBucket;
  preventiveAlerts: PreventiveAlertItem[];
  expedientes: ReturnType<typeof useConvivencia>['expedientes'];
  setExpedienteSeleccionado: ReturnType<typeof useConvivencia>['setExpedienteSeleccionado'];
  monthName: string;
  year: number;
  month: number;
  feriadosLoading: boolean;
  feriadosItems: Map<string, Feriado>;
}> = ({
  eventosLoading,
  urgencias,
  preventiveAlerts,
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
        Urgencias de Plazos
      </h3>

      <div className="space-y-4">
        {eventosLoading ? (
          <AsyncState
            state="loading"
            title="Cargando urgencias"
            message="Verificando vencidos, hoy y próximas 48h."
            compact
          />
        ) : (urgencias.hoy.length + urgencias.proximas48h.length + urgencias.vencidas.length) > 0 ? (
          <>
            {[
              { key: 'VENCIDAS', items: urgencias.vencidas, tone: 'border-red-300 bg-red-50/30', label: 'Vencidas' },
              { key: 'HOY', items: urgencias.hoy, tone: 'border-amber-300 bg-amber-50/30', label: 'Vencen Hoy' },
              { key: '48H', items: urgencias.proximas48h, tone: 'border-blue-300 bg-blue-50/30', label: 'Próx. 48h' },
            ].map((group) =>
              group.items.length > 0 ? (
                <div key={group.key} className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{group.label}</p>
                  {group.items.map((urg) => (
                    <div
                      key={`${group.key}-${urg.expedienteId}-${urg.type}-${urg.title}`}
                      className={`border-2 p-4 rounded-2xl transition-all cursor-pointer group ${group.tone}`}
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
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-black uppercase bg-slate-900 text-white">{urg.type}</span>
                        <span className="text-xs font-bold text-slate-400 font-mono">{urg.expedienteId}</span>
                      </div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1">{urg.title}</h4>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{urg.nna}</p>
                    </div>
                  ))}
                </div>
              ) : null
            )}
          </>
        ) : (
          <AsyncState
            state="empty"
            title="Sin urgencias activas"
            message="No hay plazos vencidos, de hoy o próximas 48 horas."
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
        {preventiveAlerts.length === 0 ? (
          <p className="text-xs text-slate-300 font-semibold">Sin alertas críticas para las próximas 48h.</p>
        ) : (
          preventiveAlerts.map((item) => (
            <div key={item.key} className="border-l-2 border-red-500 pl-4 py-1">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-red-500/20 px-1.5 py-0.5 text-[10px] font-black uppercase text-red-300">
                  {item.badge}
                </span>
                <p className="text-xs font-black uppercase leading-tight">{item.titulo}</p>
              </div>
              <p className="text-xs text-slate-400 font-bold mt-1">NNA: {item.nna}</p>
              <p className="text-[10px] text-slate-300 mt-1">{item.descripcion}</p>
            </div>
          ))
        )}
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
  const [eventTooltip, setEventTooltip] = useState<EventTooltipState | null>(null);

  const expedientesAbiertos = useMemo(
    () => expedientes.filter((exp) => OPEN_STAGES.has(exp.etapa)),
    [expedientes]
  );

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
    const generarEventos = () => {
      const startMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const list: Evento[] = [];
      const feriados = feriadosState.items;

      for (const exp of expedientesAbiertos) {
        try {
          // Plazo Fatal (Vencimiento de Proceso) - calculado con feriados locales
          if (filters.expulsion && exp.gravedad === 'GRAVISIMA_EXPULSION') {
            const plazoFatal = addBusinessDaysWithHolidays(exp.fechaInicio, BUSINESS_DAYS_EXPULSION, feriados);
            list.push({
              date: plazoFatal.toISOString().split('T')[0],
              type: 'FATAL',
              title: 'Cierre Aula Segura',
              expedienteId: exp.id,
              nna: exp.nnaNombre
            });
          } else if (filters.reconsideracion) {
            const plazoFatal = addBusinessDaysWithHolidays(exp.fechaInicio, BUSINESS_DAYS_RELEVANTE, feriados);
            list.push({
              date: plazoFatal.toISOString().split('T')[0],
              type: 'FATAL',
              title: 'Vencimiento Legal',
              expedienteId: exp.id,
              nna: exp.nnaNombre
            });
          }

          // Hito de Descargos (3 días hábiles desde notificación)
          if (exp.etapa === 'NOTIFICADO' || exp.etapa === 'DESCARGOS') {
            const fechaDescargos = addBusinessDaysWithHolidays(exp.fechaInicio, 3, feriados);
            list.push({
              date: fechaDescargos.toISOString().split('T')[0],
              type: 'DESCARGOS',
              title: 'Cierre Descargos',
              expedienteId: exp.id,
              nna: exp.nnaNombre
            });
          }

          // Notificación SIE (5 días hábiles)
          if (filters.internos && (exp.etapa === 'RESOLUCION_PENDIENTE' || exp.etapa === 'RECONSIDERACION')) {
            const fechaSie = addBusinessDaysWithHolidays(exp.fechaInicio, 5, feriados);
            list.push({
              date: fechaSie.toISOString().split('T')[0],
              type: 'SIE',
              title: 'Notificación SIE (5 días)',
              expedienteId: exp.id,
              nna: exp.nnaNombre
            });
          }

          // Reconsideración (15 días hábiles)
          if (filters.reconsideracion && (exp.etapa === 'RESOLUCION_PENDIENTE' || exp.etapa === 'RECONSIDERACION')) {
            const fechaReconsideracion = addBusinessDaysWithHolidays(exp.fechaInicio, 15, feriados);
            list.push({
              date: fechaReconsideracion.toISOString().split('T')[0],
              type: 'RECONSIDERACION',
              title: 'Vence reconsideración (15 días)',
              expedienteId: exp.id,
              nna: exp.nnaNombre
            });
          }

          // Hito interno de investigación (7 días hábiles)
          if (filters.internos && (exp.etapa === 'INICIO' || exp.etapa === 'INVESTIGACION')) {
            const fechaInterna = addBusinessDaysWithHolidays(exp.fechaInicio, 7, feriados);
            list.push({
              date: fechaInterna.toISOString().split('T')[0],
              type: 'INTERNO',
              title: 'Revisión interna (7 días)',
              expedienteId: exp.id,
              nna: exp.nnaNombre
            });
          }

          // Seguimiento GCC en etapas abiertas de resolución
          if (filters.mediaciones && exp.etapa === 'RESOLUCION_PENDIENTE') {
            list.push({
              date: exp.fechaInicio.split('T')[0],
              type: 'GCC',
              title: 'Seguimiento GCC',
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

      const endMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const elapsed = Math.round(endMs - startMs);
      console.info('[CalendarioPlazosLegales] cálculo completado', {
        expedientes: expedientesAbiertos.length,
        eventos: list.length,
        duracionMs: elapsed,
      });
    };

    generarEventos();
  }, [expedientesAbiertos, filters, feriadosState.items]);

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

  const urgencias = useMemo<UrgenciaBucket>(() => {
    const todayStr = toDateKeyLocal(new Date());
    const hoy: Evento[] = [];
    const proximas48h: Evento[] = [];
    const vencidas: Evento[] = [];

    for (const evento of eventosState.items) {
      const diffDays = dateDiffInDays(todayStr, evento.date);
      if (diffDays < 0) {
        vencidas.push(evento);
      } else if (diffDays === 0) {
        hoy.push(evento);
      } else if (diffDays <= 2) {
        proximas48h.push(evento);
      }
    }

    return { hoy, proximas48h, vencidas };
  }, [eventosState.items]);

  const totalUrgencias = urgencias.hoy.length + urgencias.proximas48h.length + urgencias.vencidas.length;

  const preventiveAlerts = useMemo<PreventiveAlertItem[]>(() => {
    const todayStr = toDateKeyLocal(new Date());
    const byId = new Map(expedientes.map((exp) => [exp.id, exp]));
    const candidates = eventosState.items.filter((ev) => ev.type === 'DESCARGOS' || ev.type === 'FATAL');
    const items: PreventiveAlertItem[] = [];

    for (const ev of candidates) {
      const exp = byId.get(ev.expedienteId);
      if (!exp || exp.gravedad !== 'GRAVISIMA_EXPULSION') continue;

      const diffDays = dateDiffInDays(todayStr, ev.date);
      if (diffDays > 2) continue;

      let badge: PreventiveAlertItem['badge'];
      if (diffDays < 0) badge = 'VENCIDO';
      else if (diffDays === 0) badge = 'HOY';
      else if (diffDays === 1) badge = '24H';
      else badge = '48H';

      const descripcion =
        diffDays < 0
          ? `Plazo vencido hace ${Math.abs(diffDays)} día(s).`
          : diffDays === 0
            ? 'Plazo vence hoy.'
            : `Plazo vence en ${diffDays} día(s).`;

      items.push({
        key: `${ev.expedienteId}-${ev.type}-${ev.date}`,
        expedienteId: ev.expedienteId,
        nna: ev.nna,
        titulo: ev.title,
        badge,
        descripcion,
      });
    }

    const priority = { VENCIDO: 0, HOY: 1, '24H': 2, '48H': 3 } as const;
    return items.sort((a, b) => priority[a.badge] - priority[b.badge]).slice(0, 6);
  }, [eventosState.items, expedientes]);

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
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
                Abiertos: {expedientesAbiertos.length}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
                Eventos: {eventosState.items.length}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
                Urgencias: {totalUrgencias}
              </span>
            </div>
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
                <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                <span className="text-xs font-black uppercase text-slate-500">Reconsideración</span>
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
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" checked={filters.internos} onChange={e => setFilters({...filters, internos: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                <span className="text-xs font-black uppercase text-slate-400 group-hover:text-slate-600 transition-colors">Hitos internos / SIE</span>
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
                  onHoverEvent={(event, x, y) => setEventTooltip({ event, x, y })}
                  onLeaveEvent={() => setEventTooltip(null)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <UrgenciasSidebar
        eventosLoading={eventosState.loading}
        urgencias={urgencias}
        preventiveAlerts={preventiveAlerts}
        expedientes={expedientes}
        setExpedienteSeleccionado={setExpedienteSeleccionado}
        monthName={monthName}
        year={year}
        month={month}
        feriadosLoading={feriadosState.loading}
        feriadosItems={feriadosState.items}
      />

      {eventTooltip && (
        <div
          className="pointer-events-none fixed z-[120] w-[min(20rem,calc(100vw-1rem))] rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_24px_48px_-16px_rgba(15,23,42,0.45)] backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: Math.min(eventTooltip.x + 14, window.innerWidth - 340),
            top: Math.max(12, eventTooltip.y - 10),
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white">
              {eventTooltip.event.type}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {eventTooltip.event.date}
            </span>
          </div>
          <p className="mt-2 text-sm font-black text-slate-900">{eventTooltip.event.title}</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">NNA: {eventTooltip.event.nna}</p>
          <p className="mt-1 text-[11px] font-medium text-slate-500">Expediente: {eventTooltip.event.expedienteId}</p>
        </div>
      )}
    </main>
  );
};

export default CalendarioPlazosLegales;


