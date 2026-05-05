import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import React, { useState } from 'react';

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IconRounds = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconSquads = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconProducts = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);
const IconResults = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconChevron = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s ease' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ─── Cencosud Logo SVG ────────────────────────────────────────────────────────

const CencosudLogo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="16" fill="white"/>
    <path d="M50 15C30.67 15 15 30.67 15 50C15 69.33 30.67 85 50 85C69.33 85 85 69.33 85 50C85 30.67 69.33 15 50 15Z" fill="#003087"/>
    <path d="M50 25C36.19 25 25 36.19 25 50C25 63.81 36.19 75 50 75C63.81 75 75 63.81 75 50" stroke="white" strokeWidth="6" strokeLinecap="round"/>
    <circle cx="75" cy="50" r="5" fill="#f5a623"/>
    <path d="M38 50C38 43.37 43.37 38 50 38" stroke="white" strokeWidth="5" strokeLinecap="round"/>
  </svg>
);

// ─── Nav links config ─────────────────────────────────────────────────────────

const navLinks = [
  { to: '/admin',         label: 'Dashboard',  icon: IconDashboard, end: true },
  { to: '/admin/rounds',  label: 'Rodadas',    icon: IconRounds },
  { to: '/admin/squads',  label: 'Squads',     icon: IconSquads },
  { to: '/admin/users',   label: 'Usuários',   icon: IconUsers },
  { to: '/admin/products',label: 'Produtos',   icon: IconProducts },
  { to: '/admin/results', label: 'Resultados', icon: IconResults },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'GM';

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--cenc-gray-50)' }}>

      {/* ── Sidebar ── */}
      <aside
        className="shrink-0 flex flex-col animate-fade-in-left"
        style={{
          width: 'var(--sidebar-width)',
          background: 'linear-gradient(180deg, var(--cenc-blue-900) 0%, var(--cenc-blue-800) 100%)',
          boxShadow: '4px 0 24px rgba(0,24,77,0.18)',
        }}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <CencosudLogo size={36} />
          <div>
            <p className="text-white font-bold text-sm tracking-wide leading-tight">CommerceControl</p>
            <p className="text-xs font-medium" style={{ color: 'var(--cenc-blue-200)' }}>Game Master</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 stagger">
          {navLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 animate-fade-in ${
                  isActive
                    ? 'nav-active-bar text-white'
                    : 'text-blue-200 hover:text-white'
                }`
              }
              style={({ isActive }) => isActive
                ? { background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)' }
                : {}
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                    style={{ color: isActive ? 'var(--cenc-gold-400)' : 'inherit' }}>
                    <Icon />
                  </span>
                  <span>{label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--cenc-gold-400)' }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom brand strip */}
        <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Cencosud © 2026
          </p>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header
          className="shrink-0 flex items-center justify-between px-6 animate-slide-down"
          style={{
            height: 'var(--header-height)',
            background: 'white',
            borderBottom: '1px solid var(--cenc-gray-200)',
            boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
          }}
        >
          {/* Breadcrumb / title area */}
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ background: 'var(--cenc-blue-600)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--cenc-gray-700)' }}>
              Painel Administrativo
            </span>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 transition-all duration-150 hover:bg-gray-50"
              style={{ border: '1px solid var(--cenc-gray-200)' }}
            >
              {/* Avatar */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--cenc-blue-600), var(--cenc-blue-400))' }}
              >
                {initials}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--cenc-gray-800)' }}>{user?.name}</p>
                <p className="text-xs leading-tight" style={{ color: 'var(--cenc-blue-600)' }}>Game Master</p>
              </div>
              <IconChevron open={userMenuOpen} />
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-44 rounded-xl py-1 z-50 animate-scale-in"
                style={{
                  background: 'white',
                  border: '1px solid var(--cenc-gray-200)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                }}
              >
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-red-50"
                  style={{ color: 'var(--cenc-danger)' }}
                >
                  <IconLogout />
                  Sair da conta
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto page-enter">
          {children}
        </main>
      </div>

      {/* Overlay for user menu */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}
    </div>
  );
}
