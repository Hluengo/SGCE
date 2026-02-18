/**
 * WorkflowSystem.tsx - Sistema de Workflow y Derivaciones
 */
import React, { useState } from 'react';
import { User, Clock, Send, ChevronRight, Bell, Building } from 'lucide-react';
import type { ExpedienteCompleto, EtapaProceso, NivelUrgencia } from '@/types';
import { formatearFecha } from '@/shared/utils/plazos';
import { useAuth } from '@/shared/hooks';

const TRANSICIONES: Record<EtapaProceso, EtapaProceso[]> = {
  INICIO: ['NOTIFICADO', 'DESCARGOS', 'CERRADO_GCC'],
  NOTIFICADO: ['INICIO', 'DESCARGOS', 'CERRADO_GCC'],
  DESCARGOS: ['INVESTIGACION', 'CERRADO_GCC'],
  INVESTIGACION: ['RESOLUCION_PENDIENTE', 'CERRADO_GCC'],
  RESOLUCION_PENDIENTE: ['RECONSIDERACION', 'CERRADO_SANCION', 'CERRADO_GCC'],
  RECONSIDERACION: ['CERRADO_SANCION', 'CERRADO_GCC'],
  CERRADO_SANCION: ['CERRADO_GCC'],
  CERRADO_GCC: []
};

const ESTADO_LABELS: Record<EtapaProceso, string> = {
  INICIO: 'Inicio',
  NOTIFICADO: 'Notificado',
  DESCARGOS: 'Descargos',
  INVESTIGACION: 'Investigación',
  RESOLUCION_PENDIENTE: 'Resolución Pendiente',
  RECONSIDERACION: 'Reconsideración',
  CERRADO_SANCION: 'Cerrado Sanción',
  CERRADO_GCC: 'EN PAUSA LEGAL'
};

const URGENCIA_LABELS: Record<NivelUrgencia, { label: string }> = {
  baja: { label: 'Baja' }, media: { label: 'Media' }, alta: { label: 'Alta' }, critica: { label: 'Crítica' }
};

interface Derivacion { id: string; aDepartamento: string; urgencia: NivelUrgencia; justificacion: string; estado: string; fecha: string; }

interface Props {
  expediente: ExpedienteCompleto;
  onTransition?: (e: EtapaProceso, j: string) => void;
}

export const WorkflowSystem: React.FC<Props> = ({ expediente, onTransition }) => {
  const { tienePermiso } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [derivaciones, setDerivaciones] = useState<Derivacion[]>([]);

  const puede = tienePermiso('expedientes:editar');
  const disponibles = TRANSICIONES[expediente.etapa];
  const dias = Math.ceil((new Date(expediente.plazoFatal).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const handleTransition = (nuevo: EtapaProceso, justificacion: string) => {
    onTransition?.(nuevo, justificacion);
    setShowModal(false);
  };

  const handleDerivar = (deps: string, urg: NivelUrgencia, just: string) => {
    setDerivaciones(prev => [...prev, {
      id: crypto.randomUUID(), aDepartamento: deps, urgencia: urg, justificacion: just, estado: 'pendiente',
      fecha: new Date().toISOString()
    }]);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100">
        <div className="flex items-center justify-between">
          <div><p className="text-xs text-indigo-600 uppercase font-bold tracking-wider">Estado</p>
            <h3 className="text-xl font-black text-slate-800">{ESTADO_LABELS[expediente.etapa]}</h3>
          </div>
          <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            dias < 0 ? 'bg-red-100 text-red-700' : dias < 3 ? 'bg-orange-100 text-orange-700' :
            dias < 7 ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            <Clock className="w-4 h-4 inline mr-1" />
            {dias < 0 ? `${Math.abs(dias)} días vencido` : `${dias} días`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {puede && disponibles.length > 0 && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><ChevronRight className="w-5 h-5" /></div>
            <div className="text-left"><p className="font-medium text-slate-800">Cambiar Estado</p><p className="text-xs text-slate-500">Transicionar</p></div>
          </button>
        )}
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Send className="w-5 h-5" /></div>
          <div className="text-left"><p className="font-medium text-slate-800">Derivar</p><p className="text-xs text-slate-500">Enviar a otro</p></div>
        </button>
        <button className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Bell className="w-5 h-5" /></div>
          <div className="text-left"><p className="font-medium text-slate-800">Recordatorio</p><p className="text-xs text-slate-500">Enviar alerta</p></div>
        </button>
        <button className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><User className="w-5 h-5" /></div>
          <div className="text-left"><p className="font-medium text-slate-800">Asignar</p><p className="text-xs text-slate-500">Cambiar responsable</p></div>
        </button>
      </div>

      {derivaciones.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-slate-700 mb-3">Derivaciones</h4>
          <div className="space-y-2">
            {derivaciones.map(d => (
              <div key={d.id} className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-800">{d.aDepartamento}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100">{URGENCIA_LABELS[d.urgencia].label}</span>
                </div>
                <p className="text-sm text-slate-600">{d.justificacion}</p>
                <p className="text-xs text-slate-400 mt-2">{formatearFecha(d.fecha)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {disponibles.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-slate-700 mb-3">Estados</h4>
          <div className="flex flex-wrap gap-2">
            {disponibles.map(e => (
              <button key={e} onClick={() => handleTransition(e, '')}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100">
                {ESTADO_LABELS[e]}
              </button>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <TransitionModal
          estados={disponibles}
          onClose={() => setShowModal(false)}
          onConfirm={handleTransition}
          onDerivar={handleDerivar}
        />
      )}
    </div>
  );
};

const TransitionModal: React.FC<{
  estados: EtapaProceso[];
  onClose: () => void;
  onConfirm: (e: EtapaProceso, j: string) => void;
  onDerivar: (d: string, u: NivelUrgencia, j: string) => void;
}> = ({ estados, onClose, onConfirm, onDerivar }) => {
  const [estado, setEstado] = useState<EtapaProceso | ''>('');
  const [justificacion, setJustificacion] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [urgencia, setUrgencia] = useState<NivelUrgencia>('media');
  const [tab, setTab] = useState<'estado' | 'derivar'>('estado');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'estado' && estado) onConfirm(estado, justificacion);
    else if (tab === 'derivar' && departamento) onDerivar(departamento, urgencia, justificacion);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Acción</h3>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('estado')} className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${tab === 'estado' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>Estado</button>
          <button onClick={() => setTab('derivar')} className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${tab === 'derivar' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>Derivar</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'estado' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Estado</label>
              <select value={estado} onChange={(e) => setEstado(e.target.value as EtapaProceso)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg">
                <option value="">Seleccionar...</option>
                {estados.map(e => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
              </select>
            </div>
          ) : (
            <>
              <div><label className="block text-sm font-medium text-slate-700 mb-2">Departamento</label>
                <select value={departamento} onChange={(e) => setDepartamento(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg">
                  <option value="">Seleccionar...</option>
                  <option value="CONVIVENCIA_ESCOLAR">Convivencia Escolar</option>
                  <option value="PSICOLOGIA">Psicología</option>
                  <option value="PSICOPEDAGOGIA">Psicopedagogía</option>
                  <option value="INSPECCION">Inspección</option>
                  <option value="DIRECCION">Dirección</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-2">Urgencia</label>
                <select value={urgencia} onChange={(e) => setUrgencia(e.target.value as NivelUrgencia)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg">
                  <option value="baja">Baja</option><option value="media">Media</option>
                  <option value="alta">Alta</option><option value="critica">Crítica</option>
                </select>
              </div>
            </>
          )}
          <div><label className="block text-sm font-medium text-slate-700 mb-2">Justificación *</label>
            <textarea value={justificacion} onChange={(e) => setJustificacion(e.target.value)} required rows={3}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg" placeholder="Motivo..." />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={!justificacion.trim() || (tab === 'estado' && !estado) || (tab === 'derivar' && !departamento)}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {tab === 'estado' ? 'Cambiar' : 'Derivar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkflowSystem;
