import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import React, { useState } from 'react';

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IconConfig = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/>
  </svg>
);
const IconResults = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IconRanking = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconSun = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const IconMoon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const IconChevron = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s ease' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconStore = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconBook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
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
  { to: '/store',        label: 'Dashboard',        icon: IconDashboard, end: true },
  { to: '/store/round',  label: 'Configurar Rodada', icon: IconConfig },
  { to: '/store/results',label: 'Resultados',        icon: IconResults },
  { to: '/ranking',      label: 'Ranking',           icon: IconRanking },
  { to: '/tutorials',   label: 'Tutoriais',         icon: IconBook },
];

interface PlayerLayoutProps {
  children: React.ReactNode;
}

export default function PlayerLayout({ children }: PlayerLayoutProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isDark, toggle } = useThemeStore();
  // ADIÇÃO 1: estado para controlar a sidebar no mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'PL';

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--cenc-gray-50)' }}>

      {/* ADIÇÃO 2: overlay no mobile quando sidebar está aberta */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        // ADIÇÃO 3: fixed + translate no mobile, normal no desktop
        className={`shrink-0 flex flex-col animate-fade-in-left fixed inset-y-0 left-0 z-30 transition-transform duration-200 md:relative md:translate-x-0 md:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          width: 'var(--sidebar-width)',
          background: 'linear-gradient(180deg, #001a4d 0%, #002266 50%, #003087 100%)',
          boxShadow: '4px 0 24px rgba(0,24,77,0.18)',
        }}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <CencosudLogo size={36} />
          <div>
            <p className="text-white font-bold text-sm tracking-wide leading-tight">CommerceControl</p>
            <p className="text-xs font-medium" style={{ color: 'var(--cenc-blue-200)' }}>Simulador de Loja</p>
          </div>
        </div>

        {/* Squad info pill */}
        {user?.squadId && (
          <div className="mx-3 mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.25)' }}>
            <IconStore />
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--cenc-gold-400)' }}>Minha Loja</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Squad ativo</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 stagger">
          {navLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)} // ADIÇÃO 4: fecha ao navegar
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
          className="shrink-0 flex items-center justify-between px-4 md:px-6 animate-slide-down"
          style={{
            height: 'var(--header-height)',
            background: 'var(--cenc-surface)',
            borderBottom: '1px solid var(--cenc-gray-200)',
            boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
            zIndex : 50,
          }}
        >
          {/* Title area */}
          <div className="flex items-center gap-2">
            {/* ADIÇÃO 5: botão hamburguer — só no mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-150 hover:bg-gray-100 mr-2"
              style={{ border: '1px solid var(--cenc-gray-200)', color: 'var(--cenc-gray-600)' }}
              aria-label="Abrir menu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div className="w-1 h-5 rounded-full" style={{ background: 'var(--cenc-blue-600)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--cenc-gray-700)' }}>
              Simulador Estratégico de Loja
            </span>
          </div>

          {/* User menu — inalterado */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-150 hover:bg-gray-100"
              style={{ border: '1px solid var(--cenc-gray-200)', color: 'var(--cenc-gray-600)' }}
              aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {isDark ? <IconSun /> : <IconMoon />}
            </button>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 transition-all duration-150 hover:bg-gray-50"
                style={{ border: '1px solid var(--cenc-gray-200)' }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--cenc-blue-600), var(--cenc-blue-400))' }}
                >
                  {initials}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--cenc-gray-800)' }}>{user?.name}</p>
                  <p className="text-xs leading-tight" style={{ color: 'var(--cenc-blue-600)' }}>Player</p>
                </div>
                <IconChevron open={userMenuOpen} />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-44 rounded-xl py-1 z-50 animate-scale-in"
                  style={{
                    background: 'var(--cenc-surface)',
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
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto page-enter">
          {children}
        </main>
      </div>

      {/* Overlay for user menu — inalterado */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}
    </div>
  );
}