/**
 * DocumentosViewer - Componente de Visualización de Documentos del Expediente
 * Cumple con Circular 781 - Gestión Documental
 *
 * Funcionalidades:
 * - Previsualización de PDFs
 * - Sistema de carga de documentos
 * - Asociación de tipos de documentos (constancias, denuncias, resoluciones)
 */

import React, { useMemo, useRef, useState } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useAuth } from '@/shared/hooks/useAuth';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import {
  FileText,
  Upload,
  X,
  Eye,
  Download,
  Trash2,
  File,
  FileCheck,
  FileClock,
  AlertTriangle,
  XCircle,
  CheckCircle
} from 'lucide-react';
import { AsyncState } from '@/shared/components/ui';

/**
 * Tipo de documento
 */
type TipoDocumento = 'acta' | 'resolucion' | 'carta' | 'constancia' | 'denuncia' | 'compromiso' | 'otro';

/**
 * Información del documento
 */
interface Documento {
  id: string;
  nombre: string;
  tipo: TipoDocumento;
  url: string;
  fechaSubida: string;
  subidoPor: string;
  tamaño: number;
  hashIntegridad?: string;
}

/**
 * Configuración de tipos de documentos
 */
const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'acta', label: 'Acta', icon: FileCheck, color: 'bg-blue-100 text-blue-600' },
  { value: 'resolucion', label: 'Resolución', icon: FileText, color: 'bg-emerald-100 text-emerald-600' },
  { value: 'carta', label: 'Carta', icon: FileClock, color: 'bg-purple-100 text-purple-600' },
  { value: 'constancia', label: 'Constancia', icon: File, color: 'bg-indigo-100 text-indigo-600' },
  { value: 'denuncia', label: 'Denuncia', icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
  { value: 'compromiso', label: 'Compromiso', icon: FileCheck, color: 'bg-teal-100 text-teal-600' },
  { value: 'otro', label: 'Otro', icon: File, color: 'bg-slate-100 text-slate-600' }
];

interface DocumentosViewerProps {
  expedienteId: string;
  documentosIniciales?: Documento[];
  onDocumentosChange?: (documentos: Documento[]) => void;
}

const EMPTY_DOCUMENTOS: Documento[] = [];

interface DocumentosUiState {
  documentoSeleccionado: Documento | null;
  showUploadModal: boolean;
  tipoDocumento: TipoDocumento;
  archivoSeleccionado: File | null;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
}

interface DocumentPreviewModalProps {
  documento: Documento | null;
  onClose: () => void;
  onDownload: (doc: Documento) => void;
  getTipoIcon: (tipo: TipoDocumento) => React.ElementType;
  getTipoColor: (tipo: TipoDocumento) => string;
  formatSize: (bytes: number) => string;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  documento,
  onClose,
  onDownload,
  getTipoIcon,
  getTipoColor,
  formatSize,
}) => {
  if (!documento) return null;

  const isPDF = documento.nombre.toLowerCase().endsWith('.pdf');
  const isImage = /\.(jpg|jpeg|png)$/i.test(documento.nombre);
  const Icon = getTipoIcon(documento.tipo);
  const tipoColor = getTipoColor(documento.tipo).split(' ')[1];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl h-5\/6 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Icon className={`w-6 h-6 ${tipoColor}`} />
            <div>
              <p className="font-bold text-slate-800">{documento.nombre}</p>
              <p className="text-xs text-slate-500">
                {formatSize(documento.tamaño)} • {documento.tipo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-slate-100">
          {isPDF ? (
            <iframe src={documento.url} className="w-full h-full" title={documento.nombre} />
          ) : isImage ? (
            <img src={documento.url} alt={documento.nombre} className="w-full h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <File className="w-16 h-16 mb-4" />
              <p className="font-medium">Vista previa no disponible</p>
              <button
                onClick={() => onDownload(documento)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
              >
                Descargar archivo
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 flex justify-end space-x-4">
          <button
            onClick={() => onDownload(documento)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Descargar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface UploadDocumentoModalProps {
  show: boolean;
  tipoDocumento: TipoDocumento;
  archivoSeleccionado: File | null;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setTipoDocumento: (tipo: TipoDocumento) => void;
  setArchivoSeleccionado: (file: File | null) => void;
  onSelectFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onUpload: () => void;
  formatSize: (bytes: number) => string;
}

const UploadDocumentoModal: React.FC<UploadDocumentoModalProps> = ({
  show,
  tipoDocumento,
  archivoSeleccionado,
  isUploading,
  uploadProgress,
  error,
  fileInputRef,
  setTipoDocumento,
  setArchivoSeleccionado,
  onSelectFile,
  onCancel,
  onUpload,
  formatSize,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-black text-slate-900 uppercase">Subir Documento</h3>
          <button
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Tipo de Documento
            </p>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS_DOCUMENTO.map(tipo => {
                const Icon = tipo.icon;
                return (
                  <button
                    key={tipo.value}
                    type="button"
                    onClick={() => setTipoDocumento(tipo.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      tipoDocumento === tipo.value
                        ? `${tipo.color} border-transparent`
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="text-xs font-bold uppercase">{tipo.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Seleccionar archivo para subir"
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 cursor-pointer transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={onSelectFile}
              className="hidden"
            />
            {archivoSeleccionado ? (
              <div className="flex items-center justify-center space-x-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
                <div className="text-left">
                  <p className="font-bold text-slate-800">{archivoSeleccionado.name}</p>
                  <p className="text-xs text-slate-500">{formatSize(archivoSeleccionado.size)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setArchivoSeleccionado(null);
                  }}
                  className="p-1 text-slate-400 hover:text-red-500"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                <p className="text-sm font-bold text-slate-600">
                  Haz clic o arrastra un archivo
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  PDF, JPG o PNG (máx. 10MB)
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <AsyncState
                state="error"
                title="No se pudo subir el documento"
                message={error}
                compact
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onUpload}
            disabled={!archivoSeleccionado || isUploading}
            className={`px-6 py-3 rounded-xl font-bold text-xs uppercase transition-all flex items-center space-x-2 ${
              !archivoSeleccionado || isUploading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Subiendo... {uploadProgress}%</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Subir Documento</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const DocumentosList: React.FC<{
  documentos: Documento[];
  filtrosError: string | null;
  onOpenUpload: () => void;
  onPreview: (doc: Documento) => void;
  onDownload: (doc: Documento) => void;
  onDelete: (id: string) => void;
  getTipoIcon: (tipo: TipoDocumento) => React.ElementType;
  getTipoColor: (tipo: TipoDocumento) => string;
  formatSize: (bytes: number) => string;
}> = ({
  documentos,
  filtrosError,
  onOpenUpload,
  onPreview,
  onDownload,
  onDelete,
  getTipoIcon,
  getTipoColor,
  formatSize,
}) => (
  <>
    {filtrosError && (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <AsyncState
          state="error"
          title="Error de documentos"
          message={filtrosError}
          compact
        />
      </div>
    )}

    <div className="space-y-2">
      {documentos.length === 0 ? (
        <div className="p-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <AsyncState
            state="empty"
            title="No hay documentos asociados"
            message="Sube el primer documento para iniciar el repositorio del expediente."
            compact
          />
          <div className="mt-3 text-center">
            <button
              onClick={onOpenUpload}
              className="text-indigo-600 font-bold text-sm hover:text-indigo-700"
            >
              Subir el primer documento
            </button>
          </div>
        </div>
      ) : (
        documentos.map(doc => {
          const Icon = getTipoIcon(doc.tipo);
          return (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-xl ${getTipoColor(doc.tipo)}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{doc.nombre}</p>
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <span>{formatSize(doc.tamaño)}</span>
                    <span>•</span>
                    <span>{new Date(doc.fechaSubida).toLocaleDateString()}</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded-full uppercase text-xs font-black">
                      {doc.tipo}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onPreview(doc)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  title="Ver documento"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDownload(doc)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  title="Descargar"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(doc.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  </>
);

/**
 * Componente principal de visualización de documentos
 */
const DocumentosViewer: React.FC<DocumentosViewerProps> = ({
  expedienteId,
  documentosIniciales = EMPTY_DOCUMENTOS,
  onDocumentosChange
}) => {
  const { expedientes } = useConvivencia();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const expedienteDbId = expedientes.find((exp) => exp.id === expedienteId)?.dbId ?? expedienteId;

  const [documentosLocales, setDocumentosLocales] = useState<Documento[]>(EMPTY_DOCUMENTOS);
  const [documentosEliminados, setDocumentosEliminados] = useState<string[]>([]);
  const [uiState, setUiState] = useState<DocumentosUiState>({
    documentoSeleccionado: null,
    showUploadModal: false,
    tipoDocumento: 'otro',
    archivoSeleccionado: null,
    isUploading: false,
    uploadProgress: 0,
    error: null
  });
  const {
    documentoSeleccionado,
    showUploadModal,
    tipoDocumento,
    archivoSeleccionado,
    isUploading,
    uploadProgress,
    error
  } = uiState;
  const documentos = useMemo(() => {
    const merged = [...documentosIniciales, ...documentosLocales];
    const byId = new Map<string, Documento>();
    merged.forEach((doc) => byId.set(doc.id, doc));
    return Array.from(byId.values()).filter((doc) => !documentosEliminados.includes(doc.id));
  }, [documentosIniciales, documentosLocales, documentosEliminados]);

  // Manejar selección de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];

      // Validaciones
      if (file.size > 10 * 1024 * 1024) { // 10MB
        setUiState((prev) => ({ ...prev, error: 'El archivo no puede superar los 10MB' }));
        return;
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setUiState((prev) => ({ ...prev, error: 'Solo se permiten archivos PDF, JPG o PNG' }));
        return;
      }

      setUiState((prev) => ({ ...prev, archivoSeleccionado: file, error: null }));
    }
  };

  // Subir documento
  const handleUpload = async () => {
    if (!archivoSeleccionado || !supabase) return;

    setUiState((prev) => ({ ...prev, isUploading: true, uploadProgress: 0, error: null }));

    try {
      // Generar nombre único
      const timestamp = Date.now();
      const nombreArchivo = `${expedienteDbId}/${timestamp}_${archivoSeleccionado.name}`;

      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documentos-expedientes')
        .upload(nombreArchivo, archivoSeleccionado);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('documentos-expedientes')
        .getPublicUrl(nombreArchivo);

      // Generar hash de integridad (simplificado)
      const buffer = await archivoSeleccionado.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Crear registro en base de datos
      const nuevoDocumento: Documento = {
        id: `doc_${timestamp}`,
        nombre: archivoSeleccionado.name,
        tipo: tipoDocumento,
        url: urlData.publicUrl,
        fechaSubida: new Date().toISOString(),
        subidoPor: user?.email || 'Sistema',
        tamaño: archivoSeleccionado.size,
        hashIntegridad: hashHex
      };

      // Guardar en Supabase
      const { error: insertError } = await supabase
        .from('documentos_expediente')
          .insert({
            id: nuevoDocumento.id,
            expediente_id: expedienteDbId,
            nombre: nuevoDocumento.nombre,
            tipo: nuevoDocumento.tipo,
            url: nuevoDocumento.url,
          fecha_subida: nuevoDocumento.fechaSubida,
          subido_por: nuevoDocumento.subidoPor,
          tamaño: nuevoDocumento.tamaño,
          hash_integridad: nuevoDocumento.hashIntegridad
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Actualizar estado local
      const nuevosDocumentos = [...documentos, nuevoDocumento];
      setDocumentosLocales((prev) => [...prev, nuevoDocumento]);

      if (onDocumentosChange) {
        onDocumentosChange(nuevosDocumentos);
      }

      // Limpiar formulario
      setUiState((prev) => ({
        ...prev,
        showUploadModal: false,
        archivoSeleccionado: null,
        tipoDocumento: 'otro'
      }));

    } catch (err) {
      console.error('Error al subir documento:', err);
      setUiState((prev) => ({ ...prev, error: err instanceof Error ? err.message : 'Error al subir documento' }));
    } finally {
      setUiState((prev) => ({ ...prev, isUploading: false, uploadProgress: 100 }));
    }
  };

  // Eliminar documento
  const handleDelete = async (docId: string) => {
    if (!confirm('¿Está seguro de eliminar este documento?')) return;

    const doc = documentos.find(d => d.id === docId);
    if (!doc) return;

    try {
      // Eliminar de Supabase
      if (supabase) {
        await supabase
          .from('documentos_expediente')
          .delete()
          .eq('id', docId);

        // Eliminar del storage (extraer nombre del archivo de la URL)
        const urlParts = doc.url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        await supabase.storage
          .from('documentos-expedientes')
          .remove([`${expedienteDbId}/${fileName}`]);
      }

      // Actualizar estado
      const nuevosDocumentos = documentos.filter(d => d.id !== docId);
      setDocumentosLocales((prev) => prev.filter((doc) => doc.id !== docId));
      setDocumentosEliminados((prev) => (prev.includes(docId) ? prev : [...prev, docId]));

      if (onDocumentosChange) {
        onDocumentosChange(nuevosDocumentos);
      }

      if (documentoSeleccionado?.id === docId) {
        setUiState((prev) => ({ ...prev, documentoSeleccionado: null }));
      }

    } catch (err) {
      console.error('Error al eliminar documento:', err);
      setUiState((prev) => ({ ...prev, error: 'No se pudo eliminar el documento' }));
    }
  };

  // Descargar documento
  const handleDownload = (doc: Documento) => {
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.nombre;
    link.target = '_blank';
    link.click();
  };

  // Obtener icono por tipo
  const getTipoIcon = (tipo: TipoDocumento) => {
    const config = TIPOS_DOCUMENTO.find(t => t.value === tipo);
    return config?.icon || File;
  };

  // Obtener color por tipo
  const getTipoColor = (tipo: TipoDocumento) => {
    const config = TIPOS_DOCUMENTO.find(t => t.value === tipo);
    return config?.color || 'bg-slate-100 text-slate-600';
  };

  // Formatear tamaño
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const closeUploadModal = () => {
    setUiState((prev) => ({
      ...prev,
      showUploadModal: false,
      archivoSeleccionado: null,
      error: null
    }));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center">
          <FileText className="w-5 h-5 mr-3 text-indigo-600" />
          Documentos del Expediente
        </h3>
        <button
          onClick={() => setUiState((prev) => ({ ...prev, showUploadModal: true }))}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>Subir Documento</span>
        </button>
      </div>

      <DocumentosList
        documentos={documentos}
        filtrosError={error}
        onOpenUpload={() => setUiState((prev) => ({ ...prev, showUploadModal: true }))}
        onPreview={(doc) => setUiState((prev) => ({ ...prev, documentoSeleccionado: doc }))}
        onDownload={handleDownload}
        onDelete={handleDelete}
        getTipoIcon={getTipoIcon}
        getTipoColor={getTipoColor}
        formatSize={formatSize}
      />

      <UploadDocumentoModal
        show={showUploadModal}
        tipoDocumento={tipoDocumento}
        archivoSeleccionado={archivoSeleccionado}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        error={error}
        fileInputRef={fileInputRef}
        setTipoDocumento={(tipo) => setUiState((prev) => ({ ...prev, tipoDocumento: tipo }))}
        setArchivoSeleccionado={(file) => setUiState((prev) => ({ ...prev, archivoSeleccionado: file }))}
        onSelectFile={handleFileSelect}
        onCancel={closeUploadModal}
        onUpload={handleUpload}
        formatSize={formatSize}
      />

      {/* Previsualización */}
      <DocumentPreviewModal
        documento={documentoSeleccionado}
        onClose={() => setUiState((prev) => ({ ...prev, documentoSeleccionado: null }))}
        onDownload={handleDownload}
        getTipoIcon={getTipoIcon}
        getTipoColor={getTipoColor}
        formatSize={formatSize}
      />
    </div>
  );
};

export default DocumentosViewer;


