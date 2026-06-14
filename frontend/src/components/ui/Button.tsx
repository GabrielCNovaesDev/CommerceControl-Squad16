'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

export default function Button({
  children,
  variant = 'primary',
  loading = false,
  size = 'md',
  icon,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const isDisabled = loading || props.disabled;

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    borderRadius: '10px',
    border: 'none',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.18s ease',
    outline: 'none',
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: isDisabled
        ? 'var(--cenc-blue-200)'
        : 'linear-gradient(135deg, var(--cenc-blue-700) 0%, var(--cenc-blue-500) 100%)',
      color: 'white',
      boxShadow: isDisabled ? 'none' : '0 2px 12px rgba(0,85,204,0.3)',
    },
    secondary: {
      background: isDisabled ? 'var(--cenc-gray-100)' : 'var(--cenc-surface)',
      color: isDisabled ? 'var(--cenc-gray-400)' : 'var(--cenc-gray-700)',
      border: '1.5px solid var(--cenc-gray-200)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    },
    danger: {
      background: isDisabled
        ? '#fca5a5'
        : 'linear-gradient(135deg, #b91c1c 0%, var(--cenc-danger) 100%)',
      color: 'white',
      boxShadow: isDisabled ? 'none' : '0 2px 12px rgba(220,38,38,0.3)',
    },
    ghost: {
      background: 'transparent',
      color: isDisabled ? 'var(--cenc-gray-300)' : 'var(--cenc-blue-600)',
    },
    outline: {
      background: 'transparent',
      color: isDisabled ? 'var(--cenc-gray-300)' : 'var(--cenc-blue-600)',
      border: '1.5px solid var(--cenc-blue-300)',
    },
  };

  function handleMouseEnter(e: React.MouseEvent<HTMLButtonElement>) {
    if (isDisabled) return;
    const el = e.currentTarget;
    if (variant === 'primary') {
      el.style.transform = 'translateY(-1px)';
      el.style.boxShadow = '0 6px 20px rgba(0,85,204,0.4)';
    } else if (variant === 'danger') {
      el.style.transform = 'translateY(-1px)';
      el.style.boxShadow = '0 6px 20px rgba(220,38,38,0.4)';
    } else if (variant === 'secondary') {
      el.style.background = 'var(--cenc-gray-50)';
      el.style.borderColor = 'var(--cenc-gray-300)';
    } else if (variant === 'ghost') {
      el.style.background = 'var(--cenc-blue-50)';
    } else if (variant === 'outline') {
      el.style.background = 'var(--cenc-blue-50)';
    }
  }

  function handleMouseLeave(e: React.MouseEvent<HTMLButtonElement>) {
    if (isDisabled) return;
    const el = e.currentTarget;
    el.style.transform = '';
    if (variant === 'primary') el.style.boxShadow = '0 2px 12px rgba(0,85,204,0.3)';
    else if (variant === 'danger') el.style.boxShadow = '0 2px 12px rgba(220,38,38,0.3)';
    else if (variant === 'secondary') { el.style.background = 'var(--cenc-surface)'; el.style.borderColor = 'var(--cenc-gray-200)'; }
    else if (variant === 'ghost') el.style.background = 'transparent';
    else if (variant === 'outline') el.style.background = 'transparent';
  }

  return (
    <button
      disabled={isDisabled}
      style={{ ...baseStyle, ...variantStyles[variant] }}
      className={`${sizeStyles[size]} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="rounded-full border-2 border-current border-t-transparent shrink-0"
            style={{ width: 14, height: 14, animation: 'spin 0.7s linear infinite' }}
          />
          Carregando...
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}