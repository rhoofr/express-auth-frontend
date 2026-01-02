/**
 * @module hooks/useToast
 * Custom hook for showing toast notifications using react-hot-toast.
 */
import toast from 'react-hot-toast';
import type { ToastOptions } from 'react-hot-toast';

type ToastType = 'success' | 'error' | 'info' | 'loading';

interface UseToast {
  show: (type: ToastType, message: string, options?: ToastOptions) => string | void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  loading: (message: string, options?: ToastOptions) => string;
  dismiss: (toastId?: string) => void;
}

export function useToast(): UseToast {
  const show: UseToast['show'] = (type, message, options) => {
    switch (type) {
      case 'success':
        return toast.success(message, options);
      case 'error':
        return toast.error(message, options);
      case 'info':
        return toast(message, options);
      case 'loading':
        return toast.loading(message, options);
      default:
        return toast(message, options);
    }
  };

  return {
    show,
    success: (message, options) => toast.success(message, options),
    error: (message, options) => toast.error(message, options),
    info: (message, options) => toast(message, options),
    loading: (message, options) => toast.loading(message, options),
    dismiss: (toastId) => toast.dismiss(toastId),
  };
}
