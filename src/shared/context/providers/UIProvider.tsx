import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/** Tipo de contexto de UI */
interface UIContextType {
  /** Estado del wizard de expedientes */
  isWizardOpen: boolean;
  /** Abrir/cerrar wizard */
  setIsWizardOpen: (open: boolean) => void;
  toggleWizard: () => void;

  /** Estado del asistente legal */
  isAssistantOpen: boolean;
  /** Abrir/cerrar asistente */
  setIsAssistantOpen: (open: boolean) => void;
  toggleAssistant: () => void;
}

/** Valor por defecto del contexto */
const defaultContext: UIContextType = {
  isWizardOpen: false,
  setIsWizardOpen: () => {},
  toggleWizard: () => {},
  isAssistantOpen: false,
  setIsAssistantOpen: () => {},
  toggleAssistant: () => {},
};

/** Contexto de UI */
const UIContext = createContext<UIContextType>(defaultContext);

/**
 * Provider de estado de UI.
 * Maneja wizard de expedientes y asistente legal.
 * @example
 * ```tsx
 * <UIProvider>
 *   <App />
 * </UIProvider>
 * ```
 */
export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const toggleWizard = useCallback(() => {
    setIsWizardOpen(prev => !prev);
  }, []);

  const toggleAssistant = useCallback(() => {
    setIsAssistantOpen(prev => !prev);
  }, []);

  return (
    <UIContext.Provider
      value={{
        isWizardOpen,
        setIsWizardOpen,
        toggleWizard,
        isAssistantOpen,
        setIsAssistantOpen,
        toggleAssistant,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

/**
 * Hook para acceder al contexto de UI.
 * @throws Error si se usa fuera de UIProvider
 * @returns Estado de UI
 * @example
 * ```tsx
 * const { isWizardOpen, toggleWizard } = useUI();
 * ```
 */
export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI debe usarse dentro de UIProvider');
  }
  return context;
};

export default UIProvider;
