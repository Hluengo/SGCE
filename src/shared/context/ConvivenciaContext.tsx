
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useMemo, useRef } from 'react';
import { Estudiante, Expediente, EtapaProceso, GravedadFalta } from '@/types';
import { calcularPlazoLegal, addBusinessDays } from '@/shared/utils/plazos';
import { supabase, safeSupabase } from '@/shared/lib/supabaseClient';
import { useTenant } from '@/shared/context/TenantContext';
import { isUuid } from '@/shared/utils/expedienteRef';
import { hitosBase } from '@/shared/domain/expedientes/hitosBase';
import { 
  DbEstudiante, 
  ExpedienteQueryRow,
  mapDbTipoFaltaToGravedad,
  mapDbEstadoToEtapa
} from '@/shared/types/supabase';

// AppView removed as it's replaced by Routing

interface ConvivenciaContextType {
  expedientes: Expediente[];
  setExpedientes: React.Dispatch<React.SetStateAction<Expediente[]>>;
  estudiantes: Estudiante[];
  setEstudiantes: React.Dispatch<React.SetStateAction<Estudiante[]>>;
  expedienteSeleccionado: Expediente | null;
  setExpedienteSeleccionado: (exp: Expediente | null) => void;

  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
  actualizarEtapa: (id: string, nuevaEtapa: EtapaProceso) => void;
  calcularPlazoLegal: (fecha: Date, gravedad: GravedadFalta) => Date;
}

const ConvivenciaContext = createContext<ConvivenciaContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'sge_expedientes_v1';

const getStorageKey = (tenantId: string | null) =>
  `${STORAGE_KEY_PREFIX}:${tenantId ?? 'no-tenant'}`;

// Helper para días hábiles moved to utils/plazos.ts

export { hitosBase } from '@/shared/domain/expedientes/hitosBase';

/**
 * Carga datos de localStorage de forma segura
 * Retorna array vacío en lugar de datos ficticios
 */
const loadLocalExpedientes = (tenantId: string | null): Expediente[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getStorageKey(tenantId));
    if (raw) {
      const parsed = JSON.parse(raw);
      // Validar que sea un array
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as Expediente[];
      }
    }
  } catch (error) {
    console.warn('Error loading expedientes from localStorage:', error);
  }
  return []; // Retornar array vacío, no datos ficticios
};

export const ConvivenciaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState<Expediente | null>(null);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [uiState, setUiState] = useState({
    isWizardOpen: false,
    isAssistantOpen: false,
    supabaseLoaded: false
  });
  const { isWizardOpen, isAssistantOpen, supabaseLoaded } = uiState;
  const loadSeqRef = useRef(0);
  const expedientesRef = useRef<Expediente[]>([]);
  
  // Obtener el tenant actual para filtrar consultas
  const { tenantId } = useTenant();

  const calcularPlazo = useCallback((fecha: Date, gravedad: GravedadFalta): Date => {
    return calcularPlazoLegal(fecha, gravedad);
  }, []);

  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const setIsWizardOpen = useCallback((open: boolean) => {
    setUiState((prev) => ({ ...prev, isWizardOpen: open }));
  }, []);

  const setIsAssistantOpen = useCallback((open: boolean) => {
    setUiState((prev) => ({ ...prev, isAssistantOpen: open }));
  }, []);

  const resetTenantState = useCallback(() => {
    setExpedienteSeleccionado(null);
    setExpedientes([]);
    setEstudiantes([]);
    setUiState((prev) => ({ ...prev, supabaseLoaded: false }));
  }, []);

  const applyCachedExpedientes = useCallback((items: Expediente[]) => {
    setExpedientes(items);
  }, []);

  const applyRemoteExpedientes = useCallback((items: Expediente[]) => {
    setExpedientes(items);
    setUiState((prev) => ({ ...prev, supabaseLoaded: true }));
  }, []);

  const applyRemoteEstudiantes = useCallback((items: Estudiante[]) => {
    setEstudiantes(items);
  }, []);

  useEffect(() => {
    expedientesRef.current = expedientes;
  }, [expedientes]);

  useEffect(() => {
    const supabaseClient = supabase;
    const currentLoadSeq = ++loadSeqRef.current;
    let isCancelled = false;
    const isCurrentLoad = () => !isCancelled && currentLoadSeq === loadSeqRef.current;

    // Al cambiar tenant, limpiar estado para evitar mezcla visual entre colegios.
    resetTenantState();

    if (!tenantId) return;
    const tenantIsUuid = isUuid(tenantId);

    // Carga rápida desde cache local por tenant (solo como fallback visual mientras consulta).
    applyCachedExpedientes(loadLocalExpedientes(tenantId));
    if (!supabaseClient) return;
    if (!tenantIsUuid) {
      console.warn('ConvivenciaContext: tenantId no UUID, se omite carga remota', { tenantId });
      return;
    }

    const loadExpedientes = async () => {
      // Filtrar por establecimiento_id si hay tenant configurado
      let query = supabaseClient
        .from('expedientes')
        .select('id, folio, tipo_falta, estado_legal, etapa_proceso, fecha_inicio, plazo_fatal, creado_por, estudiante_a:estudiantes!expedientes_estudiante_id_fkey(id, nombre_completo, curso), estudiante_b:estudiantes!expedientes_estudiante_b_id_fkey(id, nombre_completo, curso)')
        .limit(200);
      
      // Añadir filtro de tenant si está disponible
      if (tenantIsUuid) {
        query = query.eq('establecimiento_id', tenantId);
      }
      
      const { data, error } = await query;

      if (!isCurrentLoad()) return;

        if (error || !data) {
          console.error('Supabase: no se pudieron cargar expedientes', error);
          applyCachedExpedientes([]);
          return;
        }

      const mapped: Expediente[] = data.map((row: ExpedienteQueryRow) => {
        const gravedad = mapDbTipoFaltaToGravedad(row.tipo_falta);
        const esExpulsion = gravedad === 'GRAVISIMA_EXPULSION';
        const fechaInicio = row.fecha_inicio ? new Date(row.fecha_inicio).toISOString() : new Date().toISOString();
        const plazoFatal = row.plazo_fatal
          ? new Date(row.plazo_fatal).toISOString()
          : addBusinessDays(new Date(), esExpulsion ? 10 : 40).toISOString();

        const etapaDb = row.etapa_proceso ?? row.estado_legal;
        const estudianteA = Array.isArray(row.estudiante_a) ? row.estudiante_a[0] : row.estudiante_a;
        const estudianteB = Array.isArray(row.estudiante_b) ? row.estudiante_b[0] : row.estudiante_b;

        return {
          id: row.folio ?? row.id,
          dbId: row.id,
          nnaNombre: estudianteA?.nombre_completo ?? 'Sin nombre',
          nnaCurso: estudianteA?.curso ?? null,
          nnaNombreB: estudianteB?.nombre_completo ?? null,
          nnaCursoB: estudianteB?.curso ?? null,
          etapa: mapDbEstadoToEtapa(etapaDb),
          gravedad,
          fechaInicio,
          plazoFatal,
          encargadoId: row.creado_por ?? '',
          esProcesoExpulsion: esExpulsion,
          accionesPrevias: false,
          hitos: hitosBase(esExpulsion)
        };
      });

      applyRemoteExpedientes(mapped);
    };

    const loadEstudiantes = async () => {
      // Filtrar por establecimiento_id si hay tenant configurado
      let query = supabaseClient
        .from('estudiantes')
        .select('id, nombre_completo, curso')
        .limit(200);
      
      // Añadir filtro de tenant si está disponible
      if (tenantIsUuid) {
        query = query.eq('establecimiento_id', tenantId);
      }
      
      const { data, error } = await query;

      if (!isCurrentLoad()) return;

      if (error || !data) {
        console.error('Supabase: no se pudieron cargar estudiantes', error);
        applyRemoteEstudiantes([]);
        return;
      }

      applyRemoteEstudiantes(
        data.map((row: DbEstudiante) => ({
          id: row.id,
          nombreCompleto: row.nombre_completo,
          curso: row.curso ?? null
        }))
      );
    };

    loadExpedientes();
    // Cargar estudiantes solo cuando sea necesario (lazy)
    // Por ahora mantenemos la carga pero no bloqueamos la UI
    loadEstudiantes().catch(err => {
      console.warn('Error cargando estudiantes (no crítico):', err);
    });
    return () => {
      isCancelled = true;
    };
  }, [tenantId, applyCachedExpedientes, applyRemoteEstudiantes, applyRemoteExpedientes, resetTenantState]);

  useEffect(() => {
    if (!tenantId || !supabaseLoaded) return;
    try {
      localStorage.setItem(getStorageKey(tenantId), JSON.stringify(expedientes));
    } catch (error) {
      console.warn('Error saving expedientes to localStorage:', error);
    }
  }, [expedientes, supabaseLoaded, tenantId]);

  const actualizarEtapa = useCallback((id: string, nuevaEtapa: EtapaProceso) => {
    const current = expedientesRef.current.find((exp) => exp.id === id);
    if (!current) return;
    if (current.etapa === nuevaEtapa) return;

    // Update local state first (optimistic) and persist once.
    setExpedientes((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, etapa: nuevaEtapa } : exp))
    );

    if (!supabase || !current.dbId) return;

    let updateQuery = safeSupabase()
      .from('expedientes')
      .update({ etapa_proceso: nuevaEtapa })
      .eq('id', current.dbId);

    if (tenantId && isUuid(tenantId)) {
      updateQuery = updateQuery.eq('establecimiento_id', tenantId);
    }

    updateQuery.then(({ error }) => {
      if (error) {
        console.warn('Supabase: no se pudo actualizar etapa', error);
        // Revertir cambio en caso de error
        setExpedientes((prev) =>
          prev.map((exp) => (exp.id === id ? { ...exp, etapa: current.etapa } : exp))
        );
      }
    });
  }, [tenantId]);

  const contextValue = useMemo<ConvivenciaContextType>(() => ({
    expedientes,
    setExpedientes,
    estudiantes,
    setEstudiantes,
    actualizarEtapa,
    expedienteSeleccionado,
    setExpedienteSeleccionado,
    isWizardOpen,
    setIsWizardOpen,
    isAssistantOpen,
    setIsAssistantOpen,
    calcularPlazoLegal: calcularPlazo
  }), [
    expedientes,
    estudiantes,
    actualizarEtapa,
    expedienteSeleccionado,
    isWizardOpen,
    isAssistantOpen,
    calcularPlazo
  ]);

  return (
    <ConvivenciaContext.Provider value={contextValue}>
      {children}
    </ConvivenciaContext.Provider>
  );
};

export const useConvivencia = () => {
  const context = useContext(ConvivenciaContext);
  if (!context) throw new Error('useConvivencia debe usarse dentro de ConvivenciaProvider');
  return context;
};
