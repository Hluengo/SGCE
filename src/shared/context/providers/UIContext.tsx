/**
 * UIContext - Contexto específico para estado de UI
 * Maneja modales, wizards, notifications y otros estados de interfaz
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type { Expediente } from '@/types';

/**
 * Tipos de contexto para UI
 */
interface UIContextType {
  // Wizard de expedientes
  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
  toggleWizard: () => void;

  // Assistant legal
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
  toggleAssistant: () => void;

  // Expediente seleccionado (para detalle)
  expedienteSeleccionado: Expediente | null;
  setExpedienteSeleccionado: (exp: Expediente | null) => void;
  selectExpediente: (exp: Expediente | null) => void;

  // Offline status
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;

  // Notifications
  notification: Notification | null;
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  hideNotification: () => void;
}

/**
 * Tipo de notificación
 */
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// Crear contexto
const UIContext = createContext<UIContextType | undefined>(undefined);

/**
 * Provider de UIContext
 */
export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Assistant state
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Expediente seleccionado
  const [expedienteSeleccionado, setExpedienteSeleccionado] =
    useState<Expediente | null>(null);

  // Online status
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Notification state
  const [notification, setNotification] = useState<Notification | null>(null);

  // Toggle wizard
  const toggleWizard = useCallback(() => {
    setIsWizardOpen((prev) => !prev);
  }, []);

  // Toggle assistant
  const toggleAssistant = useCallback(() => {
    setIsAssistantOpen((prev) => !prev);
  }, []);

  // Select expediente
  const selectExpediente = useCallback((exp: Expediente | null) => {
    setExpedienteSeleccionado(exp);
  }, []);

  // Show notification
  const showNotification = useCallback(
    (notificationData: Omit<Notification, 'id'>) => {
      const id = `notification-${Date.now()}`;
      const notificationItem: Notification = {
        ...notificationData,
        id,
        duration: notificationData.duration ?? 5000,
      };

      setNotification(notificationItem);

      // Auto-hide after duration
      if (notificationItem.duration && notificationItem.duration > 0) {
        setTimeout(() => {
          setNotification((prev) => (prev?.id === id ? null : prev));
        }, notificationItem.duration);
      }
    },
    []
  );

  // Hide notification
  const hideNotification = useCallback(() => {
    setNotification(null);
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
        expedienteSeleccionado,
        setExpedienteSeleccionado,
        selectExpediente,
        isOnline,
        setIsOnline,
        notification,
        showNotification,
        hideNotification,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

/**
 * Hook para usar el contexto de UI
 */
export const useUIContext = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIContext debe usarse dentro de UIProvider');
  }
  return context;
};

/**
 * Hook específico para el wizard
 */
export const useWizard = () => {
  const { isWizardOpen, setIsWizardOpen, toggleWizard } = useUIContext();
  return { isWizardOpen, setIsWizardOpen, toggleWizard };
};

/**
 * Hook específico para el assistant
 */
export const useAssistant = () => {
  const { isAssistantOpen, setIsAssistantOpen, toggleAssistant } = useUIContext();
  return { isAssistantOpen, setIsAssistantOpen, toggleAssistant };
};

/**
 * Hook específico para notificaciones
 */
export const useNotification = () => {
  const { notification, showNotification, hideNotification } = useUIContext();

  const success = useCallback(
    (title: string, message?: string) => {
      showNotification({ type: 'success', title, message });
    },
    [showNotification]
  );

  const error = useCallback(
    (title: string, message?: string) => {
      showNotification({ type: 'error', title, message });
    },
    [showNotification]
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      showNotification({ type: 'warning', title, message });
    },
    [showNotification]
  );

  const info = useCallback(
    (title: string, message?: string) => {
      showNotification({ type: 'info', title, message });
    },
    [showNotification]
  );

  return {
    notification,
    showNotification,
    hideNotification,
    success,
    error,
    warning,
    info,
  };
};

export default UIContext;
