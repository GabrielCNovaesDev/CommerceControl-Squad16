import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export default function Input({ label, error, hint, icon, className = '', style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cenc-gray-700)' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--cenc-gray-400)', display: 'flex', alignItems: 'center', pointerEvents: 'none',
          }}>
            {icon}
          </span>
        )}
        <input
          className={`input-cenc ${className}`}
          style={{
            width: '100%',
            borderRadius: '10px',
            border: `1.5px solid ${error ? 'var(--cenc-danger)' : 'var(--cenc-gray-300)'}`,
            padding: icon ? '10px 14px 10px 38px' : '10px 14px',
            fontSize: '14px',
            color: 'var(--cenc-gray-900)',
            background: error ? 'var(--cenc-danger-bg)' : props.disabled ? 'var(--cenc-gray-100)' : 'white',
            outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            cursor: props.disabled ? 'not-allowed' : 'text',
            ...style,
          }}
          {...props}
        />
      </div>
      {error && (
        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--cenc-danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </span>
      )}
      {hint && !error && (
        <span style={{ fontSize: '12px', color: 'var(--cenc-gray-400)' }}>{hint}</span>
      )}
    </div>
  );
}
