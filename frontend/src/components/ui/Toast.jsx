import { useEffect } from 'react';
import useToastStore from '../../hooks/useToast';

const STYLES = {
  success: {
    container: 'bg-green-50 border-green-300 text-green-800',
    icon: '✓',
    iconClass: 'text-green-600',
    bar: 'bg-green-400',
  },
  error: {
    container: 'bg-red-50 border-red-300 text-red-800',
    icon: '✕',
    iconClass: 'text-red-500',
    bar: 'bg-red-400',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-300 text-yellow-800',
    icon: '⚠',
    iconClass: 'text-yellow-600',
    bar: 'bg-yellow-400',
  },
  info: {
    container: 'bg-blue-50 border-blue-300 text-blue-800',
    icon: 'ℹ',
    iconClass: 'text-blue-500',
    bar: 'bg-blue-400',
  },
};

const AUTO_DISMISS_MS = 4000;

function ToastItem({ toast }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const style = STYLES[toast.type] ?? STYLES.info;

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  return (
    <div
      className={`relative flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium min-w-[260px] max-w-sm overflow-hidden ${style.container}`}
      role="alert"
    >
      {/* Ícone */}
      <span className={`mt-px shrink-0 font-bold ${style.iconClass}`}>{style.icon}</span>

      {/* Mensagem */}
      <span className="flex-1 leading-snug">{toast.message}</span>

      {/* Fechar manual */}
      <button
        onClick={() => removeToast(toast.id)}
        className="ml-1 shrink-0 opacity-50 hover:opacity-100 transition-opacity text-base leading-none"
        aria-label="Fechar"
      >
        ×
      </button>

      {/* Barra de progresso */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${style.bar}`}
        style={{ animation: `shrink ${AUTO_DISMISS_MS}ms linear forwards` }}
      />

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

export default function Toast() {
  const toasts = useToastStore((s) => s.toasts);
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}
