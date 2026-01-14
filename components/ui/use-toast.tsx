
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X } from 'lucide-react';

type ToastType = 'default' | 'destructive' | 'warning' | 'success';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastType;
}

const ToastContext = createContext<{ toast: (t: Omit<Toast, 'id'>) => void }>({ toast: () => {} });

export const Toaster = () => {
  const { toasts, removeToast } = useToastInternal();
  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className={`group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all 
            ${t.variant === 'destructive' ? 'bg-red-600 border-red-600 text-white' : 
              t.variant === 'warning' ? 'bg-amber-500 border-amber-500 text-white' :
              t.variant === 'success' ? 'bg-green-600 border-green-600 text-white' :
              'bg-white border-slate-200'}`}
        >
          <div className="grid gap-1">
            {t.title && <div className="text-sm font-semibold">{t.title}</div>}
            {t.description && <div className="text-sm opacity-90">{t.description}</div>}
          </div>
          <button 
            onClick={() => removeToast(t.id)} 
            className="absolute right-2 top-2 rounded-md p-1 opacity-50 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

const useToastInternal = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const toast = useCallback(({ title, description, variant }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  return { toasts, toast, removeToast };
};

export const toast = (t: Omit<Toast, 'id'>) => {
    // This is a simplified static hook-like usage.
    // In a real app, we'd use a singleton or global state.
    console.log("Toast:", t);
};

export const useToast = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);
    const toastFn = useCallback(({ title, description, variant }: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, title, description, variant }]);
        setTimeout(() => removeToast(id), 5000);
    }, [removeToast]);

    return { toast: toastFn };
};
