'use client';

import React, { useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { useToasts } from '../hooks/useToast';

type ToastType = 'success' | 'error' | 'warning' | 'info';
type ThemeStyle = {
  bg: string; border: string; color: string; iconBg: string; icon: React.ReactNode; bar: string;
};
type ThemeStyles = Record<ToastType, ThemeStyle>;

const STYLES: Record<'light' | 'dark', ThemeStyles> = {
  light: {
    success: {
      bg: '#f0fdf4',
      border: '#86efac',
      color: '#15803d',
      iconBg: '#dcfce7',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
      bar: '#22c55e',
    },
    error: {
      bg: '#fff1f2',
      border: '#fca5a5',
      color: '#b91c1c',
      iconBg: '#fee2e2',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      ),
      bar: '#ef4444',
    },
    warning: {
      bg: '#fffbeb',
      border: '#fcd34d',
      color: '#92400e',
      iconBg: '#fef3c7',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
      bar: '#f59e0b',
    },
    info: {
      bg: 'var(--cenc-blue-50)',
      border: 'var(--cenc-blue-200)',
      color: 'var(--cenc-blue-700)',
      iconBg: 'var(--cenc-blue-100)',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      ),
      bar: 'var(--cenc-blue-500)',
    },
  },
  dark: {
    success: {
      bg: '#052e16',
      border: '#166534',
      color: '#86efac',
      iconBg: '#14532d',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
      bar: '#22c55e',
    },
    error: {
      bg: '#1f0707',
      border: '#7f1d1d',
      color: '#fca5a5',
      iconBg: '#3f1212',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      ),
      bar: '#ef4444',
    },
    warning: {
      bg: '#1c1400',
      border: '#92400e',
      color: '#fde68a',
      iconBg: '#332200',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
      bar: '#f59e0b',
    },
    info: {
      bg: '#0a1628',
      border: '#1d4ed8',
      color: '#bfdbfe',
      iconBg: '#12315a',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      ),
      bar: 'var(--cenc-blue-500)',
    },
  },
};

const AUTO_DISMISS_MS = 4000;

interface ToastData {
  id: number;
  message: string;
  type: ToastType;
}

function ToastItem({ toast }: { toast: ToastData }) {
  const { removeToast } = useToasts();
  const { isDark } = useTheme();
  const themeStyles = STYLES[isDark ? 'dark' : 'light'];
  const style = themeStyles[toast.type] ?? themeStyles.info;

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  return (
    <div
      role="alert"
      className="animate-slide-down"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        borderRadius: '12px',
        padding: '12px 14px',
        minWidth: '280px',
        maxWidth: '360px',
        overflow: 'hidden',
        background: style.bg,
        border: `1px solid ${style.border}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        color: style.color,
      }}
    >
      {/* Icon */}
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: style.iconBg,
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {style.icon}
      </span>

      {/* Message */}
      <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, lineHeight: 1.45, paddingTop: 3 }}>
        {toast.message}
      </span>

      {/* Close */}
      <button
        onClick={() => removeToast(toast.id)}
        aria-label="Fechar"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'currentColor',
          opacity: 0.5,
          padding: '2px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.5'; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          background: style.bar,
          borderRadius: '0 0 0 12px',
          animation: `shrink ${AUTO_DISMISS_MS}ms linear forwards`,
        }}
      />
    </div>
  );
}

export default function Toast() {
  const { toasts } = useToasts();
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={t as ToastData} />
        </div>
      ))}
    </div>
  );
}

// Re-export useToast hook for convenience
export { useToast } from '../hooks/useToast';