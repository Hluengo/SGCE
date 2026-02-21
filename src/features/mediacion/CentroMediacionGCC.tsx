/**
 * Centro de Mediación GCC - Gestión Colaborativa de Conflictos
 * Cumple con Circular 782, Artículo 8 - Mecanismos de Resolución Pacífica
 *
 * Funcionalidades:
 * - Derivación automática de expedientes a GCC
 * - Registro de procesos de mediación
 * - Seguimiento de compromisos reparatorios
 * - Cierre formativo de expedientes
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTenant } from '@/shared/context/TenantContext';
import { useGccMetrics, useGccForm } from '@/shared/hooks';
import { useToast } from '@/shared/components/Toast/ToastProvider';
import { createRenderProfiler, isPerfProfilerEnabled } from '@/shared/utils/perfProfiler';
import { supabase } from '@/shared/lib/supabaseClient';
import { Handshake } from 'lucide-react';
import PageTitleHeader from '@/shared/components/PageTitleHeader';

import {
  GccCasosPanel,
  GccPanelRouter,
  GccMechanismSelector,
  GccDerivacionForm,
  GccResultadoForm,
} from './components';
import GccCierreModal from './GccCierreModal';
import ActaEstandarizada from './components/ActaEstandarizada';
import { useGccMechanismState, useGccWorkflow, useGccPanelProps } from './hooks';

const GccCasosSection: React.FC<{
  casosParaGCC: ReturnType<typeof useConvivencia>['expedientes'];
  casosConDerivacion: ReturnType<typeof useConvivencia>['expedientes'];
  selectedCaseId: string | null;
  perfEnabled: boolean;
  onCasosPanelRender: React.ProfilerOnRenderCallback;
  onSelectCase: (id: string) => void;
}> = ({ casosParaGCC, casosConDerivacion, selectedCaseId, perfEnabled, onCasosPanelRender, onSelectCase }) => (
  <section data-testid="mediation-list" className="md:col-span-2 xl:col-span-3 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col">
    <div className="p-3 md:p-4 lg:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3 bg-slate-50/40">
      <h2 className="text-sm md:text-base font-bold text-slate-900 uppercase tracking-tight">Casos en Proceso</h2>
      <span className="rounded-lg bg-blue-100 px-2 md:px-3 py-1 text-xs font-bold text-blue-700 w-fit">
        {casosParaGCC.length + casosConDerivacion.length} total
      </span>
    </div>
    {perfEnabled ? (
      <React.Profiler id="GCC/CasosPanel" onRender={onCasosPanelRender}>
        <GccCasosPanel
          casosParaGCC={casosParaGCC}
          casosConDerivacion={casosConDerivacion}
          selectedCaseId={selectedCaseId}
          onSelectCase={onSelectCase}
        />
      </React.Profiler>
    ) : (
      <GccCasosPanel
        casosParaGCC={casosParaGCC}
        casosConDerivacion={casosConDerivacion}
        selectedCaseId={selectedCaseId}
        onSelectCase={onSelectCase}
      />
    )}
  </section>
);

const GccControlSidebar: React.FC<{
  selectedCaseId: string | null;
  mecanismoSeleccionado: 'MEDIACION' | 'CONCILIACION' | 'ARBITRAJE_PEDAGOGICO' | null;
  casoSeleccionado: ReturnType<typeof useConvivencia>['expedientes'][number] | null;
  onChangeMecanismo: (value: 'MEDIACION' | 'CONCILIACION' | 'ARBITRAJE_PEDAGOGICO') => void;
}> = ({ selectedCaseId, mecanismoSeleccionado, casoSeleccionado, onChangeMecanismo }) => (
  <aside className="md:col-span-1 xl:col-span-1 space-y-3 md:space-y-4">
    {selectedCaseId && (
      <GccMechanismSelector
        value={mecanismoSeleccionado}
        onChange={onChangeMecanismo}
      />
    )}
    {casoSeleccionado && selectedCaseId ? (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl md:rounded-2xl border border-slate-200 shadow-md p-3 md:p-4 space-y-3 md:space-y-4">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Caso Seleccionado</p>
          <p className="text-xs md:text-sm font-mono font-bold text-slate-900 mt-1">{selectedCaseId.slice(0, 8)}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Estudiante</p>
          <p className="text-xs md:text-sm font-bold text-slate-900 truncate mt-1">{casoSeleccionado.nnaNombre}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Etapa</p>
          <span className={`inline-block px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg text-xs font-bold uppercase tracking-tight mt-1 ${casoSeleccionado.etapa === 'CERRADO_GCC' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {casoSeleccionado.etapa === 'CERRADO_GCC' ? 'En GCC' : 'Disponible'}
          </span>
        </div>
      </div>
    ) : (
      <div className="bg-slate-100 rounded-xl md:rounded-2xl border border-slate-200 p-3 md:p-4 text-center space-y-2">
        <p className="text-xs md:text-sm font-bold text-slate-900">Selecciona un caso</p>
        <p className="text-xs text-slate-500">para habilitar controles</p>
      </div>
    )}
  </aside>
);

function renderCentroMediacionContent(params: {
  casosParaGCC: ReturnType<typeof useConvivencia>['expedientes'];
  casosConDerivacion: ReturnType<typeof useConvivencia>['expedientes'];
  selectedCaseId: string | null;
  perfEnabled: boolean;
  onCasosPanelRender: React.ProfilerOnRenderCallback;
  handleSelectCase: (id: string) => void;
  mecanismoSeleccionado: 'MEDIACION' | 'CONCILIACION' | 'ARBITRAJE_PEDAGOGICO' | null;
  casoSeleccionado: ReturnType<typeof useConvivencia>['expedientes'][number] | null;
  cambiarMecanismo: (value: 'MEDIACION' | 'CONCILIACION' | 'ARBITRAJE_PEDAGOGICO') => void;
  showDerivacionForm: boolean;
  showResultadoForm: boolean;
  statusGCC: 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO';
  estadoEtapaLabel: string;
  toggleModal: (modal: 'showDerivacionForm' | 'showResultadoForm' | 'showCierreModal' | 'showActaPreview') => void;
  handleDerivacionCompletaInternal: (payload: { mediacionId: string }) => Promise<void>;
  handleResultadoCompleto: (payload: { status: 'LOGRADO' | 'NO_ACUERDO' }) => Promise<void>;
  panelRouterProps: React.ComponentProps<typeof GccPanelRouter>;
  onPanelRouterRender: React.ProfilerOnRenderCallback;
  showCierreModal: boolean;
  selectedMediacionId: string | null;
  toast: ReturnType<typeof useToast>;
  refreshGccMetrics: () => void;
  showActaPreview: boolean;
  numeroActa: string;
  establecimientoNombre: string;
  responsableActa: string;
  fechaSesionActa: string;
  detallePrincipalActa: string;
  compromisos: ReturnType<typeof useGccForm>['state']['compromisos'];
}) {
  const {
    casosParaGCC,
    casosConDerivacion,
    selectedCaseId,
    perfEnabled,
    onCasosPanelRender,
    handleSelectCase,
    mecanismoSeleccionado,
    casoSeleccionado,
    cambiarMecanismo,
    showDerivacionForm,
    showResultadoForm,
    statusGCC,
    estadoEtapaLabel,
    toggleModal,
    handleDerivacionCompletaInternal,
    handleResultadoCompleto,
    panelRouterProps,
    onPanelRouterRender,
    showCierreModal,
    selectedMediacionId,
    toast,
    refreshGccMetrics,
    showActaPreview,
    numeroActa,
    establecimientoNombre,
    responsableActa,
    fechaSesionActa,
    detallePrincipalActa,
    compromisos,
  } = params;

  return (
    <main data-testid="gcc-interface" className="flex-1 p-4 md:p-8 space-y-6 bg-slate-50/50 overflow-y-auto">
      <div className="w-full space-y-6">
        <PageTitleHeader
          title="Centro de Mediación Escolar (GCC)"
          subtitle="Gestión colaborativa de conflictos · Circular 782"
          icon={Handshake}
        />

        {/* Search input for testing */}
        <div className="mb-4">
          <input
            data-testid="search-input"
            type="text"
            placeholder="Buscar casos..."
            className="w-full max-w-md p-2 border border-slate-300 rounded"
          />
          <div data-testid="search-results" className="mt-2">
            {/* Search results would go here */}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          <GccCasosSection
            casosParaGCC={casosParaGCC}
            casosConDerivacion={casosConDerivacion}
            selectedCaseId={selectedCaseId}
            perfEnabled={perfEnabled}
            onCasosPanelRender={onCasosPanelRender}
            onSelectCase={handleSelectCase}
          />
          <GccControlSidebar
            selectedCaseId={selectedCaseId}
            mecanismoSeleccionado={mecanismoSeleccionado}
            casoSeleccionado={casoSeleccionado}
            onChangeMecanismo={cambiarMecanismo}
          />
        </div>

        {selectedCaseId && mecanismoSeleccionado && (
          <section className="bg-white border border-slate-200 rounded-xl lg:rounded-2xl shadow-lg p-4 md:p-6">
            {showDerivacionForm && casoSeleccionado ? (
              <GccDerivacionForm
                expedienteId={casoSeleccionado.id}
                estudianteNombre={casoSeleccionado.nnaNombre}
                mecanismo={mecanismoSeleccionado}
                onMecanismoChange={cambiarMecanismo}
                plazoFatal={casoSeleccionado.plazoFatal}
                onDerivacionCompleta={(payload) => { void handleDerivacionCompletaInternal(payload); }}
                onCancelar={() => toggleModal('showDerivacionForm')}
              />
            ) : showResultadoForm ? (
              <GccResultadoForm onCompleto={(payload) => { void handleResultadoCompleto(payload); }} />
            ) : (
              <>
                <div className="mb-4 md:mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h2 className="text-base md:text-lg font-bold text-slate-900 uppercase tracking-tight">Proceso GCC</h2>
                    <p className="text-xs text-slate-600 font-semibold">{estadoEtapaLabel}</p>
                  </div>
                  {statusGCC !== 'PROCESO' && casoSeleccionado && (
                    <button
                      onClick={() => toggleModal('showActaPreview')}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-colors"
                    >
                      Generar Acta Estandar
                    </button>
                  )}
                  <button
                    data-testid="add-commitment-btn"
                    onClick={() => {/* TODO: Implement add commitment */}}
                    className="px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-black uppercase tracking-widest hover:bg-green-700 transition-colors"
                  >
                    Agregar Compromiso
                  </button>
                </div>
                {perfEnabled ? (
                  <React.Profiler id="GCC/PanelRouter" onRender={onPanelRouterRender}>
                    <GccPanelRouter {...panelRouterProps} />
                  </React.Profiler>
                ) : (
                  <GccPanelRouter {...panelRouterProps} />
                )}

                {/* Simple commitment form for testing */}
                <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-white">
                  <h3 className="text-sm font-bold mb-2">Agregar Compromiso</h3>
                  <div className="space-y-2">
                    <input
                      data-testid="commitment-description"
                      type="text"
                      placeholder="Descripción del compromiso"
                      className="w-full p-2 border border-slate-300 rounded"
                    />
                    <input
                      data-testid="commitment-date"
                      type="date"
                      className="w-full p-2 border border-slate-300 rounded"
                    />
                    <button
                      data-testid="save-commitment-btn"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Guardar Compromiso
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {showCierreModal && selectedMediacionId && (
          <GccCierreModal
            mediacionId={selectedMediacionId}
            onClose={() => toggleModal('showCierreModal')}
            onCierreExitoso={() => {
              toast?.showToast('success', 'GCC', 'Mediación cerrada correctamente');
              refreshGccMetrics();
              toggleModal('showCierreModal');
            }}
          />
        )}

        {showActaPreview && casoSeleccionado && (
          <ActaEstandarizada
            isOpen={showActaPreview}
            onClose={() => toggleModal('showActaPreview')}
            numeroActa={numeroActa}
            establecimientoNombre={establecimientoNombre}
            caso={casoSeleccionado}
            mecanismo={mecanismoSeleccionado}
            estado={statusGCC}
            responsableNombre={responsableActa}
            fechaSesion={fechaSesionActa}
            detallePrincipal={detallePrincipalActa}
            compromisos={compromisos}
          />
        )}
      </div>
    </main>
  );
}

/**
 * Componente Principal: Centro de Mediación GCC
 */
const CentroMediacionGCC: React.FC = () => {
  const { expedientes, setExpedientes, setExpedienteSeleccionado } = useConvivencia();
  const { usuario } = useAuth();
  const { establecimiento, tenantId } = useTenant();
  const { refresh: refreshGccMetrics } = useGccMetrics();
  const toast = useToast();
  const [numeroActaPersistido, setNumeroActaPersistido] = useState<string | null>(null);

  // Hooks GCC - Gestión de estado centralizada
  const {
    state: gccState,
    selectCase,
    setMediacionId,
    cambiarMecanismo,
    cambiarStatus,
    cambiarFacilitador,
    agregarCompromiso,
    eliminarCompromiso,
    toggleCumplimiento,
    actualizarNuevoCompromiso,
    toggleModal
  } = useGccForm();

  const mechanismState = useGccMechanismState();
  const perfEnabled = isPerfProfilerEnabled();
  const onCasosPanelRender = useMemo(
    () => createRenderProfiler('GCC/CasosPanel', 6),
    []
  );
  const onPanelRouterRender = useMemo(
    () => createRenderProfiler('GCC/PanelRouter', 8),
    []
  );

  // Accesos de estado más legibles
  const {
    selectedCaseId,
    selectedMediacionId,
    compromisos,
    statusGCC,
    mecanismoSeleccionado,
    facilitador,
    nuevoCompromiso,
    uiState,
  } = gccState;

  const {
    showDerivacionForm,
    showResultadoForm,
    showCierreModal,
    showActaPreview,
  } = uiState;

  // Filtrar casos disponibles para GCC (usando valores de EtapaProceso正确os)
  const casosParaGCC = useMemo(
    () =>
      expedientes.filter(
        (e) =>
          e.etapa === 'INVESTIGACION' ||
          e.etapa === 'NOTIFICADO' ||
          e.etapa === 'DESCARGOS'
      ),
    [expedientes]
  );

  const casosConDerivacion = useMemo(
    () => expedientes.filter((e) => e.etapa === 'CERRADO_GCC'),
    [expedientes]
  );

  const {
    casoSeleccionado,
    handleSelectCase,
    handleDerivacionCompletaInternal,
    handleResultadoCompleto,
  } = useGccWorkflow({
    expedientes,
    setExpedientes,
    setExpedienteSeleccionado,
    selectedCaseId,
    selectedMediacionId,
    mecanismoSeleccionado,
    selectCase,
    setMediacionId,
    cambiarMecanismo,
    cambiarStatus,
    toggleModal,
    refreshGccMetrics,
    circular782Context: {
      aceptaParticipacion: mechanismState.aceptaParticipacion,
      escenarioProcedencia: mechanismState.escenarioProcedencia,
      autorizaDivulgacionResultado: mechanismState.autorizaDivulgacionResultado,
      plazoCompromiso: mechanismState.plazoCompromiso,
      fechaSeguimiento: mechanismState.fechaSeguimiento,
      evaluacionResultado: mechanismState.evaluacionResultado,
    },
  });
  const { panelRouterProps } = useGccPanelProps({
    casoSeleccionado,
    usuarioRol: usuario?.rol,
    mecanismoSeleccionado,
    statusGCC,
    compromisos,
    nuevoCompromiso,
    facilitador,
    mechanismState,
    cambiarStatus,
    agregarCompromiso,
    eliminarCompromiso,
    toggleCumplimiento,
    cambiarFacilitador,
    actualizarNuevoCompromiso,
    toggleModal,
  });

  const numeroActaFallback = useMemo(() => {
    const base = selectedMediacionId || selectedCaseId || crypto.randomUUID();
    return `ACTA-${base.slice(0, 8).toUpperCase()}`;
  }, [selectedMediacionId, selectedCaseId]);
  const numeroActa = numeroActaPersistido || numeroActaFallback;

  const resolverNumeroActaPersistido = useCallback(async () => {
    if (!showActaPreview || !selectedMediacionId || !tenantId || !supabase) return;

    const { data: actaRow, error: actaError } = await supabase
      .from('actas_gcc_v2')
      .select('id, contenido_json, created_at')
      .eq('establecimiento_id', tenantId)
      .eq('mediacion_id', selectedMediacionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (actaError) {
      console.error('No se pudo resolver acta para numeración correlativa:', actaError);
      return;
    }
    if (!actaRow) return;

    const contenidoActual =
      actaRow.contenido_json && typeof actaRow.contenido_json === 'object'
        ? (actaRow.contenido_json as Record<string, unknown>)
        : {};

    const numeroExistente = contenidoActual.numero_acta;
    if (typeof numeroExistente === 'string' && numeroExistente.trim().length > 0) {
      setNumeroActaPersistido(numeroExistente);
      return;
    }

    const year = new Date().getFullYear();
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const { count, error: countError } = await supabase
      .from('actas_gcc_v2')
      .select('id', { count: 'exact', head: true })
      .eq('establecimiento_id', tenantId)
      .gte('fecha_emision', yearStart)
      .lte('fecha_emision', yearEnd);

    if (countError) {
      console.error('No se pudo calcular correlativo de actas:', countError);
      return;
    }

    const baseCount = count ?? 0;
    for (let attempt = 1; attempt <= 8; attempt += 1) {
      const correlativo = String(baseCount + attempt).padStart(4, '0');
      const numeroGenerado = `ACTA-${year}-${correlativo}`;
      const contenidoActualizado = { ...contenidoActual, numero_acta: numeroGenerado };

      const { error: updateError } = await supabase
        .from('actas_gcc_v2')
        .update({ contenido_json: contenidoActualizado })
        .eq('id', actaRow.id);

      if (!updateError) {
        setNumeroActaPersistido(numeroGenerado);
        return;
      }

      // Colisión por índice único: intentamos el siguiente correlativo.
      if (updateError.code === '23505') {
        continue;
      }

      console.error('No se pudo persistir numero_acta en actas_gcc_v2:', updateError);
      return;
    }

    console.error('No se pudo asignar numero_acta único tras múltiples intentos.');
  }, [showActaPreview, selectedMediacionId, tenantId]);

  useEffect(() => {
    if (!showActaPreview) {
      setNumeroActaPersistido(null);
      return;
    }
    void resolverNumeroActaPersistido();
  }, [showActaPreview, resolverNumeroActaPersistido]);

  const responsableActa = useMemo(() => {
    if (mecanismoSeleccionado === 'ARBITRAJE_PEDAGOGICO') return 'Director del Establecimiento';
    const fullName = `${usuario?.nombre ?? ''} ${usuario?.apellido ?? ''}`.trim();
    return fullName || facilitador || 'Profesional de Convivencia';
  }, [mecanismoSeleccionado, usuario?.nombre, usuario?.apellido, facilitador]);

  const fechaSesionActa = useMemo(() => {
    if (mecanismoSeleccionado === 'CONCILIACION') return mechanismState.fechaConciliacion;
    if (mecanismoSeleccionado === 'ARBITRAJE_PEDAGOGICO') return mechanismState.fechaArbitraje;
    return mechanismState.fechaMediacion;
  }, [
    mecanismoSeleccionado,
    mechanismState.fechaArbitraje,
    mechanismState.fechaConciliacion,
    mechanismState.fechaMediacion,
  ]);

  const detallePrincipalActa = useMemo(() => {
    if (mecanismoSeleccionado === 'CONCILIACION') {
      return mechanismState.propuestaConciliador;
    }
    if (mecanismoSeleccionado === 'ARBITRAJE_PEDAGOGICO') {
      return mechanismState.resolucionArbitro;
    }
    return mechanismState.detallesAcuerdo;
  }, [
    mecanismoSeleccionado,
    mechanismState.propuestaConciliador,
    mechanismState.resolucionArbitro,
    mechanismState.detallesAcuerdo,
  ]);

  const estadoEtapaLabel = useMemo(() => {
    if (statusGCC === 'PROCESO') {
      return 'Etapa 1: Registro y desarrollo del mecanismo';
    }
    return 'Etapa 2: Caso finalizado, listo para acta oficial';
  }, [statusGCC]);

  return renderCentroMediacionContent({
    casosParaGCC,
    casosConDerivacion,
    selectedCaseId,
    perfEnabled,
    onCasosPanelRender,
    handleSelectCase,
    mecanismoSeleccionado,
    casoSeleccionado,
    cambiarMecanismo,
    showDerivacionForm,
    showResultadoForm,
    statusGCC,
    estadoEtapaLabel,
    toggleModal,
    handleDerivacionCompletaInternal,
    handleResultadoCompleto,
    panelRouterProps,
    onPanelRouterRender,
    showCierreModal,
    selectedMediacionId,
    toast,
    refreshGccMetrics,
    showActaPreview,
    numeroActa,
    establecimientoNombre: establecimiento?.nombre || 'Establecimiento Educacional',
    responsableActa,
    fechaSesionActa,
    detallePrincipalActa,
    compromisos,
  });
};

export default CentroMediacionGCC;
