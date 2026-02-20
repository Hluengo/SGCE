/**
 * Hook useGccForm
 * Centraliza la gestión de estado del formulario GCC usando Reducer Pattern
 * Reemplaza 15+ useState hooks dispersos
 * 
 * Ventajas:
 * - Sincronización garantizada de estado
 * - Transiciones de estado predecibles
 * - Debugging facilitado
 * - Reutilizable en otros componentes
 */

import { useReducer, useCallback, Dispatch } from 'react';

export type MecanismoGCC = 'MEDIACION' | 'CONCILIACION' | 'ARBITRAJE_PEDAGOGICO';

export interface Compromiso {
  id: string;
  descripcion: string;
  fechaCumplimiento: string;
  responsable: string;
  completado: boolean;
}

export interface GccFormState {
  // Casos seleccionado
  selectedCaseId: string | null;
  selectedMediacionId: string | null;
  
  // Datos del proceso
  compromisos: Compromiso[];
  statusGCC: 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO';
  mecanismoSeleccionado: MecanismoGCC;
  facilitador: string;
  
  // Nuevo compromiso (formulario)
  nuevoCompromiso: {
    descripcion: string;
    fecha: string;
    responsable: string;
  };
  
  // Estados de UI
  uiState: {
    showDerivacionForm: boolean;
    showResultadoForm: boolean;
    showCierreModal: boolean;
    showDashboard: boolean;
    showActaPreview: boolean;
  };
  
  // Estados de carga
  isLoading: {
    derivacion: boolean;
    cierre: boolean;
    general: boolean;
  };
  
  // Estados de error
  error: {
    derivacion: string | null;
    cierre: string | null;
    general: string | null;
  };
}

export type GccFormAction =
  | { type: 'SELECT_CASE'; payload: string | null }
  | { type: 'SET_MEDIACION_ID'; payload: string | null }
  | { type: 'RESET_CASO' }
  | { type: 'CAMBIAR_MECANISMO'; payload: MecanismoGCC }
  | { type: 'CAMBIAR_STATUS'; payload: 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO' }
  | { type: 'CAMBIAR_FACILITADOR'; payload: string }
  | { type: 'AGREGAR_COMPROMISO'; payload: Compromiso }
  | { type: 'ELIMINAR_COMPROMISO'; payload: string }
  | { type: 'TOGGLE_CUMPLIMIENTO'; payload: string }
  | { type: 'ACTUALIZAR_NUEVO_COMPROMISO'; payload: Partial<GccFormState['nuevoCompromiso']> }
  | { type: 'LIMPIAR_NUEVO_COMPROMISO' }
  | { type: 'TOGGLE_MODAL'; payload: keyof GccFormState['uiState'] }
  | { type: 'SET_LOADING'; payload: { key: keyof GccFormState['isLoading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: { key: keyof GccFormState['error']; value: string | null } }
  | { type: 'LIMPIAR_ERRORES' };

const INITIAL_STATE: GccFormState = {
  selectedCaseId: null,
  selectedMediacionId: null,
  compromisos: [],
  statusGCC: 'PROCESO',
  mecanismoSeleccionado: 'MEDIACION',
  facilitador: 'Psicóloga Ana María González',
  nuevoCompromiso: {
    descripcion: '',
    fecha: '',
    responsable: ''
  },
  uiState: {
    showDerivacionForm: false,
    showResultadoForm: false,
    showCierreModal: false,
    showDashboard: false,
    showActaPreview: false
  },
  isLoading: {
    derivacion: false,
    cierre: false,
    general: false
  },
  error: {
    derivacion: null,
    cierre: null,
    general: null
  }
};

function gccFormReducer(state: GccFormState, action: GccFormAction): GccFormState {
  switch (action.type) {
    case 'SELECT_CASE':
      return {
        ...state,
        selectedCaseId: action.payload,
        selectedMediacionId: null,
        compromisos: [],
        statusGCC: 'PROCESO',
        uiState: {
          ...state.uiState,
          showDerivacionForm: false,
          showResultadoForm: false,
          showActaPreview: false
        }
      };

    case 'SET_MEDIACION_ID':
      return {
        ...state,
        selectedMediacionId: action.payload
      };

    case 'RESET_CASO':
      return {
        ...state,
        selectedCaseId: null,
        selectedMediacionId: null,
        compromisos: [],
        statusGCC: 'PROCESO',
        mecanismoSeleccionado: 'MEDIACION',
        uiState: {
          ...state.uiState,
          showDerivacionForm: false,
          showResultadoForm: false,
          showCierreModal: false,
          showActaPreview: false
        },
        nuevoCompromiso: INITIAL_STATE.nuevoCompromiso
      };

    case 'CAMBIAR_MECANISMO':
      return {
        ...state,
        mecanismoSeleccionado: action.payload
      };

    case 'CAMBIAR_STATUS':
      return {
        ...state,
        statusGCC: action.payload
      };

    case 'CAMBIAR_FACILITADOR':
      return {
        ...state,
        facilitador: action.payload
      };

    case 'AGREGAR_COMPROMISO':
      return {
        ...state,
        compromisos: [...state.compromisos, action.payload],
        nuevoCompromiso: INITIAL_STATE.nuevoCompromiso
      };

    case 'ELIMINAR_COMPROMISO':
      return {
        ...state,
        compromisos: state.compromisos.filter(c => c.id !== action.payload)
      };

    case 'TOGGLE_CUMPLIMIENTO':
      return {
        ...state,
        compromisos: state.compromisos.map(c =>
          c.id === action.payload ? { ...c, completado: !c.completado } : c
        )
      };

    case 'ACTUALIZAR_NUEVO_COMPROMISO':
      return {
        ...state,
        nuevoCompromiso: {
          ...state.nuevoCompromiso,
          ...action.payload
        }
      };

    case 'LIMPIAR_NUEVO_COMPROMISO':
      return {
        ...state,
        nuevoCompromiso: INITIAL_STATE.nuevoCompromiso
      };

    case 'TOGGLE_MODAL':
      return {
        ...state,
        uiState: {
          ...state.uiState,
          [action.payload]: !state.uiState[action.payload]
        }
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: {
          ...state.isLoading,
          [action.payload.key]: action.payload.value
        }
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: {
          ...state.error,
          [action.payload.key]: action.payload.value
        }
      };

    case 'LIMPIAR_ERRORES':
      return {
        ...state,
        error: INITIAL_STATE.error
      };

    default:
      return state;
  }
}

interface UseGccFormReturn {
  state: GccFormState;
  dispatch: Dispatch<GccFormAction>;
  // Helper methods
  selectCase: (caseId: string | null) => void;
  setMediacionId: (id: string | null) => void;
  resetCaso: () => void;
  cambiarMecanismo: (mecanismo: MecanismoGCC) => void;
  cambiarStatus: (status: 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO') => void;
  cambiarFacilitador: (facilitador: string) => void;
  agregarCompromiso: (compromiso: Compromiso) => void;
  eliminarCompromiso: (id: string) => void;
  toggleCumplimiento: (id: string) => void;
  actualizarNuevoCompromiso: (updates: Partial<GccFormState['nuevoCompromiso']>) => void;
  limpiarNuevoCompromiso: () => void;
  toggleModal: (modal: keyof GccFormState['uiState']) => void;
  setLoading: (key: keyof GccFormState['isLoading'], value: boolean) => void;
  setError: (key: keyof GccFormState['error'], value: string | null) => void;
  limpiarErrores: () => void;
}

export function useGccForm(): UseGccFormReturn {
  const [state, dispatch] = useReducer(gccFormReducer, INITIAL_STATE);

  const selectCase = useCallback((caseId: string | null) => {
    dispatch({ type: 'SELECT_CASE', payload: caseId });
  }, []);

  const setMediacionId = useCallback((id: string | null) => {
    dispatch({ type: 'SET_MEDIACION_ID', payload: id });
  }, []);

  const resetCaso = useCallback(() => {
    dispatch({ type: 'RESET_CASO' });
  }, []);

  const cambiarMecanismo = useCallback((mecanismo: MecanismoGCC) => {
    dispatch({ type: 'CAMBIAR_MECANISMO', payload: mecanismo });
  }, []);

  const cambiarStatus = useCallback((status: 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO') => {
    dispatch({ type: 'CAMBIAR_STATUS', payload: status });
  }, []);

  const cambiarFacilitador = useCallback((facilitador: string) => {
    dispatch({ type: 'CAMBIAR_FACILITADOR', payload: facilitador });
  }, []);

  const agregarCompromiso = useCallback((compromiso: Compromiso) => {
    dispatch({ type: 'AGREGAR_COMPROMISO', payload: compromiso });
  }, []);

  const eliminarCompromiso = useCallback((id: string) => {
    dispatch({ type: 'ELIMINAR_COMPROMISO', payload: id });
  }, []);

  const toggleCumplimiento = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_CUMPLIMIENTO', payload: id });
  }, []);

  const actualizarNuevoCompromiso = useCallback((updates: Partial<GccFormState['nuevoCompromiso']>) => {
    dispatch({ type: 'ACTUALIZAR_NUEVO_COMPROMISO', payload: updates });
  }, []);

  const limpiarNuevoCompromiso = useCallback(() => {
    dispatch({ type: 'LIMPIAR_NUEVO_COMPROMISO' });
  }, []);

  const toggleModal = useCallback((modal: keyof GccFormState['uiState']) => {
    dispatch({ type: 'TOGGLE_MODAL', payload: modal });
  }, []);

  const setLoading = useCallback((key: keyof GccFormState['isLoading'], value: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: { key, value } });
  }, []);

  const setError = useCallback((key: keyof GccFormState['error'], value: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: { key, value } });
  }, []);

  const limpiarErrores = useCallback(() => {
    dispatch({ type: 'LIMPIAR_ERRORES' });
  }, []);

  return {
    state,
    dispatch,
    selectCase,
    setMediacionId,
    resetCaso,
    cambiarMecanismo,
    cambiarStatus,
    cambiarFacilitador,
    agregarCompromiso,
    eliminarCompromiso,
    toggleCumplimiento,
    actualizarNuevoCompromiso,
    limpiarNuevoCompromiso,
    toggleModal,
    setLoading,
    setError,
    limpiarErrores
  };
}
