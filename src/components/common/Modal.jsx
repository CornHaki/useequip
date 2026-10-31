import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ title, subtitle, onClose, children }) {
  const modalRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);

  const requestClose = useCallback(() => {
    if (isClosing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose();
      return;
    }
    setIsClosing(true);
    closeTimeoutRef.current = window.setTimeout(onClose, 150);
  }, [isClosing, onClose]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        requestClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [requestClose]);

  useEffect(() => () => window.clearTimeout(closeTimeoutRef.current), []);

  const handleBackdropClick = (e) => {
    if (!isClosing && modalRef.current && !modalRef.current.contains(e.target)) {
      requestClose();
    }
  };

  return createPortal(
    <div
      className={`modal-backdrop fixed inset-0 z-[100] bg-primary/35 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6${isClosing ? ' modal-backdrop-closing' : ''}`}
      onMouseDown={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`modal-dialog bg-surface rounded-2xl sm:rounded-3xl border border-slate-200 max-w-xl w-full shadow-2xl flex flex-col max-h-[90dvh] relative${isClosing ? ' modal-dialog-closing' : ''}`}
      >
        <div className="shrink-0 p-5 sm:p-8 pb-4">
          <div className="pr-8">
            <h3 className="text-xl font-bold text-textMain">{title}</h3>
            {subtitle && <p className="text-sm text-textMain/80 mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={requestClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-textMain/60 hover:text-textMain hover:bg-secondary transition-colors rounded-lg p-2"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-8 pb-5 sm:pb-8 pt-1 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}