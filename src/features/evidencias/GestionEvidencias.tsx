
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Video, 
  Mic, 
  FileText, 
  Upload, 
  Lock, 
  ShieldCheck, 
  Trash2, 
  Download, 
  Search, 
  CheckSquare, 
  X, 
  Clock, 
  User, 
  FileCheck,
  Plus
} from 'lucide-react';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { useTenant } from '@/shared/context/TenantContext';
import { useLocalDraft } from '@/shared/utils/useLocalDraft';
import { supabase } from '@/shared/lib/supabaseClient';
import FormularioNuevaEvidencia, { NuevaEvidenciaPayload } from './FormularioNuevaEvidencia';
import { isUuid } from '@/shared/utils/expedienteRef';

interface Evidencia {
  id: string;
  nombre: string;
  tipo: 'IMG' | 'VIDEO' | 'AUDIO' | 'PDF';
  fecha: string;
  hora: string;
  autor: string;
  descripcion: string;
  fuente: 'ESCUELA' | 'APODERADO' | 'SIE';
  hash: string;
  seleccionada: boolean;
  urlSimulada: string;
}

interface EvidenciaRow {
  id: string;
  nombre: string | null;
  tipo: Evidencia['tipo'] | null;
  fecha: string | null;
  hora: string | null;
  autor: string | null;
  descripcion: string | null;
  fuente: Evidencia['fuente'] | null;
  hash_integridad: string | null;
  url_storage: string | null;
}

const GestionEvidencias: React.FC = () => {
  const { expedientes } = useConvivencia();
  const { tenantId } = useTenant();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedEvidenciaId, setSelectedEvidenciaId] = useLocalDraft<string | null>('evidencias:selected', null);
  const [filterFuente, setFilterFuente] = useLocalDraft<'TODAS' | 'ESCUELA' | 'APODERADO' | 'SIE'>('evidencias:filter', 'TODAS');
  const [searchTerm, setSearchTerm] = useLocalDraft('evidencias:search', '');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [archivoNombre, setArchivoNombre] = useState<string | undefined>(undefined);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);

  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [isLoadingEvidencias, setIsLoadingEvidencias] = useState(true);

  const mapFuente = (origen: NuevaEvidenciaPayload['origen']): Evidencia['fuente'] => {
    switch (origen) {
      case 'APODERADO':
        return 'APODERADO';
      case 'DECLARACION_ESTUDIANTE':
        return 'SIE';
      default:
        return 'ESCUELA';
    }
  };

  const tipoFromFile = (fileName?: string): Evidencia['tipo'] => {
    const name = (fileName ?? '').toLowerCase();
    if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp')) return 'IMG';
    if (name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.avi')) return 'VIDEO';
    if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.m4a')) return 'AUDIO';
    return 'PDF';
  };

  const resolveStorageRef = (rawValue: string): { bucket: string; path: string } | null => {
    const raw = (rawValue || '').trim();
    if (!raw) return null;

    let path = raw;

    // URL completa Supabase (signed/public) -> extraer bucket/path
    if (raw.includes('.supabase.co') && raw.includes('/storage/v1/object/')) {
      const signMatch = raw.match(/\/storage\/v1\/object\/sign\/([^?]+)/i);
      const publicMatch = raw.match(/\/storage\/v1\/object\/public\/([^?]+)/i);
      const extracted = signMatch?.[1] ?? publicMatch?.[1];
      if (!extracted) return null;
      path = extracted;
    }

    if (path.startsWith('evidencias-')) {
      const [bucket, ...rest] = path.split('/');
      const normalizedPath = rest.join('/').trim();
      if (!bucket || !normalizedPath) return null;
      return { bucket, path: normalizedPath };
    }

    // Placeholders legacy (ej: demo.pdf) sin prefijo/carpeta no se firman.
    if (!path.includes('/')) return null;

    return { bucket: 'evidencias-publicas', path };
  };

  useEffect(() => {
    const client = supabase;
    let cancelled = false;
    const shouldIgnore = () => cancelled;
    setEvidencias([]);
    setSelectedEvidenciaId(null);
    setIsLoadingEvidencias(true);

    if (!client) {
      setIsLoadingEvidencias(false);
      return;
    }

    const loadEvidencias = async () => {
      if (!tenantId || !isUuid(tenantId)) {
        setIsLoadingEvidencias(false);
        return;
      }

      const { data, error } = await client
        .from('evidencias')
        .select('id, nombre, tipo, fecha, hora, autor, descripcion, fuente, hash_integridad, url_storage')
        .eq('establecimiento_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (shouldIgnore()) return;

      if (error || !data || data.length === 0) {
        if (error) {
          console.warn('Supabase: no se pudieron cargar evidencias', error);
        }
        setIsLoadingEvidencias(false);
        return;
      }

      const rows = data as EvidenciaRow[];
      const mapped = rows.map((row): Evidencia => ({
        id: row.id,
        nombre: row.nombre ?? 'Sin nombre',
        tipo: row.tipo ?? 'PDF',
        fecha: row.fecha ?? '',
        hora: row.hora ?? '',
        autor: row.autor ?? 'Sistema',
        descripcion: row.descripcion ?? '',
        fuente: row.fuente ?? 'ESCUELA',
        hash: row.hash_integridad ?? '',
        seleccionada: false,
        urlSimulada: row.url_storage ?? ''
      }));

      const signed = await Promise.all(mapped.map(async (ev) => {
        if (!client) return ev;
        const row = rows.find((r) => r.id === ev.id);
        const raw = row?.url_storage || '';
        if (!raw || ev.tipo !== 'IMG') return ev;

        const storageRef = resolveStorageRef(raw);
        if (!storageRef) return ev;

        try {
          const { data: signedData, error: signedError } = await client
            .storage
            .from(storageRef.bucket)
            .createSignedUrl(storageRef.path, 60 * 10);
          if (signedError) {
            // RLS de signing puede bloquear; no rompemos UI si ya existe el archivo.
            return ev;
          }
          return { ...ev, urlSimulada: signedData?.signedUrl ?? '' };
        } catch (error) {
          console.warn('Error creating signed URL:', { raw, error });
          return ev;
        }
      }));
      if (shouldIgnore()) return;
      setEvidencias(signed);
      setIsLoadingEvidencias(false);
    };

    void loadEvidencias();
    return () => {
      cancelled = true;
    };
  }, [tenantId, setSelectedEvidenciaId]);

  const filteredEvidencias = useMemo(() => {
    return evidencias.filter(ev => {
      const matchFuente = filterFuente === 'TODAS' || ev.fuente === filterFuente;
      const matchSearch = ev.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ev.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
      return matchFuente && matchSearch;
    });
  }, [evidencias, filterFuente, searchTerm]);

  const selectedEvidencia = useMemo(() => 
    evidencias.find(e => e.id === selectedEvidenciaId), 
    [evidencias, selectedEvidenciaId]
  );

  const toggleSelect = (id: string) => {
    setEvidencias(prev => prev.map(e => 
      e.id === id ? { ...e, seleccionada: !e.seleccionada } : e
    ));
  };

  const getFileIcon = (tipo: Evidencia['tipo'], size: number = 6) => {
    const className = `w-${size} h-${size}`;
    switch (tipo) {
      case 'IMG': return <ImageIcon className={className} />;
      case 'VIDEO': return <Video className={className} />;
      case 'AUDIO': return <Mic className={className} />;
      case 'PDF': return <FileText className={className} />;
    }
  };

  return (
    <main className="flex-1 flex flex-col lg:flex-row bg-slate-100 overflow-hidden animate-in fade-in duration-700">
      
      {/* Columna Izquierda: Filtros y Carga */}
      <aside className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-4 md:p-8 flex flex-col space-y-8 shrink-0 overflow-y-auto">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center">
            <Lock className="w-5 h-5 mr-3 text-blue-600" />
            Custodia SIE
          </h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Garantía de Integridad</p>
        </div>

        <section className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Acciones Rápidas</label>
          <div className="space-y-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-between p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 group"
            >
              <span className="text-xs font-black uppercase">Nueva Evidencia</span>
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setArchivoNombre(file.name);
                  setArchivoSeleccionado(file);
                  setIsFormOpen(true);
                }
              }}
            />
            <button className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all active:scale-95">
              <span className="text-xs font-black uppercase">Foliar Selección</span>
              <CheckSquare className="w-4 h-4" />
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Filtrar por Fuente</label>
          <div className="flex flex-col space-y-2">
            {(['TODAS', 'ESCUELA', 'APODERADO', 'SIE'] as const).map(f => (
              <button 
                key={f}
                onClick={() => setFilterFuente(f)}
                className={`w-full px-4 py-3 rounded-xl text-left text-[10px] font-black uppercase tracking-widest transition-all ${filterFuente === f ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </section>

        {/* Zona Drag & Drop (Simulada) */}
        <section className="flex-1 flex flex-col pt-8">
          <div className="flex-1 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-50/50 hover:bg-blue-50/30 hover:border-blue-300 transition-all cursor-pointer">
            <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-300">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-tight">Zona de Carga</p>
              <p className="text-[10px] text-slate-400 font-medium leading-tight mt-1">Arrastre archivos multimedia para indexar al expediente.</p>
            </div>
          </div>
        </section>
      </aside>

      {/* Área Central: Galería */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Barra de Búsqueda */}
        <header className="min-h-20 bg-white border-b border-slate-200 px-4 md:px-8 py-4 md:py-0 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o descripción..." 
              className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" />
                <span>Hashing Activo: Certificado</span>
             </div>
          </div>
        </header>

        {/* Grilla de Evidencias */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
          {isLoadingEvidencias ? (
            <div className="py-10 text-center">
              <p className="text-sm font-bold text-slate-500">Cargando evidencias...</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredEvidencias.map((ev) => (
              <div 
                key={ev.id}
                onClick={() => setSelectedEvidenciaId(ev.id)}
                className={`group relative bg-white border-2 rounded-[2.5rem] overflow-hidden transition-all duration-300 cursor-pointer flex flex-col h-[320px] ${
                  selectedEvidenciaId === ev.id 
                  ? 'border-blue-600 shadow-2xl shadow-blue-500/10 scale-[1.02]' 
                  : 'border-white shadow-sm hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/40'
                }`}
              >
                {/* Checkbox de Selección */}
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleSelect(ev.id); }}
                  className={`absolute top-6 left-6 z-10 p-2 rounded-xl border-2 transition-all ${
                    ev.seleccionada ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/80 backdrop-blur-sm border-slate-200 text-transparent group-hover:text-slate-200'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                </button>

                {/* Previsualización */}
                <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {ev.tipo === 'IMG' && ev.urlSimulada ? (
                    <img src={ev.urlSimulada} alt={ev.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${
                      ev.tipo === 'VIDEO' ? 'bg-red-50 text-red-500' :
                      ev.tipo === 'AUDIO' ? 'bg-amber-50 text-amber-500' :
                      'bg-indigo-50 text-indigo-500'
                    }`}>
                      {getFileIcon(ev.tipo, 8)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-all duration-300"></div>
                </div>

                {/* Información Básica */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-tight">{ev.tipo}</span>
                       <span className={`text-[8px] font-black uppercase tracking-widest ${ev.fuente === 'APODERADO' ? 'text-amber-500' : 'text-slate-400'}`}>{ev.fuente}</span>
                    </div>
                    <h4 className="text-[11px] font-black text-slate-800 truncate uppercase tracking-tight">{ev.nombre}</h4>
                    <p className="text-[9px] text-slate-400 font-bold mt-1 line-clamp-2 leading-relaxed">{ev.descripcion}</p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3 text-slate-300" />
                      <span className="text-[9px] font-bold text-slate-400">{ev.fecha}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                       <User className="w-3 h-3 text-slate-300" />
                       <span className="text-[9px] font-bold text-slate-400 truncate max-w-[80px]">{ev.autor}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Panel de Detalles de Evidencia */}
      {selectedEvidenciaId && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSelectedEvidenciaId(null)}
        />
      )}
      <aside className={`fixed lg:static inset-x-0 bottom-0 h-[70vh] lg:h-auto lg:w-[450px] bg-white border-t lg:border-t-0 lg:border-l border-slate-200 transition-all duration-500 overflow-y-auto z-50 lg:z-auto ${selectedEvidenciaId ? 'translate-y-0 lg:translate-y-0' : 'translate-y-full lg:translate-y-0 lg:-mr-[450px]'}`}>
        {selectedEvidencia ? (
          <div className="p-4 md:p-10 space-y-10 animate-in slide-in-from-right-8 duration-500">
            <header className="flex justify-between items-start">
              <div className="space-y-2">
                 <div className="flex items-center space-x-3">
                    <div className="p-3 bg-slate-900 text-white rounded-2xl">
                       {getFileIcon(selectedEvidencia.tipo, 5)}
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Ficha Técnica</h3>
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{selectedEvidencia.id}</p>
              </div>
              <button onClick={() => setSelectedEvidenciaId(null)} className="p-2 text-slate-300 hover:bg-slate-100 rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Visualización Expandida */}
            <div className="rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner bg-slate-50 aspect-video flex items-center justify-center">
               {selectedEvidencia.tipo === 'IMG' && selectedEvidencia.urlSimulada ? (
                 <img src={selectedEvidencia.urlSimulada} alt={selectedEvidencia.nombre} className="w-full h-full object-cover" />
               ) : (
                 <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-slate-300">
                       {getFileIcon(selectedEvidencia.tipo, 10)}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin vista previa disponible</p>
                 </div>
               )}
            </div>

            {/* Metadatos y Hash */}
            <section className="space-y-6">
              <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all"></div>
                <div className="flex items-center justify-between mb-4">
                   <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center">
                     <FileCheck className="w-4 h-4 mr-2" />
                     Hash de Integridad
                   </h5>
                   <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="font-mono text-[10px] break-all bg-white/5 p-4 rounded-xl border border-white/10 text-slate-300 group-hover:border-blue-500/50 transition-all">
                  {selectedEvidencia.hash}
                </p>
                <p className="text-[9px] text-slate-500 mt-4 italic">
                  * Este sello digital garantiza que el archivo original no ha sido alterado desde su carga.
                </p>
              </div>

              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nombre del Registro</label>
                    <input type="text" value={selectedEvidencia.nombre} readOnly className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 focus:outline-none" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Descripción del Contenido</label>
                    <textarea 
                      value={selectedEvidencia.descripcion} 
                      className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-600 focus:outline-none resize-none"
                    />
                 </div>
              </div>
            </section>

            {/* Acciones de Ficha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
               <button className="flex items-center justify-center space-x-2 py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:border-blue-600 hover:text-blue-600 transition-all active:scale-95">
                  <Download className="w-4 h-4" />
                  <span>Descargar</span>
               </button>
               <button className="flex items-center justify-center space-x-2 py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:border-red-600 hover:text-red-600 transition-all active:scale-95">
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
               </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-6 opacity-30">
             <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center">
                <FileSearch className="w-12 h-12 text-slate-300" />
             </div>
             <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">Seleccione una evidencia para ver su trazabilidad técnica y metadatos.</p>
          </div>
        )}
      </aside>

      {/* Floating Action Bar (Visible cuando hay selección) */}
      {evidencias.some(e => e.seleccionada) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 md:px-10 py-4 md:py-5 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center gap-4 md:gap-10 animate-in slide-in-from-bottom-10 duration-500 z-40 border border-white/10 max-w-[92vw]">
           <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center">
                 <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Elementos Seleccionados</p>
                 <p className="text-sm font-black tracking-tight">{evidencias.filter(e => e.seleccionada).length} Archivos</p>
              </div>
           </div>
           <div className="hidden md:block h-10 w-[1px] bg-white/10"></div>
           <div className="flex items-center space-x-4">
              <button className="px-6 py-2.5 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all active:scale-95">
                 Incluir en Informe Final
              </button>
              <button onClick={() => setEvidencias(prev => prev.map(e => ({...e, seleccionada: false})))} className="p-2.5 text-slate-400 hover:text-white transition-all">
                 <X className="w-5 h-5" />
              </button>
           </div>
        </div>
      )}

      <FormularioNuevaEvidencia
        isOpen={isFormOpen}
        archivoNombre={archivoNombre}
        onClose={() => setIsFormOpen(false)}
        onSubmit={async (payload: NuevaEvidenciaPayload) => {
          const fechaCarga = new Date(payload.fechaCarga);
          const fecha = fechaCarga.toISOString().split('T')[0];
          const hora = fechaCarga.toTimeString().slice(0, 5);
          const tipo = tipoFromFile(archivoNombre);
          const fuente = mapFuente(payload.origen);
          const expedienteTarget = expedientes[0];

          const localEv: Evidencia = {
            id: `EV-${Math.floor(Math.random() * 9000) + 1000}`,
            nombre: archivoNombre ?? 'Sin archivo',
            tipo,
            fecha,
            hora,
            autor: 'Sistema',
            descripcion: payload.descripcion,
            fuente,
            hash: payload.hashIntegridad,
            seleccionada: false,
            urlSimulada: ''
          };

          if (supabase && expedienteTarget?.dbId) {
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData.session?.user;
            const userId = user?.id;

            if (userId) {
              let urlStorage = '';
              if (archivoSeleccionado) {
                const bucket = payload.esSensible ? 'evidencias-sensibles' : 'evidencias-publicas';
                const safeName = archivoSeleccionado.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                const tenantPrefix = tenantId ?? expedienteTarget.dbId;
                const path = `${tenantPrefix}/${expedienteTarget.dbId}/${Date.now()}-${safeName}`;
                const { error: uploadError } = await supabase
                  .storage
                  .from(bucket)
                  .upload(path, archivoSeleccionado, { upsert: true });

                if (!uploadError) {
                  urlStorage = `${bucket}/${path}`;
                } else {
                  console.warn('Supabase: no se pudo subir archivo', uploadError);
                }
              }

              const { data: inserted, error } = await supabase
                .from('evidencias')
                .insert({
                  expediente_id: expedienteTarget.dbId,
                  url_storage: urlStorage,
                  tipo_archivo: archivoSeleccionado?.type ?? 'application/octet-stream',
                  hash_integridad: payload.hashIntegridad,
                  subido_por: userId,
                  nombre: archivoNombre ?? null,
                  tipo,
                  fecha,
                  hora,
                  autor: user?.email ?? 'Sistema',
                  descripcion: payload.descripcion,
                  fuente,
                  seleccionado: false
                })
                .select('id, url_storage')
                .single();

              if (!error && inserted?.id) {
                localEv.id = inserted.id;
                if (inserted.url_storage && tipo === 'IMG') {
                  const storageRef = resolveStorageRef(inserted.url_storage);
                  if (storageRef) {
                    const { data: signedData } = await supabase.storage
                      .from(storageRef.bucket)
                      .createSignedUrl(storageRef.path, 60 * 10);
                    localEv.urlSimulada = signedData?.signedUrl ?? '';
                  }
                }
              } else if (error) {
                console.warn('Supabase: no se pudo registrar evidencia', error);
              }
            } else {
              console.warn('Supabase: no hay sesion activa, se usara fallback local');
            }
          }

          setEvidencias(prev => [localEv, ...prev]);
          setArchivoSeleccionado(null);
          setIsFormOpen(false);
        }}
      />
    </main>
  );
};

// Componente helper para iconos de búsqueda no definidos en el set anterior
const FileSearch: React.FC<{className?: string}> = ({className}) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M7 11h8"/><path d="M11 7v8"/></svg>
);

export default GestionEvidencias;
