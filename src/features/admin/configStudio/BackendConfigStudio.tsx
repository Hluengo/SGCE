import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Database,
  History,
  Loader2,
  Play,
  RotateCcw,
  Send,
  School,
  Sparkles,
  Lock,
  Wrench,
  SlidersHorizontal,
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/shared/lib/supabaseClient';
import useAuth from '@/shared/hooks/useAuth';
import { useTenant } from '@/shared/context/TenantContext';
import { withRetry } from '@/shared/utils/retry';
import { AsyncState } from '@/shared/components/ui';
import { basicStudioValidation, buildConfigStudioChangeset } from './sqlGenerator';
import type { ConfigStudioState, StudioScope } from './types';

interface ChangesetRow {
  id: string;
  scope: StudioScope;
  tenant_id: string | null;
  title: string;
  summary: string | null;
  status: 'draft' | 'validated' | 'applied' | 'failed' | 'reverted';
  created_at: string;
  error_text: string | null;
}

type StudioView = 'colegio' | 'seguridad' | 'infra' | 'avanzado' | 'historial';

const initialState: ConfigStudioState = {
  tables: [{
    tableName: '',
    createIfMissing: true,
    enableRls: true,
    columns: [
      { name: 'id', type: 'uuid primary key default uuid_generate_v4()', notNull: true },
      { name: 'establecimiento_id', type: 'uuid', notNull: true, referencesTable: 'establecimientos', referencesColumn: 'id' },
    ],
    indexes: [],
  }],
  policies: [{
    tableName: '',
    policyName: '',
    command: 'all',
    usingExpr: 'public.can_user_access_row(establecimiento_id)',
    withCheckExpr: 'public.can_user_access_row(establecimiento_id)',
  }],
  triggers: [],
  functions: [],
  auth: { passwordMinLength: 12, requireMfaAdmins: true, sessionTimeoutMinutes: 480, allowedProviders: ['email'] },
  storage: [{ bucketName: '', isPublic: false, maxSizeMb: 20, allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] }],
  edgeFunctions: [{ functionName: '', routePath: '', enabled: true, version: 'v1', envJson: '{}' }],
  api: { rateLimitPerMinute: 120, customClaimsJson: '{"tenant_scope": true}' },
  projectPreferences: [{ key: 'project.branding', valueJson: '{"name":"Convivencia Escolar"}', description: 'Preferencias visuales del proyecto' }],
};

const statusBadge: Record<ChangesetRow['status'], string> = {
  draft: 'bg-slate-100 text-slate-700',
  validated: 'bg-blue-100 text-blue-700',
  applied: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-rose-100 text-rose-700',
  reverted: 'bg-amber-100 text-amber-700',
};

const statusLabel: Record<ChangesetRow['status'], string> = {
  draft: 'borrador',
  validated: 'validado',
  applied: 'aplicado',
  failed: 'fallido',
  reverted: 'revertido',
};

const tabClass = (active: boolean) =>
  `rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest ${active ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`;

const wizardOrder: StudioView[] = ['colegio', 'seguridad', 'infra', 'avanzado', 'historial'];

const wizardHelp: Record<StudioView, string> = {
  colegio: 'Define estructura de datos y políticas RLS por establecimiento.',
  seguridad: 'Ajusta password, MFA, sesión y límites API para el colegio.',
  infra: 'Configura buckets y edge functions sin entrar al dashboard de Supabase.',
  avanzado: 'Revisa SQL generado e impacto antes de aplicar.',
  historial: 'Aplica, revierte y audita cambiosets guardados.',
};

const wizardRequirements: Record<StudioView, string[]> = {
  colegio: [
    'Nombre de tabla de configuración del colegio',
    'Tabla objetivo para la política de acceso (RLS)',
    'Nombre de la política de acceso (RLS)',
  ],
  seguridad: [
    'Password mínimo >= 8',
    'Timeout de sesión >= 30 min',
    'Rate limit > 0',
  ],
  infra: [
    'Nombre de bucket de storage',
    'Nombre de edge function',
  ],
  avanzado: [
    'SQL generado disponible para revisión',
  ],
  historial: [
    'Al menos un changeset guardado',
  ],
};

type FieldGuideItem = {
  field: string;
  what: string;
  format: string;
  example: string;
};

const fieldGuides: Record<StudioView, FieldGuideItem[]> = {
  colegio: [
    {
      field: 'Tabla',
      what: 'Nombre de la tabla a crear o editar para datos del colegio.',
      format: 'snake_case',
      example: 'configuracion_colegio',
    },
    {
      field: 'Columnas (JSON)',
      what: 'Definición estructural de columnas: nombre, tipo, nullabilidad y referencias.',
      format: 'JSON array válido',
      example: '[{"name":"establecimiento_id","type":"uuid","notNull":true}]',
    },
    {
      field: 'Policy RLS',
      what: 'Regla de aislamiento por tenant para lectura y escritura.',
      format: 'Expresión SQL booleana',
      example: 'public.can_user_access_row(establecimiento_id)',
    },
  ],
  seguridad: [
    {
      field: 'Password mínimo',
      what: 'Largo mínimo de contraseña para cuentas nuevas o reseteadas.',
      format: 'Número entero >= 8',
      example: '12',
    },
    {
      field: 'Timeout sesión',
      what: 'Duración máxima de sesión antes de reautenticación.',
      format: 'Número entero en minutos',
      example: '240',
    },
    {
      field: 'Rate limit/min',
      what: 'Máximo de solicitudes API por minuto.',
      format: 'Número entero > 0',
      example: '80',
    },
  ],
  infra: [
    {
      field: 'Bucket',
      what: 'Contenedor de archivos para documentos del colegio.',
      format: 'kebab-case o snake_case',
      example: 'documentos-colegio',
    },
    {
      field: 'Tipos MIME',
      what: 'Formatos de archivo permitidos en el bucket.',
      format: 'Lista separada por coma',
      example: 'application/pdf,image/jpeg,image/png',
    },
    {
      field: 'Edge function',
      what: 'Función backend para automatizar configuración/sincronización.',
      format: 'Nombre + ruta HTTP',
      example: 'sync-tenant-settings /tenant/settings/sync',
    },
  ],
  avanzado: [
    {
      field: 'Sentencias SQL',
      what: 'Código SQL que se ejecutará al aplicar el changeset.',
      format: 'Solo lectura',
      example: 'create table ...; create policy ...;',
    },
    {
      field: 'Rollback',
      what: 'Sentencias usadas para revertir el cambio.',
      format: 'Solo lectura',
      example: 'drop policy ...; drop table ...;',
    },
    {
      field: 'Impacto',
      what: 'Conteo de objetos modificados y advertencias técnicas.',
      format: 'Resumen informativo',
      example: 'Tablas: 2, Policies: 1, Warnings: 0',
    },
  ],
  historial: [
    {
      field: 'Borrador',
      what: 'Cambio guardado, aún no ejecutado en base de datos.',
      format: 'Estado de changeset',
      example: 'borrador',
    },
    {
      field: 'Validado',
      what: 'SQL revisado por reglas del sistema, listo para aplicar.',
      format: 'Estado de changeset',
      example: 'validado',
    },
    {
      field: 'Aplicado/Revertido',
      what: 'Cambio ya ejecutado o deshecho en entorno real.',
      format: 'Estado de changeset',
      example: 'aplicado | revertido',
    },
  ],
};

const extractJsonFromAi = (text: string): unknown => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(candidate);
};

const toSafeNumber = (value: unknown, fallback: number, min = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.round(parsed));
};

const useBackendConfigStudioState = () => {
  const [view, setView] = useState<StudioView>('colegio');
  const [scope, setScope] = useState<StudioScope>('global');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [state, setState] = useState<ConfigStudioState>(initialState);
  const [history, setHistory] = useState<ChangesetRow[]>([]);
  const [selectedChangesetId, setSelectedChangesetId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [serverValidation, setServerValidation] = useState<{ ok: boolean; errors: string[]; warnings: string[] } | null>(null);
  const [uiError, setUiError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [showFieldHelp, setShowFieldHelp] = useState(false);
  const [showAiCopilot, setShowAiCopilot] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);
  const [aiAutoValidating, setAiAutoValidating] = useState(false);

  return {
    view,
    setView,
    scope,
    setScope,
    title,
    setTitle,
    summary,
    setSummary,
    state,
    setState,
    history,
    setHistory,
    selectedChangesetId,
    setSelectedChangesetId,
    loadingHistory,
    setLoadingHistory,
    savingDraft,
    setSavingDraft,
    executing,
    setExecuting,
    validationErrors,
    setValidationErrors,
    serverValidation,
    setServerValidation,
    uiError,
    setUiError,
    saveSuccess,
    setSaveSuccess,
    showFieldHelp,
    setShowFieldHelp,
    showAiCopilot,
    setShowAiCopilot,
    aiPrompt,
    setAiPrompt,
    aiResponse,
    setAiResponse,
    aiLoading,
    setAiLoading,
    aiError,
    setAiError,
    aiSuccess,
    setAiSuccess,
    aiAutoValidating,
    setAiAutoValidating,
  };
};

const useBackendConfigStudioView = () => {
  const { usuario } = useAuth();
  const { tenantId } = useTenant();
  const {
    view,
    setView,
    scope,
    setScope,
    title,
    setTitle,
    summary,
    setSummary,
    state,
    setState,
    history,
    setHistory,
    selectedChangesetId,
    setSelectedChangesetId,
    loadingHistory,
    setLoadingHistory,
    savingDraft,
    setSavingDraft,
    executing,
    setExecuting,
    validationErrors,
    setValidationErrors,
    serverValidation,
    setServerValidation,
    uiError,
    setUiError,
    saveSuccess,
    setSaveSuccess,
    showFieldHelp,
    setShowFieldHelp,
    showAiCopilot,
    setShowAiCopilot,
    aiPrompt,
    setAiPrompt,
    aiResponse,
    setAiResponse,
    aiLoading,
    setAiLoading,
    aiError,
    setAiError,
    aiSuccess,
    setAiSuccess,
    aiAutoValidating,
    setAiAutoValidating,
  } = useBackendConfigStudioState();

  const generated = useMemo(() => buildConfigStudioChangeset(scope, scope === 'tenant' ? tenantId : null, state, title, summary), [scope, tenantId, state, title, summary]);

  const tableDraft = state.tables[0] ?? initialState.tables[0];
  const policyDraft = state.policies[0] ?? initialState.policies[0];
  const storageDraft = state.storage[0] ?? initialState.storage[0];
  const edgeDraft = state.edgeFunctions[0] ?? initialState.edgeFunctions[0];
  const currentStepIndex = wizardOrder.indexOf(view);
  const canGoPrev = currentStepIndex > 0;
  const canGoNext = currentStepIndex < wizardOrder.length - 1;
  const stepCompletion = useMemo<Record<StudioView, boolean>>(() => {
    const colegioOk =
      tableDraft.tableName.trim().length > 0
      && policyDraft.tableName.trim().length > 0
      && policyDraft.policyName.trim().length > 0;
    const seguridadOk =
      state.auth.passwordMinLength >= 8
      && state.auth.sessionTimeoutMinutes >= 30
      && state.api.rateLimitPerMinute > 0;
    const infraOk =
      storageDraft.bucketName.trim().length > 0
      && edgeDraft.functionName.trim().length > 0;
    const avanzadoOk = generated.sql.length > 0;
    const historialOk = history.length > 0;

    return {
      colegio: colegioOk,
      seguridad: seguridadOk,
      infra: infraOk,
      avanzado: avanzadoOk,
      historial: historialOk,
    };
  }, [
    tableDraft.tableName,
    policyDraft.tableName,
    policyDraft.policyName,
    state.auth.passwordMinLength,
    state.auth.sessionTimeoutMinutes,
    state.api.rateLimitPerMinute,
    storageDraft.bucketName,
    edgeDraft.functionName,
    generated.sql.length,
    history.length,
  ]);
  const completedSteps = wizardOrder.filter((step) => stepCompletion[step]).length;
  const progressPct = Math.round((completedSteps / wizardOrder.length) * 100);
  const currentStepIssues = useMemo(() => {
    switch (view) {
      case 'colegio': {
        const issues: string[] = [];
        if (!tableDraft.tableName.trim()) issues.push('Falta nombre de tabla del colegio.');
        if (!policyDraft.tableName.trim()) issues.push('Falta tabla objetivo de la policy RLS.');
        if (!policyDraft.policyName.trim()) issues.push('Falta nombre de policy RLS.');
        return issues;
      }
      case 'seguridad': {
        const issues: string[] = [];
        if (state.auth.passwordMinLength < 8) issues.push('Password mínimo debe ser al menos 8.');
        if (state.auth.sessionTimeoutMinutes < 30) issues.push('Timeout de sesión debe ser al menos 30 minutos.');
        if (state.api.rateLimitPerMinute <= 0) issues.push('Rate limit debe ser mayor a 0.');
        return issues;
      }
      case 'infra': {
        const issues: string[] = [];
        if (!storageDraft.bucketName.trim()) issues.push('Falta nombre de bucket.');
        if (!edgeDraft.functionName.trim()) issues.push('Falta nombre de edge function.');
        return issues;
      }
      case 'avanzado':
        return generated.sql.length > 0 ? [] : ['No hay SQL generado para revisar.'];
      case 'historial':
        return history.length > 0 ? [] : ['Aún no hay changesets guardados en el historial.'];
      default:
        return [];
    }
  }, [
    view,
    tableDraft.tableName,
    policyDraft.tableName,
    policyDraft.policyName,
    state.auth.passwordMinLength,
    state.auth.sessionTimeoutMinutes,
    state.api.rateLimitPerMinute,
    storageDraft.bucketName,
    edgeDraft.functionName,
    generated.sql.length,
    history.length,
  ]);

  const applyPreset = (preset: 'colegio' | 'seguridad' | 'infra') => {
    if (preset === 'colegio') {
      setScope('tenant');
      setTitle('Configuracion base de colegio');
      setSummary('Configuracion inicial tenant con tabla + RLS.');
      setState((current) => ({
        ...current,
        tables: [{
          ...tableDraft,
          tableName: 'configuracion_colegio',
          columns: [
            { name: 'id', type: 'uuid primary key default uuid_generate_v4()', notNull: true },
            { name: 'establecimiento_id', type: 'uuid', notNull: true, referencesTable: 'establecimientos', referencesColumn: 'id' },
            { name: 'nombre_visible', type: 'text', notNull: true },
            { name: 'contacto_email', type: 'text' },
          ],
        }],
        policies: [{
          ...policyDraft,
          tableName: 'configuracion_colegio',
          policyName: 'configuracion_colegio_tenant_isolation',
        }],
      }));
      return;
    }

    if (preset === 'seguridad') {
      setTitle('Hardening seguridad colegio');
      setSummary('Ajusta auth y API para mayor seguridad.');
      setState((current) => ({
        ...current,
        auth: { ...current.auth, passwordMinLength: 14, requireMfaAdmins: true, sessionTimeoutMinutes: 240 },
        api: { ...current.api, rateLimitPerMinute: 80 },
      }));
      return;
    }

    setTitle('Infraestructura operativa colegio');
    setSummary('Configura storage y edge function tenant.');
    setState((current) => ({
      ...current,
      storage: [{ ...storageDraft, bucketName: storageDraft.bucketName || 'documentos-colegio', isPublic: false, maxSizeMb: 25 }],
      edgeFunctions: [{ ...edgeDraft, functionName: edgeDraft.functionName || 'sync-tenant-settings', routePath: edgeDraft.routePath || '/tenant/settings/sync', enabled: true }],
    }));
  };
  const loadHistory = async () => {
    if (!supabase) return;
    setLoadingHistory(true);
    setUiError(null);
    try {
      const { data, error } = await supabase
        .from('admin_changesets')
        .select('id, scope, tenant_id, title, summary, status, created_at, error_text')
        .order('created_at', { ascending: false })
        .limit(25);
      if (error) throw error;
      setHistory((data ?? []) as ChangesetRow[]);
    } catch (error) {
      console.error('[ConfigStudio] Error loading history:', error);
      setUiError('No se pudo cargar el historial de cambios.');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const runValidation = async (): Promise<boolean> => {
    const localErrors = basicStudioValidation(state);
    setValidationErrors(localErrors);
    if (localErrors.length > 0 || !supabase) return false;

    const { data, error } = await supabase.rpc('validate_admin_sql_statements', { p_sql: generated.sql });
    if (error) {
      setUiError(error.message);
      return false;
    }

    const parsed = data as { ok?: boolean; errors?: string[]; warnings?: string[] };
    setServerValidation({
      ok: Boolean(parsed?.ok),
      errors: Array.isArray(parsed?.errors) ? parsed.errors : [],
      warnings: Array.isArray(parsed?.warnings) ? parsed.warnings : [],
    });
    return Boolean(parsed?.ok);
  };

  const saveChangesetDraft = async () => {
    setUiError(null);
    setServerValidation(null);
    setSaveSuccess(null);

    const localErrors = basicStudioValidation(state);
    setValidationErrors(localErrors);
    if (localErrors.length > 0) return;

    if (!supabase || !usuario?.id) {
      setUiError('Supabase no disponible o sesion invalida.');
      return;
    }

    setSavingDraft(true);
    try {
      const { data: validationData, error: validationError } = await supabase.rpc('validate_admin_sql_statements', { p_sql: generated.sql });
      if (validationError) throw validationError;

      const validationReport = validationData as { ok: boolean; errors?: string[]; warnings?: string[] };
      const { error: insertError } = await supabase.from('admin_changesets').insert({
        scope,
        tenant_id: scope === 'tenant' ? tenantId : null,
        module: generated.module,
        title: generated.title,
        summary: generated.summary,
        desired_state: generated.desiredState,
        generated_sql: generated.sql,
        rollback_sql: generated.rollbackSql,
        validation_report: validationReport,
        status: validationReport.ok ? 'validated' : 'failed',
        created_by: usuario.id,
        error_text: validationReport.ok ? null : (validationReport.errors ?? []).join('\n'),
      });
      if (insertError) throw insertError;

      setServerValidation({
        ok: Boolean(validationReport.ok),
        errors: Array.isArray(validationReport.errors) ? validationReport.errors : [],
        warnings: Array.isArray(validationReport.warnings) ? validationReport.warnings : [],
      });

      await loadHistory();
      setSaveSuccess('Borrador guardado correctamente en historial.');
      setView('historial');
    } catch (error) {
      console.error('[ConfigStudio] Error saving changeset:', error);
      setUiError(error instanceof Error ? error.message : 'No se pudo guardar el draft.');
    } finally {
      setSavingDraft(false);
    }
  };

  const applySelectedChangeset = async () => {
    if (!supabase || !selectedChangesetId) return;
    setExecuting(true);
    setUiError(null);
    try {
      const { data, error } = await supabase.rpc('apply_admin_changeset', { p_changeset_id: selectedChangesetId });
      if (error) throw error;
      if (!(data as { ok?: boolean })?.ok) throw new Error((data as { error?: string }).error ?? 'No se pudo aplicar el changeset');
      await loadHistory();
    } catch (error) {
      console.error('[ConfigStudio] Error applying changeset:', error);
      setUiError(error instanceof Error ? error.message : 'No se pudo aplicar el changeset.');
    } finally {
      setExecuting(false);
    }
  };

  const revertSelectedChangeset = async () => {
    if (!supabase || !selectedChangesetId) return;
    setExecuting(true);
    setUiError(null);
    try {
      const { data, error } = await supabase.rpc('revert_admin_changeset', { p_changeset_id: selectedChangesetId });
      if (error) throw error;
      if (!(data as { ok?: boolean })?.ok) throw new Error((data as { error?: string }).error ?? 'No se pudo revertir el changeset');
      await loadHistory();
    } catch (error) {
      console.error('[ConfigStudio] Error reverting changeset:', error);
      setUiError(error instanceof Error ? error.message : 'No se pudo revertir el changeset.');
    } finally {
      setExecuting(false);
    }
  };

  const goPrevStep = () => {
    if (!canGoPrev) return;
    setView(wizardOrder[currentStepIndex - 1]);
  };

  const goNextStep = () => {
    if (!canGoNext || currentStepIssues.length > 0) return;
    setView(wizardOrder[currentStepIndex + 1]);
  };

  const buildAiContext = () => {
    const currentPayload =
      view === 'colegio'
        ? { table: tableDraft, policy: policyDraft, scope, tenantId, title, summary }
        : view === 'seguridad'
          ? { auth: state.auth, api: state.api, scope, tenantId, title, summary }
          : view === 'infra'
            ? { storage: storageDraft, edgeFunction: edgeDraft, scope, tenantId, title, summary }
            : view === 'avanzado'
              ? { sqlCount: generated.sql.length, rollbackCount: generated.rollbackSql.length, warnings: generated.impactPreview.warnings, title, summary }
              : { selectedChangesetId, historyCount: history.length, title, summary };

    return JSON.stringify(currentPayload, null, 2);
  };

  const runAiGuidance = async (quickPrompt?: string) => {
    if (aiLoading) return;
    setAiError(null);
    setAiSuccess(null);
    setAiResponse('');
    const prompt = (quickPrompt ?? aiPrompt).trim();
    if (!prompt) {
      setAiError('Escribe una consulta para el copiloto IA.');
      return;
    }
    if (!navigator.onLine) {
      setAiError('Sin conexión. No se puede consultar IA en modo offline.');
      return;
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (!apiKey) {
      setAiError('Falta VITE_GEMINI_API_KEY en .env.local para usar el copiloto IA.');
      return;
    }

    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `Eres un copiloto de Config Studio para Supabase en una plataforma escolar multi-tenant.
Responde en español, claro y accionable para usuarios no técnicos.
Debes:
1) Detectar campos faltantes o ambiguos.
2) Explicar cada término técnico en lenguaje simple.
3) Proponer valores concretos y válidos.
4) Priorizar seguridad RLS por establecimiento_id.
5) Entregar respuesta en secciones: "Diagnóstico", "Qué completar ahora", "Ejemplo listo para copiar", "Riesgos".`;

      const context = buildAiContext();
      const guideSnippet = fieldGuides[view]
        .map((item) => `${item.field}: ${item.what}. Formato: ${item.format}. Ejemplo: ${item.example}.`)
        .join('\n');

      const finalPrompt = `Vista actual: ${view}
Ayuda esperada por plantilla:
${guideSnippet}

Contexto actual del formulario:
${context}

Solicitud del usuario:
${prompt}`;

      const response = await withRetry(
        () =>
          ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: finalPrompt,
            config: { systemInstruction },
          }),
        { retries: 2, baseDelayMs: 600 },
      );

      setAiResponse(response?.text ?? 'No hubo respuesta del modelo.');
    } catch (error) {
      console.error('[ConfigStudio] Error copiloto IA:', error);
      setAiError('No fue posible generar guía con IA. Revisa clave API o conexión.');
    } finally {
      setAiLoading(false);
    }
  };

  const runAiAutofill = async (): Promise<boolean> => {
    if (aiLoading) return false;
    setAiError(null);
    setAiSuccess(null);
    if (!['colegio', 'seguridad', 'infra'].includes(view)) {
      setAiError('Autocompletar IA está disponible solo en Colegio, Seguridad e Infraestructura.');
      return false;
    }
    if (!navigator.onLine) {
      setAiError('Sin conexión. No se puede autocompletar con IA en modo offline.');
      return false;
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (!apiKey) {
      setAiError('Falta VITE_GEMINI_API_KEY en .env.local para usar autocompletado IA.');
      return false;
    }

    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const context = buildAiContext();
      const targetSchema =
        view === 'colegio'
          ? `{
  "title": "string",
  "summary": "string",
  "scope": "tenant|global",
  "table": {
    "tableName": "string",
    "createIfMissing": true,
    "enableRls": true,
    "columns": [{"name":"string","type":"string","notNull":true}]
  },
  "policy": {
    "tableName": "string",
    "policyName": "string",
    "usingExpr": "string",
    "withCheckExpr": "string"
  }
}`
          : view === 'seguridad'
            ? `{
  "title": "string",
  "summary": "string",
  "auth": {"passwordMinLength": 12, "sessionTimeoutMinutes": 240, "requireMfaAdmins": true},
  "api": {"rateLimitPerMinute": 80}
}`
            : `{
  "title": "string",
  "summary": "string",
  "storage": {"bucketName":"string", "allowedMimeTypes":["application/pdf"], "isPublic": false, "maxSizeMb": 20},
  "edgeFunction": {"functionName":"string", "routePath":"/tenant/settings/sync", "enabled": true}
}`;

      const systemInstruction = `Eres un generador JSON para un formulario Config Studio.
Responde SOLO JSON válido y nada más.
No incluyas markdown ni comentarios.
Usa valores realistas, seguros y orientados a multi-tenant escolar.`;

      const response = await withRetry(
        () =>
          ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Vista activa: ${view}
Genera JSON para autocompletar esta plantilla.
Respeta exactamente este esquema:
${targetSchema}

Contexto actual:
${context}`,
            config: { systemInstruction },
          }),
        { retries: 2, baseDelayMs: 600 },
      );

      const raw = response?.text?.trim();
      if (!raw) throw new Error('La IA no devolvió contenido.');
      const parsed = extractJsonFromAi(raw) as Record<string, unknown>;

      if (typeof parsed.title === 'string' && parsed.title.trim()) setTitle(parsed.title.trim());
      if (typeof parsed.summary === 'string' && parsed.summary.trim()) setSummary(parsed.summary.trim());
      if (parsed.scope === 'tenant' || parsed.scope === 'global') setScope(parsed.scope);

      if (view === 'colegio') {
        const table = (parsed.table ?? {}) as Record<string, unknown>;
        const policy = (parsed.policy ?? {}) as Record<string, unknown>;
        const rawColumns = Array.isArray(table.columns) ? table.columns : [];
        const nextColumns = rawColumns
          .map((col) => col as Record<string, unknown>)
          .filter((col) => typeof col.name === 'string' && col.name.trim() && typeof col.type === 'string' && col.type.trim())
          .map((col) => ({
            name: String(col.name).trim(),
            type: String(col.type).trim(),
            notNull: Boolean(col.notNull),
            unique: Boolean(col.unique),
            defaultValue: typeof col.defaultValue === 'string' ? col.defaultValue : undefined,
            referencesTable: typeof col.referencesTable === 'string' ? col.referencesTable : undefined,
            referencesColumn: typeof col.referencesColumn === 'string' ? col.referencesColumn : undefined,
          }));

        setState((current) => ({
          ...current,
          tables: [{
            ...tableDraft,
            tableName: typeof table.tableName === 'string' ? table.tableName : tableDraft.tableName,
            createIfMissing: typeof table.createIfMissing === 'boolean' ? table.createIfMissing : tableDraft.createIfMissing,
            enableRls: typeof table.enableRls === 'boolean' ? table.enableRls : tableDraft.enableRls,
            columns: nextColumns.length > 0 ? nextColumns : tableDraft.columns,
          }],
          policies: [{
            ...policyDraft,
            tableName: typeof policy.tableName === 'string' ? policy.tableName : policyDraft.tableName,
            policyName: typeof policy.policyName === 'string' ? policy.policyName : policyDraft.policyName,
            usingExpr: typeof policy.usingExpr === 'string' ? policy.usingExpr : policyDraft.usingExpr,
            withCheckExpr: typeof policy.withCheckExpr === 'string' ? policy.withCheckExpr : policyDraft.withCheckExpr,
          }],
        }));
      }

      if (view === 'seguridad') {
        const auth = (parsed.auth ?? {}) as Record<string, unknown>;
        const api = (parsed.api ?? {}) as Record<string, unknown>;
        setState((current) => ({
          ...current,
          auth: {
            ...current.auth,
            passwordMinLength: toSafeNumber(auth.passwordMinLength, current.auth.passwordMinLength, 8),
            sessionTimeoutMinutes: toSafeNumber(auth.sessionTimeoutMinutes, current.auth.sessionTimeoutMinutes, 30),
            requireMfaAdmins: typeof auth.requireMfaAdmins === 'boolean' ? auth.requireMfaAdmins : current.auth.requireMfaAdmins,
          },
          api: {
            ...current.api,
            rateLimitPerMinute: toSafeNumber(api.rateLimitPerMinute, current.api.rateLimitPerMinute, 1),
          },
        }));
      }

      if (view === 'infra') {
        const storage = (parsed.storage ?? {}) as Record<string, unknown>;
        const edgeFunction = (parsed.edgeFunction ?? {}) as Record<string, unknown>;
        const mimeTypes = Array.isArray(storage.allowedMimeTypes)
          ? storage.allowedMimeTypes.map((m) => String(m).trim()).filter(Boolean)
          : storageDraft.allowedMimeTypes;

        setState((current) => ({
          ...current,
          storage: [{
            ...storageDraft,
            bucketName: typeof storage.bucketName === 'string' ? storage.bucketName : storageDraft.bucketName,
            allowedMimeTypes: mimeTypes,
            isPublic: typeof storage.isPublic === 'boolean' ? storage.isPublic : storageDraft.isPublic,
            maxSizeMb: toSafeNumber(storage.maxSizeMb, storageDraft.maxSizeMb, 1),
          }],
          edgeFunctions: [{
            ...edgeDraft,
            functionName: typeof edgeFunction.functionName === 'string' ? edgeFunction.functionName : edgeDraft.functionName,
            routePath: typeof edgeFunction.routePath === 'string' ? edgeFunction.routePath : edgeDraft.routePath,
            enabled: typeof edgeFunction.enabled === 'boolean' ? edgeFunction.enabled : edgeDraft.enabled,
          }],
        }));
      }

      setAiResponse(raw);
      setAiSuccess('Formulario actualizado con sugerencia IA. Revisa y ajusta antes de guardar.');
      return true;
    } catch (error) {
      console.error('[ConfigStudio] Error autocompletado IA:', error);
      setAiError('No se pudo autocompletar la plantilla con IA. Intenta nuevamente.');
      return false;
    } finally {
      setAiLoading(false);
    }
  };

  const runAiAutofillAndValidate = async () => {
    if (aiLoading || aiAutoValidating) return;
    setAiError(null);
    setAiSuccess(null);
    setAiAutoValidating(true);
    try {
      const autofillOk = await runAiAutofill();
      if (!autofillOk) return;
      const validationOk = await runValidation();
      if (validationOk) {
        setAiSuccess('Autocompletado y validación correctos. Puedes guardar borrador con confianza.');
      } else {
        setAiSuccess('Autocompletado aplicado. Revisa errores/advertencias de validación antes de guardar.');
      }
    } finally {
      setAiAutoValidating(false);
    }
  };

  return (
    <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 md:p-6 space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-600" />
            Config Studio Supabase
          </h2>
          <p className="text-xs text-slate-500 mt-1">Flujo guiado para configurar backend por colegio sin escribir SQL manualmente.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAiCopilot((prev) => !prev)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
          >
            <Bot className="w-3.5 h-3.5" />
            {showAiCopilot ? 'Ocultar IA' : 'Copiloto IA'}
          </button>
          <button
            onClick={() => setShowFieldHelp((prev) => !prev)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-100"
          >
            {showFieldHelp ? 'Ocultar ayuda' : 'Ayuda de campos'}
          </button>
          <button onClick={() => applyPreset('colegio')} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-100">Plantilla colegio</button>
          <button onClick={() => applyPreset('seguridad')} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-100">Plantilla seguridad</button>
          <button onClick={() => applyPreset('infra')} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-100">Plantilla infraestructura</button>
          <button onClick={() => void runValidation()} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-100">Validar configuración</button>
          <button onClick={() => void saveChangesetDraft()} disabled={savingDraft} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50">
            {savingDraft ? 'Guardando...' : 'Guardar borrador'}
          </button>
        </div>
      </header>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
        <p className="font-black uppercase tracking-widest text-xs text-slate-600 mb-1">Glosario rápido</p>
        <p><span className="font-semibold">Alcance:</span> define si el cambio aplica a todos los colegios o solo al colegio activo.</p>
        <p><span className="font-semibold">Borrador:</span> propuesta guardada de cambios, aún no aplicada a la base de datos.</p>
        <p><span className="font-semibold">Política RLS:</span> regla de acceso por filas que limita qué datos puede ver/modificar cada usuario.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/70">
        <div className="grid lg:grid-cols-4 gap-4">
          <div className="text-xs space-y-1">
            <span className="font-black uppercase tracking-wider text-slate-500">Alcance</span>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setScope('global')} className={tabClass(scope === 'global')}>Global (todos)</button>
              <button onClick={() => setScope('tenant')} className={tabClass(scope === 'tenant')}>Por colegio</button>
            </div>
          </div>
          <div className="text-xs space-y-1">
            <span className="font-black uppercase tracking-wider text-slate-500">Tenant Activo</span>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700">{tenantId ?? 'No seleccionado'}</div>
          </div>
          <div className="text-xs space-y-1">
            <label htmlFor="configstudio-title" className="font-black uppercase tracking-wider text-slate-500">Titulo</label>
            <input id="configstudio-title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
          </div>
          <div className="text-xs space-y-1">
            <label htmlFor="configstudio-summary" className="font-black uppercase tracking-wider text-slate-500">Resumen</label>
            <input id="configstudio-summary" value={summary} onChange={(e) => setSummary(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 font-semibold">
          {saveSuccess}
        </div>
      )}

      {showFieldHelp && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2 text-xs text-slate-700">
          <p className="font-black uppercase tracking-widest text-xs text-blue-800">
            Ayuda rápida: qué debes completar
          </p>
          <p><span className="font-semibold">Plantilla colegio:</span> nombre de tabla, columnas y política RLS (tabla + nombre + reglas USING/WITH CHECK).</p>
          <p><span className="font-semibold">Plantilla seguridad:</span> password mínimo, timeout de sesión, rate limit y MFA para admins.</p>
          <p><span className="font-semibold">Plantilla infraestructura:</span> bucket de archivos, tipos MIME permitidos, nombre y ruta de función edge.</p>
          <p className="text-slate-600">
            Guía completa de referencia: <span className="font-mono">docs/CONFIG_STUDIO_FIELDS.md</span>
          </p>
        </div>
      )}

      {showAiCopilot && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-700" />
            <p className="text-xs font-black uppercase tracking-widest text-violet-800">
              Copiloto IA de configuración
            </p>
          </div>
          <p className="text-xs text-violet-900">
            Te guía en lenguaje simple según la plantilla activa ({view}), con validaciones, ejemplos y riesgos.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void runAiGuidance('Revisa esta plantilla y dime exactamente qué campos faltan completar para dejarla lista.')}
              className="px-3 py-1.5 rounded-lg border border-violet-300 text-xs font-black uppercase tracking-widest text-violet-800 hover:bg-violet-100"
            >
              Diagnóstico rápido
            </button>
            <button
              onClick={() => void runAiGuidance('Dame un ejemplo completo y válido para esta plantilla, listo para copiar en los campos del formulario.')}
              className="px-3 py-1.5 rounded-lg border border-violet-300 text-xs font-black uppercase tracking-widest text-violet-800 hover:bg-violet-100"
            >
              Ejemplo listo
            </button>
            <button
              onClick={() => void runAiGuidance('Explícame los términos técnicos de esta vista en palabras simples para un usuario no técnico.')}
              className="px-3 py-1.5 rounded-lg border border-violet-300 text-xs font-black uppercase tracking-widest text-violet-800 hover:bg-violet-100"
            >
              Traducir términos
            </button>
            <button
              onClick={() => void runAiAutofill()}
              disabled={aiLoading || aiAutoValidating}
              className="px-3 py-1.5 rounded-lg bg-violet-700 text-white text-xs font-black uppercase tracking-widest hover:bg-violet-800 disabled:opacity-50"
            >
              Autocompletar plantilla
            </button>
            <button
              onClick={() => void runAiAutofillAndValidate()}
              disabled={aiLoading || aiAutoValidating}
              className="px-3 py-1.5 rounded-lg bg-cyan-700 text-white text-xs font-black uppercase tracking-widest hover:bg-cyan-800 disabled:opacity-50"
            >
              {aiAutoValidating ? 'Autocompletando...' : 'Autocompletar + validar'}
            </button>
          </div>
          <div className="flex gap-2">
            <textarea
              rows={2}
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              placeholder="Escribe aquí tu consulta de configuración..."
              className="flex-1 rounded-xl border border-violet-300 bg-white px-3 py-2 text-xs"
            />
            <button
              onClick={() => void runAiGuidance()}
              disabled={aiLoading}
              className="px-3 py-2 rounded-xl bg-violet-700 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 flex items-center gap-1.5 h-fit"
            >
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Guiar
            </button>
          </div>
          {aiError && (
            <p className="text-xs text-rose-700 font-semibold">{aiError}</p>
          )}
          {aiSuccess && (
            <p className="text-xs text-emerald-700 font-semibold">{aiSuccess}</p>
          )}
          {aiResponse && (
            <article className="rounded-xl border border-violet-200 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-widest text-violet-700 mb-2">
                Respuesta IA
              </p>
              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans">{aiResponse}</pre>
            </article>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setView('colegio')} className={tabClass(view === 'colegio')}><School className="w-3.5 h-3.5 inline mr-1" />Colegio</button>
        <button onClick={() => setView('seguridad')} className={tabClass(view === 'seguridad')}><Lock className="w-3.5 h-3.5 inline mr-1" />Seguridad</button>
        <button onClick={() => setView('infra')} className={tabClass(view === 'infra')}><Wrench className="w-3.5 h-3.5 inline mr-1" />Infraestructura</button>
        <button onClick={() => setView('avanzado')} className={tabClass(view === 'avanzado')}><SlidersHorizontal className="w-3.5 h-3.5 inline mr-1" />SQL avanzado</button>
        <button onClick={() => setView('historial')} className={tabClass(view === 'historial')}><History className="w-3.5 h-3.5 inline mr-1" />Historial</button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-black uppercase tracking-widest text-slate-600 mb-2">
          Qué significa cada campo en esta plantilla ({view})
        </p>
        <div className="grid md:grid-cols-3 gap-2">
          {fieldGuides[view].map((item) => (
            <div key={item.field} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <p className="text-xs font-bold text-slate-800">{item.field}</p>
              <p className="text-xs text-slate-600 mt-1">{item.what}</p>
              <p className="text-xs text-slate-500 mt-1"><span className="font-semibold">Formato:</span> {item.format}</p>
              <p className="text-xs text-slate-500"><span className="font-semibold">Ejemplo:</span> {item.example}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs text-cyan-900 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="w-full space-y-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <p>
              <span className="font-black uppercase tracking-widest text-xs mr-2">Paso {currentStepIndex + 1}/{wizardOrder.length}</span>
              {wizardHelp[view]}
            </p>
            <div className="flex gap-2">
              <button
                onClick={goPrevStep}
                disabled={!canGoPrev}
                className="px-3 py-1.5 rounded-lg border border-cyan-300 text-xs font-black uppercase tracking-widest disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                onClick={goNextStep}
                disabled={!canGoNext || currentStepIssues.length > 0}
                className="px-3 py-1.5 rounded-lg bg-cyan-700 text-white text-xs font-black uppercase tracking-widest disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-full rounded-full bg-cyan-100 overflow-hidden">
              <div
                className="h-full bg-cyan-600 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-cyan-800 whitespace-nowrap">
              {progressPct}%
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {wizardOrder.map((step) => (
              <span
                key={step}
                className={`px-2 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                  stepCompletion[step]
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {step} {stepCompletion[step] ? 'OK' : 'Pendiente'}
              </span>
            ))}
          </div>
          <div className="rounded-lg border border-cyan-200 bg-white/70 p-2">
            <p className="text-xs font-black uppercase tracking-widest text-cyan-800 mb-1">
              Este paso te pide
            </p>
            <ul className="space-y-1">
              {wizardRequirements[view].map((req) => (
                <li key={req} className="text-xs text-cyan-900">- {req}</li>
              ))}
            </ul>
            {currentStepIssues.length > 0 && (
              <>
                <p className="text-xs font-black uppercase tracking-widest text-rose-700 mt-2 mb-1">
                  Falta completar
                </p>
                <ul className="space-y-1">
                  {currentStepIssues.map((issue) => (
                    <li key={issue} className="text-xs text-rose-700">- {issue}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
      {view === 'colegio' && (
        <div className="grid xl:grid-cols-2 gap-4">
          <article className="rounded-2xl border border-slate-200 p-4 space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Modelo de datos</p>
            <input value={tableDraft.tableName} onChange={(e) => setState((current) => ({ ...current, tables: [{ ...tableDraft, tableName: e.target.value }] }))} placeholder="Tabla" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2"><input type="checkbox" checked={tableDraft.createIfMissing} onChange={(e) => setState((current) => ({ ...current, tables: [{ ...tableDraft, createIfMissing: e.target.checked }] }))} />Crear si no existe</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={tableDraft.enableRls} onChange={(e) => setState((current) => ({ ...current, tables: [{ ...tableDraft, enableRls: e.target.checked }] }))} />Habilitar RLS</label>
            </div>
            <textarea
              rows={6}
              value={JSON.stringify(tableDraft.columns, null, 2)}
              onChange={(event) => {
                try {
                  const parsed = JSON.parse(event.target.value) as typeof tableDraft.columns;
                  setState((current) => ({ ...current, tables: [{ ...tableDraft, columns: parsed }] }));
                  setUiError(null);
                } catch {
                  setUiError('JSON invalido en columnas.');
                }
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono"
            />
          </article>

          <article className="rounded-2xl border border-slate-200 p-4 space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">RLS tenant</p>
            <input value={policyDraft.tableName} onChange={(e) => setState((current) => ({ ...current, policies: [{ ...policyDraft, tableName: e.target.value }] }))} placeholder="Tabla a proteger (RLS)" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
            <input value={policyDraft.policyName} onChange={(e) => setState((current) => ({ ...current, policies: [{ ...policyDraft, policyName: e.target.value }] }))} placeholder="Nombre de la política de acceso" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
            <textarea value={policyDraft.usingExpr ?? ''} onChange={(e) => setState((current) => ({ ...current, policies: [{ ...policyDraft, usingExpr: e.target.value }] }))} rows={3} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono" />
            <textarea value={policyDraft.withCheckExpr ?? ''} onChange={(e) => setState((current) => ({ ...current, policies: [{ ...policyDraft, withCheckExpr: e.target.value }] }))} rows={3} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono" />
          </article>
        </div>
      )}

      {view === 'seguridad' && (
        <article className="rounded-2xl border border-slate-200 p-4 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Auth y API</p>
          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <label className="space-y-1"><span>Min password</span><input type="number" min={8} value={state.auth.passwordMinLength} onChange={(e) => setState((current) => ({ ...current, auth: { ...current.auth, passwordMinLength: Number(e.target.value) || 8 } }))} className="w-full rounded-lg border border-slate-300 px-2 py-1.5" /></label>
            <label className="space-y-1"><span>Timeout sesion</span><input type="number" min={30} value={state.auth.sessionTimeoutMinutes} onChange={(e) => setState((current) => ({ ...current, auth: { ...current.auth, sessionTimeoutMinutes: Number(e.target.value) || 30 } }))} className="w-full rounded-lg border border-slate-300 px-2 py-1.5" /></label>
            <label className="space-y-1"><span>Rate limit/min</span><input type="number" min={10} value={state.api.rateLimitPerMinute} onChange={(e) => setState((current) => ({ ...current, api: { ...current.api, rateLimitPerMinute: Number(e.target.value) || 10 } }))} className="w-full rounded-lg border border-slate-300 px-2 py-1.5" /></label>
          </div>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={state.auth.requireMfaAdmins} onChange={(e) => setState((current) => ({ ...current, auth: { ...current.auth, requireMfaAdmins: e.target.checked } }))} />MFA obligatorio admins</label>
        </article>
      )}

      {view === 'infra' && (
        <div className="grid xl:grid-cols-2 gap-4">
          <article className="rounded-2xl border border-slate-200 p-4 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Archivos (Storage)</p>
          <input value={storageDraft.bucketName} onChange={(e) => setState((current) => ({ ...current, storage: [{ ...storageDraft, bucketName: e.target.value }] }))} placeholder="Nombre del contenedor de archivos (bucket)" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
          <input value={storageDraft.allowedMimeTypes.join(',')} onChange={(e) => setState((current) => ({ ...current, storage: [{ ...storageDraft, allowedMimeTypes: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) }] }))} placeholder="Tipos permitidos: image/png,application/pdf" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
        </article>
        <article className="rounded-2xl border border-slate-200 p-4 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Funciones Edge</p>
          <input value={edgeDraft.functionName} onChange={(e) => setState((current) => ({ ...current, edgeFunctions: [{ ...edgeDraft, functionName: e.target.value }] }))} placeholder="Nombre de la función edge" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
          <input value={edgeDraft.routePath} onChange={(e) => setState((current) => ({ ...current, edgeFunctions: [{ ...edgeDraft, routePath: e.target.value }] }))} placeholder="Ruta HTTP de la función (ej: /api/sync)" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
        </article>
      </div>
      )}

      {view === 'avanzado' && (
        <article className="rounded-2xl border border-slate-200 p-4 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Vista previa técnica (SQL)</p>
          <div className="text-xs text-slate-700 space-y-2">
            <p><span className="font-black">Sentencias SQL:</span> {generated.sql.length}</p>
            <p><span className="font-black">Sentencias de reversa (rollback):</span> {generated.rollbackSql.length}</p>
          </div>
          <textarea value={generated.sql.join('\n')} readOnly rows={12} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono bg-slate-50" />
        </article>
      )}

      {view === 'historial' && (
        <div className="rounded-2xl border border-slate-200 p-4 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
            <p className="font-black uppercase tracking-widest text-xs text-slate-600 mb-1">Estados explicados</p>
            <p><span className="font-semibold">Borrador:</span> configuración guardada, aún no aplicada.</p>
            <p><span className="font-semibold">Validado:</span> SQL revisado por reglas automáticas; listo para aplicar.</p>
            <p><span className="font-semibold">Aplicado:</span> cambios ejecutados en base real.</p>
            <p><span className="font-semibold">Fallido:</span> error al validar o ejecutar; revisar detalle.</p>
            <p><span className="font-semibold">Revertido:</span> se ejecutó rollback para deshacer cambios.</p>
          </div>
          {uiError && (
            <AsyncState
              state="error"
              title="No se pudo cargar el historial"
              message={uiError}
              onRetry={() => {
                void loadHistory();
              }}
              compact
            />
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Historial</p>
            <button onClick={() => void loadHistory()} disabled={loadingHistory} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-100 disabled:opacity-50">
              {loadingHistory ? 'Cargando...' : 'Refrescar'}
            </button>
          </div>
          <div className="overflow-auto border border-slate-100 rounded-xl">
            {loadingHistory ? (
              <div className="p-4">
                <AsyncState
                  state="loading"
                  title="Cargando historial"
                  message="Recuperando changesets guardados."
                  compact
                />
              </div>
            ) : history.length === 0 ? (
              <div className="p-4">
                <AsyncState
                  state="empty"
                  title="Sin changesets en historial"
                  message="Guarda un borrador para comenzar el versionado técnico."
                  compact
                />
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest">
                  <tr><th className="p-2 text-left">Selección</th><th className="p-2 text-left">Título</th><th className="p-2 text-left">Alcance</th><th className="p-2 text-left">Estado</th></tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="p-2"><input type="radio" checked={selectedChangesetId === item.id} onChange={() => setSelectedChangesetId(item.id)} /></td>
                      <td className="p-2"><p className="font-bold text-slate-700">{item.title}</p><p className="text-slate-500">{item.id}</p>{item.error_text && <p className="text-rose-600">{item.error_text}</p>}</td>
                      <td className="p-2 text-slate-600">{item.scope === 'global' ? 'Global (todos)' : 'Por colegio'}</td>
                      <td className="p-2"><span className={`px-2 py-1 rounded-full font-black uppercase text-xs ${statusBadge[item.status]}`}>{statusLabel[item.status]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void applySelectedChangeset()} disabled={!selectedChangesetId || executing} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 flex items-center gap-2"><Play className="w-3.5 h-3.5" />Aplicar</button>
            <button onClick={() => void revertSelectedChangeset()} disabled={!selectedChangesetId || executing} className="px-3 py-2 rounded-xl bg-amber-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 flex items-center gap-2"><RotateCcw className="w-3.5 h-3.5" />Revertir</button>
          </div>
        </div>
      )}

      {(validationErrors.length > 0 || serverValidation || (uiError && view !== 'historial') || generated.impactPreview.warnings.length > 0) && (
        <div className="rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
          {uiError && view !== 'historial' && <p className="text-rose-700 font-semibold">{uiError}</p>}
          {validationErrors.map((error) => <p key={error} className="text-rose-700">{error}</p>)}
          {serverValidation?.errors.map((error) => <p key={error} className="text-rose-700">{error}</p>)}
          {serverValidation?.warnings.map((warning) => <p key={warning} className="text-amber-700">{warning}</p>)}
          {generated.impactPreview.warnings.map((warning) => <p key={warning} className="text-amber-700 flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 mt-0.5" />{warning}</p>)}
          {serverValidation?.ok && <p className="text-emerald-700 font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Validacion correcta.</p>}
        </div>
      )}
    </section>
  );
};

const BackendConfigStudio = () => useBackendConfigStudioView();

export default BackendConfigStudio;

