/**
 * ExpedienteForm - Formulario de Creación de Nuevos Expedientes Disciplinarios
 * Cumple con Circular 781 y 782 de la Superintendencia de Educación
 *
 * Funcionalidades:
 * - Validación de campos obligatorios
 * - Integración con tipos Medida, Participante, Documento
 * - Asignación automática de número de expediente secuencial
 * - Flujo de creación paso a paso
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { supabase } from '@/shared/lib/supabaseClient';
import { useAuth } from '@/shared/hooks/useAuth';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  FileText,
  Users,
  AlertTriangle,
  FilePlus,
  CheckCircle,
  X,
  Upload,
  Trash2,
  ShieldAlert
} from 'lucide-react';
import { EtapaProceso, GravedadFalta, Expediente } from '@/types';
import { calcularPlazoLegal } from '@/shared/utils/plazos';

/**
 * Tipos de falta según normativa
 */
const TIPOS_FALTA = [
  { value: 'conducta_contraria', label: 'Conducta Contraria a la Convivencia', description: 'Faltas leves que afectan la convivencia escolar' },
  { value: 'falta_grave', label: 'Falta Grave', description: 'Conductas que afectan la integridad de miembros de la comunidad' },
  { value: 'falta_gravisima', label: 'Falta Gravísima', description: 'Conductas que pueden ameritar cancelación de matrícula o expulsión' }
];

/**
 * Opciones de gravedad por tipo de falta
 */
const getGravedadOptions = (tipoFalta: string): { value: GravedadFalta; label: string }[] => {
  switch (tipoFalta) {
    case 'conducta_contraria':
      return [
        { value: 'LEVE', label: 'Leve' },
        { value: 'RELEVANTE', label: 'Relevante' }
      ];
    case 'falta_grave':
      return [
        { value: 'RELEVANTE', label: 'Relevante' },
        { value: 'GRAVISIMA_EXPULSION', label: 'Gravísima (Expulsión)' }
      ];
    case 'falta_gravisima':
      return [
        { value: 'GRAVISIMA_EXPULSION', label: 'Gravísima (Expulsión)' }
      ];
    default:
      return [
        { value: 'LEVE', label: 'Leve' },
        { value: 'RELEVANTE', label: 'Relevante' },
        { value: 'GRAVISIMA_EXPULSION', label: 'Gravísima (Expulsión)' }
      ];
  }
};

/**
 * Datos del formulario
 */
interface ExpedienteFormData {
  // Datos del estudiante
  estudianteNombre: string;
  estudianteRun: string;
  estudianteCurso: string;
  estudianteNivel: 'basica' | 'media';
  
  // Datos del apoderado
  apoderadoNombre: string;
  apoderadoRun: string;
  apoderadoTelefono: string;
  apoderadoEmail: string;
  
  // Datos del hecho
  tipoFalta: string;
  gravedad: GravedadFalta;
  fechaHecho: string;
  lugarHecho: string;
  descripcionHecho: string;
  victimas: string[];
  testigos: string[];
  normasInfringidas: string[];
  
  // Documentos adjuntos
  documentos: File[];
  
  // Acciones previas
  accionesPrevias: boolean;
  descripcionAccionesPrevias: string;
}

/**
 * Estado inicial del formulario
 */
const initialFormData: ExpedienteFormData = {
  estudianteNombre: '',
  estudianteRun: '',
  estudianteCurso: '',
  estudianteNivel: 'basica',
  apoderadoNombre: '',
  apoderadoRun: '',
  apoderadoTelefono: '',
  apoderadoEmail: '',
  tipoFalta: '',
  gravedad: 'LEVE',
  fechaHecho: new Date().toISOString().split('T')[0],
  lugarHecho: '',
  descripcionHecho: '',
  victimas: [],
  testigos: [],
  normasInfringidas: [],
  documentos: [],
  accionesPrevias: false,
  descripcionAccionesPrevias: ''
};

/**
 * Pasos del formulario
 */
const STEPS = [
  { key: 'estudiante', label: 'Estudiante', icon: Users },
  { key: 'apoderado', label: 'Apoderado', icon: ShieldAlert },
  { key: 'hecho', label: 'Hecho', icon: AlertTriangle },
  { key: 'documentos', label: 'Documentos', icon: FilePlus },
  { key: 'revision', label: 'Revisión', icon: CheckCircle }
];

/**
 * Componente principal del formulario
 */
const ExpedienteForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setExpedientes } = useConvivencia();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ExpedienteFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [nuevoExpedienteId, setNuevoExpedienteId] = useState<string | null>(null);

  // Validar paso actual
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Estudiante
        if (!formData.estudianteNombre.trim()) {
          newErrors.estudianteNombre = 'El nombre del estudiante es obligatorio';
        }
        if (!formData.estudianteRun.trim()) {
          newErrors.estudianteRun = 'El RUN es obligatorio';
        }
        if (!formData.estudianteCurso.trim()) {
          newErrors.estudianteCurso = 'El curso es obligatorio';
        }
        break;

      case 1: // Apoderado
        if (!formData.apoderadoNombre.trim()) {
          newErrors.apoderadoNombre = 'El nombre del apoderado es obligatorio';
        }
        if (!formData.apoderadoTelefono.trim()) {
          newErrors.apoderadoTelefono = 'El teléfono es obligatorio';
        }
        break;

      case 2: // Hecho
        if (!formData.tipoFalta) {
          newErrors.tipoFalta = 'El tipo de falta es obligatorio';
        }
        if (!formData.gravedad) {
          newErrors.gravedad = 'La gravedad es obligatoria';
        }
        if (!formData.fechaHecho) {
          newErrors.fechaHecho = 'La fecha del hecho es obligatoria';
        }
        if (!formData.descripcionHecho.trim()) {
          newErrors.descripcionHecho = 'La descripción del hecho es obligatoria';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navegación entre pasos
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Manejo de cambios en el formulario
  const handleChange = (field: keyof ExpedienteFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error al modificar
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Manejo de archivos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setFormData(prev => ({
        ...prev,
        documentos: [...prev.documentos, ...Array.from(files)]
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documentos: prev.documentos.filter((_, i) => i !== index)
    }));
  };

  // Generar número de expediente secuencial
  const generarNumeroExpediente = async (): Promise<string> => {
    const año = new Date().getFullYear();
    
    if (!supabase) {
      return `EXP-${año}-001`;
    }
    
    // Obtener el último número del año
    const { data: lastExp } = await supabase
      .from('expedientes')
      .select('id')
      .like(`id`, `EXP-${año}-%`)
      .order('id', { ascending: false })
      .limit(1);

    let secuencia = 1;
    if (lastExp && lastExp.length > 0) {
      const lastId = lastExp[0].id;
      const match = lastId.match(/EXP-\d{4}-(\d+)/);
      if (match) {
        secuencia = parseInt(match[1], 10) + 1;
      }
    }

    return `EXP-${año}-${String(secuencia).padStart(3, '0')}`;
  };

  // Submit del formulario
  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Generar número de expediente
      const expedienteId = await generarNumeroExpediente();

      // Calcular plazo fatal según gravedad
      const fechaInicio = new Date();
      const plazoFatal = calcularPlazoLegal(fechaInicio, formData.gravedad);

      // Crear objeto expediente
      const nuevoExpediente = {
        id: expedienteId,
        nnaNombre: formData.estudianteNombre,
        etapa: 'INICIO' as EtapaProceso,
        gravedad: formData.gravedad,
        fechaInicio: fechaInicio.toISOString(),
        plazoFatal: plazoFatal.toISOString(),
        encargadoId: user?.id || 'unknown',
        esProcesoExpulsion: formData.gravedad === 'GRAVISIMA_EXPULSION',
        accionesPrevias: formData.accionesPrevias,
        additionalData: {
          estudianteCurso: formData.estudianteCurso,
          descripcionHecho: formData.descripcionHecho,
          tipoFalta: formData.tipoFalta,
        },
        interactionType: 'creacion',
        hitos: [
          {
            id: 'h1',
            titulo: 'Inicio de Proceso',
            descripcion: 'Registro de la denuncia y apertura de folio.',
            completado: true,
            fechaCumplimiento: fechaInicio.toISOString().split('T')[0],
            requiereEvidencia: true
          },
          {
            id: 'h2',
            titulo: 'Notificación a Apoderados',
            descripcion: 'Comunicación oficial del inicio del proceso (Plazo 24h).',
            completado: false,
            requiereEvidencia: true
          },
          {
            id: 'h3',
            titulo: 'Periodo de Descargos',
            descripcion: 'Recepción de la versión del estudiante y su familia.',
            completado: false,
            requiereEvidencia: true
          },
          {
            id: 'h4',
            titulo: 'Resolución del Director',
            descripcion: 'Determinación de la medida formativa o disciplinaria.',
            completado: false,
            requiereEvidencia: true
          }
        ]
      };

      // Guardar en Supabase
      if (!supabase) {
        throw new Error('Conexión a base de datos no disponible');
      }
      
      const { error: insertError } = await supabase
        .from('expedientes')
        .insert({
          id: nuevoExpediente.id,
          nna_nombre: nuevoExpediente.nnaNombre,
          etapa: nuevoExpediente.etapa,
          gravedad: nuevoExpediente.gravedad,
          fecha_inicio: nuevoExpediente.fechaInicio,
          plazo_fatal: nuevoExpediente.plazoFatal,
          encargado_id: nuevoExpediente.encargadoId,
          es_proceso_expulsion: nuevoExpediente.esProcesoExpulsion,
          acciones_previas: nuevoExpediente.accionesPrevias,
          hitos: nuevoExpediente.hitos,
          interaction_type: 'creacion'
          additional_data: nuevoExpediente.additionalData ?? {
            estudianteCurso: formData.estudianteCurso,
            descripcionHecho: formData.descripcionHecho,
            tipoFalta: formData.tipoFalta,
          }
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Guardar en contexto local
      setExpedientes(prev => [...prev, nuevoExpediente as Expediente]);

      setNuevoExpedienteId(expedienteId);

    } catch (error) {
      console.error('Error al crear expediente:', error);
      setSubmitError(error instanceof Error ? error.message : 'Error al crear el expediente');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderizar paso actual
  const renderStep = () => {
    switch (currentStep) {
      case 0: // Estudiante
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase">Datos del Estudiante</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Información del involucrado</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.estudianteNombre}
                  onChange={(e) => handleChange('estudianteNombre', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium focus:outline-none transition-all ${
                    errors.estudianteNombre
                      ? 'border-red-300 focus:border-red-500 bg-red-50'
                      : 'border-slate-200 focus:border-indigo-300 bg-slate-50'
                  }`}
                  placeholder="Nombres y apellidos"
                />
                {errors.estudianteNombre && (
                  <p className="text-xs text-red-500 font-medium">{errors.estudianteNombre}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  RUN (sin puntos ni guión) *
                </label>
                <input
                  type="text"
                  value={formData.estudianteRun}
                  onChange={(e) => handleChange('estudianteRun', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium focus:outline-none transition-all ${
                    errors.estudianteRun
                      ? 'border-red-300 focus:border-red-500 bg-red-50'
                      : 'border-slate-200 focus:border-indigo-300 bg-slate-50'
                  }`}
                  placeholder="12345678-9"
                />
                {errors.estudianteRun && (
                  <p className="text-xs text-red-500 font-medium">{errors.estudianteRun}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Curso *
                </label>
                <input
                  type="text"
                  value={formData.estudianteCurso}
                  onChange={(e) => handleChange('estudianteCurso', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium focus:outline-none transition-all ${
                    errors.estudianteCurso
                      ? 'border-red-300 focus:border-red-500 bg-red-50'
                      : 'border-slate-200 focus:border-indigo-300 bg-slate-50'
                  }`}
                  placeholder="8° Básico A"
                />
                {errors.estudianteCurso && (
                  <p className="text-xs text-red-500 font-medium">{errors.estudianteCurso}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Nivel Educativo
                </label>
                <select
                  value={formData.estudianteNivel}
                  onChange={(e) => handleChange('estudianteNivel', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-300 bg-slate-50 transition-all"
                >
                  <option value="basica">Educación Básica</option>
                  <option value="media">Educación Media</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 1: // Apoderado
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase">Datos del Apoderado</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Responsable legal</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.apoderadoNombre}
                  onChange={(e) => handleChange('apoderadoNombre', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium focus:outline-none transition-all ${
                    errors.apoderadoNombre
                      ? 'border-red-300 focus:border-red-500 bg-red-50'
                      : 'border-slate-200 focus:border-indigo-300 bg-slate-50'
                  }`}
                  placeholder="Nombres y apellidos"
                />
                {errors.apoderadoNombre && (
                  <p className="text-xs text-red-500 font-medium">{errors.apoderadoNombre}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  RUN
                </label>
                <input
                  type="text"
                  value={formData.apoderadoRun}
                  onChange={(e) => handleChange('apoderadoRun', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-300 bg-slate-50 transition-all"
                  placeholder="12345678-9"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.apoderadoTelefono}
                  onChange={(e) => handleChange('apoderadoTelefono', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium focus:outline-none transition-all ${
                    errors.apoderadoTelefono
                      ? 'border-red-300 focus:border-red-500 bg-red-50'
                      : 'border-slate-200 focus:border-indigo-300 bg-slate-50'
                  }`}
                  placeholder="+56 9 XXXX XXXX"
                />
                {errors.apoderadoTelefono && (
                  <p className="text-xs text-red-500 font-medium">{errors.apoderadoTelefono}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.apoderadoEmail}
                  onChange={(e) => handleChange('apoderadoEmail', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-300 bg-slate-50 transition-all"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>
          </div>
        );

      case 2: // Hecho
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase">Características del Hecho</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Clasificación de la falta</p>
              </div>
            </div>

            {/* Tipo de falta */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Tipo de Falta *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TIPOS_FALTA.map((tipo) => (
                  <button
                    key={tipo.value}
                    type="button"
                    onClick={() => handleChange('tipoFalta', tipo.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.tipoFalta === tipo.value
                        ? 'bg-indigo-50 border-indigo-500'
                        : 'bg-white border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <p className="font-black text-sm text-slate-800 uppercase">{tipo.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{tipo.description}</p>
                  </button>
                ))}
              </div>
              {errors.tipoFalta && (
                <p className="text-xs text-red-500 font-medium">{errors.tipoFalta}</p>
              )}
            </div>

            {/* Gravedad */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Gravedad de la Falta *
              </label>
              <select
                value={formData.gravedad}
                onChange={(e) => handleChange('gravedad', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium focus:outline-none transition-all ${
                  errors.gravedad
                    ? 'border-red-300 focus:border-red-500 bg-red-50'
                    : 'border-slate-200 focus:border-indigo-300 bg-slate-50'
                }`}
              >
                {getGravedadOptions(formData.tipoFalta).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.gravedad && (
                <p className="text-xs text-red-500 font-medium">{errors.gravedad}</p>
              )}
            </div>

            {/* Fecha y lugar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Fecha del Hecho *
                </label>
                <input
                  type="date"
                  value={formData.fechaHecho}
                  onChange={(e) => handleChange('fechaHecho', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium focus:outline-none transition-all ${
                    errors.fechaHecho
                      ? 'border-red-300 focus:border-red-500 bg-red-50'
                      : 'border-slate-200 focus:border-indigo-300 bg-slate-50'
                  }`}
                />
                {errors.fechaHecho && (
                  <p className="text-xs text-red-500 font-medium">{errors.fechaHecho}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Lugar del Hecho
                </label>
                <input
                  type="text"
                  value={formData.lugarHecho}
                  onChange={(e) => handleChange('lugarHecho', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-300 bg-slate-50 transition-all"
                  placeholder="Sala de clases, patio, etc."
                />
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Descripción Detallada del Hecho *
              </label>
              <textarea
                value={formData.descripcionHecho}
                onChange={(e) => handleChange('descripcionHecho', e.target.value)}
                rows={5}
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium focus:outline-none transition-all resize-none ${
                  errors.descripcionHecho
                    ? 'border-red-300 focus:border-red-500 bg-red-50'
                    : 'border-slate-200 focus:border-indigo-300 bg-slate-50'
                }`}
                placeholder="Describa los hechos de manera objetiva, incluyendo qué ocurrió, cuándo, dónde y cómo..."
              />
              {errors.descripcionHecho && (
                <p className="text-xs text-red-500 font-medium">{errors.descripcionHecho}</p>
              )}
            </div>

            {/* Acciones previas */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.accionesPrevias}
                  onChange={(e) => handleChange('accionesPrevias', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-bold text-slate-700">
                  El estudiante registra acciones previas relacionadas con esta falta
                </span>
              </label>
              {formData.accionesPrevias && (
                <textarea
                  value={formData.descripcionAccionesPrevias}
                  onChange={(e) => handleChange('descripcionAccionesPrevias', e.target.value)}
                  rows={3}
                  className="w-full mt-4 px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-300 bg-white transition-all resize-none"
                  placeholder="Describa las acciones previas..."
                />
              )}
            </div>
          </div>
        );

      case 3: // Documentos
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                <FilePlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase">Documentos de Respaldo</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Evidencias y constancias</p>
              </div>
            </div>

            {/* Área de carga */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
              <Upload className="w-10 h-10 mx-auto text-slate-400 mb-4" />
              <p className="text-sm font-bold text-slate-600 mb-2">
                Arrastra archivos aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-slate-400">
                Formatos permitidos: PDF, JPG, PNG (máx. 10MB)
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Lista de archivos */}
            {formData.documentos.length > 0 && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Archivos Cargados
                </label>
                {formData.documentos.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      <span className="text-sm font-medium text-slate-700">{file.name}</span>
                      <span className="text-xs text-slate-400">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 4: // Revisión
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase">Revisión Final</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Confirme los datos antes de crear</p>
              </div>
            </div>

            {/* Resumen del expediente */}
            <div className="bg-slate-50 rounded-xl p-6 space-y-4">
              <h4 className="font-black text-slate-900 uppercase">Datos del Estudiante</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Nombre:</span>
                  <p className="font-bold text-slate-800">{formData.estudianteNombre}</p>
                </div>
                <div>
                  <span className="text-slate-500">RUN:</span>
                  <p className="font-bold text-slate-800">{formData.estudianteRun}</p>
                </div>
                <div>
                  <span className="text-slate-500">Curso:</span>
                  <p className="font-bold text-slate-800">{formData.estudianteCurso}</p>
                </div>
              </div>

              <h4 className="font-black text-slate-900 uppercase pt-4">Clasificación del Hecho</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Tipo de Falta:</span>
                  <p className="font-bold text-slate-800">
                    {TIPOS_FALTA.find(t => t.value === formData.tipoFalta)?.label}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Gravedad:</span>
                  <p className={`font-bold ${
                    formData.gravedad === 'GRAVISIMA_EXPULSION' ? 'text-red-600' :
                    formData.gravedad === 'RELEVANTE' ? 'text-yellow-600' : 'text-blue-600'
                  }`}>
                    {formData.gravedad}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Fecha:</span>
                  <p className="font-bold text-slate-800">{formData.fechaHecho}</p>
                </div>
              </div>

              {formData.documentos.length > 0 && (
                <>
                  <h4 className="font-black text-slate-900 uppercase pt-4">Documentos Adjuntos</h4>
                  <p className="text-sm font-medium text-slate-700">{formData.documentos.length} archivo(s)</p>
                </>
              )}
            </div>

            {submitError && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center space-x-3">
                <X className="w-5 h-5 text-red-500" />
                <p className="text-sm font-bold text-red-700">{submitError}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Si se creó exitosamente, mostrar confirmación
  if (nuevoExpedienteId) {
    return (
      <main className="flex-1 p-4 md:p-8 flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-white rounded-[2.5rem] border border-emerald-200 shadow-2xl shadow-emerald-200/20 p-8 md:p-12 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase mb-2">
            Expediente Creado
          </h2>
          <p className="text-slate-500 font-bold mb-6">
            El expediente ha sido registrado exitosamente
          </p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Número de Folio</p>
            <p className="text-xl font-black text-indigo-600">{nuevoExpedienteId}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate(`/expedientes/${nuevoExpedienteId}`)}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all"
            >
              Ver Expediente
            </button>
            <button
              onClick={() => {
                setNuevoExpedienteId(null);
                setFormData(initialFormData);
                setCurrentStep(0);
              }}
              className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              Crear Otro
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50/30 overflow-y-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center flex-wrap gap-4">
          <div className="p-4 bg-indigo-600 text-white rounded-[1.5rem] shadow-xl shadow-indigo-200">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Nuevo Expediente
            </h2>
            <p className="text-indigo-700 font-bold text-xs md:text-sm">
              Creación de Folio Disciplinario - Circular 781/782
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/expedientes')}
          className="px-4 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>
      </header>

      {/* Indicador de progreso */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-lg shadow-slate-200/20 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest mt-2 ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    isCompleted ? 'bg-emerald-500' : 'bg-slate-100'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-lg shadow-slate-200/20 p-4 md:p-8">
        {renderStep()}

        {/* Botones de navegación */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`flex items-center space-x-2 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
              currentStep === 0
                ? 'opacity-0 cursor-not-allowed'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center space-x-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all"
            >
              <span>Siguiente</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Crear Expediente</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </main>
  );
};

export default ExpedienteForm;
