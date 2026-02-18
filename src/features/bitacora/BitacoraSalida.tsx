import React, { useState, useEffect } from 'react';
import { DoorOpen, ShieldAlert, Plus, FileText } from 'lucide-react';
import { supabase } from '@/shared/lib/supabaseClient';
import { EstudianteBadge } from '@/shared/components/EstudianteBadge';

interface RegistroSalida {
  id: string;
  nna: string;
  nnaCurso?: string | null;
  hora: string;
  motivo: string;
  retiradoPor: string;
  rut: string;
  firma: boolean;
  fecha: string;
}

const BitacoraSalida: React.FC = () => {
  const [registros, setRegistros] = useState<RegistroSalida[]>([]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const loadRegistros = async () => {
      const { data, error } = await client
        .from('bitacora_salida')
        .select('id, nna_nombre, nna_curso, hora, motivo, retirado_por, rut, firma, fecha')
        .order('fecha', { ascending: false })
        .limit(200);

      if (error || !data || data.length === 0) {
        if (error) {
          console.warn('Supabase: no se pudieron cargar salidas', error);
        }
        return;
      }

      const mapped = data.map((row) => ({
        id: row.id,
        nna: row.nna_nombre ?? 'Sin nombre',
        nnaCurso: row.nna_curso ?? null,
        hora: row.hora ?? '',
        motivo: row.motivo ?? '',
        retiradoPor: row.retirado_por ?? '',
        rut: row.rut ?? '',
        firma: row.firma ?? false,
        fecha: row.fecha ?? ''
      }));

      setRegistros(mapped);
    };

    loadRegistros();
  }, []);

  return (
    <main className="flex-1 p-4 md:p-10 bg-slate-50 flex justify-center items-start overflow-y-auto animate-in fade-in duration-700">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] border border-slate-200 shadow-2xl p-6 md:p-12 space-y-8">
        <header className="text-center space-y-2">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
            <DoorOpen className="w-8 h-8 md:w-10 md:h-10" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">Bitacora de Salida</h2>
          <p className="text-slate-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em]">Control de Custodia y Retiro de Estudiantes</p>
        </header>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 leading-relaxed">
            <p className="font-bold text-xs uppercase tracking-wider mb-1">Aviso Legal</p>
            <p className="text-[11px] font-medium leading-relaxed">
              El establecimiento no puede hacer abandono del estudiante sin antes entregarlo a un adulto responsable. Este registro constituye la prueba legal de entrega de custodia.
            </p>
          </div>
        </div>

        <button className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
          <Plus className="w-5 h-5" />
          <span>Nuevo Registro de Salida</span>
        </button>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Registros Recientes</h3>
          
          {registros.length > 0 ? (
            registros.map((reg) => (
              <div key={reg.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-lg font-black text-slate-400">
                        {reg.hora ? reg.hora.split(':')[0] : '--'}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500">{reg.fecha}</p>
                      <p className="text-[10px] font-black text-slate-500">{reg.hora}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-500">{reg.id.slice(0, 8)}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Estudiante</p>
                    <EstudianteBadge nombre={reg.nna} curso={reg.nnaCurso} size="md" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Motivo</p>
                    <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                      {reg.motivo}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Adulto Responsable</p>
                      <p className="text-xs font-black text-slate-800 uppercase">{reg.retiradoPor}</p>
                      <p className="text-[9px] font-bold text-slate-400 font-mono">{reg.rut}</p>
                    </div>
                    <button className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all">
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <DoorOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-bold uppercase">No hay registros</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default BitacoraSalida;
