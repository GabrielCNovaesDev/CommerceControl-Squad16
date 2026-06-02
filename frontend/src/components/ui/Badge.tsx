import React from 'react';
import useThemeStore from '../../store/themeStore';

type BadgeVariant = 'green' | 'yellow' | 'gray' | 'red' | 'blue' | 'gold' | 'indigo';

const variants: Record<'light' | 'dark', Record<BadgeVariant, React.CSSProperties>> = {
  light: {
    green:  { background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' },
    yellow: { background: '#fef9c3', color: '#a16207', border: '1px solid #fef08a' },
    gray:   { background: 'var(--cenc-gray-100)', color: 'var(--cenc-gray-600)', border: '1px solid var(--cenc-gray-200)' },
    red:    { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' },
    blue:   { background: 'var(--cenc-blue-50)', color: 'var(--cenc-blue-700)', border: '1px solid var(--cenc-blue-100)' },
    gold:   { background: 'var(--cenc-gold-100)', color: '#92400e', border: '1px solid #fde68a' },
    indigo: { background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' },
  },
  dark: {
    green:  { background: '#052e16', color: '#86efac', border: '1px solid #166534' },
    yellow: { background: '#1c1400', color: '#fde68a', border: '1px solid #92400e' },
    gray:   { background: '#111827', color: '#d1d5db', border: '1px solid #374151' },
    red:    { background: '#1f0707', color: '#fca5a5', border: '1px solid #7f1d1d' },
    blue:   { background: '#0a1628', color: '#bfdbfe', border: '1px solid #1d4ed8' },
    gold:   { background: '#241a00', color: '#fcd34d', border: '1px solid #92400e' },
    indigo: { background: '#1e1b4b', color: '#c7d2fe', border: '1px solid #4338ca' },
  },
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  pulse?: boolean;
}

export default function Badge({ children, variant = 'gray', dot = false, pulse = false }: BadgeProps) {
  const isDark = useThemeStore((state) => state.isDark);
  const palette = variants[isDark ? 'dark' : 'light'][variant];

  return (
    <span
      style={{
        ...palette,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        borderRadius: '99px',
        padding: '2px 10px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'currentColor',
            flexShrink: 0,
            ...(pulse ? { animation: 'pulse-ring 2s infinite' } : {}),
          }}
        />
      )}
      {children}
    </span>
  );
}
