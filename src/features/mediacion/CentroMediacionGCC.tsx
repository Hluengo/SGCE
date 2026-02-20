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

import React, { useMemo } from 'react';
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { useAuth } from '@/shared/hooks/useAuth';
import { useGccMetrics, useGccForm } from '@/shared/hooks';
import { useToast } from '@/shared/components/Toast/ToastProvider';
import { createRenderProfiler, isPerfProfilerEnabled } from '@/shared/utils/perfProfiler';

import {
  GccCasosPanel,
  GccPanelRouter,
  GccMechanismSelector,
  GccDerivacionForm,
  GccResultadoForm,
} from './components';
import GccCierreModal from './GccCierreModal';
import { useGccMechanismState, useGccWorkflow, useGccPanelProps } from './hooks';

/**
 * Componente Principal: Centro de Mediación GCC
 */
const CentroMediacionGCC: React.FC = () => {
  const { expedientes, setExpedientes, setExpedienteSeleccionado } = useConvivencia();
  const { usuario } = useAuth();
  const { refresh: refreshGccMetrics } = useGccMetrics();
  const toast = useToast();

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
    showCierreModal
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

  return (
    <main className="flex-1 p-4 md:p-8 space-y-6 bg-slate-50/50 overflow-y-auto">
      
      {/* Container Principal */}
      <div className="w-full space-y-6">
        
        {/* Encabezado Minimalista */}
        <section className="space-y-2">
          <div className="flex items-baseline gap-2">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Centro de Mediación Escolar
            </h1>
            <span className="text-sm text-slate-500 font-medium">(GCC)</span>
          </div>
          <p className="text-sm text-slate-600">
            Gestión colaborativa de conflictos | Circular 782 - Enfoque formativo y restaurativo
          </p>
        </section>

        {/* Layout Principal: Tabla + Sidebar */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          
          {/* Columna Principal: Tabla de Casos */}
          <section className="md:col-span-2 xl:col-span-3 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="p-3 md:p-4 lg:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3 bg-slate-50/40">
              <h2 className="text-sm md:text-base font-bold text-slate-900 uppercase tracking-tight">
                Casos en Proceso
              </h2>
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
                  onSelectCase={handleSelectCase}
                />
              </React.Profiler>
            ) : (
              <GccCasosPanel
                casosParaGCC={casosParaGCC}
                casosConDerivacion={casosConDerivacion}
                selectedCaseId={selectedCaseId}
                onSelectCase={handleSelectCase}
              />
            )}
          </section>

          {/* Columna Secundaria: Controles Compactos */}
          <aside className="md:col-span-1 xl:col-span-1 space-y-3 md:space-y-4">
            
            {/* Selector de Mecanismo */}
            {selectedCaseId && (
              <GccMechanismSelector
                value={mecanismoSeleccionado}
                onChange={cambiarMecanismo}
              />
            )}

            {/* Resumen de Caso Seleccionado */}
            {casoSeleccionado && selectedCaseId && (
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
                  <span className={`inline-block px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg text-xs font-bold uppercase tracking-tight mt-1 ${
                    casoSeleccionado.etapa === 'CERRADO_GCC' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {casoSeleccionado.etapa === 'CERRADO_GCC' ? 'En GCC' : 'Disponible'}
                  </span>
                </div>
              </div>
            )}

            {/* Placeholder cuando no hay selección */}
            {!selectedCaseId && (
              <div className="bg-slate-100 rounded-xl md:rounded-2xl border border-slate-200 p-3 md:p-4 text-center space-y-2">
                <p className="text-xs md:text-sm font-bold text-slate-900">Selecciona un caso</p>
                <p className="text-xs text-slate-500">para habilitar controles</p>
              </div>
            )}
          </aside>
        </div>

        {/* Panel de Trabajo: Full Width cuando hay caso y mecanismo */}
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
                <h2 className="text-base md:text-lg font-bold text-slate-900 uppercase tracking-tight mb-4 md:mb-6">
                  Proceso de Mediación
                </h2>
                {perfEnabled ? (
                  <React.Profiler id="GCC/PanelRouter" onRender={onPanelRouterRender}>
                    <GccPanelRouter {...panelRouterProps} />
                  </React.Profiler>
                ) : (
                  <GccPanelRouter {...panelRouterProps} />
                )}
              </>
            )}
          </section>
        )}
      
      {/* Modal de Cierre GCC */}
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
    </div>
    </main>
  );
};

export default CentroMediacionGCC;
