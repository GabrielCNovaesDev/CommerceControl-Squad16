'use client';

interface SkeletonProps {
  variant?: 'line' | 'card' | 'table' | 'stat';
  rows?: number;
  className?: string;
  width?: string;
  height?: string;
}

export default function Skeleton({ variant = 'line', rows = 4, className = '', width, height }: SkeletonProps) {
  if (variant === 'table') {
    return (
      <div
        className={className}
        style={{
          borderRadius: '14px',
          border: '1px solid var(--cenc-gray-200)',
          overflow: 'hidden',
            background: 'var(--cenc-surface)',
          boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', gap: '16px', padding: '12px 16px', background: 'var(--cenc-gray-50)', borderBottom: '1px solid var(--cenc-gray-200)' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '12px', flex: 1, borderRadius: '6px' }} />
          ))}
        </div>
        {/* Rows */}
        {[...Array(rows)].map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: '16px', padding: '14px 16px', borderTop: '1px solid var(--cenc-gray-100)' }}>
            <div className="skeleton" style={{ width: '24px', height: '16px', borderRadius: '6px', flexShrink: 0 }} />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="skeleton" style={{ height: '16px', flex: 1, borderRadius: '6px', opacity: 1 - j * 0.1 }} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={className}
        style={{
          borderRadius: '14px',
          border: '1px solid var(--cenc-gray-200)',
          background: 'var(--cenc-surface)',
          boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div className="skeleton" style={{ height: '12px', width: '80px', borderRadius: '6px' }} />
        <div className="skeleton" style={{ height: '32px', width: '120px', borderRadius: '8px' }} />
        <div className="skeleton" style={{ height: '12px', width: '140px', borderRadius: '6px', opacity: 0.6 }} />
      </div>
    );
  }

  if (variant === 'stat') {
    return (
      <div
        className={className}
        style={{
          borderRadius: '14px',
          border: '1px solid var(--cenc-gray-200)',
          background: 'var(--cenc-surface)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ height: '12px', width: '90px', borderRadius: '6px' }} />
          <div className="skeleton" style={{ height: '32px', width: '32px', borderRadius: '8px' }} />
        </div>
        <div className="skeleton" style={{ height: '36px', width: '100px', borderRadius: '8px' }} />
        <div className="skeleton" style={{ height: '10px', width: '120px', borderRadius: '6px', opacity: 0.5 }} />
      </div>
    );
  }

  // line (default)
  return (
    <div
      className={`skeleton ${className}`}
      style={{ height: height ?? '16px', width: width ?? '100%', borderRadius: '6px' }}
    />
  );
}