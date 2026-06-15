'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import CencosudLogo from '@/components/CencosudLogo';
import { useTheme } from '@/components/ThemeContext';

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
const IconSidebarToggle = ({ collapsed }: { collapsed: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
    <polyline points="15 18 9 12 15 6" />
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

// ─── Nav links config ─────────────────────────────────────────────────────────

const navLinks = [
  { href: '/dashboard',               label: 'Dashboard',        icon: IconDashboard, end: true },
  { href: '/dashboard/round-config', label: 'Configurar Rodada', icon: IconConfig },
  { href: '/dashboard/results',       label: 'Resultados',        icon: IconResults },
  { href: '/dashboard/ranking',       label: 'Ranking',           icon: IconRanking },
  { href: '/dashboard/tutorials',     label: 'Tutoriais',         icon: IconBook },
];

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isDark, toggle } = useTheme();

  // Hidrata o estado de colapso do sidebar APÓS o mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSidebarCollapsed(window.localStorage.getItem('cc-player-sidebar-collapsed') === '1');
  }, []);

  // Persiste o colapso sempre que mudar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('cc-player-sidebar-collapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  // Guard: redireciona conforme status da sessão
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (session?.user?.role === 'GAME_MASTER') {
      router.replace('/admin');
    }
  }, [status, session, router]);

  if (status === 'loading' || status === 'unauthenticated' ||
      (status === 'authenticated' && session?.user?.role === 'GAME_MASTER')) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cenc-gray-50)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--cenc-blue-600)' }} />
          <p className="mt-4 text-sm" style={{ color: 'var(--cenc-gray-600)' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  async function handleLogout() {
    setUserMenuOpen(false);
    await signOut({ redirect: false });
    router.push('/login');
  }

  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'PL';

  return (
    <div className="app-shell app-shell-player flex min-h-screen" style={{ background: 'var(--cenc-gray-50)' }}>

      {/* ── Sidebar ── */}
      <aside
        className="shrink-0 flex flex-col overflow-hidden"
        style={{
          width: sidebarCollapsed ? '80px' : 'var(--sidebar-width)',
          background: 'linear-gradient(180deg, #001a4d 0%, #002266 50%, #003087 100%)',
          boxShadow: '4px 0 24px rgba(0,24,77,0.18)',
          transition: 'width 220ms ease, box-shadow 220ms ease',
        }}
      >
        {/* Logo area */}
        <div
          className={`flex items-center py-5 ${sidebarCollapsed ? 'justify-center px-3' : 'gap-3 px-5'}`}
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <CencosudLogo size={36} />
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-white font-bold text-sm tracking-wide leading-tight">CommerceControl</p>
              <p className="text-xs font-medium" style={{ color: 'var(--cenc-blue-200)' }}>Simulador de Loja</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed((value) => !value)}
            className="ml-auto mr-1 flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          >
            <IconSidebarToggle collapsed={sidebarCollapsed} />
          </button>
        </div>

        {/* Squad info pill */}
        {/* Note: squadId would come from session metadata in a real implementation */}
        {false && !sidebarCollapsed && (
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
        <nav className={`flex-1 py-4 flex flex-col gap-0.5 stagger ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
          {navLinks.map(({ href, label, icon: Icon, end }) => {
            const isActive = end ? pathname === href : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                title={label}
                className={`group relative flex items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
                  sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
                } ${
                  isActive
                    ? 'nav-active-bar text-white'
                    : 'text-blue-200 hover:text-white'
                }`}
                style={isActive
                  ? { background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)' }
                  : {}
                }
                onClick={() => setUserMenuOpen(false)}
              >
                <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                  style={{ color: isActive ? 'var(--cenc-gold-400)' : 'inherit' }}>
                  <Icon />
                </span>
                {!sidebarCollapsed && <span>{label}</span>}
                {!sidebarCollapsed && isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--cenc-gold-400)' }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom brand strip */}
        <div className={`py-4 ${sidebarCollapsed ? 'px-2 text-center' : 'px-5'}`} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {sidebarCollapsed ? 'CC' : 'Cencosud © 2026'}
          </p>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header
          className="shrink-0 flex items-center justify-between px-6 animate-slide-down"
          style={{
            position: 'relative',
            zIndex: 50,
            height: 'var(--header-height)',
            background: 'var(--cenc-surface)',
            borderBottom: '1px solid var(--cenc-gray-200)',
            boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
          }}
        >
          {/* Title area */}
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ background: 'var(--cenc-blue-600)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--cenc-gray-700)' }}>
              Simulador Estratégico de Loja
            </span>
          </div>

          {/* User menu */}
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
                <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--cenc-gray-800)' }}>{session?.user?.name}</p>
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
