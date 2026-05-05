interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: '#fee2e2',
        border: '1px solid #fecaca',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>

      {/* Text */}
      <div>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--cenc-gray-800)', margin: 0 }}>
          Algo deu errado
        </p>
        <p style={{ fontSize: '13px', color: 'var(--cenc-gray-500)', marginTop: '4px' }}>
          {message}
        </p>
      </div>

      {/* Retry */}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 20px',
            borderRadius: '10px',
            border: '1.5px solid var(--cenc-gray-200)',
            background: 'white',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--cenc-gray-700)',
            cursor: 'pointer',
            transition: 'all 0.15s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--cenc-blue-50)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--cenc-blue-300)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--cenc-blue-700)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'white';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--cenc-gray-200)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--cenc-gray-700)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
          </svg>
          Tentar novamente
        </button>
      )}
    </div>
  );
}
