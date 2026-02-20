
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { useTenant } from '@/shared/context/TenantContext';
import { supabase } from '@/shared/lib/supabaseClient';
import { isUuid } from '@/shared/utils/expedienteRef';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Users2,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  FileSearch,
  MessageSquare,
  ImageIcon,
  History,
  Scale,
  Gavel,
  Check,
  ShieldAlert,
  Clock
} from 'lucide-react';
import NormativeBadge from '@/shared/components/NormativeBadge';
import PlazoCounter from '@/shared/components/PlazoCounter';
import GeneradorResolucion from '@/features/legal/GeneradorResolucion';
import CaseTimeline from '@/features/expedientes/CaseTimeline';
import { useExpedienteHistorial } from '@/shared/hooks/useExpedienteHistorial';
import { EtapaProceso } from '@/types';
import { useLocalDraft } from '@/shared/utils/useLocalDraft';
import { AsyncState } from '@/shared/components/ui';
import { useExpedienteLoader } from './hooks/useExpedienteLoader';
import { useExpedienteHitos } from './hooks/useExpedienteHitos';
import { useExpedienteEvidencias } from './hooks/useExpedienteEvidencias';

const STEP_CONFIG: Record<string, { title: string; dateLabel: string; placeholder: string; hitoTitle: string }> = {
  INICIO: {
    title: 'Registro de Inicio',
    dateLabel: 'Fecha de Inicio',
    placeholder: 'Resumen inicial del caso...',
    hitoTitle: 'INICIO'
  },
  NOTIFICADO: {
    title: 'Registro de Notificacion',
    dateLabel: 'Fecha de Notificacion',
    placeholder: 'Detalle de la notificacion a apoderados...',
    hitoTitle: 'NOTIFICADO'
  },
  DESCARGOS: {
    title: 'Registro de Descargos (Acta de Escucha)',
    dateLabel: 'Fecha de Descargos',
    placeholder: 'Escriba aqui el resumen de la version del estudiante...',
    hitoTitle: 'DESCARGOS'
  },
  INVESTIGACION: {
    title: 'Registro de Investigacion',
    dateLabel: 'Fecha de Investigacion',
    placeholder: 'Resumen de entrevistas, recopilacion y analisis...',
    hitoTitle: 'INVESTIGACION'
  },
  RESOLUCION_PENDIENTE: {
    title: 'Registro de Resolucion',
    dateLabel: 'Fecha de Resolucion',
    placeholder: 'Resumen de la resolucion emitida...',
    hitoTitle: 'RESOLUCION'
  },
  RECONSIDERACION: {
    title: 'Registro de Reconsideracion',
    dateLabel: 'Fecha de Reconsideracion',
    placeholder: 'Resumen del proceso de reconsideracion...',
    hitoTitle: 'RECONSIDERACION'
  }
};

const STEPS = [
  { key: 'INICIO', label: 'Inicio', icon: FileSearch },
  { key: 'NOTIFICADO', label: 'Notificacion', icon: Calendar },
  { key: 'DESCARGOS', label: 'Descargos', icon: MessageSquare },
  { key: 'INVESTIGACION', label: 'Investigacion', icon: ShieldAlert },
  { key: 'RESOLUCION_PENDIENTE', label: 'Resolucion', icon: Gavel },
  { key: 'RECONSIDERACION', label: 'Apelacion', icon: Scale },
];

const mapEtapaToEstadoLegal = (etapa: EtapaProceso): string => {
  switch (etapa) {
    case 'INICIO':
    case 'NOTIFICADO':
      return 'apertura';
    case 'DESCARGOS':
    case 'INVESTIGACION':
      return 'investigacion';
    case 'RESOLUCION_PENDIENTE':
    case 'RECONSIDERACION':
      return 'resolucion';
    case 'CERRADO_SANCION':
    case 'CERRADO_GCC':
      return 'cerrado';
    default:
      return 'investigacion';
  }
};

const useExpedienteDetalleView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const modoFromUrl = searchParams.get('modo');
  const isEditMode = location.pathname.endsWith('/editar') || modoFromUrl === 'apertura';
  const { expedientes, setExpedientes, actualizarEtapa, setExpedienteSeleccionado } = useConvivencia();
  const { tenantId } = useTenant();

  const expedienteSeleccionado = useMemo(() =>
    expedientes.find(e => e.id === id) ?? null,
    [expedientes, id]);
  const { isResolvingExpediente, resolveAttempted, loadHechosFromResumen } = useExpedienteLoader({
    id,
    tenantId,
    expedienteSeleccionado,
    setExpedientes,
  });

  const currentEtapa = expedienteSeleccionado?.etapa || 'INICIO';
  const hitoConfig = STEP_CONFIG[currentEtapa] || STEP_CONFIG.INICIO;
  const draftKey = `expediente:${tenantId ?? 'no-tenant'}:${id ?? 'none'}:${hitoConfig.hitoTitle}:resumen`;
  const fechaKey = `expediente:${tenantId ?? 'no-tenant'}:${id ?? 'none'}:${hitoConfig.hitoTitle}:fecha`;
  const [hitoResumen, setHitoResumen, clearHitoResumen] = useLocalDraft(draftKey, '');
  const [hitoFecha, setHitoFecha, clearFecha] = useLocalDraft(fechaKey, '');
  const [uiState, setUiState] = useState({
    isGeneradorOpen: false,
    saveStatus: '' as string,
    isSaving: false,
    saveFeedback: null as { type: 'success' | 'error' | 'info'; message: string } | null,
    uploadFile: null as File | null,
    uploadNombre: '',
    uploadTipo: 'PDF',
    uploadFuente: 'ESCUELA',
    uploadFeedback: null as {
      type: 'success' | 'error' | 'info';
      title: string;
      message?: string;
    } | null,
    isUploading: false,
    isLoadingHechos: false,
    activeTab: (isEditMode ? 'workflow' : tabFromUrl === 'timeline' ? 'timeline' : 'workflow') as 'workflow' | 'timeline'
  });
  const {
    isGeneradorOpen,
    saveStatus,
    isSaving,
    saveFeedback,
    uploadFile,
    uploadNombre,
    uploadTipo,
    uploadFuente,
    uploadFeedback,
    isUploading,
    isLoadingHechos,
    activeTab
  } = uiState;
  const setIsGeneradorOpen = (value: boolean) => setUiState((prev) => ({ ...prev, isGeneradorOpen: value }));
  const setSaveStatus = (value: string) => setUiState((prev) => ({ ...prev, saveStatus: value }));
  const setIsSaving = (value: boolean) => setUiState((prev) => ({ ...prev, isSaving: value }));
  const setSaveFeedback = (
    value: { type: 'success' | 'error' | 'info'; message: string } | null
  ) => setUiState((prev) => ({ ...prev, saveFeedback: value }));
  const setUploadFile = (value: File | null) => setUiState((prev) => ({ ...prev, uploadFile: value }));
  const setUploadNombre = (value: string) => setUiState((prev) => ({ ...prev, uploadNombre: value }));
  const setUploadTipo = (value: string) => setUiState((prev) => ({ ...prev, uploadTipo: value }));
  const setUploadFuente = (value: string) => setUiState((prev) => ({ ...prev, uploadFuente: value }));
  const setUploadFeedback = (
    value: { type: 'success' | 'error' | 'info'; title: string; message?: string } | null
  ) => setUiState((prev) => ({ ...prev, uploadFeedback: value }));
  const setIsUploading = (value: boolean) => setUiState((prev) => ({ ...prev, isUploading: value }));
  const setIsLoadingHechos = (value: boolean) => setUiState((prev) => ({ ...prev, isLoadingHechos: value }));
  const setActiveTab = (value: 'workflow' | 'timeline') => setUiState((prev) => ({ ...prev, activeTab: value }));
  const { entries: historial, isLoading: isLoadingHistorial, reload: reloadHistorial } = useExpedienteHistorial(
    expedienteSeleccionado?.dbId ?? expedienteSeleccionado?.id ?? null
  );

  const getHitoTitleFromStepKey = useCallback((stepKey: string): string => {
    switch (stepKey) {
      case 'RESOLUCION_PENDIENTE':
        return 'RESOLUCION';
      default:
        return stepKey;
    }
  }, []);

  useEffect(() => {
    if (isEditMode) {
      setActiveTab('workflow');
      return;
    }
    setActiveTab(tabFromUrl === 'timeline' ? 'timeline' : 'workflow');
  }, [tabFromUrl, id, isEditMode]);

  // Limpieza de claves legacy (sin tenant) para evitar mezclar borradores entre colegios.
  useEffect(() => {
    if (!id) return;
    const legacyResumen = `expediente:${id}:${hitoConfig.hitoTitle}:resumen`;
    const legacyFecha = `expediente:${id}:${hitoConfig.hitoTitle}:fecha`;
    try {
      localStorage.removeItem(legacyResumen);
      localStorage.removeItem(legacyFecha);
    } catch {
      // ignore
    }
  }, [id, hitoConfig.hitoTitle]);

  const { hitosDb, refreshHitos } = useExpedienteHitos({
    expedienteDbId: expedienteSeleccionado?.dbId,
    hitoTitle: hitoConfig.hitoTitle,
    currentEtapa,
    setHitoResumen,
    setHitoFecha,
  });
  const { evidenciasDb, refreshEvidencias } = useExpedienteEvidencias(expedienteSeleccionado?.dbId);
  const evidencias = useMemo(
    () =>
      evidenciasDb.length > 0
        ? evidenciasDb.map((doc) => ({
            id: doc.id,
            name: doc.nombre || doc.url_storage || 'Archivo',
            type: doc.tipo || 'DOC',
            date: (doc.fecha || doc.created_at || '').toString().slice(0, 10),
            icon: doc.tipo === 'IMG' ? ImageIcon : FileText
          }))
        : [],
    [evidenciasDb]
  );

  useEffect(() => {
    if (expedienteSeleccionado) {
      setExpedienteSeleccionado(expedienteSeleccionado);
    }
    return () => setExpedienteSeleccionado(null);
  }, [expedienteSeleccionado, setExpedienteSeleccionado]);


  if (!expedienteSeleccionado && isResolvingExpediente) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <AsyncState
          state="loading"
          title="Cargando expediente"
          message="Recuperando información del caso."
          compact
        />
      </div>
    );
  }

  if (!expedienteSeleccionado && resolveAttempted) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6">
          <AsyncState
            state="error"
            title="Expediente no encontrado"
            message="No existe o no tienes permisos para este expediente."
            compact
          />
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => navigate('/expedientes')}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"
            >
              Volver al listado
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!expedienteSeleccionado) {
    return null;
  }

  const currentStepIndex = STEPS.findIndex(s => s.key === expedienteSeleccionado.etapa);
  const isExpulsion = expedienteSeleccionado.gravedad === 'GRAVISIMA_EXPULSION';
  const puedeFinalizar = !isExpulsion || expedienteSeleccionado.accionesPrevias;
  const isLocked = expedienteSeleccionado.etapa.startsWith('CERRADO');
  const isAperturaEditable = isEditMode && currentEtapa === 'INICIO' && !isLocked;
  const uploadBucket = 'evidencias-publicas';
  const uploadSafeName = uploadFile ? uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, '_') : '';

  const isCanonicalUrlStorage = (value: string): boolean =>
    /^evidencias-(publicas|sensibles)\/.+/.test(value);

  const handleUploadEvidencia = async () => {
    if (!supabase) return;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setUploadFeedback({ type: 'error', title: 'Debes iniciar sesión para subir evidencia.' });
      return;
    }
    if (!expedienteSeleccionado?.dbId) {
      setUploadFeedback({ type: 'error', title: 'Expediente sin ID en base de datos.' });
      return;
    }
    if (!uploadFile) {
      setUploadFeedback({ type: 'error', title: 'Selecciona un archivo para subir.' });
      return;
    }
    if (!tenantId) {
      setUploadFeedback({ type: 'error', title: 'No hay colegio activo para subir evidencia.' });
      return;
    }

    setIsUploading(true);
    setUploadFeedback({ type: 'info', title: 'Subiendo evidencia...', message: 'Estamos indexando el archivo en el expediente.' });
    try {
      const safeName = uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const bucket = uploadBucket;
      // RLS de storage.objects valida prefijo por establecimiento actual del usuario.
      // Intentamos ambos prefijos posibles para evitar mismatch entre contexto UI y perfil.
      let profileTenantPrefix: string | null = null;
      const { data: perfilActual } = await supabase
        .from('perfiles')
        .select('establecimiento_id')
        .eq('id', sessionData.session.user.id)
        .maybeSingle();
      if (perfilActual?.establecimiento_id) {
        profileTenantPrefix = perfilActual.establecimiento_id;
      }
      const prefixCandidates = Array.from(
        new Set([profileTenantPrefix, tenantId].filter((v): v is string => Boolean(v)))
      );

      let uploadOkPath: string | null = null;
      let lastUploadError: string | null = null;

      for (const prefix of prefixCandidates) {
        const objectPath = `${prefix}/${expedienteSeleccionado.dbId}/${Date.now()}-${safeName}`;
        const canonicalUrlStorageTry = `${bucket}/${objectPath}`;
        if (!isCanonicalUrlStorage(canonicalUrlStorageTry)) continue;

        const { error: upError } = await supabase.storage
          .from(bucket)
          .upload(objectPath, uploadFile, { upsert: false });

        if (!upError) {
          uploadOkPath = objectPath;
          break;
        }

        console.warn('Storage upload error:', { prefix, error: upError });
        lastUploadError = upError?.message || 'No se pudo subir el archivo.';
      }

      if (!uploadOkPath) {
        if ((lastUploadError || '').toLowerCase().includes('row-level security policy')) {
          setUploadFeedback({
            type: 'error',
            title: 'Permiso denegado al subir evidencia (RLS).',
            message: `Prefijos intentados: ${prefixCandidates.join(', ')}. Ejecuta el fix 028 y vuelve a intentar.`
          });
        } else {
          setUploadFeedback({
            type: 'error',
            title: 'No se pudo subir el archivo.',
            message: lastUploadError || 'Error desconocido'
          });
        }
        return;
      }
      const canonicalUrlStorage = `${bucket}/${uploadOkPath}`;

      const { error: insError } = await supabase
        .from('evidencias')
        .insert({
          expediente_id: expedienteSeleccionado.dbId,
          establecimiento_id: tenantId,
          url_storage: canonicalUrlStorage,
          tipo_archivo: uploadFile.type || 'application/octet-stream',
          subido_por: sessionData.session.user.id,
          nombre: uploadNombre || uploadFile.name,
          tipo: uploadTipo,
          fecha: new Date().toISOString().slice(0, 10),
          autor: sessionData.session.user.email || '',
          fuente: uploadFuente
        });

      if (insError) {
        setUploadFeedback({
          type: 'error',
          title: 'Archivo subido, pero no se pudo indexar en el expediente.',
          message: insError.message || 'Reintenta en unos segundos.'
        });
      } else {
        setUploadFeedback({
          type: 'success',
          title: 'Evidencia subida correctamente.',
          message: `${uploadNombre || uploadFile.name} fue agregada al expediente.`
        });
        setUploadFile(null);
        setUploadNombre('');
        await refreshEvidencias();
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveDescargos = async () => {
    if (!supabase) return;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setSaveStatus('Inicia sesion para guardar.');
      setSaveFeedback({ type: 'error', message: 'Debes iniciar sesión para guardar este registro.' });
      return;
    }
    if (!expedienteSeleccionado?.dbId) {
      setSaveStatus('No se puede guardar: expediente sin ID en base de datos.');
      setSaveFeedback({ type: 'error', message: 'No se pudo identificar el expediente en base de datos.' });
      return;
    }
    setIsSaving(true);
    setSaveStatus('');
    setSaveFeedback({ type: 'info', message: 'Guardando cambios del registro...' });
    try {
      const payload = {
        expediente_id: expedienteSeleccionado.dbId,
        establecimiento_id: tenantId,
        titulo: hitoConfig.hitoTitle,
        descripcion: hitoResumen || '',
        fecha_cumplimiento: hitoFecha || null,
        completado: Boolean(hitoResumen || hitoFecha),
        requiere_evidencia: true
      };

      const res = await supabase
        .from('hitos_expediente')
        .insert(payload)
        .select('id')
        .single();

      if (res.error) {
        setSaveStatus('No se pudo guardar. Revisa tu sesion.');
        setSaveFeedback({ type: 'error', message: `No se pudo guardar: ${res.error.message}` });
      } else {
        setSaveStatus('Guardado');
        setSaveFeedback({ type: 'success', message: 'Registro guardado correctamente y agregado al historial.' });
        // refrescar hitos visibles inmediatamente
        await refreshHitos();
        // refrescar timeline consolidado
        await reloadHistorial();
      }
    } catch (error) {
      setSaveStatus('No se pudo guardar.');
      setSaveFeedback({ type: 'error', message: 'No se pudo guardar. Intenta nuevamente.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDerivarAMediacion = async () => {
    if (!supabase) return;
    if (!tenantId || !expedienteSeleccionado?.dbId) {
      setSaveFeedback({
        type: 'error',
        message: 'No se pudo derivar: falta colegio activo o ID del expediente.'
      });
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setSaveFeedback({
        type: 'error',
        message: 'Debes iniciar sesión para derivar a mediación.'
      });
      return;
    }

    setIsSaving(true);
    setSaveFeedback({ type: 'info', message: 'Derivando expediente a mediación...' });
    try {
      const { data: existingMediacion } = await supabase
        .from('mediaciones_gcc_v2')
        .select('id')
        .eq('expediente_id', expedienteSeleccionado.dbId)
        .eq('establecimiento_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!existingMediacion) {
        let createdBy = expedienteSeleccionado.encargadoId;
        if (!isUuid(createdBy)) {
          const { data: fallbackPerfil } = await supabase
            .from('perfiles')
            .select('id')
            .eq('establecimiento_id', tenantId)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
          createdBy = fallbackPerfil?.id ?? '';
        }
        if (!isUuid(createdBy)) {
          setSaveFeedback({
            type: 'error',
            message: 'No se pudo derivar: no se encontró perfil responsable válido.'
          });
          return;
        }

        const fechaLimite = expedienteSeleccionado.plazoFatal
          ? new Date(expedienteSeleccionado.plazoFatal).toISOString().slice(0, 10)
          : new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10);

        const { error: mediacionInsertError } = await supabase
          .from('mediaciones_gcc_v2')
          .insert({
            establecimiento_id: tenantId,
            expediente_id: expedienteSeleccionado.dbId,
            tipo_mecanismo: 'MEDIACION',
            estado_proceso: 'abierta',
            efecto_suspensivo_activo: true,
            fecha_inicio: new Date().toISOString(),
            fecha_limite_habil: fechaLimite,
            motivo_derivacion: 'Derivación desde expediente',
            created_by: createdBy,
            facilitador_id: createdBy
          });
        if (mediacionInsertError) {
          setSaveFeedback({
            type: 'error',
            message: `No se pudo crear derivación GCC: ${mediacionInsertError.message}`
          });
          return;
        }
      }

      const { error: etapaError } = await supabase
        .from('expedientes')
        .update({ etapa_proceso: 'CERRADO_GCC', estado_legal: 'pausa_legal' })
        .eq('id', expedienteSeleccionado.dbId);

      if (etapaError) {
        setSaveFeedback({
          type: 'error',
          message: `No se pudo actualizar etapa: ${etapaError.message}`
        });
        return;
      }

      actualizarEtapa(expedienteSeleccionado.id, 'CERRADO_GCC');
      await refreshHitos();
      await reloadHistorial();
      setSaveFeedback({
        type: 'success',
        message: 'Derivación a mediación guardada correctamente.'
      });
      navigate('/mediacion');
    } catch (error) {
      setSaveFeedback({
        type: 'error',
        message: 'No se pudo derivar a mediación. Intenta nuevamente.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleWorkflowStepClick = async (stepKey: EtapaProceso) => {
    if (isLocked || !expedienteSeleccionado) return;
    if (stepKey === expedienteSeleccionado.etapa) return;

    // Intentar persistir primero en DB para evitar desincronización silenciosa.
    if (supabase && expedienteSeleccionado.dbId) {
      const { data, error } = await supabase
        .from('expedientes')
        .update({
          etapa_proceso: stepKey,
          estado_legal: mapEtapaToEstadoLegal(stepKey)
        })
        .eq('id', expedienteSeleccionado.dbId)
        .select('id')
        .maybeSingle();

      if (error) {
        setSaveFeedback({
          type: 'error',
          message: `No se pudo avanzar a ${stepKey}: ${error.message}`
        });
        return;
      }
      if (!data?.id) {
        setSaveFeedback({
          type: 'error',
          message: `No se pudo avanzar a ${stepKey}: sin filas actualizadas (RLS/permisos).`
        });
        return;
      }
    }

    actualizarEtapa(expedienteSeleccionado.id, stepKey);
    setExpedienteSeleccionado({ ...expedienteSeleccionado, etapa: stepKey });
    await refreshHitos();
    await reloadHistorial();
    setSaveFeedback({
      type: 'success',
      message: `Etapa actualizada a ${stepKey}.`
    });
  };

  const handleLoadHechosFromResumen = async () => {
    setIsLoadingHechos(true);
    try {
      const initialText = await loadHechosFromResumen();
      if (!initialText) {
        setSaveFeedback({
          type: 'info',
          message: 'No hay hechos en el resumen del expediente para cargar.'
        });
        return;
      }
      setHitoResumen(initialText);
      setSaveFeedback({
        type: 'info',
        message: 'Hechos del resumen cargados en el registro de inicio.'
      });
    } finally {
      setIsLoadingHechos(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={() => navigate('/expedientes')}
              className="p-4 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-blue-600 border border-slate-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{expedienteSeleccionado.id}</h2>
                <NormativeBadge gravedad={expedienteSeleccionado.gravedad} />
                {expedienteSeleccionado.nnaNombreB && (
                  <span className="px-2 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-indigo-100 text-indigo-700 border border-indigo-200">
                    Caso bilateral A/B
                  </span>
                )}
              </div>
              <p className="text-slate-500 font-bold text-xs flex items-center uppercase tracking-widest">
                <Users2 className="w-4 h-4 mr-2 text-blue-500" />
                NNA A: <span className="text-slate-900 ml-2">{expedienteSeleccionado.nnaNombre}</span>
              </p>
              {expedienteSeleccionado.nnaNombreB && (
                <p className="text-slate-500 font-bold text-xs flex items-center uppercase tracking-widest mt-1">
                  <Users2 className="w-4 h-4 mr-2 text-indigo-400" />
                  NNA B: <span className="text-slate-900 ml-2">{expedienteSeleccionado.nnaNombreB}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-4">
            <PlazoCounter fechaLimite={expedienteSeleccionado.plazoFatal} />
            {isExpulsion && (
              <div className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center shadow-lg border border-red-500 tracking-widest uppercase">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Ley Aula Segura
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tab Switcher: Workflow / Timeline */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 w-fit">
          <button
            onClick={() => {
              setActiveTab('workflow');
              navigate(`/expedientes/${id}`, { replace: true });
            }}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'workflow'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Ruta Crítica
            </span>
          </button>
          {!isEditMode && (
            <button
              onClick={() => {
                setActiveTab('timeline');
                navigate(`/expedientes/${id}?tab=timeline`, { replace: true });
              }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'timeline'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Historial
              </span>
            </button>
          )}
        </div>
        {isEditMode && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
            <p className="text-xs font-black uppercase tracking-widest text-blue-700">
              Modo Edicion de Apertura
            </p>
            <p className="text-xs font-semibold text-blue-600 mt-1">
              Completa o corrige antecedentes iniciales del expediente y guarda los cambios.
            </p>
            {!isAperturaEditable && (
              <p className="text-xs font-semibold text-amber-700 mt-1">
                Disponible solo para expedientes en etapa INICIO y no cerrados.
              </p>
            )}
          </div>
        )}
        {expedienteSeleccionado.etapa === 'CERRADO_GCC' && (
          <div className="mt-4 bg-blue-50 border-2 border-blue-200 border-dashed rounded-2xl px-4 py-3">
            <p className="text-xs font-black uppercase tracking-widest text-blue-800">
              Pausa Legal
            </p>
            <p className="text-xs font-semibold text-blue-700 mt-1">
              La Circular 782 indica que, al activarse un mecanismo de Gestión Colaborativa de Conflictos (GCC), el establecimiento puede suspender la tramitación del procedimiento disciplinario para dar espacio a la resolución del conflicto entre las partes.
            </p>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8">
        {/* Vista de Timeline */}
        {activeTab === 'timeline' ? (
          <section className="bg-white p-4 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center">
              <Clock className="w-5 h-5 mr-3 text-blue-600" />
              Historial del Expediente
            </h3>
            {isLoadingHistorial ? (
              <AsyncState
                state="loading"
                title="Cargando historial"
                message="Estamos reuniendo la trazabilidad del expediente."
                compact
              />
            ) : historial.length > 0 ? (
              <CaseTimeline 
                items={historial.map(entry => ({
                  id: entry.id,
                  fecha: entry.fecha,
                  titulo: entry.titulo,
                  descripcion: entry.descripcion,
                  tipo: entry.tipo,
                  usuario: entry.usuario
                }))}
                initialLimit={20}
              />
            ) : (
              <AsyncState
                state="empty"
                title="Sin registros en el historial"
                message="Los cambios del expediente se registrarán automáticamente."
                compact
              />
            )}
          </section>
        ) : (
          /* Vista de Workflow */
          <section className="bg-white p-4 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-10 flex items-center">
              <History className="w-5 h-5 mr-3 text-blue-600" />
              Ruta Crítica de Cumplimiento (Circular 782)
            </h3>
          <div className="overflow-x-auto">
            <div className="relative flex justify-between items-start min-w-full">
              <div className="absolute top-6 left-0 w-full h-1 bg-slate-100 -z-0"></div>
              {STEPS.map((step, idx) => {
                const hitoTitle = getHitoTitleFromStepKey(step.key);
                const isHitoCompleted = hitosDb.some((h) => h.titulo === hitoTitle && h.completado);
                const isCompleted = isHitoCompleted || idx < currentStepIndex || (idx === currentStepIndex && expedienteSeleccionado.etapa.startsWith('CERRADO'));
                const isCurrent = idx === currentStepIndex;
                const isClickable = !isLocked && step.key !== expedienteSeleccionado.etapa;
                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => {
                      if (isClickable) {
                        void handleWorkflowStepClick(step.key as EtapaProceso);
                      }
                    }}
                    className={`relative z-10 flex flex-col items-center group w-1/6 px-2 ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                    title={isLocked ? 'Etapa cerrada' : `Cambiar a ${step.label}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-white shadow-lg ${isCompleted ? 'bg-emerald-500 text-white' :
                      isCurrent ? 'bg-blue-600 text-white scale-110' : 'bg-white text-slate-300 border-slate-100'
                      }`}>
                      {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <step.icon className="w-5 h-5" />}
                    </div>
                    <div className="mt-4 text-center">
                      <p className={`text-xs font-black uppercase tracking-tighter ${isCompleted ? 'text-emerald-600' : isCurrent ? 'text-blue-700' : 'text-slate-400'
                        }`}>
                        {step.label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {isExpulsion && (
              <div className={`border-2 rounded-3xl p-8 relative overflow-hidden transition-all ${expedienteSeleccionado.accionesPrevias ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200 shadow-red-100 shadow-xl animate-pulse'}`}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <ShieldCheck className="w-24 h-24" />
                </div>
                <h3 className={`font-black text-sm uppercase tracking-widest flex items-center mb-6 ${expedienteSeleccionado.accionesPrevias ? 'text-emerald-900' : 'text-red-900'}`}>
                  {expedienteSeleccionado.accionesPrevias ? <CheckCircle2 className="w-5 h-5 mr-3" /> : <AlertTriangle className="w-5 h-5 mr-3" />}
                  Validación de Gradualidad (Art. 6 Circular 782)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`flex items-center p-4 rounded-2xl border-2 ${expedienteSeleccionado.accionesPrevias ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-white border-red-200 text-red-700'}`}>
                    <Check className="w-4 h-4 mr-3" />
                    <div>
                      <p className="text-xs font-black uppercase">Advertencia Escrita</p>
                    </div>
                  </div>
                  <div className={`flex items-center p-4 rounded-2xl border-2 ${expedienteSeleccionado.accionesPrevias ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-white border-red-200 text-red-700'}`}>
                    <Check className="w-4 h-4 mr-3" />
                    <div>
                      <p className="text-xs font-black uppercase">Apoyo Psicosocial</p>
                    </div>
                  </div>
                </div>
                {!expedienteSeleccionado.accionesPrevias && (
                  <div className="mt-6 p-4 bg-white rounded-xl border border-red-200">
                    <p className="text-xs text-red-600 font-bold flex items-center italic">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      BLOQUEO LEGAL: No se puede proceder con la resolución de expulsión sin acreditar estas medidas previas.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-4 md:p-8">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center">
                <MessageSquare className="w-5 h-5 mr-3 text-blue-600" />
                {isEditMode ? 'Edicion de Apertura' : hitoConfig.title}
              </h3>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">{hitoConfig.dateLabel}</label>
                  <input
                    type="date"
                    value={hitoFecha}
                    onChange={(e) => setHitoFecha(e.target.value)}
                    disabled={isEditMode && !isAperturaEditable}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
                <button
                  onClick={() => { clearHitoResumen(); clearFecha(); }}
                  disabled={isEditMode && !isAperturaEditable}
                  className="self-end md:self-start px-4 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl text-xs font-black uppercase hover:bg-slate-50 transition-all"
                >
                  Limpiar borrador
                </button>
                {currentEtapa === 'INICIO' && (
                  <button
                    onClick={handleLoadHechosFromResumen}
                    disabled={isLoadingHechos || (isEditMode && !isAperturaEditable)}
                    className={`self-end md:self-start px-4 py-3 rounded-2xl text-xs font-black uppercase transition-all ${
                      isLoadingHechos
                        ? 'bg-slate-200 text-slate-400'
                        : 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200'
                    }`}
                  >
                    {isLoadingHechos ? 'Cargando hechos...' : 'Cargar hechos del resumen'}
                  </button>
                )}
                <button
                  onClick={handleSaveDescargos}
                  disabled={isSaving || (isEditMode && !isAperturaEditable)}
                  className={`self-end md:self-start px-4 py-3 rounded-2xl text-xs font-black uppercase transition-all ${isSaving ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {isSaving ? 'Guardando...' : isEditMode ? 'Guardar apertura' : 'Guardar'}
                </button>
              </div>
              {saveFeedback && (
                <div
                  className={`mb-3 rounded-2xl px-4 py-3 text-xs font-bold border ${
                    saveFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : saveFeedback.type === 'error'
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}
                >
                  {saveFeedback.message}
                </div>
              )}
              {saveStatus && !saveFeedback && (
                <p className="text-xs font-bold text-slate-500 mb-2">{saveStatus}</p>
              )}
              <textarea
                className="w-full h-40 bg-slate-50 border border-slate-200 rounded-3xl p-6 text-sm font-medium focus:ring-4 focus:ring-blue-500/5 focus:outline-none placeholder:text-slate-300"
                placeholder={hitoConfig.placeholder}
                value={hitoResumen}
                onChange={(e) => setHitoResumen(e.target.value)}
                readOnly={isEditMode && !isAperturaEditable}
              />
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-4 md:p-8">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center">
                <History className="w-5 h-5 mr-3 text-blue-600" />
                Historial de Hitos
              </h3>
              {hitosDb.length === 0 ? (
                <AsyncState
                  state="empty"
                  title="Sin hitos registrados"
                  message="Los hitos aparecerán aquí al guardar avances."
                  compact
                />
              ) : (
                <ol className="relative border-l border-slate-200 ml-3">
                  {hitosDb.map((hito) => (
                    <li key={hito.id} className="mb-6 ml-6">
                      <span className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ${hito.completado ? 'bg-emerald-500' : 'bg-blue-500'} text-white text-xs font-black`}>
                        {hito.completado ? 'OK' : '...'}
                      </span>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-700">{hito.titulo}</p>
                        {hito.fecha_cumplimiento && (
                          <span className="text-xs font-bold text-slate-400">{String(hito.fecha_cumplimiento).slice(0, 10)}</span>
                        )}
                      </div>
                      {hito.descripcion && (
                        <p className="text-xs text-slate-600 mt-1">{hito.descripcion}</p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {!isEditMode && (
              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <button
                  onClick={() => setIsGeneradorOpen(true)}
                  disabled={!puedeFinalizar}
                  className={`flex-1 flex items-center justify-center space-x-3 py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl ${puedeFinalizar
                    ? 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  <Gavel className="w-5 h-5" />
                  <span>Emitir Resolución Final</span>
                </button>

                <button
                  onClick={handleDerivarAMediacion}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center space-x-3 py-5 rounded-2xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-600/20"
                >
                  <Handshake className="w-5 h-5" />
                  <span>Derivar a Mediación GCC</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 flex flex-col h-full">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center">
                <FileText className="w-5 h-5 mr-3 text-blue-600" />
                Evidencia Indexada
              </h3>
              <div className="space-y-4 flex-1">
                {evidencias.length === 0 ? (
                  <AsyncState
                    state="empty"
                    title="Sin evidencias indexadas"
                    message="Sube archivos para crear trazabilidad en este expediente."
                    compact
                  />
                ) : (
                  evidencias.map((doc) => (
                    <div key={doc.id} className="flex items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-blue-50 transition-all cursor-pointer">
                      <doc.icon className="w-5 h-5 text-blue-600 mr-4" />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-black text-slate-700 truncate uppercase">{doc.name}</p>
                        <p className="text-xs font-bold text-slate-400 italic">{doc.date}</p>
                      </div>
                    </div>
                  ))
                )}

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Subir evidencia</p>
                  <input
                    type="file"
                    onChange={(e) => {
                      setUploadFile(e.target.files ? e.target.files[0] : null);
                      setUploadFeedback(null);
                    }}
                    className="w-full text-xs font-bold text-slate-500"
                  />
                  {uploadFile && expedienteSeleccionado?.dbId && tenantId && (
                    <p className="mt-2 text-xs font-semibold text-blue-700 break-all">
                      Se guardará como: {uploadBucket}/{tenantId}/{expedienteSeleccionado.dbId}/&lt;timestamp&gt;-{uploadSafeName}
                    </p>
                  )}
                  <input
                    value={uploadNombre}
                    onChange={(e) => setUploadNombre(e.target.value)}
                    placeholder="Nombre"
                    className="mt-2 w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <select
                      value={uploadTipo}
                      onChange={(e) => setUploadTipo(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                    >
                      <option value="IMG">IMG</option>
                      <option value="VIDEO">VIDEO</option>
                      <option value="AUDIO">AUDIO</option>
                      <option value="PDF">PDF</option>
                    </select>
                    <select
                      value={uploadFuente}
                      onChange={(e) => setUploadFuente(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                    >
                      <option value="ESCUELA">ESCUELA</option>
                      <option value="APODERADO">APODERADO</option>
                      <option value="SIE">SIE</option>
                    </select>
                  </div>
                  {uploadFeedback && (
                    <div
                      className={`mt-3 rounded-xl border px-3 py-2 ${
                        uploadFeedback.type === 'success'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : uploadFeedback.type === 'error'
                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                            : 'border-blue-200 bg-blue-50 text-blue-700'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {uploadFeedback.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 mt-0.5" />
                        ) : uploadFeedback.type === 'error' ? (
                          <AlertTriangle className="w-4 h-4 mt-0.5" />
                        ) : (
                          <Clock className="w-4 h-4 mt-0.5" />
                        )}
                        <div>
                          <p className="text-xs font-black">{uploadFeedback.title}</p>
                          {uploadFeedback.message && (
                            <p className="text-xs font-semibold mt-0.5 opacity-90">{uploadFeedback.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handleUploadEvidencia}
                    disabled={isUploading}
                    className={`mt-2 w-full px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest ${isUploading ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {isUploading ? 'Subiendo...' : 'Subir evidencia'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isGeneradorOpen && <GeneradorResolucion onClose={() => setIsGeneradorOpen(false)} />}
    </div>
  );
};

const ExpedienteDetalle: React.FC = () => useExpedienteDetalleView();

const Handshake: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17 2 2 6-6" /><path d="m18 10 1-1a2 2 0 0 0-3-3l-1 1" /><path d="m14 14 1 1a2 2 0 0 0 3 0l.5-.5" /><path d="m8 5.8a2.1 2.1 0 0 1 2.1-2.1c1.1 0 2 1 2 2.1a2.1 2.1 0 0 1-2.1 2.1c-1.1 0-2-1-2-2.1Z" /><path d="M10.5 9.9a4.8 4.8 0 0 0-6.3 1.8A5.2 5.2 0 0 0 5.6 18l.8.7" /><path d="M7 15h2" /><path d="m15 18-2 2" /></svg>
);

export default ExpedienteDetalle;


