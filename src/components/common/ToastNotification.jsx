import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function ToastNotification({ toast, onClose }) {
  return (
    <div className={`toast-transition fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] w-[calc(100%-2rem)] sm:w-auto max-w-md bg-surface text-textMain px-5 py-4 rounded-2xl shadow-lg border border-slate-200 flex items-start gap-3.5${toast.isClosing ? ' toast-exiting' : ''}`}>
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-5 h-5 text-accent" />
      </div>
      <div className="flex-1 text-sm">
        <p className="font-bold text-textMain">{toast.title}</p>
        <p className="text-textMain/80 mt-1 leading-relaxed text-xs sm:text-sm">{toast.message}</p>
      </div>
      <button onClick={onClose} aria-label="Dismiss notification" className="text-textMain/60 hover:text-textMain p-1 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
    </div>
  );
}