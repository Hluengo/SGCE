/**
 * DocumentosViewer - Componente de Visualización de Documentos del Expediente
 * Cumple con Circular 781 - Gestión Documental
 *
 * Funcionalidades:
 * - Previsualización de PDFs
 * - Sistema de carga de documentos
 * - Asociación de tipos de documentos (constancias, denuncias, resoluciones)
 */

import React, { useState, useRef } from 'react';
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

/**
 * Componente principal de visualización de documentos
 */
const DocumentosViewer: React.FC<DocumentosViewerProps> = ({
  expedienteId,
  documentosIniciales = [],
  onDocumentosChange
}) => {
  const { expedientes } = useConvivencia();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const expedienteDbId = expedientes.find((exp) => exp.id === expedienteId)?.dbId ?? expedienteId;

  const [documentos, setDocumentos] = useState<Documento[]>(documentosIniciales);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState<Documento | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('otro');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Manejar selección de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];

      // Validaciones
      if (file.size > 10 * 1024 * 1024) { // 10MB
        setError('El archivo no puede superar los 10MB');
        return;
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setError('Solo se permiten archivos PDF, JPG o PNG');
        return;
      }

      setArchivoSeleccionado(file);
      setError(null);
    }
  };

  // Subir documento
  const handleUpload = async () => {
    if (!archivoSeleccionado || !supabase) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

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
      setDocumentos(nuevosDocumentos);

      if (onDocumentosChange) {
        onDocumentosChange(nuevosDocumentos);
      }

      // Limpiar formulario
      setShowUploadModal(false);
      setArchivoSeleccionado(null);
      setTipoDocumento('otro');

    } catch (err) {
      console.error('Error al subir documento:', err);
      setError(err instanceof Error ? err.message : 'Error al subir documento');
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
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
      setDocumentos(nuevosDocumentos);

      if (onDocumentosChange) {
        onDocumentosChange(nuevosDocumentos);
      }

      if (documentoSeleccionado?.id === docId) {
        setDocumentoSeleccionado(null);
      }

    } catch (err) {
      console.error('Error al eliminar documento:', err);
      setError('No se pudo eliminar el documento');
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

  // Renderizar previsualización
  const renderPreview = () => {
    if (!documentoSeleccionado) return null;

    const isPDF = documentoSeleccionado.nombre.toLowerCase().endsWith('.pdf');
    const isImage = /\.(jpg|jpeg|png)$/i.test(documentoSeleccionado.nombre);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-4xl h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
          {/* Header del preview */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {React.createElement(getTipoIcon(documentoSeleccionado.tipo), {
                className: `w-6 h-6 ${getTipoColor(documentoSeleccionado.tipo).split(' ')[1]}`
              })}
              <div>
                <p className="font-bold text-slate-800">{documentoSeleccionado.nombre}</p>
                <p className="text-xs text-slate-500">
                  {formatSize(documentoSeleccionado.tamaño)} • {documentoSeleccionado.tipo}
                </p>
              </div>
            </div>
            <button
              onClick={() => setDocumentoSeleccionado(null)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido del preview */}
          <div className="flex-1 overflow-hidden bg-slate-100">
            {isPDF ? (
              <iframe
                src={documentoSeleccionado.url}
                className="w-full h-full"
                title={documentoSeleccionado.nombre}
              />
            ) : isImage ? (
              <img
                src={documentoSeleccionado.url}
                alt={documentoSeleccionado.nombre}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <File className="w-16 h-16 mb-4" />
                <p className="font-medium">Vista previa no disponible</p>
                <button
                  onClick={() => handleDownload(documentoSeleccionado)}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
                >
                  Descargar archivo
                </button>
              </div>
            )}
          </div>

          {/* Footer del preview */}
          <div className="p-4 border-t border-slate-200 flex justify-end space-x-3">
            <button
              onClick={() => handleDownload(documentoSeleccionado)}
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center">
          <FileText className="w-5 h-5 mr-3 text-indigo-600" />
          Documentos del Expediente
        </h3>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>Subir Documento</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2">
          <XCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      {/* Lista de documentos */}
      <div className="space-y-2">
        {documentos.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No hay documentos asociados</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-3 text-indigo-600 font-bold text-sm hover:text-indigo-700"
            >
              Subir el primer documento
            </button>
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
                    <div className="flex items-center space-x-3 text-xs text-slate-500">
                      <span>{formatSize(doc.tamaño)}</span>
                      <span>•</span>
                      <span>{new Date(doc.fechaSubida).toLocaleDateString()}</span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded-full uppercase text-[10px] font-black">
                        {doc.tipo}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setDocumentoSeleccionado(doc)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    title="Ver documento"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    title="Descargar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
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

      {/* Modal de carga */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase">Subir Documento</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setArchivoSeleccionado(null);
                  setError(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tipo de documento */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Tipo de Documento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIPOS_DOCUMENTO.map(tipo => {
                    const Icon = tipo.icon;
                    return (
                      <button
                        key={tipo.value}
                        type="button"
                        onClick={() => setTipoDocumento(tipo.value)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
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

              {/* Área de carga */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 cursor-pointer transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {archivoSeleccionado ? (
                  <div className="flex items-center justify-center space-x-3">
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
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <p className="text-sm font-bold text-red-700">{error}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setArchivoSeleccionado(null);
                  setError(null);
                }}
                className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
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
      )}

      {/* Previsualización */}
      {renderPreview()}
    </div>
  );
};

export default DocumentosViewer;
