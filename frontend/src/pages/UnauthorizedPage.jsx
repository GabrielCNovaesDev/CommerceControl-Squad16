import { useNavigate } from 'react-router-dom';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <h1 className="text-3xl font-bold text-red-600">Acesso Negado</h1>
      <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
      <button
        onClick={() => navigate(-1)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Voltar
      </button>
    </div>
  );
}
