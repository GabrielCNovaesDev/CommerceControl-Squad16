import { useNavigate } from 'react-router-dom';

const CencosudLogo = () => (
  <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="16" fill="white"/>
    <path d="M50 15C30.67 15 15 30.67 15 50C15 69.33 30.67 85 50 85C69.33 85 85 69.33 85 50C85 30.67 69.33 15 50 15Z" fill="#003087"/>
    <path d="M50 25C36.19 25 25 36.19 25 50C25 63.81 36.19 75 50 75C63.81 75 75 63.81 75 50" stroke="white" strokeWidth="6" strokeLinecap="round"/>
    <circle cx="75" cy="50" r="5" fill="#f5a623"/>
    <path d="M38 50C38 43.37 43.37 38 50 38" stroke="white" strokeWidth="5" strokeLinecap="round"/>
  </svg>
);

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f1ff 50%, #f5f8ff 100%)',
      padding: '24px',
    }}>
      {/* Background decor */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }} aria-hidden>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,102,255,0.1) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,48,135,0.08) 0%, transparent 70%)' }} />
      </div>

      <div className="animate-scale-in" style={{
        background: 'white',
        borderRadius: '24px',
        border: '1px solid var(--cenc-gray-200)',
        boxShadow: '0 8px 48px rgba(0,48,135,0.1)',
        padding: '48px 40px',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        position: 'relative',
      }}>
        {/* Logo */}
        <CencosudLogo />

        {/* Error icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#fee2e2', border: '2px solid #fecaca',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        </div>

        {/* Text */}
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            borderRadius: 99, padding: '4px 12px', marginBottom: 12,
            background: '#fee2e2', border: '1px solid #fecaca',
            fontSize: '12px', fontWeight: 700, color: '#b91c1c',
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Erro 403
          </div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--cenc-gray-900)' }}>
            Acesso Negado
          </h1>
          <p style={{ margin: '10px 0 0', fontSize: '14px', color: 'var(--cenc-gray-500)', lineHeight: 1.6 }}>
            Você não tem permissão para acessar esta página. Verifique suas credenciais ou entre em contato com o administrador.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 10, fontSize: '14px', fontWeight: 600,
              background: 'white', color: 'var(--cenc-gray-700)',
              border: '1.5px solid var(--cenc-gray-200)', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--cenc-gray-50)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'white'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Voltar
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 10, fontSize: '14px', fontWeight: 600,
              background: 'linear-gradient(135deg, var(--cenc-blue-700), var(--cenc-blue-500))',
              color: 'white', border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(0,85,204,0.3)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; }}
          >
            Ir para Login
          </button>
        </div>

        <p style={{ margin: 0, fontSize: '12px', color: 'var(--cenc-gray-400)' }}>
          © 2026 Cencosud Brasil
        </p>
      </div>
    </div>
  );
}
