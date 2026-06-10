import { useNavigate } from 'react-router-dom';
import usePageTitle from "../hooks/usePageTitle";

export default function NotFoundPage() {
  usePageTitle("404 - Página não encontrada");
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      background: 'var(--cenc-gray-50)',
    }}>
      <p style={{ fontSize: '80px', margin: 0 }}>🔍</p>
      <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: 'var(--cenc-gray-900)' }}>
        Página não encontrada
      </h1>
      <p style={{ margin: 0, fontSize: '14px', color: 'var(--cenc-gray-500)' }}>
        A rota que você acessou não existe.
      </p>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginTop: '8px',
          padding: '10px 24px',
          borderRadius: '10px',
          border: 'none',
          background: 'var(--cenc-blue-600)',
          color: 'white',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        ← Voltar
      </button>
    </div>
  );
}