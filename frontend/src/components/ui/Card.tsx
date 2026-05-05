import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
  accent?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  headerAction?: React.ReactNode;
}

const paddingMap = {
  sm: '12px 16px',
  md: '16px 20px',
  lg: '24px 28px',
  none: '0',
};

export default function Card({
  title,
  subtitle,
  children,
  className = '',
  style,
  hover = false,
  accent = false,
  padding = 'md',
  headerAction,
}: CardProps) {
  return (
    <div
      className={`${hover ? 'card-hover' : ''} ${className}`}
      style={{
        background: 'white',
        borderRadius: '14px',
        border: '1px solid var(--cenc-gray-200)',
        boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        ...(accent ? { borderTop: '3px solid var(--cenc-blue-600)' } : {}),
        ...style,
      }}
    >
      {(title || headerAction) && (
        <div
          style={{
            padding: paddingMap[padding === 'none' ? 'md' : padding],
            borderBottom: '1px solid var(--cenc-gray-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            {title && (
              <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--cenc-gray-800)' }}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--cenc-gray-500)' }}>
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div style={{ padding: paddingMap[padding] }}>
        {children}
      </div>
    </div>
  );
}
