
import React, { useEffect, useMemo, useReducer } from 'react';
import { Library, Folder, FileText, Download, ShieldCheck, Search, Upload, Loader2, X } from 'lucide-react';
import { supabase } from '@/shared/lib/supabaseClient';
import useAuth from '@/shared/hooks/useAuth';
import { useTenant } from '@/shared/context/TenantContext';
import PageTitleHeader from '@/shared/components/PageTitleHeader';

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
  tipo: string | null;
  size_bytes: number | null;
  url_storage: string | null;
}

interface ArchivoState {
  carpetas: Array<{ id: string; name: string; docs: number; size: string }>;
  documentos: DocumentoRow[];
  searchTerm: string;
  reloadKey: number;
  isUploadOpen: boolean;
  uploadFile: File | null;
  uploadName: string;
  uploadFolderId: string;
  isUploading: boolean;
  isLoadingCarpetas: boolean;
  isLoadingDocumentos: boolean;
}

type ArchivoAction =
  | { type: 'PATCH'; payload: Partial<ArchivoState> }
  | { type: 'INCREMENT_RELOAD' }
  | { type: 'RESET_UPLOAD_FORM' };

const DOCUMENTOS_BUCKET = 'documentos-institucionales';
const CARPETA_SKELETON_KEYS = ['folder-a', 'folder-b', 'folder-c', 'folder-d'] as const;
const DOCUMENTO_SKELETON_KEYS = ['doc-a', 'doc-b', 'doc-c', 'doc-d', 'doc-e'] as const;

const initialArchivoState: ArchivoState = {
  carpetas: [],
  documentos: [],
  searchTerm: '',
  reloadKey: 0,
  isUploadOpen: false,
  uploadFile: null,
  uploadName: '',
  uploadFolderId: '',
  isUploading: false,
  isLoadingCarpetas: true,
  isLoadingDocumentos: true,
};

function archivoReducer(state: ArchivoState, action: ArchivoAction): ArchivoState {
  switch (action.type) {
    case 'PATCH':
      return { ...state, ...action.payload };
    case 'INCREMENT_RELOAD':
      return { ...state, reloadKey: state.reloadKey + 1 };
    case 'RESET_UPLOAD_FORM':
      return { ...state, isUploadOpen: false, uploadFile: null, uploadName: '', uploadFolderId: '' };
    default:
      return state;
  }
}

function slugifyFileName(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120);
}

function resolveStorageRef(rawValue: string): { bucket: string; path: string } | null {
  const raw = rawValue.trim();
  if (!raw) return null;
  if (raw.includes('://')) return null;

  const canonicalMatch = raw.match(/^([^/]+)\/(.+)$/);
  if (canonicalMatch) {
    const bucket = canonicalMatch[1];
    const path = canonicalMatch[2];
    if (bucket && path) return { bucket, path };
  }

  return null;
}

const UploadDocumentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  establecimientoNombre: string;
  uploadName: string;
  uploadFolderId: string;
  uploadFile: File | null;
  isUploading: boolean;
  carpetas: Array<{ id: string; name: string }>;
  onFileChange: (file: File | null) => void;
  onUploadNameChange: (value: string) => void;
  onUploadFolderChange: (value: string) => void;
  onSubmit: () => void;
}> = ({
  isOpen,
  onClose,
  establecimientoNombre,
  uploadName,
  uploadFolderId,
  uploadFile,
  isUploading,
  carpetas,
  onFileChange,
  onUploadNameChange,
  onUploadFolderChange,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        <header className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Subir documento institucional</h3>
            <p className="text-xs text-slate-500">Se guardara en: {establecimientoNombre}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="px-6 py-5 space-y-4">
          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Archivo</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Nombre visible</span>
            <input
              value={uploadName}
              onChange={(e) => onUploadNameChange(e.target.value)}
              placeholder="Ej: Protocolo de convivencia 2026"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Carpeta (opcional)</span>
            <select
              value={uploadFolderId}
              onChange={(e) => onUploadFolderChange(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Sin carpeta</option>
              {carpetas.map((folder) => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
          </label>
        </div>

        <footer className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase bg-slate-100 text-slate-600 rounded-lg">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isUploading || !uploadFile}
            className="px-4 py-2 text-xs font-bold uppercase bg-blue-600 text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {isUploading ? 'Subiendo...' : 'Subir documento'}
          </button>
        </footer>
      </div>
    </div>
  );
};

const FolderGridSection: React.FC<{
  isLoading: boolean;
  carpetas: Array<{ id: string; name: string; docs: number; size: string }>;
}> = ({ isLoading, carpetas }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
    {isLoading ? (
      CARPETA_SKELETON_KEYS.map((key) => (
        <div key={key} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm animate-pulse">
          <div className="w-14 h-14 bg-slate-200 rounded-2xl mb-6"></div>
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-slate-100 rounded w-1/2"></div>
        </div>
      ))
    ) : (
      carpetas.map((folder) => (
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
      ))
    )}
  </div>
);

const RecentDocumentsSection: React.FC<{
  isLoading: boolean;
  searchTerm: string;
  documentos: DocumentoRow[];
  onSearchChange: (value: string) => void;
  onDownload: (doc: DocumentoRow) => void;
}> = ({ isLoading, searchTerm, documentos, onSearchChange, onDownload }) => (
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
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none w-full md:w-auto"
          />
        </div>
        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Download className="w-4 h-4" /></button>
      </div>
    </div>

    <div className="divide-y divide-slate-50">
      {isLoading ? (
        DOCUMENTO_SKELETON_KEYS.map((key) => (
          <div key={key} className="px-4 md:px-10 py-5 flex items-center justify-between animate-pulse">
            <div className="flex items-center space-x-4 flex-1">
              <div className="p-2 bg-slate-200 rounded-lg w-8 h-8"></div>
              <div className="flex-1">
                <div className="h-3 bg-slate-200 rounded w-1/3 mb-2"></div>
                <div className="h-2 bg-slate-100 rounded w-1/4"></div>
              </div>
            </div>
            <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
          </div>
        ))
      ) : (
        documentos.map((doc) => (
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
            <button
              type="button"
              onClick={() => onDownload(doc)}
              className="p-2 bg-slate-50 text-slate-300 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        ))
      )}
    </div>
  </section>
);

const ArchivoDocumental: React.FC = () => {
  const { tienePermiso, usuario } = useAuth();
  const { tenantId, establecimiento } = useTenant();
  const canUpload = tienePermiso('documentos:subir');

  const [state, dispatch] = useReducer(archivoReducer, initialArchivoState);
  const {
    carpetas,
    documentos,
    searchTerm,
    reloadKey,
    isUploadOpen,
    uploadFile,
    uploadName,
    uploadFolderId,
    isUploading,
    isLoadingCarpetas,
    isLoadingDocumentos,
  } = state;

  useEffect(() => {
    dispatch({ type: 'PATCH', payload: { isLoadingCarpetas: true, isLoadingDocumentos: true } });
    const loadCarpetas = async () => {
      try {
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

        dispatch({ type: 'PATCH', payload: { carpetas: mapped } });
      } finally {
        dispatch({ type: 'PATCH', payload: { isLoadingCarpetas: false } });
      }
    };

    const loadDocumentos = async () => {
      try {
        if (!supabase) return;
        const { data, error } = await supabase
          .from('documentos_institucionales')
          .select('id, nombre, created_at, tipo, size_bytes, url_storage')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error || !data || data.length === 0) {
          if (error) {
            console.warn('Supabase: no se pudieron cargar documentos', error);
          }
          return;
        }

        dispatch({ type: 'PATCH', payload: { documentos: data as DocumentoRow[] } });
      } finally {
        dispatch({ type: 'PATCH', payload: { isLoadingDocumentos: false } });
      }
    };

    loadCarpetas();
    loadDocumentos();
  }, [reloadKey]);

  const filteredDocumentos = useMemo(() => {
    if (!searchTerm.trim()) return documentos;
    const term = searchTerm.toLowerCase();
    return documentos.filter(d => d.nombre.toLowerCase().includes(term));
  }, [documentos, searchTerm]);

  const handleUploadDocument = async () => {
    if (!supabase) {
      alert('No hay conexion activa con backend.');
      return;
    }
    if (!canUpload) {
      alert('No tienes permiso para subir documentos.');
      return;
    }
    if (!tenantId) {
      alert('No se pudo resolver el establecimiento actual.');
      return;
    }
    if (!uploadFile) {
      alert('Debes seleccionar un archivo.');
      return;
    }

    const finalName = (uploadName.trim() || uploadFile.name).trim();
    const safeFileName = slugifyFileName(uploadFile.name);
    const objectPath = `${tenantId}/institucional/${Date.now()}_${safeFileName}`;
    const canonicalUrl = `${DOCUMENTOS_BUCKET}/${objectPath}`;

    dispatch({ type: 'PATCH', payload: { isUploading: true } });
    try {
      const { error: uploadError } = await supabase.storage
        .from(DOCUMENTOS_BUCKET)
        .upload(objectPath, uploadFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: uploadFile.type || 'application/octet-stream',
        });

      if (uploadError) {
        throw uploadError;
      }

      const payload = {
        establecimiento_id: tenantId,
        carpeta_id: uploadFolderId || null,
        nombre: finalName,
        tipo: uploadFile.type || null,
        size_bytes: uploadFile.size,
        url_storage: canonicalUrl,
        creado_por: usuario?.id ?? null,
      };

      const { error: insertError } = await supabase
        .from('documentos_institucionales')
        .insert(payload);

      if (insertError) {
        await supabase.storage.from(DOCUMENTOS_BUCKET).remove([objectPath]);
        throw insertError;
      }

      dispatch({ type: 'RESET_UPLOAD_FORM' });
      dispatch({ type: 'INCREMENT_RELOAD' });
    } catch (error) {
      console.error('Error al subir documento institucional', error);
      alert('No se pudo subir el documento. Revisa permisos y vuelve a intentar.');
    } finally {
      dispatch({ type: 'PATCH', payload: { isUploading: false } });
    }
  };

  const handleDownloadDocument = async (doc: DocumentoRow) => {
    if (!doc.url_storage) {
      alert('El documento no tiene ruta de almacenamiento registrada.');
      return;
    }

    const storageRef = resolveStorageRef(doc.url_storage);
    if (!storageRef) {
      window.open(doc.url_storage, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!supabase) {
      alert('No hay conexion activa con backend.');
      return;
    }

    const { data, error } = await supabase.storage
      .from(storageRef.bucket)
      .createSignedUrl(storageRef.path, 120);

    if (error || !data?.signedUrl) {
      console.error('No se pudo generar URL firmada', error);
      alert('No se pudo descargar el archivo.');
      return;
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-700">
      <UploadDocumentModal
        isOpen={isUploadOpen}
        onClose={() => dispatch({ type: 'PATCH', payload: { isUploadOpen: false } })}
        establecimientoNombre={establecimiento?.nombre ?? tenantId ?? 'tenant actual'}
        uploadName={uploadName}
        uploadFolderId={uploadFolderId}
        uploadFile={uploadFile}
        isUploading={isUploading}
        carpetas={carpetas}
        onFileChange={(file) => {
          dispatch({ type: 'PATCH', payload: { uploadFile: file } });
          if (file && !uploadName.trim()) dispatch({ type: 'PATCH', payload: { uploadName: file.name } });
        }}
        onUploadNameChange={(value) => dispatch({ type: 'PATCH', payload: { uploadName: value } })}
        onUploadFolderChange={(value) => dispatch({ type: 'PATCH', payload: { uploadFolderId: value } })}
        onSubmit={() => { void handleUploadDocument(); }}
      />

      <header className="px-4 md:px-10 py-6 md:py-8 bg-white border-b border-slate-200">
        <PageTitleHeader
          title="Portal de Documentación Institucional"
          subtitle="Repositorio del reglamento interno y evidencias de cumplimiento · Circular 781"
          icon={Library}
          actions={
            <>
              {canUpload && (
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'PATCH', payload: { isUploadOpen: true } })}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-700"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir documento</span>
                </button>
              )}
              <div className="flex items-center space-x-2 text-xs font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" />
                <span>Archivo Auditado SIE</span>
              </div>
            </>
          }
        />
      </header>

      <div className="p-4 md:p-10 flex-1 overflow-y-auto space-y-10">
        <FolderGridSection isLoading={isLoadingCarpetas} carpetas={carpetas} />
        <RecentDocumentsSection
          isLoading={isLoadingDocumentos}
          searchTerm={searchTerm}
          documentos={filteredDocumentos}
          onSearchChange={(value) => dispatch({ type: 'PATCH', payload: { searchTerm: value } })}
          onDownload={(doc) => { void handleDownloadDocument(doc); }}
        />
      </div>
    </main>
  );
};

export default ArchivoDocumental;

