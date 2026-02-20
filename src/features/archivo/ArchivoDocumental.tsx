
import React, { useEffect, useMemo, useState } from 'react';
import { Library, Folder, FileText, Download, ShieldCheck, Search } from 'lucide-react';
import { supabase } from '@/shared/lib/supabaseClient';

interface CarpetaRow {
  id: string;
  nombre: string;
}

interface DocumentoCountRow {
  carpeta_id: string;
  size_bytes: number | null;
}

interface DocumentoRow {
  id: string;
  nombre: string;
  created_at: string;
  size_bytes: number | null;
}

const ArchivoDocumental: React.FC = () => {
  const [carpetas, setCarpetas] = useState<{ id: string; name: string; docs: number; size: string }[]>([
    { id: 'mock-1', name: 'Reglamentos RICE 2025', docs: 4, size: '12 MB' },
    { id: 'mock-2', name: 'Protocolos de Emergencia', docs: 8, size: '24 MB' },
    { id: 'mock-3', name: 'Resoluciones Firmadas', docs: 42, size: '156 MB' },
    { id: 'mock-4', name: 'Actas de Mediacion', docs: 15, size: '8 MB' }
  ]);
  const [documentos, setDocumentos] = useState<{ id: string; nombre: string; created_at: string; size_bytes: number | null }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadCarpetas = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('carpetas_documentales')
        .select('id, nombre')
        .order('nombre', { ascending: true })
        .limit(200);

      if (error || !data || data.length === 0) {
        if (error) {
          console.warn('Supabase: no se pudieron cargar carpetas', error);
        }
        return;
      }

      const { data: docCounts } = await supabase
        .from('documentos_institucionales')
        .select('carpeta_id, size_bytes');

      const counts = new Map<string, { count: number; size: number }>();
      (docCounts as DocumentoCountRow[] | null ?? []).forEach((d) => {
        const prev = counts.get(d.carpeta_id) ?? { count: 0, size: 0 };
        counts.set(d.carpeta_id, { count: prev.count + 1, size: prev.size + (d.size_bytes ?? 0) });
      });

      const mapped = (data as CarpetaRow[]).map((row) => {
        const info = counts.get(row.id) ?? { count: 0, size: 0 };
        const sizeMb = info.size > 0 ? `${Math.max(1, Math.round(info.size / (1024 * 1024)))} MB` : '0 MB';
        return { id: row.id, name: row.nombre, docs: info.count, size: sizeMb };
      });

      setCarpetas(mapped);
    };

    const loadDocumentos = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('documentos_institucionales')
        .select('id, nombre, created_at, size_bytes')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data || data.length === 0) {
        if (error) {
          console.warn('Supabase: no se pudieron cargar documentos', error);
        }
        return;
      }

      setDocumentos(data as DocumentoRow[]);
    };

    loadCarpetas();
    loadDocumentos();
  }, []);

  const filteredDocumentos = useMemo(() => {
    if (!searchTerm.trim()) return documentos;
    const term = searchTerm.toLowerCase();
    return documentos.filter(d => d.nombre.toLowerCase().includes(term));
  }, [documentos, searchTerm]);

  return (
    <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-700">
      <header className="px-4 md:px-10 py-6 md:py-8 bg-white border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl">
            <Library className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Portal de Documentacion Institucional</h2>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Repositorio central de gestion normativa</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 uppercase tracking-widest">
          <ShieldCheck className="w-4 h-4" />
          <span>Archivo Auditado SIE</span>
        </div>
      </header>

      <div className="p-4 md:p-10 flex-1 overflow-y-auto space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {carpetas.map((folder) => (
            <div key={folder.id} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all group cursor-pointer border-b-4 border-b-blue-600/10">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Folder className="w-7 h-7" />
              </div>
              <h3 className="text-xs font-black text-slate-800 uppercase mb-2 tracking-tight leading-tight">{folder.name}</h3>
              <div className="flex justify-between items-center mt-auto">
                <span className="text-xs font-bold text-slate-400 uppercase">{folder.docs} Documentos</span>
                <span className="text-xs font-mono text-slate-300">{folder.size}</span>
              </div>
            </div>
          ))}
        </div>

        <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 md:p-8 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="font-black text-slate-800 text-sm tracking-tight uppercase">Documentos Recientes</h3>
            <div className="flex items-center space-x-4 w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                <input
                  type="text"
                  placeholder="Filtrar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none w-full md:w-auto"
                />
              </div>
              <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Download className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {filteredDocumentos.map((doc) => (
              <div key={doc.id} className="px-4 md:px-10 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-slate-100 text-slate-400 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-700 uppercase">{doc.nombre}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      {new Date(doc.created_at).toLocaleDateString()} - {doc.size_bytes ? `${Math.max(1, Math.round(doc.size_bytes / (1024 * 1024)))} MB` : '0 MB'}
                    </p>
                  </div>
                </div>
                <button className="p-2 bg-slate-50 text-slate-300 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default ArchivoDocumental;

