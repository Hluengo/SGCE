# AUDITORIA RESPONSIVE AUTOMATICA (2026-02-23)

## Patrones: elementos fixed
src\App.tsx:172:                    className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-slate-900 text-xs font-black text-center py-2"
src\features\admin\components\SuperAdminProfilePanels.tsx:431:    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
src\features\admin\components\SuperAdminLayoutPieces.tsx:163:  <div className="fixed top-6 right-6 z-50 flex w-[min(92vw,24rem)] flex-col gap-2">
src\features\admin\BrandingConfigForm.tsx:548:      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
src\features\admin\BrandingConfigForm.tsx:558:    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
src\features\admin\AdminColegios.tsx:74:    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
src\features\admin\AdminColegios.tsx:233:    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
src\features\admin\AdminColegios.tsx:270:    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
src\features\documentos\components\OficioPreviewModal.tsx:81:    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
src\features\apoyo\SeguimientoApoyo.tsx:113:    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95">
src\features\dashboard\NuevaIntervencionModal.tsx:195:    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
src\features\dashboard\ReportePatioModal.tsx:176:    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
src\features\dashboard\NotificationsPanel.tsx:196:            className="fixed inset-0 z-40"
src\features\dashboard\RegistrarDerivacionModal.tsx:182:    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
src\shared\components\Sidebar.tsx:72:        className="lg:hidden fixed z-50 h-11 w-11 inline-flex items-center justify-center bg-slate-800 rounded-lg text-white shadow-lg"
src\shared\components\Sidebar.tsx:140:          className="lg:hidden fixed inset-0 bg-black/50 z-30"
src\features\evidencias\GestionEvidencias.tsx:469:          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
src\features\evidencias\GestionEvidencias.tsx:574:          className="fixed left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 md:px-10 py-4 md:py-5 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center gap-4 md:gap-10 animate-in slide-in-from-bottom-10 duration-500 z-40 border border-white/10 max-w-[calc(100vw-1rem)]"
src\features\evidencias\FormularioNuevaEvidencia.tsx:65:    <div className="fixed inset-0 z-[70] flex items-start md:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
src\features\expedientes\WorkflowSystem.tsx:176:    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
src\features\expedientes\ExpedienteResumenModal.tsx:389:    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
src\features\mediacion\GccCierreModal.tsx:801:    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
src\features\expedientes\DocumentosViewer.tsx:106:    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
src\features\expedientes\DocumentosViewer.tsx:193:    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
src\features\expedientes\DocumentManager.tsx:216:        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
src\features\expedientes\DocumentManager.tsx:239:        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
src\features\expedientes\ExpedienteTransitions.tsx:340:    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
src\features\expedientes\ExpedienteWizard.tsx:342:      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
src\shared\components\ui\Modal.tsx:114:      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
src\shared\components\Toast\ToastProvider.tsx:112:      className="fixed z-50 space-y-3 pointer-events-none"
src\features\legal\GeneradorResolucion.tsx:48:    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 p-4 md:p-10 overflow-y-auto">
src\features\legal\GeneradorResolucion.tsx:156:    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-hidden">
src\features\legal\LegalAssistant.tsx:33:    className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl shadow-blue-400 flex items-center justify-center hover:scale-110 transition-transform active:scale-95 z-[60] group"
src\features\legal\LegalAssistant.tsx:229:    <div className="fixed bottom-4 right-4 left-4 z-50 flex h-5/6 w-auto flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in slide-in-from-bottom-8 duration-300 md:bottom-6 md:right-6 md:left-auto md:h-3/4 md:w-96">
src\features\legal\CalendarioPlazosLegales.tsx:727:          className="pointer-events-none fixed z-[120] w-80 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_24px_48px_-16px_rgba(15,23,42,0.45)] backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150"
src\features\mediacion\components\RealtimeIndicators.tsx:121:      className="fixed bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded shadow-lg animate-slideIn max-w-[min(26rem,calc(100vw-1.5rem))]"
src\features\mediacion\components\WizardModal.tsx:106:    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

## Patrones: alturas no dinamicas / riesgo 100vh
src\features\admin\BrandingConfigForm.tsx:559:      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-screen overflow-y-auto">
src\features\UnauthorizedPage.tsx:10:    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
src\features\home\InicioPage.tsx:10:    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#0f172a_0%,_#111827_40%,_#020617_100%)] text-slate-100">
src\features\auth\AuthPage.tsx:136:    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#0f172a_0%,_#111827_40%,_#020617_100%)] text-slate-100">
src\features\auth\AuthPage.tsx:137:      <div className="min-h-screen w-full grid lg:grid-cols-[1.15fr_0.85fr]">
src\features\dashboard\ReportePatioModal.tsx:177:      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 max-h-screen overflow-y-auto">
src\features\dashboard\RegistrarDerivacionModal.tsx:183:      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 max-h-screen overflow-y-auto">
src\features\dashboard\NuevaIntervencionModal.tsx:196:      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 max-h-screen overflow-y-auto">
src\features\evidencias\FormularioNuevaEvidencia.tsx:66:      <div className="bg-white w-full max-w-2xl max-h-screen rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
src\features\legal\GeneradorResolucion.tsx:49:      <div className="relative w-full max-w-4xl min-h-screen bg-white p-6 font-serif text-slate-900 shadow-2xl md:p-24">
src\features\expedientes\DocumentManager.tsx:217:          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-screen flex flex-col">
src\features\documentos\components\OficioPreviewModal.tsx:82:      <div className="bg-white w-full max-w-5xl max-h-screen rounded-3xl shadow-2xl flex flex-col overflow-hidden">
src\features\expedientes\ExpedienteResumenModal.tsx:412:        <div className="p-6 max-h-screen overflow-y-auto">
src\features\mediacion\GccCierreModal.tsx:802:      <div className="w-full max-w-2xl max-h-screen overflow-y-auto rounded-lg bg-white shadow-xl">
src\shared\components\auth\RequireAuth.tsx:15:      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-200">
src\features\mediacion\components\WizardModal.tsx:107:      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-screen overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
src\features\expedientes\ExpedienteWizard.tsx:344:      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-screen">

## Patrones: grids densas (>=3 columnas)
src\features\archivo\ArchivoDocumental.tsx:115:        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
src\features\dashboard\EstadisticasConvivencia.tsx:54:      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
src\features\dashboard\EstadisticasConvivencia.tsx:152:      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
src\features\dashboard\EstadisticasConvivencia.tsx:221:                <div className="grid grid-cols-3 gap-2 pt-2">
src\features\dashboard\DashboardAuditoriaSIE.tsx:84:      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
src\features\bitacora\BitacoraSalida.tsx:104:                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
src\features\auth\AuthPage.tsx:171:            <div className="grid grid-cols-3 gap-2 bg-slate-800/70 p-1.5 rounded-2xl text-xs font-black uppercase tracking-wider" role="tablist" aria-label="Opciones de acceso">
src\features\expedientes\ExpedientesList.tsx:162:      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
src\features\expedientes\ExpedientesList.tsx:296:    <div className="hidden md:grid md:grid-cols-6 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200">
src\features\expedientes\ExpedientesList.tsx:330:              className="group grid grid-cols-1 md:grid-cols-6 gap-4 px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
src\features\evidencias\GestionEvidencias.tsx:392:          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
src\features\expedientes\ExpedienteResumenModal.tsx:160:    <div className="grid grid-cols-4 gap-4">
src\features\expedientes\ExpedienteDetalle.tsx:827:        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
src\features\expedientes\ReportsExpedientes.tsx:74:      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
src\features\expedientes\ReportsExpedientes.tsx:81:      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
src\features\expedientes\ReportsExpedientes.tsx:90:        <div className="p-6 grid grid-cols-4 gap-4">
src\features\expedientes\ExpedienteForm.tsx:577:              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
src\features\expedientes\wizard\WizardStep1Clasificacion.tsx:56:            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
src\features\expedientes\ExpedienteDetail.tsx:174:                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
src\features\expedientes\ExpedienteDetail.tsx:200:                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
src\features\expedientes\ExpedienteDetail.tsx:227:                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
src\features\admin\components\SuperAdminProfilePanels.tsx:234:      <div className="mt-2 grid gap-2 md:grid-cols-4">
src\features\admin\components\SuperAdminProfilePanels.tsx:329:        <div className="grid grid-cols-3 gap-2">
src\features\admin\components\SuperAdminLayoutPieces.tsx:62:    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
src\features\admin\components\SuperAdminLayoutPieces.tsx:67:    <div className="grid xl:grid-cols-3 gap-6">
src\features\admin\components\SuperAdminLayoutPieces.tsx:94:  <section className="grid md:grid-cols-2 xl:grid-cols-6 gap-4">
src\features\legal\CalendarioPlazosLegales.tsx:684:            <div className="bg-slate-200 grid grid-cols-7 gap-px rounded-3xl border border-slate-200 overflow-hidden shadow-2xl min-w-full">
src\features\admin\AdminColegios.tsx:405:  <div className="grid gap-4 md:grid-cols-3">
src\features\admin\AdminColegios.tsx:610:    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
src\features\mediacion\components\GccArbitrajePanel.tsx:287:            <div className="grid grid-cols-3 gap-2">
src\features\mediacion\components\GccArbitrajePanel.tsx:475:            <div className="grid grid-cols-3 gap-4">
src\features\mediacion\components\GccCompromisos.tsx:164:        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
src\features\admin\configStudio\BackendConfigStudio.tsx:958:        <div className="grid lg:grid-cols-4 gap-4">
src\features\admin\configStudio\BackendConfigStudio.tsx:1092:        <div className="grid md:grid-cols-3 gap-2">
src\features\admin\configStudio\BackendConfigStudio.tsx:1215:          <div className="grid md:grid-cols-3 gap-4 text-xs">
src\features\mediacion\components\GccConciliacionPanel.tsx:203:            <div className="grid grid-cols-3 gap-2">
src\features\mediacion\components\GccConciliacionPanel.tsx:251:          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
src\features\mediacion\components\GccConciliacionPanel.tsx:462:            <div className="grid grid-cols-3 gap-4">
src\features\expedientes\CaseTimeline.tsx:139:        <div className="grid grid-cols-4 gap-3 text-center">
src\features\mediacion\components\GccDashboard.tsx:252:        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
src\features\mediacion\components\GccDashboard.tsx:303:        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 lg:gap-4 mb-4 md:mb-6">
src\features\mediacion\components\GccDashboard.tsx:331:        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
src\features\mediacion\components\GccDashboard.tsx:385:          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
src\features\mediacion\components\GccDashboard.tsx:470:        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
src\features\admin\SuperAdminPage.tsx:424:      <div className="grid xl:grid-cols-5 gap-4">
src\features\admin\SuperAdminPage.tsx:559:        <section className={`${SA_UI.section} xl:grid-cols-3`}>
src\features\mediacion\components\GccMetricsBar.tsx:114:      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
src\features\mediacion\components\GccMetricsBar.test.tsx:183:      expect(gridElement?.className).toContain('md:grid-cols-4'); // Desktop: 4 columnas
src\features\mediacion\components\GccNegociacionPanel.tsx:186:            <div className="grid grid-cols-3 gap-2">
src\features\mediacion\components\GccMediacionPanel.tsx:201:            <div className="grid grid-cols-3 gap-2">
src\features\mediacion\components\GccMediacionPanel.tsx:249:          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
src\features\mediacion\components\GccMediacionPanel.tsx:442:          <div className="grid grid-cols-3 gap-4">
src\features\mediacion\components\GccSalaMediacion.tsx:166:              <div className="grid grid-cols-3 gap-2">
src\features\mediacion\components\GccResultadoForm.tsx:47:        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
src\features\expedientes\DocumentManager.tsx:153:        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
src\shared\components\ImportarEstudiantes.tsx:406:          <div className="grid md:grid-cols-3 gap-3">
src\shared\components\Skeleton\Skeleton.tsx:44:      <div className="grid grid-cols-6 gap-4 px-6 py-4">
src\shared\components\Skeleton\Skeleton.tsx:51:        <div key={`row-${rowIndex}`} className="grid grid-cols-6 gap-4 px-6 py-4 border-t border-slate-100">
src\shared\components\Skeleton\Skeleton.tsx:96:    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="status" aria-label="Cargando estadísticas">
src\features\mediacion\CentroMediacionGCC.tsx:164:        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
src\features\patio\ListaReportesPatio.tsx:106:  <div className="grid grid-cols-4 gap-4 mb-8">

## Patrones: posibles touch-targets pequenos
src\features\derivacion\RegistrarDerivacion.tsx:177:            <ArrowRightCircle className="w-8 h-8 md:w-10 md:h-10" />
src\features\derivacion\RegistrarDerivacion.tsx:232:                    <div className="border border-slate-200 rounded-2xl overflow-hidden animate-in slide-in-from-top-2">
src\features\derivacion\RegistrarDerivacion.tsx:239:                            <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center"><span className="text-xs font-bold text-violet-600">{est.nombreCompleto.charAt(0)}</span></div>
src\features\derivacion\RegistrarDerivacion.tsx:252:                      <button type="button" onClick={handleClearEstudiante} className="p-2 hover:bg-violet-200 rounded-lg"><span className="text-xs">✕</span></button>
src\features\home\InicioPage.tsx:16:            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 hover:bg-cyan-300 transition-colors"
src\features\home\InicioPage.tsx:25:            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-300/40 bg-cyan-400/10 text-cyan-100 text-[10px] font-black uppercase tracking-widest">
src\features\home\InicioPage.tsx:50:                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/40 bg-cyan-400/15 px-4 py-3 text-xs font-black uppercase tracking-widest text-cyan-100 hover:bg-cyan-400/25 transition-colors"
src\features\auth\components\FeatureList.tsx:10:    <ul className={`grid gap-2 sm:grid-cols-2 text-sm text-slate-300 leading-snug ${className}`}>
src\features\auth\components\FeatureList.tsx:12:        <li key={text} className="flex gap-2 items-start">
src\features\auth\AuthPage.tsx:145:            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-300/40 bg-cyan-400/10 text-cyan-100 text-[10px] font-black uppercase tracking-widest">
src\features\auth\AuthPage.tsx:171:            <div className="grid grid-cols-3 gap-2 bg-slate-800/70 p-1.5 rounded-2xl text-xs font-black uppercase tracking-wider" role="tablist" aria-label="Opciones de acceso">
src\features\auth\AuthPage.tsx:297:                <div role="alert" aria-live="assertive" className="rounded-xl border border-rose-400/50 bg-rose-400/10 p-4 text-xs text-rose-100 flex gap-2 items-start">
src\features\auth\AuthPage.tsx:304:                <div role="status" aria-live="polite" className="rounded-xl border border-emerald-400/50 bg-emerald-400/10 p-4 text-xs text-emerald-100 flex gap-2 items-start">
src\features\expedientes\WorkflowSystem.tsx:74:          <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
src\features\expedientes\WorkflowSystem.tsx:88:            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><ChevronRight className="w-5 h-5" /></div>
src\features\expedientes\WorkflowSystem.tsx:94:          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Send className="w-5 h-5" /></div>
src\features\expedientes\WorkflowSystem.tsx:98:          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Bell className="w-5 h-5" /></div>
src\features\expedientes\WorkflowSystem.tsx:102:          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><User className="w-5 h-5" /></div>
src\features\expedientes\WorkflowSystem.tsx:114:                  <div className="flex items-center gap-2">
src\features\expedientes\WorkflowSystem.tsx:131:          <div className="flex flex-wrap gap-2">
src\features\expedientes\WorkflowSystem.tsx:134:                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100">
src\features\expedientes\WorkflowSystem.tsx:179:        <div className="flex gap-2 mb-4">
src\features\archivo\ArchivoDocumental.tsx:144:              <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Download className="w-4 h-4" /></button>
src\features\archivo\ArchivoDocumental.tsx:152:                  <div className="p-2 bg-slate-100 text-slate-400 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600">
src\features\archivo\ArchivoDocumental.tsx:162:                <button className="p-2 bg-slate-50 text-slate-300 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
src\features\apoyo\SeguimientoApoyo.tsx:127:            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X className="w-6 h-6" /></button>
src\features\apoyo\SeguimientoApoyo.tsx:291:      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
src\features\apoyo\SeguimientoApoyo.tsx:378:                  <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
src\features\dashboard\DashboardAuditoriaSIE.tsx:91:            <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${kpis.saludGlobal > 85 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
src\features\dashboard\DashboardAuditoriaSIE.tsx:105:              <div className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-red-200">
src\features\dashboard\DashboardAuditoriaSIE.tsx:129:            <div className="w-3 h-8 bg-slate-900 rounded-full"></div>
src\features\dashboard\DashboardAuditoriaSIE.tsx:134:            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-inner">
src\features\dashboard\DashboardAuditoriaSIE.tsx:166:                <div className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-tighter ${
src\features\dashboard\DashboardAuditoriaSIE.tsx:174:              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-black uppercase">
src\features\dashboard\DashboardAuditoriaSIE.tsx:175:                <div className={`px-2 py-1 rounded ${item.audit.notificacion ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>Notificación</div>
src\features\dashboard\DashboardAuditoriaSIE.tsx:176:                <div className={`px-2 py-1 rounded ${item.audit.descargos ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>Descargos</div>
src\features\dashboard\DashboardAuditoriaSIE.tsx:177:                <div className={`px-2 py-1 rounded ${item.audit.evidencias ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>Evidencias</div>
src\features\dashboard\DashboardAuditoriaSIE.tsx:178:                <div className={`px-2 py-1 rounded ${item.audit.resolucion ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>Resolución</div>
src\features\dashboard\DashboardAuditoriaSIE.tsx:238:                    <div className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-black uppercase tracking-tighter ${
src\features\dashboard\DashboardAuditoriaSIE.tsx:250:                      className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-900 hover:text-white transition-all group-hover:scale-110"
src\features\expedientes\wizard\WizardStudentSelector.tsx:134:              <div className="border border-slate-200 rounded-2xl overflow-hidden animate-in slide-in-from-top-2">
src\features\expedientes\wizard\WizardStudentSelector.tsx:171:                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
src\features\expedientes\wizard\WizardStudentSelector.tsx:193:                    className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
src\features\expedientes\wizard\WizardStep5Confirmar.tsx:89:              className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${
src\features\dashboard\Dashboard.tsx:41:      <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
src\features\dashboard\Dashboard.tsx:75:      {searchTerm ? <FilterX className="w-8 h-8" /> : <Files className="w-8 h-8" />}
src\features\dashboard\Dashboard.tsx:111:        <div className="w-3 h-8 bg-blue-600 rounded-full flex-shrink-0"></div>
src\features\dashboard\Dashboard.tsx:118:            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full hover:bg-blue-200 flex-shrink-0"
src\features\dashboard\Dashboard.tsx:175:                  <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2 md:px-3 py-1 rounded-lg md:rounded-xl border border-blue-100 whitespace-nowrap">
src\features\dashboard\Dashboard.tsx:209:                  <div className="flex items-center justify-end gap-1 md:gap-2">
src\features\dashboard\Dashboard.tsx:215:                      className="p-1.5 md:p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg md:rounded-xl transition-all flex-shrink-0"
src\features\dashboard\Dashboard.tsx:225:                      className="p-1.5 md:p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg md:rounded-xl transition-all flex-shrink-0"
src\features\dashboard\Dashboard.tsx:235:                      className="p-1.5 md:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg md:rounded-xl transition-all flex-shrink-0"
src\features\dashboard\Dashboard.tsx:245:                      className="inline-flex items-center justify-center w-8 md:w-10 h-8 md:h-10 text-blue-600 bg-blue-50 rounded-lg md:rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm group-hover:translate-x-1 flex-shrink-0"
src\features\expedientes\wizard\WizardStep4Plazos.tsx:92:          <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter border border-red-100">
src\features\expedientes\wizard\WizardStep2Gradualidad.tsx:72:          <AlertTriangle className="w-8 h-8 text-red-600 shrink-0" />
src\features\expedientes\wizard\WizardProgressBar.tsx:26:            className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-300 ${
src\features\expedientes\ReportsExpedientes.tsx:68:          <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg">
src\features\expedientes\ReportsExpedientes.tsx:111:        <div className={`p-2 rounded-lg ${color}`}><Icon className="w-5 h-5 text-white" /></div>
src\features\admin\SuperAdminPage.tsx:125:  buttonPrimary: 'inline-flex items-center justify-center gap-2 rounded-[0.75rem] bg-[var(--sa-primary)] px-4 py-2 text-[0.75rem] font-black uppercase tracking-[0.12em] text-white transition-all duration-200 ease-in-out hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 active:translate-y-[1px] disabled:opacity-50',
src\features\admin\SuperAdminPage.tsx:126:  buttonSecondary: 'inline-flex items-center justify-center gap-2 rounded-[0.75rem] border border-[var(--sa-border)] px-3 py-2 text-[0.75rem] font-black uppercase tracking-[0.12em] text-slate-700 transition-all duration-200 ease-in-out hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 active:translate-y-[1px] disabled:opacity-50',
src\features\admin\SuperAdminPage.tsx:127:  buttonAction: 'inline-flex items-center justify-center gap-2 rounded-[0.75rem] bg-[var(--sa-action)] px-3 py-2 text-[0.75rem] font-black uppercase tracking-[0.12em] text-white transition-all duration-200 ease-in-out hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-indigo-300 active:translate-y-[1px] disabled:opacity-50',
src\features\admin\SuperAdminPage.tsx:128:  buttonDanger: 'inline-flex items-center justify-center gap-2 rounded-[0.75rem] bg-rose-600 px-3 py-2 text-[0.75rem] font-black uppercase tracking-[0.12em] text-white transition-all duration-200 ease-in-out hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300 active:translate-y-[1px] disabled:opacity-50',
src\features\expedientes\ExpedienteTransitions.tsx:309:              <div className={`p-2 rounded-xl ${transicion.color} text-white`}>
src\features\expedientes\ExpedienteTransitions.tsx:344:            <div className="p-2 bg-white/20 rounded-xl">
src\features\expedientes\ExpedientesList.tsx:78:        <FileText className="w-8 h-8" />
src\features\expedientes\ExpedientesList.tsx:148:    <div className="flex items-center gap-2">
src\features\expedientes\ExpedientesList.tsx:151:        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
src\features\expedientes\ExpedientesList.tsx:162:      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
src\features\expedientes\ExpedientesList.tsx:342:                <div className="flex flex-col gap-1">
src\features\expedientes\ExpedientesList.tsx:358:                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
src\features\expedientes\ExpedientesList.tsx:377:                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${getGravedadColor(exp.gravedad)}`}>
src\features\expedientes\ExpedientesList.tsx:382:                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${getEstadoColor(exp.etapa)}`}>
src\features\expedientes\ExpedientesList.tsx:385:                <div className={`w-8 h-8 rounded-full ${plazo.color} flex items-center justify-center ml-2`}>
src\features\expedientes\ExpedientesList.tsx:395:                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
src\features\expedientes\ExpedientesList.tsx:405:                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
src\features\expedientes\ExpedientesList.tsx:415:                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
src\features\expedientes\ExpedientesList.tsx:445:          className="p-2 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
src\features\expedientes\ExpedientesList.tsx:477:          className="p-2 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
src\features\dashboard\ReportePatioModal.tsx:190:            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
src\features\dashboard\ReportePatioModal.tsx:245:                            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center"><span className="text-xs font-bold text-amber-600">{est.nombreCompleto.charAt(0)}</span></div>
src\features\dashboard\ReportePatioModal.tsx:258:                      <button type="button" onClick={handleClearEstudiante} className="p-2 hover:bg-amber-200 rounded-lg"><span className="text-xs">✕</span></button>
src\features\dashboard\ReportePatioModal.tsx:299:              <button type="submit" className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-500 flex items-center justify-center gap-2">
src\features\dashboard\RegistrarDerivacionModal.tsx:197:            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
src\features\dashboard\RegistrarDerivacionModal.tsx:256:                            <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center"><span className="text-xs font-bold text-violet-600">{est.nombreCompleto.charAt(0)}</span></div>
src\features\dashboard\RegistrarDerivacionModal.tsx:269:                      <button type="button" onClick={handleClearEstudiante} className="p-2 hover:bg-violet-200 rounded-lg"><span className="text-xs">✕</span></button>
src\features\dashboard\RegistrarDerivacionModal.tsx:317:              <button type="submit" className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-500 flex items-center justify-center gap-2">
src\features\dashboard\NuevaIntervencionModal.tsx:210:            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
src\features\dashboard\NuevaIntervencionModal.tsx:266:                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center"><span className="text-xs font-bold text-emerald-600">{est.nombreCompleto.charAt(0)}</span></div>
src\features\dashboard\NuevaIntervencionModal.tsx:279:                      <button type="button" onClick={handleClearEstudiante} className="p-2 hover:bg-emerald-200 rounded-lg"><span className="text-xs">✕</span></button>
src\features\dashboard\NuevaIntervencionModal.tsx:328:              <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-500 flex items-center justify-center gap-2">
src\features\admin\configStudio\BackendConfigStudio.tsx:919:          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
src\features\admin\configStudio\BackendConfigStudio.tsx:926:        <div className="flex flex-wrap items-center gap-2">
src\features\admin\configStudio\BackendConfigStudio.tsx:961:            <div className="grid grid-cols-2 gap-2">
src\features\admin\configStudio\BackendConfigStudio.tsx:1003:          <div className="flex items-center gap-2">
src\features\admin\configStudio\BackendConfigStudio.tsx:1012:          <div className="flex flex-wrap gap-2">
src\features\admin\configStudio\BackendConfigStudio.tsx:1015:              className="px-3 py-1.5 rounded-lg border border-violet-300 text-xs font-black uppercase tracking-widest text-violet-800 hover:bg-violet-100"
src\features\admin\configStudio\BackendConfigStudio.tsx:1021:              className="px-3 py-1.5 rounded-lg border border-violet-300 text-xs font-black uppercase tracking-widest text-violet-800 hover:bg-violet-100"
src\features\admin\configStudio\BackendConfigStudio.tsx:1027:              className="px-3 py-1.5 rounded-lg border border-violet-300 text-xs font-black uppercase tracking-widest text-violet-800 hover:bg-violet-100"
src\features\admin\configStudio\BackendConfigStudio.tsx:1034:              className="px-3 py-1.5 rounded-lg bg-violet-700 text-white text-xs font-black uppercase tracking-widest hover:bg-violet-800 disabled:opacity-50"
src\features\admin\configStudio\BackendConfigStudio.tsx:1041:              className="px-3 py-1.5 rounded-lg bg-cyan-700 text-white text-xs font-black uppercase tracking-widest hover:bg-cyan-800 disabled:opacity-50"
src\features\admin\configStudio\BackendConfigStudio.tsx:1046:          <div className="flex gap-2">
src\features\admin\configStudio\BackendConfigStudio.tsx:1080:      <div className="flex flex-wrap gap-2">
src\features\admin\configStudio\BackendConfigStudio.tsx:1092:        <div className="grid md:grid-cols-3 gap-2">
src\features\admin\configStudio\BackendConfigStudio.tsx:1094:            <div key={item.field} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
src\features\admin\configStudio\BackendConfigStudio.tsx:1104:      <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs text-cyan-900 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
src\features\admin\configStudio\BackendConfigStudio.tsx:1106:          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
src\features\admin\configStudio\BackendConfigStudio.tsx:1111:            <div className="flex gap-2">
src\features\admin\configStudio\BackendConfigStudio.tsx:1115:                className="px-3 py-1.5 rounded-lg border border-cyan-300 text-xs font-black uppercase tracking-widest disabled:opacity-40"
src\features\admin\configStudio\BackendConfigStudio.tsx:1122:                className="px-3 py-1.5 rounded-lg bg-cyan-700 text-white text-xs font-black uppercase tracking-widest disabled:opacity-40"
src\features\admin\configStudio\BackendConfigStudio.tsx:1128:          <div className="flex items-center gap-2">
src\features\admin\configStudio\BackendConfigStudio.tsx:1139:          <div className="flex flex-wrap gap-2">
src\features\admin\configStudio\BackendConfigStudio.tsx:1143:                className={`px-2 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
src\features\admin\configStudio\BackendConfigStudio.tsx:1153:          <div className="rounded-lg border border-cyan-200 bg-white/70 p-2">
src\features\admin\configStudio\BackendConfigStudio.tsx:1182:            <div className="grid grid-cols-2 gap-2 text-xs">
src\features\admin\configStudio\BackendConfigStudio.tsx:1183:              <label className="flex items-center gap-2"><input type="checkbox" checked={tableDraft.createIfMissing} onChange={(e) => setState((current) => ({ ...current, tables: [{ ...tableDraft, createIfMissing: e.target.checked }] }))} />Crear si no existe</label>
src\features\admin\configStudio\BackendConfigStudio.tsx:1184:              <label className="flex items-center gap-2"><input type="checkbox" checked={tableDraft.enableRls} onChange={(e) => setState((current) => ({ ...current, tables: [{ ...tableDraft, enableRls: e.target.checked }] }))} />Habilitar RLS</label>
src\features\admin\configStudio\BackendConfigStudio.tsx:1216:            <label className="space-y-1"><span>Min password</span><input type="number" min={8} value={state.auth.passwordMinLength} onChange={(e) => setState((current) => ({ ...current, auth: { ...current.auth, passwordMinLength: Number(e.target.value) || 8 } }))} className="w-full rounded-lg border border-slate-300 px-2 py-1.5" /></label>
src\features\admin\configStudio\BackendConfigStudio.tsx:1217:            <label className="space-y-1"><span>Timeout sesion</span><input type="number" min={30} value={state.auth.sessionTimeoutMinutes} onChange={(e) => setState((current) => ({ ...current, auth: { ...current.auth, sessionTimeoutMinutes: Number(e.target.value) || 30 } }))} className="w-full rounded-lg border border-slate-300 px-2 py-1.5" /></label>
src\features\admin\configStudio\BackendConfigStudio.tsx:1218:            <label className="space-y-1"><span>Rate limit/min</span><input type="number" min={10} value={state.api.rateLimitPerMinute} onChange={(e) => setState((current) => ({ ...current, api: { ...current.api, rateLimitPerMinute: Number(e.target.value) || 10 } }))} className="w-full rounded-lg border border-slate-300 px-2 py-1.5" /></label>
src\features\admin\configStudio\BackendConfigStudio.tsx:1220:          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={state.auth.requireMfaAdmins} onChange={(e) => setState((current) => ({ ...current, auth: { ...current.auth, requireMfaAdmins: e.target.checked } }))} />MFA obligatorio admins</label>
src\features\admin\configStudio\BackendConfigStudio.tsx:1273:            <button onClick={() => void loadHistory()} disabled={loadingHistory} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-100 disabled:opacity-50">
src\features\admin\configStudio\BackendConfigStudio.tsx:1299:                  <tr><th className="p-2 text-left">Selección</th><th className="p-2 text-left">Título</th><th className="p-2 text-left">Alcance</th><th className="p-2 text-left">Estado</th></tr>
src\features\admin\configStudio\BackendConfigStudio.tsx:1304:                      <td className="p-2"><input type="radio" checked={selectedChangesetId === item.id} onChange={() => setSelectedChangesetId(item.id)} /></td>
src\features\admin\configStudio\BackendConfigStudio.tsx:1305:                      <td className="p-2"><p className="font-bold text-slate-700">{item.title}</p><p className="text-slate-500">{item.id}</p>{item.error_text && <p className="text-rose-600">{item.error_text}</p>}</td>
src\features\admin\configStudio\BackendConfigStudio.tsx:1306:                      <td className="p-2 text-slate-600">{item.scope === 'global' ? 'Global (todos)' : 'Por colegio'}</td>
src\features\admin\configStudio\BackendConfigStudio.tsx:1307:                      <td className="p-2"><span className={`px-2 py-1 rounded-full font-black uppercase text-xs ${statusBadge[item.status]}`}>{statusLabel[item.status]}</span></td>
src\features\admin\configStudio\BackendConfigStudio.tsx:1314:          <div className="flex flex-wrap gap-2">
src\features\admin\configStudio\BackendConfigStudio.tsx:1315:            <button onClick={() => void applySelectedChangeset()} disabled={!selectedChangesetId || executing} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 flex items-center gap-2"><Play className="w-3.5 h-3.5" />Aplicar</button>
src\features\admin\configStudio\BackendConfigStudio.tsx:1316:            <button onClick={() => void revertSelectedChangeset()} disabled={!selectedChangesetId || executing} className="px-3 py-2 rounded-xl bg-amber-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 flex items-center gap-2"><RotateCcw className="w-3.5 h-3.5" />Revertir</button>
src\features\admin\configStudio\BackendConfigStudio.tsx:1327:          {generated.impactPreview.warnings.map((warning) => <p key={warning} className="text-amber-700 flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 mt-0.5" />{warning}</p>)}
src\features\admin\configStudio\BackendConfigStudio.tsx:1328:          {serverValidation?.ok && <p className="text-emerald-700 font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Validacion correcta.</p>}
src\features\dashboard\NotificationsPanel.tsx:181:        className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
src\features\dashboard\NotificationsPanel.tsx:185:          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center">
src\features\dashboard\NotificationsPanel.tsx:210:          <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
src\features\dashboard\NotificationsPanel.tsx:214:                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
src\features\dashboard\NotificationsPanel.tsx:238:                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
src\features\dashboard\NotificationsPanel.tsx:261:                          <div className={`p-2 rounded-xl ${getPrioridadColor(notificacion.prioridad)}`}>
src\features\dashboard\NotificationsPanel.tsx:271:                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
src\features\dashboard\EstadisticasConvivencia.tsx:109:      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide mb-1">
src\features\dashboard\EstadisticasConvivencia.tsx:195:                  <div className="flex h-2 gap-1 rounded-full overflow-hidden bg-slate-200">
src\features\dashboard\EstadisticasConvivencia.tsx:221:                <div className="grid grid-cols-3 gap-2 pt-2">
src\features\dashboard\EstadisticasConvivencia.tsx:222:                  <div className="bg-emerald-50 rounded-lg p-2 text-center border border-emerald-100">
src\features\dashboard\EstadisticasConvivencia.tsx:230:                  <div className="bg-amber-50 rounded-lg p-2 text-center border border-amber-100">
src\features\dashboard\EstadisticasConvivencia.tsx:238:                  <div className="bg-red-50 rounded-lg p-2 text-center border border-red-100">
src\features\dashboard\EstadisticasConvivencia.tsx:250:                  <div className="flex items-center justify-center gap-1 pt-2 border-t border-blue-100">
src\features\expedientes\DocumentManager.tsx:127:        <div className="flex items-center gap-2">
src\features\expedientes\DocumentManager.tsx:128:          <div className="flex bg-slate-100 rounded-lg p-1">
src\features\expedientes\DocumentManager.tsx:137:            <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700">
src\features\expedientes\DocumentManager.tsx:160:                  <div className={`p-2 rounded-lg ${info.color.replace('text-', 'bg-').replace('600', '100')}`}>
src\features\expedientes\DocumentManager.tsx:163:                  <div className="flex gap-1">
src\features\expedientes\DocumentManager.tsx:164:                    <button onClick={() => setUiState(prev => ({ ...prev, selectedDoc: doc }))} className="p-1 hover:bg-slate-100 rounded"><Eye className="w-4 h-4" /></button>
src\features\expedientes\DocumentManager.tsx:165:                    <button onClick={() => handleDownload(doc)} className="p-1 hover:bg-slate-100 rounded"><Download className="w-4 h-4" /></button>
src\features\expedientes\DocumentManager.tsx:166:                    {puedeEliminar && <button onClick={() => handleDelete(doc.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-500" /></button>}
src\features\expedientes\DocumentManager.tsx:198:                    <td className="px-4 py-3"><span className="px-2 py-1 bg-slate-100 rounded-full text-xs">{TIPO_LABELS[doc.tipo]}</span></td>
src\features\expedientes\DocumentManager.tsx:201:                      <div className="flex justify-end gap-1">
src\features\expedientes\DocumentManager.tsx:220:              <div className="flex items-center gap-2">
src\features\expedientes\DocumentManager.tsx:221:                <button onClick={() => handleDownload(selectedDoc)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg"><Download className="w-4 h-4" />Descargar</button>
src\features\expedientes\DocumentManager.tsx:222:                <button onClick={() => setUiState(prev => ({ ...prev, selectedDoc: null }))} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
src\features\admin\components\SuperAdminProfilePanels.tsx:116:      <div className="grid grid-cols-2 gap-2">
src\features\admin\components\SuperAdminProfilePanels.tsx:134:            <th className="p-2 text-left">Usuario</th>
src\features\admin\components\SuperAdminProfilePanels.tsx:135:            <th className="p-2 text-left">Rol</th>
src\features\admin\components\SuperAdminProfilePanels.tsx:136:            <th className="p-2 text-left">Estado</th>
src\features\admin\components\SuperAdminProfilePanels.tsx:137:            <th className="p-2 text-left">Acciones</th>
src\features\admin\components\SuperAdminProfilePanels.tsx:143:              <td className="p-2">
src\features\admin\components\SuperAdminProfilePanels.tsx:147:              <td className="p-2">
src\features\admin\components\SuperAdminProfilePanels.tsx:152:              <td className="p-2">
src\features\admin\components\SuperAdminProfilePanels.tsx:157:              <td className="p-2">
src\features\admin\components\SuperAdminProfilePanels.tsx:158:                <div className="flex flex-wrap gap-1">
src\features\admin\components\SuperAdminProfilePanels.tsx:172:      <div className="flex gap-2">
src\features\admin\components\SuperAdminProfilePanels.tsx:234:      <div className="mt-2 grid gap-2 md:grid-cols-4">
src\features\admin\components\SuperAdminProfilePanels.tsx:264:        <div className="flex flex-col md:flex-row gap-2">
src\features\admin\components\SuperAdminProfilePanels.tsx:327:      <div className="mb-3 rounded-xl border border-slate-200 bg-white p-2">
src\features\admin\components\SuperAdminProfilePanels.tsx:329:        <div className="grid grid-cols-3 gap-2">
src\features\admin\components\SuperAdminProfilePanels.tsx:335:              className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all ${
src\features\admin\components\SuperAdminProfilePanels.tsx:357:            <div className="grid md:grid-cols-2 gap-2">
src\features\admin\components\SuperAdminProfilePanels.tsx:372:                    <div className="flex items-start gap-2">
src\features\admin\components\SuperAdminProfilePanels.tsx:375:                        <div className="flex items-center gap-2">
src\features\admin\components\SuperAdminProfilePanels.tsx:415:        <p className={`inline-flex items-center gap-1 rounded-[0.75rem] px-3 py-2 text-xs ${statusTone === 'error' ? 'bg-rose-50 text-rose-700' : statusTone === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}`}>
src\features\admin\components\SuperAdminProfilePanels.tsx:440:        <div className="flex justify-end gap-2">
src\features\admin\components\SuperAdminOverviewPanels.tsx:88:                  <span className={`px-2 py-1 rounded-full text-xs font-black uppercase ${tenant.activo === false ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
src\features\admin\components\SuperAdminOverviewPanels.tsx:183:      <div className="grid grid-cols-2 gap-2">
src\features\admin\components\SuperAdminOverviewPanels.tsx:194:            <span className={`px-2 py-1 rounded-full uppercase font-black ${log.status === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
src\features\admin\components\SuperAdminOverviewPanels.tsx:204:      <p className="font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Settings2 className="w-4 h-4 text-indigo-600" />Arquitectura</p>
src\features\admin\components\SuperAdminOverviewPanels.tsx:211:      <p className="font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Wrench className="w-4 h-4 text-indigo-600" />Backend</p>
src\features\admin\components\SuperAdminOverviewPanels.tsx:212:      <p className="flex items-center gap-2"><Database className="w-3 h-3" />Listo para rotacion de claves, politicas de retencion y tareas operativas.</p>
src\features\admin\components\SuperAdminLayoutPieces.tsx:138:  <nav className={`${ui.card} p-2 flex flex-wrap gap-2`} aria-label="Secciones de administración">
src\features\admin\components\SuperAdminLayoutPieces.tsx:163:  <div className="fixed top-6 right-6 z-50 flex w-[min(92vw,24rem)] flex-col gap-2">
src\features\admin\components\SuperAdminLayoutPieces.tsx:174:        <span className="inline-flex items-center gap-2 font-bold">
src\features\bitacora\BitacoraSalida.tsx:62:            <DoorOpen className="w-8 h-8 md:w-10 md:h-10" />
src\features\bitacora\BitacoraSalida.tsx:111:                    <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-500 uppercase tracking-tighter">
src\features\bitacora\BitacoraSalida.tsx:121:                    <button className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all">
src\shared\components\PageTitleHeader.tsx:23:          <Icon className="h-8 w-8" />
src\shared\components\PageTitleHeader.tsx:34:      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
src\features\bitacora\BitacoraPsicosocial.tsx:261:          <div className="flex items-center space-x-1.5 bg-indigo-800 px-3 py-1 rounded-full">
src\features\bitacora\BitacoraPsicosocial.tsx:347:                  <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600"><Filter className="w-4 h-4" /></button>
src\features\bitacora\BitacoraPsicosocial.tsx:374:                      <button className="p-2 text-slate-300 hover:text-slate-600"><MoreVertical className="w-4 h-4" /></button>
src\features\bitacora\BitacoraPsicosocial.tsx:427:                      <div className="flex items-center gap-2">
src\features\bitacora\BitacoraPsicosocial.tsx:428:                        <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${der.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
src\features\bitacora\BitacoraPsicosocial.tsx:449:                    <Plus className="w-8 h-8" />
src\shared\components\ImportarEstudiantes.tsx:319:          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
src\shared\components\ImportarEstudiantes.tsx:327:          className="flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
src\shared\components\ImportarEstudiantes.tsx:334:      <div className="inline-flex rounded-lg bg-slate-900 p-1 mb-4 border border-slate-700">
src\shared\components\ImportarEstudiantes.tsx:337:          className={`px-3 py-1.5 rounded-md text-sm ${mode === 'csv' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
src\shared\components\ImportarEstudiantes.tsx:343:          className={`px-3 py-1.5 rounded-md text-sm ${mode === 'manual' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
src\shared\components\ImportarEstudiantes.tsx:358:            <p key={i} className="text-sm text-red-400 flex items-center gap-2">
src\shared\components\ImportarEstudiantes.tsx:427:            <label className="flex items-center gap-2">
src\shared\components\ImportarEstudiantes.tsx:435:            <label className="flex items-center gap-2">
src\shared\components\ImportarEstudiantes.tsx:445:              className="ml-auto flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
src\shared\components\ImportarEstudiantes.tsx:460:              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
src\shared\components\ImportarEstudiantes.tsx:485:                        <span className="flex items-center gap-1 text-green-400">
src\shared\components\ImportarEstudiantes.tsx:489:                        <span className="text-red-400 text-xs flex items-center gap-1">
src\shared\components\ImportarEstudiantes.tsx:506:                flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all
src\shared\components\ImportarEstudiantes.tsx:529:        <div className="mt-4 text-xs text-slate-500 flex items-center gap-2">
src\shared\components\Header.tsx:36:      <div className="flex items-center flex-wrap gap-2">
src\shared\components\Header.tsx:38:        <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 uppercase">
src\shared\components\Header.tsx:44:        <div className="flex items-center text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 font-bold uppercase tracking-tighter">
src\shared\components\ui\Spinner.tsx:36:    md: 'w-8 h-8',
src\shared\components\EstudianteBadge.tsx:50:      badge: 'px-2.5 py-1 text-sm'
src\shared\components\EstudianteBadge.tsx:62:    <div className={`flex items-center gap-2 ${className}`}>
src\shared\components\EstudianteBadge.tsx:81:      <div className="flex gap-1 flex-shrink-0">
src\shared\components\ui\Modal.tsx:141:              className="inline-flex items-center justify-center min-h-11 min-w-11 p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 active:scale-95"
src\features\evidencias\GestionEvidencias.tsx:72:  8: 'w-8 h-8',
src\features\evidencias\GestionEvidencias.tsx:334:              <Upload className="w-8 h-8" />
src\features\evidencias\GestionEvidencias.tsx:414:                  className={`absolute top-6 left-6 z-10 p-2 rounded-xl border-2 transition-all ${
src\features\evidencias\GestionEvidencias.tsx:441:                       <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-tight">{ev.tipo}</span>
src\features\evidencias\GestionEvidencias.tsx:445:                    <p className="text-xs text-slate-400 font-bold mt-1 line-clamp-2 leading-relaxed">{ev.descripcion}</p>
src\features\evidencias\GestionEvidencias.tsx:495:              <button onClick={() => setSelectedEvidenciaId(null)} className="min-h-11 min-w-11 inline-flex items-center justify-center p-2 text-slate-300 hover:bg-slate-100 rounded-full transition-all">
src\shared\components\ui\Button.tsx:106:    sm: 'px-3 py-1.5 text-xs rounded-lg',
src\shared\components\ui\Badge.tsx:57:    md: 'px-3 py-1 text-xs',
src\features\evidencias\FormularioNuevaEvidencia.tsx:77:          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 text-slate-400">
src\features\evidencias\FormularioNuevaEvidencia.tsx:90:            <div className="flex items-center text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
src\shared\components\Breadcrumb\Breadcrumb.tsx:66:    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
src\shared\components\Breadcrumb\Breadcrumb.tsx:67:      <ol className="flex items-center gap-1 list-none m-0 p-0">
src\shared\components\Breadcrumb\Breadcrumb.tsx:72:            <li key={item.path || index} className="flex items-center gap-1">
src\shared\components\Breadcrumb\Breadcrumb.tsx:113:    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
src\shared\components\Breadcrumb\Breadcrumb.tsx:114:      <ol className="flex items-center gap-1 list-none m-0 p-0">
src\shared\components\Breadcrumb\Breadcrumb.tsx:128:            <li key={item.path || index} className="flex items-center gap-1">
src\shared\components\ui\Alert.tsx:93:      <div className={`shrink-0 p-2 rounded-lg ${style.iconBg}`}>
src\shared\components\ui\Alert.tsx:109:          className="shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors"
src\shared\components\Toast\ToastProvider.tsx:96:        className={`flex-shrink-0 min-h-11 min-w-11 inline-flex items-center justify-center p-1 rounded-lg hover:bg-black/5 transition-colors ${styles.icon}`}
src\shared\components\TenantSelector.tsx:62:        <div className="flex items-center gap-2 text-slate-400">
src\shared\components\TenantSelector.tsx:74:        <div className="flex items-center gap-2 text-slate-300">
src\shared\components\TenantSelector.tsx:90:          w-full min-h-11 flex items-center justify-between gap-2 px-3 py-2 rounded-lg
src\shared\components\TenantSelector.tsx:101:        <div className="flex items-center gap-2 min-w-0 flex-1">
src\shared\components\TenantSelector.tsx:115:          className="mt-2 py-1 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden"
src\shared\components\TenantSelector.tsx:128:                  w-full min-h-11 flex items-center justify-between gap-2 px-3 py-2.5 text-sm
src\shared\components\AssistantButton.tsx:57:        flex items-center gap-2
src\shared\components\Sidebar.tsx:116:            className="hidden lg:inline-flex items-center justify-center min-h-11 min-w-11 p-2 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
src\shared\components\Sidebar\SidebarProfile.tsx:52:          className="w-full min-h-11 flex justify-center items-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
src\shared\components\Sidebar\SidebarProfile.tsx:66:          className="w-full min-h-11 flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors"
src\shared\components\Sidebar\SidebarProfile.tsx:83:              <div className="flex items-center gap-2 mb-2 text-slate-300">
src\shared\components\Sidebar\SidebarProfile.tsx:94:                  className="w-full px-3 py-1.5 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
src\shared\components\Sidebar\SidebarProfile.tsx:99:                  className="w-full min-h-11 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
src\shared\components\Sidebar\SidebarProfile.tsx:113:              className="w-full min-h-11 flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
src\features\expedientes\BitacoraList.tsx:93:    <div className={`p-2 rounded-xl border-2 ${colorClass}`}>
src\features\expedientes\BitacoraList.tsx:195:                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
src\shared\components\PlazoCounter.tsx:22:    <div className={`inline-flex items-center px-2 py-1 rounded-md border text-xs font-semibold ${getUrgencyColor()}`}>
src\features\expedientes\CaseTimeline.tsx:75:      <div className="flex flex-wrap gap-2">
src\features\expedientes\CaseTimeline.tsx:77:          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterTipo === 'todos' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
src\features\expedientes\CaseTimeline.tsx:82:            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filterTipo === tipo ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
src\features\expedientes\CaseTimeline.tsx:112:                    <div className="flex items-center gap-2 mb-2">
src\features\expedientes\CaseTimeline.tsx:128:            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
src\features\documentos\components\OficioPreviewModal.tsx:95:          <div className="flex items-center gap-2">
src\features\documentos\components\OficioPreviewModal.tsx:99:              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-indigo-700 transition-colors disabled:opacity-50"
src\features\documentos\components\OficioPreviewModal.tsx:115:              className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase hover:bg-slate-300 transition-colors"
src\features\documentos\components\OficioPreviewModal.tsx:122:              className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
src\features\expedientes\DocumentosViewer.tsx:120:            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
src\features\expedientes\DocumentosViewer.tsx:199:            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
src\features\expedientes\DocumentosViewer.tsx:210:            <div className="grid grid-cols-2 gap-2">
src\features\expedientes\DocumentosViewer.tsx:254:                <CheckCircle className="w-8 h-8 text-emerald-500" />
src\features\expedientes\DocumentosViewer.tsx:264:                  className="p-1 text-slate-400 hover:text-red-500"
src\features\expedientes\DocumentosViewer.tsx:388:                <div className={`p-2 rounded-xl ${getTipoColor(doc.tipo)}`}>
src\features\expedientes\DocumentosViewer.tsx:407:                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
src\features\expedientes\DocumentosViewer.tsx:414:                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
src\features\expedientes\DocumentosViewer.tsx:421:                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
src\features\expedientes\ExpedienteDetalle.tsx:650:                  <span className="px-2 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-indigo-100 text-indigo-700 border border-indigo-200">
src\features\expedientes\ExpedienteDetalle.tsx:681:        <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 w-fit">
src\features\expedientes\ExpedienteDetalle.tsx:693:            <span className="flex items-center gap-2">
src\features\expedientes\ExpedienteDetalle.tsx:710:              <span className="flex items-center gap-2">
src\features\expedientes\ExpedienteDetalle.tsx:951:                      <div className="flex items-center gap-2">
src\features\expedientes\ExpedienteDetalle.tsx:1039:                  <div className="mt-2 grid grid-cols-2 gap-2">
src\features\expedientes\ExpedienteDetalle.tsx:1070:                      <div className="flex items-start gap-2">
src\features\expedientes\ExpedienteForm.tsx:753:                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
src\features\expedientes\ExpedienteForm.tsx:890:            <FileText className="w-8 h-8" />
src\features\expedientes\ExpedienteResumenModal.tsx:88:        className="p-2 hover:bg-white/20 rounded-full transition-colors"
src\features\expedientes\ExpedienteResumenModal.tsx:100:        <div className="flex items-center gap-2 mb-2">
src\features\expedientes\ExpedienteResumenModal.tsx:104:        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
src\features\expedientes\ExpedienteResumenModal.tsx:118:        <div className="flex items-center gap-2 mb-2">
src\features\expedientes\ExpedienteResumenModal.tsx:137:      <div className="flex items-center gap-2 mb-2">
src\features\expedientes\ExpedienteResumenModal.tsx:141:      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
src\features\expedientes\ExpedienteResumenModal.tsx:151:      <div className="flex items-center gap-2 mb-2">
src\features\expedientes\ExpedienteResumenModal.tsx:185:        <div className="flex items-center gap-2 mb-2">
src\features\legal\GeneradorResolucion.tsx:59:          <button className="p-2 text-slate-400 hover:text-blue-600 transition-all"><Printer className="w-5 h-5" /></button>
src\features\legal\GeneradorResolucion.tsx:60:          <button className="p-2 text-slate-400 hover:text-blue-600 transition-all"><Download className="w-5 h-5" /></button>
src\features\legal\GeneradorResolucion.tsx:97:              <ShieldAlert className="w-8 h-8 text-blue-900" />
src\features\mediacion\components\GccDerivacionForm.tsx:110:        <button onClick={onCancelar} className="p-2 text-slate-400 hover:text-slate-600" aria-label="Cancelar derivación">
src\features\mediacion\components\GccDerivacionForm.tsx:189:                <button type="button" onClick={() => eliminarObjetivo(index)} className="p-2 text-red-400 hover:text-red-600">
src\features\mediacion\components\GccDashboard.tsx:245:            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
src\features\mediacion\components\GccDashboard.tsx:252:        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
src\features\mediacion\components\GccDashboard.tsx:255:            <div className="flex items-baseline gap-2">
src\features\mediacion\components\GccDashboard.tsx:266:            <div className="flex items-baseline gap-2">
src\features\mediacion\components\GccDashboard.tsx:292:          <h3 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
src\features\mediacion\components\GccDashboard.tsx:303:        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 lg:gap-4 mb-4 md:mb-6">
src\features\mediacion\components\GccDashboard.tsx:318:            <div className="flex items-center gap-2 mt-1">
src\features\mediacion\components\GccDashboard.tsx:331:        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
src\features\mediacion\components\GccDashboard.tsx:341:                <div className="flex items-baseline gap-1 mt-1.5">
src\features\mediacion\components\GccDashboard.tsx:367:            <div className="flex items-center gap-2">
src\features\mediacion\components\GccDashboard.tsx:370:                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-700 hover:bg-slate-100"
src\features\mediacion\components\GccDashboard.tsx:377:                className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-blue-700 hover:bg-blue-100"
src\features\mediacion\components\GccDashboard.tsx:385:          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
src\features\mediacion\components\GccDashboard.tsx:387:              <label className="mb-1 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
src\features\mediacion\components\GccDashboard.tsx:394:                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
src\features\mediacion\components\GccDashboard.tsx:404:              <label className="mb-1 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
src\features\mediacion\components\GccDashboard.tsx:411:                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
src\features\mediacion\components\GccDashboard.tsx:472:            <div className="flex items-center gap-2 mb-2">
src\features\mediacion\components\GccDashboard.tsx:480:            <div className="flex items-center gap-2 mb-2">
src\features\mediacion\components\GccDashboard.tsx:488:            <div className="flex items-center gap-2 mb-2">
src\features\mediacion\components\GccDashboard.tsx:510:        <div className="flex gap-2 text-xs">
src\features\mediacion\components\GccConciliacionPanel.tsx:166:            <Lightbulb className="w-8 h-8 text-purple-600" />
src\features\mediacion\components\GccConciliacionPanel.tsx:203:            <div className="grid grid-cols-3 gap-2">
src\features\mediacion\components\GccConciliacionPanel.tsx:403:                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
src\features\intervencion\NuevaIntervencion.tsx:186:            <Hand className="w-8 h-8 md:w-10 md:h-10" />
src\features\intervencion\NuevaIntervencion.tsx:242:                    <div className="border border-slate-200 rounded-2xl overflow-hidden animate-in slide-in-from-top-2">
src\features\intervencion\NuevaIntervencion.tsx:249:                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center"><span className="text-xs font-bold text-emerald-600">{est.nombreCompleto.charAt(0)}</span></div>
src\features\intervencion\NuevaIntervencion.tsx:262:                      <button type="button" onClick={handleClearEstudiante} className="p-2 hover:bg-emerald-200 rounded-lg"><span className="text-xs">✕</span></button>
src\features\mediacion\components\GccCasosPanel.tsx:133:        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-xs">
src\features\mediacion\components\GccCasosPanel.tsx:134:          <div className="flex items-center gap-2">
src\features\mediacion\components\GccCasosPanel.tsx:138:          <div className="flex items-center gap-2">
src\features\mediacion\components\GccCasosPanel.tsx:185:                      <span className="rounded-full bg-emerald-100 px-2 md:px-2.5 py-0.5 md:py-1 text-xs font-bold uppercase tracking-tight text-emerald-700">
src\features\mediacion\components\GccCasosPanel.tsx:189:                      <span className="rounded-full bg-blue-100 px-2 md:px-2.5 py-0.5 md:py-1 text-xs font-bold uppercase tracking-tight text-blue-700">
src\features\mediacion\components\GccCasosPanel.tsx:199:                        className={`rounded-full px-2 md:px-2.5 py-0.5 md:py-1 text-xs font-bold uppercase tracking-tight ${
src\features\mediacion\components\GccCasosPanel.tsx:224:                      className={`px-2 md:px-3 py-1 md:py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
src\features\mediacion\components\GccCompromisos.tsx:92:        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase text-emerald-600">
src\features\mediacion\components\GccCompromisos.tsx:113:                  className={`p-2 rounded-xl border-2 transition-all flex-shrink-0 ${
src\features\mediacion\components\GccCompromisos.tsx:133:                  <div className="flex items-center mt-1 space-x-4 flex-wrap gap-2">
src\features\mediacion\components\GccCompromisos.tsx:149:                className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 ml-4"
src\features\mediacion\CentroMediacionGCC.tsx:152:          <div className="flex items-baseline gap-2">
src\features\mediacion\CentroMediacionGCC.tsx:168:            <div className="p-3 md:p-4 lg:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3 bg-slate-50/40">
src\features\mediacion\CentroMediacionGCC.tsx:172:              <span className="rounded-lg bg-blue-100 px-2 md:px-3 py-1 text-xs font-bold text-blue-700 w-fit">
src\features\mediacion\CentroMediacionGCC.tsx:220:                  <span className={`inline-block px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg text-xs font-bold uppercase tracking-tight mt-1 ${
src\features\mediacion\components\GccArbitrajePanel.tsx:189:            <Scale className="w-8 h-8 text-red-600" />
src\features\mediacion\components\GccArbitrajePanel.tsx:196:              <span className="px-3 py-1 bg-red-100 border border-red-300 text-red-700 text-xs font-black rounded-full uppercase tracking-widest">
src\features\mediacion\components\GccArbitrajePanel.tsx:263:            <div className="grid grid-cols-2 gap-2">
src\features\mediacion\components\GccArbitrajePanel.tsx:287:            <div className="grid grid-cols-3 gap-2">
src\features\mediacion\components\GccArbitrajePanel.tsx:393:                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
src\features\mediacion\components\GccResolucion.tsx:64:        <div className="mb-10 p-4 md:p-6 rounded-2xl border border-slate-200 bg-slate-50 animate-in slide-in-from-top-2 duration-300">
src\features\mediacion\components\GccMetricsBar.tsx:124:      <div className="mt-2 flex items-center justify-end gap-1 text-xs font-medium text-slate-500">
src\features\mediacion\components\GccMediacionPanel.tsx:164:            <Users className="w-8 h-8 text-blue-600" />
src\features\mediacion\components\GccMediacionPanel.tsx:201:            <div className="grid grid-cols-3 gap-2">
src\features\mediacion\components\GccMediacionPanel.tsx:384:                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
src\features\mediacion\components\GccNegociacionPanel.tsx:149:            <Handshake className="w-8 h-8 text-green-600" />
src\features\mediacion\components\GccNegociacionPanel.tsx:186:            <div className="grid grid-cols-3 gap-2">
src\features\mediacion\components\GccNegociacionPanel.tsx:350:                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
src\features\mediacion\components\RealtimeIndicators.tsx:30:    <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
src\features\mediacion\components\RealtimeIndicators.tsx:31:      <div className="flex items-center gap-1">
src\features\mediacion\components\RealtimeIndicators.tsx:81:    <div className="flex items-center gap-2">
src\features\mediacion\components\GccSalaMediacion.tsx:122:              className="p-2 text-slate-400 hover:text-slate-600"
src\features\mediacion\components\GccSalaMediacion.tsx:166:              <div className="grid grid-cols-3 gap-2">
src\features\mediacion\components\LazyComponentLoading.tsx:19:          <Loader className="w-8 h-8 text-emerald-600 animate-spin" />
src\features\patio\EstudianteAutocomplete.tsx:177:                <div className="flex items-center gap-2">
src\features\legal\LegalAssistant.tsx:40:    <div className="absolute right-16 px-3 py-1 bg-slate-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold">
src\features\legal\LegalAssistant.tsx:51:    <div className="flex gap-2">
src\features\legal\LegalAssistant.tsx:233:          <div className="p-2 bg-blue-500 rounded-lg">
src\features\legal\LegalAssistant.tsx:247:          className="p-1 hover:bg-slate-800 rounded-full transition-colors"
src\features\legal\LegalAssistant.tsx:292:      <div className="p-2 px-4 flex gap-2 overflow-x-auto no-scrollbar border-t border-slate-100 shrink-0 bg-white">
src\features\legal\LegalAssistant.tsx:302:              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors whitespace-nowrap"
src\features\legal\LegalAssistant.tsx:317:              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors whitespace-nowrap"
src\features\legal\LegalAssistant.tsx:340:            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
src\features\mediacion\components\WizardModal.tsx:120:            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
src\features\mediacion\components\WizardModal.tsx:129:          <div className="flex justify-between items-center gap-2">
src\features\mediacion\components\WizardModal.tsx:172:                    <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black uppercase text-white">
src\features\mediacion\components\WizardModal.tsx:293:            className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
src\features\mediacion\components\WizardModal.tsx:303:              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-50 active:scale-95"
src\features\expedientes\ExpedienteDetail.tsx:95:              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 border border-white/30">
src\features\expedientes\ExpedienteDetail.tsx:104:          <div className="flex items-center gap-2">
src\features\expedientes\ExpedienteDetail.tsx:106:              <button onClick={() => onEdit?.()} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg">
src\features\expedientes\ExpedienteDetail.tsx:111:              <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg">
src\features\expedientes\ExpedienteDetail.tsx:118:          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
src\features\expedientes\ExpedienteDetail.tsx:130:            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-lg text-sm font-medium">
src\features\expedientes\ExpedienteDetail.tsx:140:        <div className="flex gap-1 p-2">
src\features\expedientes\ExpedienteDetail.tsx:150:              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
src\features\expedientes\ExpedienteDetail.tsx:176:                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><User className="w-4 h-4" /></div>
src\features\expedientes\ExpedienteDetail.tsx:180:                    <div className="p-2 bg-slate-200 text-slate-600 rounded-lg"><GraduationCap className="w-4 h-4" /></div>
src\features\expedientes\ExpedienteDetail.tsx:184:                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Building className="w-4 h-4" /></div>
src\features\expedientes\ExpedienteDetail.tsx:188:                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Users className="w-4 h-4" /></div>
src\features\expedientes\ExpedienteDetail.tsx:202:                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><User className="w-4 h-4" /></div>
src\features\expedientes\ExpedienteDetail.tsx:206:                      <div className="p-2 bg-slate-200 text-slate-600 rounded-lg"><Phone className="w-4 h-4" /></div>
src\features\expedientes\ExpedienteDetail.tsx:210:                      <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Mail className="w-4 h-4" /></div>
src\features\expedientes\ExpedienteDetail.tsx:214:                      <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><MapPin className="w-4 h-4" /></div>
src\features\expedientes\ExpedienteDetail.tsx:229:                      <div className="p-2 bg-red-100 text-red-600 rounded-lg"><Calendar className="w-4 h-4" /></div>
src\features\expedientes\ExpedienteDetail.tsx:233:                      <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><MapPin className="w-4 h-4" /></div>
src\features\expedientes\ExpedienteDetail.tsx:237:                      <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg"><AlertTriangle className="w-4 h-4" /></div>
src\features\expedientes\ExpedienteDetail.tsx:241:                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Shield className="w-4 h-4" /></div>
src\features\expedientes\ExpedienteDetail.tsx:271:                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
src\features\patio\ListaReportesPatio.tsx:137:        <div className="flex items-center gap-2 mb-2">
src\features\patio\ListaReportesPatio.tsx:138:          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${getGravedadColor(reporte.gravedad_percibida)}`}>
src\features\patio\ListaReportesPatio.tsx:141:          <span className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase">
src\features\patio\ListaReportesPatio.tsx:157:    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{reporte.descripcion}</p>
src\features\patio\ListaReportesPatio.tsx:166:    <div className="flex gap-2">
src\features\patio\ListaReportesPatio.tsx:456:          className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-500 transition-all shadow-lg hover:shadow-xl active:scale-95"
src\features\patio\ReportePatio.tsx:78:          <div className="border border-slate-200 rounded-2xl overflow-hidden animate-in slide-in-from-top-2">
src\features\patio\ReportePatio.tsx:111:                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
src\features\patio\ReportePatio.tsx:131:                className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
src\features\patio\ReportePatio.tsx:154:              className="p-2 hover:bg-amber-200 rounded-lg transition-colors"
src\features\patio\ReportePatio.tsx:288:            <AlertCircle className="w-8 h-8 md:w-10 md:h-10" />
src\features\admin\AdminColegios.tsx:82:            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
src\features\admin\AdminColegios.tsx:164:            <div className="grid grid-cols-2 gap-2">
src\features\admin\AdminColegios.tsx:168:                  <label key={nivel} className="flex items-center gap-2 text-sm text-slate-300">
src\features\admin\AdminColegios.tsx:187:          <div className="flex items-center gap-2">
src\features\admin\AdminColegios.tsx:211:            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
src\features\admin\AdminColegios.tsx:246:            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
src\features\admin\AdminColegios.tsx:283:            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
src\features\admin\AdminColegios.tsx:294:                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
src\features\admin\AdminColegios.tsx:350:      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
src\features\admin\AdminColegios.tsx:469:        <div className="flex items-center gap-2">
src\features\admin\AdminColegios.tsx:501:    <div className="flex items-center gap-2 pt-3 border-t border-slate-700">
src\features\admin\AdminColegios.tsx:520:    <div className="flex items-center gap-2 mt-2">
src\features\admin\AdminColegios.tsx:532:        className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
src\features\admin\AdminColegios.tsx:539:        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
src\features\admin\AdminColegios.tsx:547:        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
src\features\admin\AdminColegios.tsx:586:        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
src\features\admin\BrandingConfigForm.tsx:37:      <div className="m-4 p-3 bg-amber-500/10 border border-amber-500/50 rounded-lg flex gap-2">
src\features\admin\BrandingConfigForm.tsx:44:        <div className="flex gap-2 mb-2">
src\features\admin\BrandingConfigForm.tsx:49:          <div className="mt-3 pl-7 text-xs text-red-200 bg-red-900/20 p-2 rounded border border-red-900/40">
src\features\admin\BrandingConfigForm.tsx:81:          className={`flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg transition-colors ${
src\features\admin\BrandingConfigForm.tsx:124:            <div className="flex gap-2">
src\features\admin\BrandingConfigForm.tsx:135:                className="flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300 font-mono"
src\features\admin\BrandingConfigForm.tsx:191:      className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
src\features\admin\BrandingConfigForm.tsx:228:        className="px-3 py-1 rounded text-sm font-medium transition-opacity hover:opacity-80"
src\features\admin\BrandingConfigForm.tsx:253:      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
src\features\admin\BrandingConfigForm.tsx:550:          <div className="w-8 h-8 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto" />
src\features\mediacion\GccCierreModal.tsx:187:              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
src\features\mediacion\GccCierreModal.tsx:208:        <h4 className="font-medium text-blue-900 flex items-center gap-2">
src\features\mediacion\GccCierreModal.tsx:212:        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
src\features\mediacion\GccCierreModal.tsx:234:          <h4 className="font-medium text-green-900 flex items-center gap-2">
src\features\mediacion\GccCierreModal.tsx:241:          <h4 className="font-medium text-orange-900 flex items-center gap-2">
src\features\mediacion\GccCierreModal.tsx:250:        <h4 className="font-medium text-gray-900 flex items-center gap-2">
src\features\mediacion\GccCierreModal.tsx:260:              <span className={`flex items-center gap-1 ${p.consentimiento ? 'text-green-600' : 'text-red-600'}`}>
src\features\mediacion\GccCierreModal.tsx:329:        <label className="flex items-center gap-2 text-sm text-slate-700">
src\features\mediacion\GccCierreModal.tsx:345:            className="w-full rounded-lg border p-2 text-sm"
src\features\mediacion\GccCierreModal.tsx:353:        <label className="flex items-center gap-2 text-sm text-slate-700">
src\features\mediacion\GccCierreModal.tsx:365:          <h4 className="font-medium text-red-900 flex items-center gap-2">
src\features\mediacion\GccCierreModal.tsx:379:          <h4 className="font-medium text-yellow-900 flex items-center gap-2">
src\features\mediacion\GccCierreModal.tsx:413:            <button type="button" onClick={onAgregarCompromiso} className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
src\features\mediacion\GccCierreModal.tsx:439:                          className="w-full p-2 border rounded text-sm"
src\features\mediacion\GccCierreModal.tsx:442:                      <div className="grid grid-cols-2 gap-2">
src\features\mediacion\GccCierreModal.tsx:453:                            className="w-full p-2 border rounded text-sm"
src\features\mediacion\GccCierreModal.tsx:465:                            className="w-full p-2 border rounded text-sm"
src\features\mediacion\GccCierreModal.tsx:481:          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
src\features\mediacion\GccCierreModal.tsx:511:              <p className="mt-1 p-2 bg-white rounded border">{form.detalleResultado}</p>
src\features\mediacion\GccCierreModal.tsx:549:      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
src\features\mediacion\GccCierreModal.tsx:559:            className="w-full rounded-lg border p-2 text-sm"
src\features\mediacion\GccCierreModal.tsx:572:            className="w-full rounded-lg border p-2 text-sm"
src\features\mediacion\GccCierreModal.tsx:578:        <h4 className="font-medium text-yellow-900 flex items-center gap-2">
src\features\mediacion\GccCierreModal.tsx:817:              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
src\features\mediacion\GccCierreModal.tsx:841:              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
src\features\mediacion\GccCierreModal.tsx:849:              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
src\features\legal\CalendarioPlazosLegales.tsx:105:        className="min-h-28 bg-red-50 border-2 border-red-300 p-2 flex flex-col space-y-1 transition-all hover:bg-red-100/50 shadow-md"
src\features\legal\CalendarioPlazosLegales.tsx:124:      className={`min-h-28 border p-2 flex flex-col space-y-1 transition-all ${
src\features\legal\CalendarioPlazosLegales.tsx:279:                <div key={f.fecha} className="bg-white border border-orange-100 rounded-lg p-2 hover:bg-orange-50/50 transition-colors">
src\features\legal\CalendarioPlazosLegales.tsx:310:            <div key={item.key} className="border-l-2 border-red-500 pl-4 py-1">
src\features\legal\CalendarioPlazosLegales.tsx:311:              <div className="flex items-center gap-2">
src\features\legal\CalendarioPlazosLegales.tsx:580:            <div className="mt-3 flex flex-wrap items-center gap-2">
src\features\legal\CalendarioPlazosLegales.tsx:581:              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
src\features\legal\CalendarioPlazosLegales.tsx:584:              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
src\features\legal\CalendarioPlazosLegales.tsx:587:              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
src\features\legal\CalendarioPlazosLegales.tsx:593:          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm w-full md:w-auto justify-between">
src\features\legal\CalendarioPlazosLegales.tsx:734:            <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white">
