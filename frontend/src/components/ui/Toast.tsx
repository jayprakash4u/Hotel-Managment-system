'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'celebrate';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  celebrate: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      if (type === 'celebrate') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0B3D32', '#A51F36', '#166534', '#FFFFFF'],
        });
      }

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => showToast({ type: 'success', title, message }), [showToast]);
  const error = useCallback((title: string, message?: string) => showToast({ type: 'error', title, message }), [showToast]);
  const warning = useCallback((title: string, message?: string) => showToast({ type: 'warning', title, message }), [showToast]);
  const info = useCallback((title: string, message?: string) => showToast({ type: 'info', title, message }), [showToast]);
  const celebrate = useCallback((title: string, message?: string) => showToast({ type: 'celebrate', title, message }), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, celebrate }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-dropdown border backdrop-blur-md transform transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in',
              t.type === 'success' && 'bg-white border-[#BBF7D0] text-[#166534] dark:bg-[#071512] dark:border-[#166534]',
              t.type === 'error' && 'bg-white border-[#FECACA] text-[#991B1B] dark:bg-[#071512] dark:border-[#991B1B]',
              t.type === 'warning' && 'bg-white border-[#FDE68A] text-[#92400E] dark:bg-[#071512] dark:border-[#92400E]',
              t.type === 'info' && 'bg-white border-[#BFDBFE] text-[#1D4ED8] dark:bg-[#071512] dark:border-[#1D4ED8]',
              t.type === 'celebrate' && 'bg-white border-[#CBD5D0] text-[#0B3D32] dark:bg-[#071512] dark:border-[#145447]'
            )}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-[#DC2626]" />}
              {t.type === 'warning' && <AlertCircle className="w-5 h-5 text-[#D97706]" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-[#2563EB]" />}
              {t.type === 'celebrate' && <Sparkles className="w-5 h-5 text-[#0B3D32] dark:text-[#E5EEE9]" />}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold font-heading">{t.title}</h5>
              {t.message && <p className="text-[11px] text-[#43534D] dark:text-[#CBD5E1] mt-0.5">{t.message}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-[#64736C] hover:text-[#24352F] dark:hover:text-white p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
