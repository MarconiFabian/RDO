
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';

type ToastType = 'default' | 'destructive' | 'warning' | 'success';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastType;
}

// Singleton para gerenciar toasts globalmente sem depender de contexto aninhado complexo
let toastListeners: Array<(t: Toast) => void> = [];

export const toast = ({ title, description, variant }: Omit<Toast, 'id'>) => {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast = { id, title, description, variant };
  toastListeners.forEach(listener => listener(newToast));
};

export const Toaster = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const addToast = (t: Toast) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => {
        setToasts(prev => prev.filter(item => item.id !== t.id));
      }, 5000);
    };

    toastListeners.push(addToast);
    return () => {
      toastListeners = toastListeners.filter(l => l !== addToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className={`group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all animate-in slide-in-from-right-full 
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

export const useToast = () => {
  return { toast };
};
