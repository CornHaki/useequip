import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import ToastNotification from '../components/common/ToastNotification';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const autoDismissTimeoutRef = useRef(null);
  const exitTimeoutRef = useRef(null);
  const nextIdRef = useRef(0);

  const dismissToast = useCallback((id) => {
    window.clearTimeout(autoDismissTimeoutRef.current);
    window.clearTimeout(exitTimeoutRef.current);
    setToast(current => current?.id === id ? { ...current, isClosing: true } : current);
    exitTimeoutRef.current = window.setTimeout(() => {
      setToast(current => current?.id === id ? null : current);
    }, 170);
  }, []);

  const showToast = useCallback((title, message) => {
    window.clearTimeout(autoDismissTimeoutRef.current);
    window.clearTimeout(exitTimeoutRef.current);
    const id = ++nextIdRef.current;
    setToast({ title, message, id, isClosing: false });
    autoDismissTimeoutRef.current = window.setTimeout(() => dismissToast(id), 4500);
  }, [dismissToast]);

  useEffect(() => () => {
    window.clearTimeout(autoDismissTimeoutRef.current);
    window.clearTimeout(exitTimeoutRef.current);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <ToastNotification toast={toast} onClose={() => dismissToast(toast.id)} />}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);