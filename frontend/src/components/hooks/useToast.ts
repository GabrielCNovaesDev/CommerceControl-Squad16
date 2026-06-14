import { useState, useEffect } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => number;
  removeToast: (id: number) => void;
}

let nextId = 1;

// Simple module-level state for the toast store (client-side only)
let toastsStore: Toast[] = [];
type Listener = (toasts: Toast[]) => void;
const listeners: Set<Listener> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener([...toastsStore]));
}

function addToastToStore(message: string, type: Toast['type'] = 'info'): number {
  const id = nextId++;
  toastsStore = [...toastsStore, { id, message, type }];
  notifyListeners();
  return id;
}

function removeToastFromStore(id: number) {
  toastsStore = toastsStore.filter((t) => t.id !== id);
  notifyListeners();
}

// Hook to get the current toasts
function useToastsStore(): ToastState {
  const [toasts, setToasts] = useState<Toast[]>([...toastsStore]);

  useEffect(() => {
    const listener: Listener = (newToasts) => setToasts(newToasts);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    toasts,
    addToast: addToastToStore,
    removeToast: removeToastFromStore,
  };
}

export function useToast() {
  const { addToast } = useToastsStore();
  return {
    success: (msg: string) => addToast(msg, 'success'),
    error:   (msg: string) => addToast(msg, 'error'),
    warning: (msg: string) => addToast(msg, 'warning'),
    info:    (msg: string) => addToast(msg, 'info'),
  };
}

export function useToasts() {
  return useToastsStore();
}

export default useToast;