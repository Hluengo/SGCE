/**
 * NotificationsPanel - Sistema de Notificaciones y Alertas
 * Cumple con Circular 782 - Gestión de Plazos
 *
 * Funcionalidades:
 * - Notificaciones de expedientes pendientes
 * - Alertas de plazos próximos a vencer
 * - Cambios de estado relevantes
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import {
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText
} from 'lucide-react';
import { calcularDiasRestantes } from '@/shared/utils/plazos';

/**
 * Tipo de notificación
 */
type TipoNotificacion = 'plazo' | 'pendiente' | 'estado' | 'recordatorio';

/**
 * Notificación del sistema
 */
interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  expedienteId?: string;
  leida: boolean;
  fechaCreacion: string;
  prioridad: 'alta' | 'media' | 'baja';
}

/**
 * Componente de notificaciones
 */
const NotificationsPanel: React.FC = () => {
  const { expedientes } = useConvivencia();

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Generar notificaciones basadas en los expedientes
  useEffect(() => {
    const nuevasNotificaciones: Notificacion[] = [];
    const ahora = new Date();

    expedientes.forEach(exp => {
      const diasRestantes = calcularDiasRestantes(exp.plazoFatal);

      // Notificación de plazo próximo a vencer
      if (diasRestantes <= 7 && diasRestantes >= 0) {
        nuevasNotificaciones.push({
          id: `plazo_${exp.id}`,
          tipo: 'plazo',
          titulo: 'Plazo Próximo a Vencer',
          mensaje: `El expediente ${exp.id} de ${exp.nnaNombre} tiene ${diasRestantes} días restantes`,
          expedienteId: exp.id,
          leida: false,
          fechaCreacion: ahora.toISOString(),
          prioridad: diasRestantes <= 3 ? 'alta' : 'media'
        });
      }

      // Notificación de plazo vencido
      if (diasRestantes < 0) {
        nuevasNotificaciones.push({
          id: `vencido_${exp.id}`,
          tipo: 'plazo',
          titulo: 'PLAZO VENCIDO',
          mensaje: `El expediente ${exp.id} de ${exp.nnaNombre} ha superado el plazo legal`,
          expedienteId: exp.id,
          leida: false,
          fechaCreacion: ahora.toISOString(),
          prioridad: 'alta'
        });
      }

      // Notificación de expedientes sin acción prolongada
      if (exp.etapa === 'INICIO' || exp.etapa === 'NOTIFICADO') {
        const diasEnEtapa = Math.floor((ahora.getTime() - new Date(exp.fechaInicio).getTime()) / 86400000);
        if (diasEnEtapa > 5) {
          nuevasNotificaciones.push({
            id: `pendiente_${exp.id}`,
            tipo: 'pendiente',
            titulo: 'Expediente Sin Avance',
            mensaje: `El expediente ${exp.id} lleva ${diasEnEtapa} días sin avanzar de etapa`,
            expedienteId: exp.id,
            leida: false,
            fechaCreacion: ahora.toISOString(),
            prioridad: 'media'
          });
        }
      }

      // Expedientes de expulsión con urgencia
      if (exp.esProcesoExpulsion && diasRestantes <= 10) {
        nuevasNotificaciones.push({
          id: `expulsion_${exp.id}`,
          tipo: 'recordatorio',
          titulo: 'Proceso de Expulsión',
          mensaje: `Expulsión (Ley Aula Segura): ${diasRestantes} días hábiles restantes`,
          expedienteId: exp.id,
          leida: false,
          fechaCreacion: ahora.toISOString(),
          prioridad: 'alta'
        });
      }
    });

    // Ordenar por prioridad
    const ordenPrioridad = { alta: 0, media: 1, baja: 2 };
    nuevasNotificaciones.sort((a, b) => ordenPrioridad[a.prioridad] - ordenPrioridad[b.prioridad]);

    setNotificaciones(nuevasNotificaciones);
    setIsLoading(false);
  }, [expedientes]);

  // Notificaciones no leídas
  const notificacionesNoLeidas = useMemo(() =>
    notificaciones.filter(n => !n.leida),
    [notificaciones]
  );

  // Marcar como leída
  const marcarComoLeida = (id: string) => {
    setNotificaciones(prev =>
      prev.map(n => n.id === id ? { ...n, leida: true } : n)
    );
  };

  // Marcar todas como leídas
  const marcarTodasLeidas = () => {
    setNotificaciones(prev =>
      prev.map(n => ({ ...n, leida: true }))
    );
  };

  // Obtener icono por tipo
  const getTipoIcon = (tipo: TipoNotificacion) => {
    switch (tipo) {
      case 'plazo': return Clock;
      case 'pendiente': return FileText;
      case 'estado': return CheckCircle;
      case 'recordatorio': return AlertTriangle;
      default: return Bell;
    }
  };

  // Obtener color por prioridad
  const getPrioridadColor = (prioridad: 'alta' | 'media' | 'baja') => {
    switch (prioridad) {
      case 'alta': return 'bg-red-50 border-red-200 text-red-700';
      case 'media': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'baja': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    }
  };

  // Obtener icono de prioridad
  const getPrioridadIcon = (prioridad: 'alta' | 'media' | 'baja') => {
    switch (prioridad) {
      case 'alta': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'media': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'baja': return <CheckCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
      >
        <Bell className="w-6 h-6" />
        {notificacionesNoLeidas.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
            {notificacionesNoLeidas.length > 9 ? '9+' : notificacionesNoLeidas.length}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {showPanel && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPanel(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 uppercase">Notificaciones</h3>
                  <p className="text-xs text-slate-500">
                    {notificacionesNoLeidas.length} sin leer
                  </p>
                </div>
              </div>
              {notificacionesNoLeidas.length > 0 && (
                <button
                  onClick={marcarTodasLeidas}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            {/* Lista de notificaciones */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Cargando notificaciones...</p>
                </div>
              ) : notificaciones.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto text-emerald-300 mb-3" />
                  <p className="text-sm text-slate-500 font-medium">
                    No hay notificaciones pendientes
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notificaciones.map(notificacion => {
                    const Icon = getTipoIcon(notificacion.tipo);
                    return (
                      <button
                        key={notificacion.id}
                        onClick={() => marcarComoLeida(notificacion.id)}
                        className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                          !notificacion.leida ? 'bg-indigo-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-xl ${getPrioridadColor(notificacion.prioridad)}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-sm text-slate-800 truncate">
                                {notificacion.titulo}
                              </p>
                              {getPrioridadIcon(notificacion.prioridad)}
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {notificacion.mensaje}
                            </p>
                            {notificacion.expedienteId && (
                              <p className="text-[10px] font-black text-indigo-600 uppercase mt-2">
                                Folio: {notificacion.expedienteId}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200">
              <button
                onClick={() => setShowPanel(false)}
                className="w-full py-2 text-center text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsPanel;
