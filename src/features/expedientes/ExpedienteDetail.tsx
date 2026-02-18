/**
 * ExpedienteDetail.tsx - Vista Detallada de Expediente
 */

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronRight,
  Calendar,
  User,
  FileText,
  Clock,
  AlertTriangle,
  Download,
  Edit,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Shield,
  Users,
  Building
} from 'lucide-react';
import type { ExpedienteCompleto, EtapaProceso, TipoFalta, GravedadFalta } from '@/types';
import { calcularDiasRestantes, formatearFecha } from '@/shared/utils/plazos';
import { useAuth } from '@/shared/hooks';
import { CaseTimeline } from './CaseTimeline';
import { useExpedienteHistorial } from '@/shared/hooks/useExpedienteHistorial';

const ESTADO_LABELS: Record<EtapaProceso, { label: string }> = {
  INICIO: { label: 'Inicio' },
  NOTIFICADO: { label: 'Notificado' },
  DESCARGOS: { label: 'Descargos' },
  INVESTIGACION: { label: 'Investigación' },
  RESOLUCION_PENDIENTE: { label: 'Resolución Pendiente' },
  RECONSIDERACION: { label: 'Reconsideración' },
  CERRADO_SANCION: { label: 'Cerrado Sanción' },
  CERRADO_GCC: { label: 'EN PAUSA LEGAL' }
};

const GRAVEDAD_LABELS: Record<GravedadFalta, { label: string }> = {
  LEVE: { label: 'Leve' },
  RELEVANTE: { label: 'Relevante' },
  GRAVE: { label: 'Grave' },
  GRAVISIMA_EXPULSION: { label: 'Gravísima (Expulsión)' }
};

const TIPO_FALTA_LABELS: Record<TipoFalta, { label: string }> = {
  conducta_contraria: { label: 'Conducta Contraria' },
  falta_grave: { label: 'Falta Grave' },
  falta_gravisima: { label: 'Falta Gravísima' }
};

interface Props {
  expediente: ExpedienteCompleto;
  onClose?: () => void;
  onEdit?: () => void;
  showTimeline?: boolean;
  showDocuments?: boolean;
  showWorkflow?: boolean;
}

export const ExpedienteDetail: React.FC<Props> = ({
  expediente,
  onClose,
  onEdit,
  showTimeline = true,
  showDocuments = true,
  showWorkflow = true
}) => {
  const { tienePermiso } = useAuth();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const initialTab: 'info' | 'documentos' | 'timeline' | 'workflow' = 
    tabFromUrl === 'timeline' || tabFromUrl === 'documentos' || tabFromUrl === 'workflow' 
      ? tabFromUrl 
      : 'info';
  
  const [activeTab, setActiveTab] = useState<'info' | 'documentos' | 'timeline' | 'workflow'>(initialTab);
  
  const { entries: historial, isLoading: isLoadingHistorial } = useExpedienteHistorial(expediente?.id || null);

  const diasRestantes = calcularDiasRestantes(expediente.plazoFatal);
  const puedeEditar = tienePermiso('expedientes:editar');

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-black uppercase tracking-widest opacity-80">Expediente</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 border border-white/30">
                {ESTADO_LABELS[expediente.etapa].label}
              </span>
            </div>
            <h1 className="text-2xl font-black mb-1">{expediente.folio}</h1>
            <p className="text-sm opacity-80">
              Creado el {formatearFecha(expediente.fechaCreacion)} • Responsable: {expediente.responsableId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {puedeEditar && (
              <button onClick={() => onEdit?.()} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg">
                <Edit className="w-5 h-5" />
              </button>
            )}
            {onClose && (
              <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
            diasRestantes < 0 ? 'bg-red-500' :
            diasRestantes <= 3 ? 'bg-orange-500' :
            diasRestantes <= 7 ? 'bg-yellow-500' : 'bg-white/20'
          }`}>
            <Clock className="w-4 h-4" />
            <span>
              {diasRestantes < 0 ? `Vencido ${Math.abs(diasRestantes)} días` :
               diasRestantes === 0 ? 'Vence hoy' : `${diasRestantes} días`}
            </span>
          </div>
          {expediente.esExpulsion && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-lg text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              <span>Proceso Expulsión</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1 p-2">
          {[
            { key: 'info', label: 'Información', icon: FileText },
            { key: 'documentos', label: 'Documentos', icon: Download, count: expediente.documentos.length },
            { key: 'timeline', label: 'Historial', icon: Clock, count: expediente.bitacora.length },
            { key: 'workflow', label: 'Workflow', icon: Shield }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Datos del Alumno */}
            <section>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Estudiante</h2>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><User className="w-4 h-4" /></div>
                    <div><p className="text-xs text-slate-500 uppercase">Nombre</p><p className="font-semibold">{expediente.alumno.nombreCompleto}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-200 text-slate-600 rounded-lg"><GraduationCap className="w-4 h-4" /></div>
                    <div><p className="text-xs text-slate-500 uppercase">RUN</p><p className="font-semibold">{expediente.alumno.run}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Building className="w-4 h-4" /></div>
                    <div><p className="text-xs text-slate-500 uppercase">Curso</p><p className="font-semibold">{expediente.alumno.curso}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Users className="w-4 h-4" /></div>
                    <div><p className="text-xs text-slate-500 uppercase">Nivel</p><p className="font-semibold capitalize">{expediente.alumno.nivel}</p></div>
                  </div>
                </div>
              </div>
            </section>

            {/* Apoderado */}
            {expediente.apoderado && (
              <section>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Apoderado</h2>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><User className="w-4 h-4" /></div>
                      <div><p className="text-xs text-slate-500 uppercase">Nombre</p><p className="font-semibold">{expediente.apoderado.nombreCompleto}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-200 text-slate-600 rounded-lg"><Phone className="w-4 h-4" /></div>
                      <div><p className="text-xs text-slate-500 uppercase">Teléfono</p><p className="font-semibold">{expediente.apoderado.telefono}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Mail className="w-4 h-4" /></div>
                      <div><p className="text-xs text-slate-500 uppercase">Email</p><p className="font-semibold">{expediente.apoderado.email}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><MapPin className="w-4 h-4" /></div>
                      <div><p className="text-xs text-slate-500 uppercase">Dirección</p><p className="font-semibold">{expediente.apoderado.direccion}</p></div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Hechos */}
            {expediente.hechos.map((hecho, index) => (
              <section key={hecho.id}>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Hecho #{index + 1}</h2>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-100 text-red-600 rounded-lg"><Calendar className="w-4 h-4" /></div>
                      <div><p className="text-xs text-slate-500 uppercase">Fecha</p><p className="font-semibold">{formatearFecha(hecho.fechaHecho)}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><MapPin className="w-4 h-4" /></div>
                      <div><p className="text-xs text-slate-500 uppercase">Lugar</p><p className="font-semibold">{hecho.lugar}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg"><AlertTriangle className="w-4 h-4" /></div>
                      <div><p className="text-xs text-slate-500 uppercase">Gravedad</p><p className="font-semibold">{GRAVEDAD_LABELS[hecho.gravedad].label}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Shield className="w-4 h-4" /></div>
                      <div><p className="text-xs text-slate-500 uppercase">Tipo</p><p className="font-semibold">{TIPO_FALTA_LABELS[hecho.tipoFalta].label}</p></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">Descripción</p>
                    <p className="text-slate-700">{hecho.descripcion}</p>
                  </div>
                  {hecho.circunstancias && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-500 uppercase mb-1">Circunstancias</p>
                      <p className="text-slate-700">{hecho.circunstancias}</p>
                    </div>
                  )}
                </div>
              </section>
            ))}

            {/* Medidas */}
            {expediente.medidas.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Medidas Disciplinarias</h2>
                <div className="space-y-3">
                  {expediente.medidas.map((medida, index) => (
                    <div key={medida.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-slate-800">Medida #{index + 1}: {medida.tipo.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-slate-500">{formatearFecha(medida.fechaAplicacion)} • {medida.responsable}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          medida.estadoCumplimiento === 'cumplida' ? 'bg-emerald-100 text-emerald-700' :
                          medida.estadoCumplimiento === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {medida.estadoCumplimiento.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-slate-700">{medida.descripcion}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {expediente.observaciones && (
              <section>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Observaciones</h2>
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                  <p className="text-slate-700">{expediente.observaciones}</p>
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'documentos' && showDocuments && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">Documentos: {expediente.documentos.length} archivos</p>
          </div>
        )}

        {activeTab === 'timeline' && showTimeline && (
          <div className="p-4">
            {isLoadingHistorial ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-slate-500">Cargando historial...</span>
              </div>
            ) : historial.length > 0 ? (
              <CaseTimeline 
                items={historial.map(entry => ({
                  id: entry.id,
                  fecha: entry.fecha,
                  titulo: entry.titulo,
                  descripcion: entry.descripcion,
                  tipo: entry.tipo,
                  usuario: entry.usuario
                }))}
                initialLimit={15}
              />
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No hay registros en el historial del expediente.</p>
                <p className="text-xs text-slate-400 mt-2">Los cambios se registrarán automáticamente.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'workflow' && showWorkflow && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">Sistema de workflow disponible</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpedienteDetail;
