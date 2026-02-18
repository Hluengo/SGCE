import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  /**
   * Controla la visibilidad del modal
   * @required
   */
  isOpen: boolean;

  /**
   * Callback al cerrar el modal
   * @required
   */
  onClose: () => void;

  /**
   * Título del modal
   */
  title?: string;

  /**
   * Contenido del modal
   * @required
   */
  children: React.ReactNode;

  /**
   * Tamaño del modal
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Componente Modal - Ventana emergente reutilizable
 *
 * Características:
 * - Cierre con tecla ESC
 * - Cierre al hacer click fuera del contenido
 * - Bloqueo de scroll del body cuando está abierto
 * - Animaciones de entrada y salida
 *
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirmar acción"
 *   size="sm"
 * >
 *   <p>¿Estás seguro de eliminar este registro?</p>
 * </Modal>
 *
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Editar Expediente"
 *   size="lg"
 * >
 *   <FormularioExpediente />
 * </Modal>
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Cerrar al hacer click fuera
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
      onClick={handleOverlayClick}
    >
      <div className={`
        bg-white w-full rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]
        ${sizes[size]}
      `}>
        {/* Header */}
        {(title || typeof onClose === 'function') && (
          <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            {title && (
              <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                {title}
              </h3>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
