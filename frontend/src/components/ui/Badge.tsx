import React from 'react';

type BadgeVariant = 'green' | 'yellow' | 'gray' | 'red' | 'blue' | 'gold' | 'indigo';

const variants: Record<BadgeVariant, React.CSSProperties> = {
  green:  { background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' },
  yellow: { background: '#fef9c3', color: '#a16207', border: '1px solid #fef08a' },
  gray:   { background: 'var(--cenc-gray-100)', color: 'var(--cenc-gray-600)', border: '1px solid var(--cenc-gray-200)' },
  red:    { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' },
  blue:   { background: 'var(--cenc-blue-50)', color: 'var(--cenc-blue-700)', border: '1px solid var(--cenc-blue-100)' },
  gold:   { background: 'var(--cenc-gold-100)', color: '#92400e', border: '1px solid #fde68a' },
  indigo: { background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' },
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  pulse?: boolean;
}

export default function Badge({ children, variant = 'gray', dot = false, pulse = false }: BadgeProps) {
  return (
    <span
      style={{
        ...variants[variant],
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
