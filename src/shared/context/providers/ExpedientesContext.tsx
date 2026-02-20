/**
 * ExpedientesContext - Contexto específico para gestión de expedientes
 * Implementa la separación de responsabilidades según arquitectura
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
  useRef,
} from 'react';
import type { Expediente, EtapaProceso, GravedadFalta } from '@/types';
import { calcularPlazoLegal, addBusinessDays } from '@/shared/utils/plazos';
import { supabase } from '@/shared/lib/supabaseClient';
import type { ExpedienteQueryRow } from '@/shared/types/supabase';
import { hitosBase } from '@/shared/domain/expedientes/hitosBase';

// Constante de almacenamiento
const STORAGE_KEY = 'sge_expedientes_v1';

/**
 * Tipos de contexto para expedientes
 */
interface ExpedientesContextType {
  // Datos
  expedientes: Expediente[];
  loading: boolean;
  error: string | null;

  // Acciones
  setExpedientes: React.Dispatch<React.SetStateAction<Expediente[]>>;
  addExpediente: (exp: Expediente) => void;
  updateExpediente: (id: string, updates: Partial<Expediente>) => void;
  removeExpediente: (id: string) => void;
  actualizarEtapa: (id: string, nuevaEtapa: EtapaProceso) => void;

  // Utilidades
  getExpedienteById: (id: string) => Expediente | undefined;
  refreshExpedientes: () => Promise<void>;
  calcularPlazo: (fecha: Date, gravedad: GravedadFalta) => Date;
}

// Crear contexto
const ExpedientesContext = createContext<ExpedientesContextType | undefined>(undefined);

export { hitosBase } from '@/shared/domain/expedientes/hitosBase';

/**
 * Mapeo de gravedad desde base de datos
 */
const mapGravedad = (tipo: string | null | undefined): GravedadFalta => {
  switch ((tipo ?? '').toLowerCase()) {
    case 'leve':
      return 'LEVE';
    case 'relevante':
      return 'RELEVANTE';
    case 'expulsion':
      return 'GRAVISIMA_EXPULSION';
    default:
      return 'RELEVANTE';
  }
};

/**
 * Mapeo de etapa desde base de datos
 */
const mapEtapa = (estado: string | null | undefined): EtapaProceso => {
  switch ((estado ?? '').toLowerCase()) {
    case 'inicio':
    case 'apertura':
      return 'INICIO';
    case 'notificado':
      return 'NOTIFICADO';
    case 'descargos':
      return 'DESCARGOS';
    case 'investigacion':
      return 'INVESTIGACION';
    case 'resolucion_pendiente':
    case 'resolucion':
      return 'RESOLUCION_PENDIENTE';
    case 'reconsideracion':
      return 'RECONSIDERACION';
    case 'cerrado_sancion':
      return 'CERRADO_SANCION';
    case 'cerrado_gcc':
      return 'CERRADO_GCC';
    case 'cerrado':
      return 'CERRADO_SANCION';
    default:
      return 'INVESTIGACION';
  }
};

/**
 * Datos iniciales de expedientes
 */
const initialExpedientes: Expediente[] = [
  {
    id: 'EXP-2025-001',
    nnaNombre: 'A. Rojas B.',
    nnaNombreB: null,
    nnaCursoB: null,
    etapa: 'INVESTIGACION',
    gravedad: 'RELEVANTE',
    fechaInicio: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    plazoFatal: addBusinessDays(new Date(), 40).toISOString(),
    encargadoId: 'u1',
    esProcesoExpulsion: false,
    accionesPrevias: false,
    hitos: hitosBase(false),
  },
  {
    id: 'EXP-2025-002',
    nnaNombre: 'M. Soto L.',
    nnaNombreB: null,
    nnaCursoB: null,
    etapa: 'NOTIFICADO',
    gravedad: 'GRAVISIMA_EXPULSION',
    fechaInicio: new Date().toISOString(),
    plazoFatal: addBusinessDays(new Date(), 10).toISOString(),
    encargadoId: 'u1',
    esProcesoExpulsion: true,
    accionesPrevias: true,
    hitos: hitosBase(true),
  },
];

/**
 * Provider de ExpedientesContext
 */
export const ExpedientesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [expedientes, setExpedientes] = useState<Expediente[]>(() => {
    if (typeof window === 'undefined') return initialExpedientes;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Expediente[];
    } catch {
      // ignore cache errors
    }
    return initialExpedientes;
  });

  const [uiState, setUiState] = useState<{ loading: boolean; error: string | null }>({
    loading: false,
    error: null
  });
  const dataLoadedRef = useRef(false);

  const applyLoadedExpedientes = useCallback((mapped: Expediente[]) => {
    if (mapped.length > 0 && !dataLoadedRef.current) {
      dataLoadedRef.current = true;
      setExpedientes(mapped);
    }
  }, []);

  // Persistir en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expedientes));
    } catch {
      // ignore cache errors
    }
  }, [expedientes]);

  // Cargar desde Supabase
  useEffect(() => {
    if (!supabase) return;

    const loadExpedientes = async () => {
      if (dataLoadedRef.current) return;
      if (!supabase) return;
      setUiState(prev => ({ ...prev, loading: true, error: null }));
      let nextError: string | null = null;

      try {
        const { data, error } = await supabase
          .from('expedientes')
          .select('*, estudiante_a:estudiantes!expedientes_estudiante_id_fkey(nombre_completo, rut, curso), estudiante_b:estudiantes!expedientes_estudiante_b_id_fkey(nombre_completo, rut, curso)')
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) throw error;

        // Mapear datos de la API al formato de dominio
        const mapped: Expediente[] = (data as ExpedienteQueryRow[] || []).map((row) => {
          const gravedad = mapGravedad(row.tipo_falta);
          const esExpulsion = gravedad === 'GRAVISIMA_EXPULSION';
          const fechaInicio = row.fecha_inicio
            ? new Date(row.fecha_inicio).toISOString()
            : new Date().toISOString();
          const plazoFatal = row.plazo_fatal
            ? new Date(row.plazo_fatal).toISOString()
            : addBusinessDays(
                new Date(),
                esExpulsion ? 10 : 40
              ).toISOString();

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
            etapa: mapEtapa(etapaDb),
            gravedad,
            fechaInicio,
            plazoFatal,
            encargadoId: row.creado_por ?? '',
            esProcesoExpulsion: esExpulsion,
            accionesPrevias: false,
            hitos: hitosBase(esExpulsion),
          };
        });

        applyLoadedExpedientes(mapped);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        nextError = message;
      } finally {
        setUiState(prev => ({ ...prev, loading: false, error: nextError }));
      }
    };

    loadExpedientes();
  }, [applyLoadedExpedientes]);

  // Calcular plazo legal
  const calcularPlazo = useCallback(
    (fecha: Date, gravedad: GravedadFalta): Date => {
      return calcularPlazoLegal(fecha, gravedad);
    },
    []
  );

  // Agregar expediente
  const addExpediente = useCallback((exp: Expediente) => {
    setExpedientes((prev) => [exp, ...prev]);
  }, []);

  // Actualizar expediente
  const updateExpediente = useCallback(
    (id: string, updates: Partial<Expediente>) => {
      setExpedientes((prev) =>
        prev.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp))
      );

      // Sincronizar con Supabase
      if (supabase) {
        const target = expedientes.find((e) => e.id === id);
        if (target?.dbId) {
          supabase
            .from('expedientes')
            .update({
              etapa_proceso: updates.etapa,
              estado_legal: updates.etapa,
            })
            .eq('id', target.dbId)
            .then(({ error }) => {
              if (error) {
                console.warn(
                  'Supabase: no se pudo actualizar expediente',
                  error
                );
              }
            });
        }
      }
    },
    [expedientes]
  );

  // Eliminar expediente
  const removeExpediente = useCallback((id: string) => {
    setExpedientes((prev) => prev.filter((exp) => exp.id !== id));
  }, []);

  // Actualizar etapa
  const actualizarEtapa = useCallback(
    (id: string, nuevaEtapa: EtapaProceso) => {
      updateExpediente(id, { etapa: nuevaEtapa });
    },
    [updateExpediente]
  );

  // Obtener expediente por ID
  const getExpedienteById = useCallback(
    (id: string) => {
      return expedientes.find((exp) => exp.id === id);
    },
    [expedientes]
  );

  // Refrescar expedientes
  const refreshExpedientes = useCallback(async () => {
    if (!supabase) return;
    
    dataLoadedRef.current = false;
    setUiState({ loading: true, error: null });
    let nextError: string | null = null;

    try {
      const { data, error } = await supabase
        .from('expedientes')
        .select('*, estudiante_a:estudiantes!expedientes_estudiante_id_fkey(nombre_completo, rut, curso), estudiante_b:estudiantes!expedientes_estudiante_b_id_fkey(nombre_completo, rut, curso)')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const mapped: Expediente[] = (data as ExpedienteQueryRow[] || []).map((row) => {
        const gravedad = mapGravedad(row.tipo_falta);
        const esExpulsion = gravedad === 'GRAVISIMA_EXPULSION';

        const estudianteA = Array.isArray(row.estudiante_a) ? row.estudiante_a[0] : row.estudiante_a;
        const estudianteB = Array.isArray(row.estudiante_b) ? row.estudiante_b[0] : row.estudiante_b;

        return {
          id: row.folio ?? row.id,
          dbId: row.id,
          nnaNombre: estudianteA?.nombre_completo ?? 'Sin nombre',
          nnaCurso: estudianteA?.curso ?? null,
          nnaNombreB: estudianteB?.nombre_completo ?? null,
          nnaCursoB: estudianteB?.curso ?? null,
          etapa: mapEtapa(row.etapa_proceso ?? row.estado_legal),
          gravedad,
          fechaInicio: row.fecha_inicio
            ? new Date(row.fecha_inicio).toISOString()
            : new Date().toISOString(),
          plazoFatal: row.plazo_fatal
            ? new Date(row.plazo_fatal).toISOString()
            : addBusinessDays(new Date(), esExpulsion ? 10 : 40).toISOString(),
          encargadoId: row.creado_por ?? '',
          esProcesoExpulsion: esExpulsion,
          accionesPrevias: false,
          hitos: hitosBase(esExpulsion),
        };
      });

      if (mapped.length > 0) {
        setExpedientes(mapped);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      nextError = message;
    } finally {
      setUiState({ loading: false, error: nextError });
    }
  }, []);

  return (
    <ExpedientesContext.Provider
      value={{
        expedientes,
        loading: uiState.loading,
        error: uiState.error,
        setExpedientes,
        addExpediente,
        updateExpediente,
        removeExpediente,
        actualizarEtapa,
        getExpedienteById,
        refreshExpedientes,
        calcularPlazo,
      }}
    >
      {children}
    </ExpedientesContext.Provider>
  );
};

/**
 * Hook para usar el contexto de expedientes
 */
export const useExpedientesContext = () => {
  const context = useContext(ExpedientesContext);
  if (!context) {
    throw new Error(
      'useExpedientesContext debe usarse dentro de ExpedientesProvider'
    );
  }
  return context;
};

export default ExpedientesContext;
