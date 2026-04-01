import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const navLinks = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/rounds', label: 'Rodadas' },
  { to: '/admin/squads', label: 'Squads' },
  { to: '/admin/products', label: 'Produtos' },
  { to: '/admin/results', label: 'Resultados' },
];

export default function AdminLayout({ children }) {
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
          <span className="text-sm font-bold text-indigo-600 tracking-wide uppercase">
            Simulador
          </span>
          <p className="text-xs text-gray-400 mt-0.5">Game Master</p>
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
                    ? 'bg-indigo-50 text-indigo-700'
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
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-900">{user?.name}</span>
            <span className="text-gray-400">·</span>
            <span className="inline-flex items-center rounded-full bg-indigo-100 border border-indigo-200 px-2 py-0.5 text-xs font-semibold text-indigo-700">
              Game Master
            </span>
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
