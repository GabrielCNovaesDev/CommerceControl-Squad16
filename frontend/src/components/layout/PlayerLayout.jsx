import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const navLinks = [
  { to: '/store', label: 'Dashboard', end: true },
  { to: '/store/round', label: 'Configurar Rodada' },
  { to: '/store/results', label: 'Resultados' },
  { to: '/ranking', label: 'Ranking' },
];

export default function PlayerLayout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-200">
          <span className="text-sm font-bold text-blue-600 tracking-wide uppercase">
            Simulador
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navLinks.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium text-gray-900">{user?.name}</span>
            {user?.squadId && (
              <>
                <span className="text-gray-400">·</span>
                <span>Squad</span>
              </>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Sair
          </button>
        </header>

        {/* Página */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
