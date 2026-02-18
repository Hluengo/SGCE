/**
 * DocumentManager.tsx - Gestión de Documentos
 */
import React, { useState, useCallback } from 'react';
import { Upload, FileText, Image, File, X, Download, Trash2, Eye, Search, Grid, List } from 'lucide-react';
import type { Documento, TipoDocumento } from '@/types';
import { useAuth } from '@/shared/hooks';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const FILE_ICONS: Record<string, { icon: React.FC<{ className?: string }>; color: string }> = {
  'application/pdf': { icon: FileText, color: 'text-red-600' },
  'image/jpeg': { icon: Image, color: 'text-yellow-600' },
  'image/png': { icon: Image, color: 'text-yellow-600' },
  'application/msword': { icon: File, color: 'text-blue-600' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: File, color: 'text-blue-600' }
};

const TIPO_LABELS: Record<TipoDocumento, string> = {
  acta: 'Acta', resolucion: 'Resolución', carta: 'Carta', constancia: 'Constancia',
  derivacion: 'Derivación', compromiso: 'Compromiso', otro: 'Otro'
};

interface Props {
  documentos: Documento[];
  onUpload?: (doc: Documento) => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

export const DocumentManager: React.FC<Props> = ({ documentos: initialDocs, onUpload, onDelete, readOnly }) => {
  const { tienePermiso } = useAuth();
  const [documentos, setDocumentos] = useState<Documento[]>(initialDocs);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<TipoDocumento | 'todos'>('todos');
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
  const [uploading, setUploading] = useState(false);

  const puedeSubir = tienePermiso('documentos:subir') && !readOnly;
  const puedeEliminar = tienePermiso('documentos:eliminar') && !readOnly;

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const nuevoDoc: Documento = {
        id: crypto.randomUUID(),
        tipo: 'otro',
        titulo: file.name,
        fecha: new Date().toISOString().split('T')[0],
        urlArchivo: URL.createObjectURL(file),
        nombreArchivo: file.name,
        tamanho: file.size,
        subidoPor: 'user',
        fechaSubida: new Date().toISOString(),
        esPublico: false,
        nivelConfidencialidad: 'media'
      };
      setDocumentos(prev => [...prev, nuevoDoc]);
      onUpload?.(nuevoDoc);
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const handleDelete = useCallback((id: string) => {
    if (!confirm('¿Eliminar?')) return;
    setDocumentos(prev => prev.filter(d => d.id !== id));
    onDelete?.(id);
  }, [onDelete]);

  const handleDownload = useCallback((doc: Documento) => {
    const link = document.createElement('a');
    link.href = doc.urlArchivo;
    link.download = doc.nombreArchivo;
    link.click();
  }, []);

  const filteredDocs = React.useMemo(() => {
    return documentos.filter(doc => {
      const matchesSearch = searchTerm === '' || doc.titulo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTipo = filterTipo === 'todos' || doc.tipo === filterTipo;
      return matchesSearch && matchesTipo;
    });
  }, [documentos, searchTerm, filterTipo]);

  const formatSize = (b: number) => b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return FILE_ICONS['application/pdf'];
    if (['jpg', 'jpeg', 'png'].includes(ext || '')) return FILE_ICONS['image/jpeg'];
    return FILE_ICONS['application/pdf'];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64" />
          </div>
          <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value as TipoDocumento | 'todos')}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="todos">Todos</option>
            {Object.entries(TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          {puedeSubir && (
            <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700">
              <Upload className="w-4 h-4" />
              <span className="text-sm">Subir</span>
              <input type="file" accept={ALLOWED_TYPES.join(',')} className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
            </label>
          )}
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">No hay documentos</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map(doc => {
            const info = getFileIcon(doc.urlArchivo);
            const Icon = info.icon;
            return (
              <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${info.color.replace('text-', 'bg-').replace('600', '100')}`}>
                    <Icon className={`w-5 h-5 ${info.color}`} />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setSelectedDoc(doc)} className="p-1 hover:bg-slate-100 rounded"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => handleDownload(doc)} className="p-1 hover:bg-slate-100 rounded"><Download className="w-4 h-4" /></button>
                    {puedeEliminar && <button onClick={() => handleDelete(doc.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-500" /></button>}
                  </div>
                </div>
                <h4 className="font-medium text-slate-800 truncate mb-1">{doc.titulo}</h4>
                <p className="text-xs text-slate-500">{formatSize(doc.tamanho || 0)} • {TIPO_LABELS[doc.tipo]}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Tamaño</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map(doc => {
                const info = getFileIcon(doc.urlArchivo);
                const Icon = info.icon;
                return (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${info.color}`} />
                        <span className="font-medium">{doc.titulo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-slate-100 rounded-full text-xs">{TIPO_LABELS[doc.tipo]}</span></td>
                    <td className="px-4 py-3 text-sm">{formatSize(doc.tamanho || 0)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setSelectedDoc(doc)} className="p-1.5 hover:bg-slate-100 rounded"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleDownload(doc)} className="p-1.5 hover:bg-slate-100 rounded"><Download className="w-4 h-4" /></button>
                        {puedeEliminar && <button onClick={() => handleDelete(doc.id)} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-500" /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div><h3 className="font-bold">{selectedDoc.titulo}</h3></div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownload(selectedDoc)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg"><Download className="w-4 h-4" />Descargar</button>
                <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              {selectedDoc.urlArchivo.endsWith('.pdf') ? (
                <iframe src={selectedDoc.urlArchivo} className="w-full h-full rounded-lg" />
              ) : selectedDoc.urlArchivo.match(/\.(jpg|jpeg|png)$/i) ? (
                <img src={selectedDoc.urlArchivo} alt={selectedDoc.titulo} className="max-w-full mx-auto" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full"><FileText className="w-16 h-16 text-slate-300 mb-4" /><p className="text-slate-500">Vista previa no disponible</p></div>
              )}
            </div>
          </div>
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Subiendo...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;
