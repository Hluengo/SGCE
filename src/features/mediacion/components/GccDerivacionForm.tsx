import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle, Send, X } from 'lucide-react';
import type { MecanismoGCC } from './GccPanelRouter';
import type { DerivacionCompletaPayload } from '../types';

type AlertaPlazo = 'OK' | 'T2' | 'T1' | 'VENCIDO';

const parseFecha = (value?: string | null): Date | null => {
  if (!value) return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;
  const parts = value.split('-');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const parsed = new Date(`${y}-${m}-${d}`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

const diffDias = (target: Date): number => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

const getAlertaPlazo = (fecha?: string | null): AlertaPlazo => {
  const parsed = parseFecha(fecha);
  if (!parsed) return 'OK';
  const days = diffDias(parsed);
  if (days < 0) return 'VENCIDO';
  if (days <= 1) return 'T1';
  if (days <= 2) return 'T2';
  return 'OK';
};

interface GccDerivacionFormProps {
  expedienteId: string;
  estudianteNombre: string;
  mecanismo: MecanismoGCC;
  onMecanismoChange: (value: MecanismoGCC) => void;
  plazoFatal?: string | null;
  onDerivacionCompleta: (payload: DerivacionCompletaPayload) => void;
  onCancelar: () => void;
}

export const GccDerivacionForm: React.FC<GccDerivacionFormProps> = ({
  expedienteId,
  estudianteNombre,
  mecanismo,
  onMecanismoChange,
  plazoFatal,
  onDerivacionCompleta,
  onCancelar,
}) => {
  const [motivo, setMotivo] = useState('');
  const [objetivos, setObjetivos] = useState<string[]>(['']);
  const [mediadorAsignado, setMediadorAsignado] = useState('');
  const [fechaMediacion, setFechaMediacion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediadores = [
    'Psicóloga Ana María González',
    'Psicólogo Roberto Martínez',
    'Educadora Carla Herrera',
    'Orientador Luis Vega',
  ];

  const alertaPlazo = getAlertaPlazo(plazoFatal);

  const agregarObjetivo = () => setObjetivos([...objetivos, '']);
  const actualizarObjetivo = (index: number, valor: string) => {
    const nuevos = [...objetivos];
    nuevos[index] = valor;
    setObjetivos(nuevos);
  };
  const eliminarObjetivo = (index: number) => {
    setObjetivos(objetivos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onDerivacionCompleta({
        motivo,
        objetivos: objetivos.filter((o) => o.trim() !== ''),
        mediadorAsignado,
        fechaMediacion,
      });
    } catch (err) {
      setError('Error al crear derivación');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-xl shadow-emerald-200/20 animate-in zoom-in-95 duration-300 md:p-10">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center">
          <Send className="w-6 h-6 mr-3 text-emerald-600" />
          Derivación a Centro de Mediación GCC
        </h3>
        <button onClick={onCancelar} className="p-2 text-slate-400 hover:text-slate-600" aria-label="Cancelar derivación">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl">
        <p className="text-sm font-bold text-blue-800">
          Derivando a: <span className="font-black uppercase">{estudianteNombre}</span>
        </p>
        <p className="text-xs text-blue-600 mt-1">Folio: {expedienteId}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Mecanismo GCC</label>
          <select
            value={mecanismo}
            onChange={(e) => onMecanismoChange(e.target.value as MecanismoGCC)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-300 focus:outline-none"
          >
            <option value="MEDIACION">Mediacion (formal)</option>
            <option value="CONCILIACION">Conciliacion (formal)</option>
            <option value="ARBITRAJE_PEDAGOGICO">Arbitraje Pedagogico (formal)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Motivo de Derivación *</label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
            rows={4}
            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-300 focus:outline-none resize-none"
            placeholder="Describa brevemente el conflicto que será derivado a mediación..."
          />
        </div>

        {plazoFatal && (
          <div
            className={`rounded-2xl border px-4 py-3 ${
              alertaPlazo === 'VENCIDO'
                ? 'bg-red-50 border-red-200'
                : alertaPlazo === 'T1'
                  ? 'bg-rose-50 border-rose-200'
                  : alertaPlazo === 'T2'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <p className="text-xs font-black uppercase tracking-widest text-slate-700">Control de Plazo GCC</p>
            <p className="text-xs font-bold mt-1 text-slate-700">
              {alertaPlazo === 'VENCIDO' && 'Caso GCC vencido, requiere accion inmediata.'}
              {alertaPlazo === 'T1' && 'Caso GCC vence manana (alerta alta).'}
              {alertaPlazo === 'T2' && 'Caso GCC próximo al vencimiento (faltan 2 días).'}
              {alertaPlazo === 'OK' && 'Plazo en rango normal.'}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Objetivos de la Mediación</label>
          {objetivos.map((obj, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={obj}
                onChange={(e) => actualizarObjetivo(index, e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-300 focus:outline-none"
                placeholder={`Objetivo ${index + 1}`}
              />
              {objetivos.length > 1 && (
                <button type="button" onClick={() => eliminarObjetivo(index)} className="p-2 text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={agregarObjetivo} className="flex items-center space-x-2 text-sm font-bold text-emerald-600 hover:text-emerald-700">
            <Plus className="w-4 h-4" />
            <span>Agregar Objetivo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Mediador Asignado</label>
            <select
              value={mediadorAsignado}
              onChange={(e) => setMediadorAsignado(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-300 focus:outline-none"
            >
              <option value="">Seleccionar mediador...</option>
              {mediadores.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Fecha Programada</label>
            <input
              type="date"
              value={fechaMediacion}
              onChange={(e) => setFechaMediacion(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-300 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancelar}
            className="flex-1 rounded-2xl border-2 border-slate-200 py-4 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || !motivo.trim()}
            className="flex-[2] rounded-2xl bg-emerald-600 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Derivando...' : 'Confirmar Derivación'}
          </button>
        </div>
      </form>
    </div>
  );
};
