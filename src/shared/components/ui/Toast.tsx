import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * Toast individual
 */
interface Toast {
  /**
   * Identificador único del toast
   */
  id: string;

  /**
   * Mensaje a mostrar
   */
  message: string;

  /**
   * Tipo de toast (determina el color e icono)
   */
  type: 'info' | 'success' | 'warning' | 'error';
}

/**
 * Valor del contexto de Toast
 */
interface ToastContextValue {
  /**
   * Lista de toasts activos
   */
  toasts: Toast[];

  /**
   * Agrega un nuevo toast
   * @param message - Mensaje del toast
   * @param type - Tipo de toast (info, success, warning, error)
   */
  addToast: (message: string, type?: Toast['type']) => void;

  /**
   * Elimina un toast por su ID
   * @param id - ID del toast a eliminar
   */
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Provider de Toast - Gestiona notificaciones emergentes globalmente
 *
 * Características:
 * - Muestra toasts en la esquina inferior derecha
 * - Auto-eliminación después de 5 segundos
 * - Tipos: info, success, warning, error
 *
 * @example
 * ```tsx
 * // En App.tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * ```
 */
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/**
 * ToastItem - Componente individual de toast
 *
 * @internal
 */
const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const icons = {
    info: <Info className="w-5 h-5 text-blue-600" />,
    success: <CheckCircle className="w-5 h-5 text-emerald-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
  };

  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className={`
      flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-in slide-in-from-right
      ${styles[toast.type]}
    `}>
      {icons[toast.type]}
      <span className="text-sm font-medium">{toast.message}</span>
      <button onClick={onClose} className="ml-2 p-1 hover:bg-black/5 rounded">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Hook para acceder al contexto de Toast
 *
 * @returns Objeto con toasts, addToast y removeToast
 * @throws Error si se usa fuera de ToastProvider
 *
 * @example
 * ```tsx
 * const { addToast } = useToast();
 *
 * const handleSave = () => {
 *   addToast('Cambios guardados correctamente', 'success');
 * };
 * ```
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export default ToastProvider;
