import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { ResultadoMediacion } from '@/types';
import type { ResultadoCompletoPayload } from '../types';

interface GccResultadoFormProps {
  onCompleto: (payload: ResultadoCompletoPayload) => void;
}

export const GccResultadoForm: React.FC<GccResultadoFormProps> = ({ onCompleto }) => {
  const [resultado, setResultado] = useState<ResultadoMediacion>('sin_acuerdo');
  const [acuerdos, setAcuerdos] = useState<string[]>(['']);
  const [compromisos, setCompromisos] = useState<string[]>(['']);
  const [observaciones, setObservaciones] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const agregarAcuerdo = () => setAcuerdos([...acuerdos, '']);
  const agregarCompromiso = () => setCompromisos([...compromisos, '']);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onCompleto({
        resultado,
        acuerdos: acuerdos.filter((item) => item.trim() !== ''),
        compromisos: compromisos.filter((item) => item.trim() !== ''),
        observaciones,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resultados: { value: ResultadoMediacion; label: string; color: string }[] = [
    { value: 'acuerdo_total', label: 'Acuerdo Total', color: 'bg-emerald-500' },
    { value: 'acuerdo_parcial', label: 'Acuerdo Parcial', color: 'bg-yellow-500' },
    { value: 'sin_acuerdo', label: 'Sin Acuerdo', color: 'bg-orange-500' },
    { value: 'no_conciliables', label: 'No Conciliables', color: 'bg-red-500' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Resultado de la Mediación *</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {resultados.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setResultado(r.value)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                resultado === r.value ? `${r.color} text-white border-transparent shadow-lg` : 'border-slate-200 text-slate-600 hover:border-emerald-300'
              }`}
            >
              <span className="text-xs font-black uppercase">{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Acuerdos Alcanzados</label>
        {acuerdos.map((a, i) => (
          <textarea
            key={i}
            value={a}
            onChange={(e) => {
              const nuevos = [...acuerdos];
              nuevos[i] = e.target.value;
              setAcuerdos(nuevos);
            }}
            rows={2}
            className="w-full px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-300 focus:outline-none resize-none"
            placeholder={`Acuerdo ${i + 1}`}
          />
        ))}
        <button type="button" onClick={agregarAcuerdo} className="flex items-center space-x-2 text-sm font-bold text-emerald-600 hover:text-emerald-700">
          <Plus className="w-4 h-4" />
          <span>Agregar Acuerdo</span>
        </button>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Compromisos Reparatorios</label>
        {compromisos.map((c, i) => (
          <input
            key={i}
            type="text"
            value={c}
            onChange={(e) => {
              const nuevos = [...compromisos];
              nuevos[i] = e.target.value;
              setCompromisos(nuevos);
            }}
            className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 focus:outline-none"
            placeholder={`Compromiso ${i + 1}`}
          />
        ))}
        <button type="button" onClick={agregarCompromiso} className="flex items-center space-x-2 text-sm font-bold text-blue-600 hover:text-blue-700">
          <Plus className="w-4 h-4" />
          <span>Agregar Compromiso</span>
        </button>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Observaciones</label>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-300 focus:outline-none resize-none"
          placeholder="Observaciones adicionales..."
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-2xl bg-emerald-600 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all disabled:opacity-50"
      >
        {isLoading ? 'Guardando...' : 'Registrar Resultado'}
      </button>
    </form>
  );
};
