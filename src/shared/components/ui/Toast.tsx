import { ToastProvider as CoreToastProvider, useToast as useCoreToast } from '@/shared/components/Toast/ToastProvider';

type LegacyToastType = 'info' | 'success' | 'warning' | 'error';

export const ToastProvider = CoreToastProvider;

export const useToast = () => {
  const context = useCoreToast();
  return {
    toasts: context.toasts,
    addToast: (message: string, type: LegacyToastType = 'info') => {
      context.showToast(type, message);
    },
    removeToast: context.hideToast,
  };
};

export default ToastProvider;
