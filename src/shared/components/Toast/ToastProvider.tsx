import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/** Tipos de toast */
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, title: string, message?: string) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/** Iconos por tipo */
const ToastIcon: Record<ToastType, React.FC<{ className?: string }>> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

/** Colores por tipo */
const toastStyles: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500', text: 'text-emerald-800' },
  error: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500', text: 'text-red-800' },
  warning: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-500', text: 'text-orange-800' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500', text: 'text-blue-800' },
};

/** Provider del Toast Context */
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = crypto.randomUUID();
    const toast: Toast = { id, type, title, message, duration: 5000 };
    
    setToasts(prev => [...prev, toast]);

    if (toast.duration) {
      setTimeout(() => hideToast(id), toast.duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  );
};

/** Hook para usar toasts */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
};

/** Componente Toast individual */
const ToastItem: React.FC<{ toast: Toast; onHide: (id: string) => void }> = ({ toast, onHide }) => {
  const styles = toastStyles[toast.type];
  const Icon = ToastIcon[toast.type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-start gap-3 p-4 rounded-xl border ${styles.bg} ${styles.border} shadow-lg animate-in slide-in-from-right fade-in max-w-sm`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${styles.text}`}>{toast.title}</p>
        {toast.message && (
          <p className={`text-sm mt-1 ${styles.text} opacity-80`}>{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onHide(toast.id)}
        aria-label="Cerrar notificación"
        className={`flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors ${styles.icon}`}
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
};

/** Contenedor de toasts */
const ToastContainer: React.FC<{ toasts: Toast[]; onHide: (id: string) => void }> = ({ toasts, onHide }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none"
    >
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onHide={onHide} />
        </div>
      ))}
    </div>
  );
};

export default ToastProvider;
