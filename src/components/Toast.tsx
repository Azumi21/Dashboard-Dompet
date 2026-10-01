import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const bgStyles = {
    success: 'bg-white dark:bg-slate-900 border-l-4 border-emerald-500 text-slate-800 dark:text-slate-100 shadow-lg',
    error: 'bg-white dark:bg-slate-900 border-l-4 border-rose-500 text-slate-800 dark:text-slate-100 shadow-lg',
    info: 'bg-white dark:bg-slate-900 border-l-4 border-blue-500 text-slate-800 dark:text-slate-100 shadow-lg',
  }[toast.type];

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-md border border-slate-200 dark:border-slate-800 transition-all transform translate-y-0 ${bgStyles}`}
    >
      <div className="shrink-0 mt-0.5">
        {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
        {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
      </div>
      <div className="flex-1 text-sm">
        {toast.title && <div className="font-semibold text-xs tracking-wider uppercase mb-0.5">{toast.title}</div>}
        <div className="text-slate-600 dark:text-slate-300">{toast.message}</div>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        aria-label="Tutup notifikasi"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
