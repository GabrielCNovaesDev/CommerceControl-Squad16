import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import authService from '../services/authService';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import type { UserRole } from '../types';

const schema = z.object({
  email: z.string().email('Informe um email válido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof schema>;

const ROLE_REDIRECT: Record<UserRole, string> = {
  GAME_MASTER: '/admin',
  PLAYER: '/store',
  OBSERVER: '/ranking',
};

// ─── Cencosud Logo ────────────────────────────────────────────────────────────

const CencosudLogo = () => (
  <svg width="56" height="56" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="var(--cenc-surface)"/>
    <path d="M50 15C30.67 15 15 30.67 15 50C15 69.33 30.67 85 50 85C69.33 85 85 69.33 85 50C85 30.67 69.33 15 50 15Z" fill="#003087"/>
    <path d="M50 25C36.19 25 25 36.19 25 50C25 63.81 36.19 75 50 75C63.81 75 75 63.81 75 50" stroke="white" strokeWidth="6" strokeLinecap="round"/>
    <circle cx="75" cy="50" r="5" fill="#f5a623"/>
    <path d="M38 50C38 43.37 43.37 38 50 38" stroke="white" strokeWidth="5" strokeLinecap="round"/>
  </svg>
);

// ─── Eye icons ────────────────────────────────────────────────────────────────

const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const IconSun = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="2" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" />
    <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
    <line x1="16.95" y1="7.05" x2="19.07" y2="4.93" />
    <line x1="4.93" y1="19.07" x2="7.05" y2="16.95" />
  </svg>
);

const IconMoon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3c0 0 0 0 0 0A7 7 0 0 0 21 12.79z" />
  </svg>
);

// ─── Decorative background shapes ────────────────────────────────────────────

function BackgroundDecor() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Large circle top-right */}
      <div style={{
        position: 'absolute', top: '-120px', right: '-120px',
        width: '480px', height: '480px', borderRadius: '50%',
        background: 'radial-gradient(circle, var(--login-right-decor-circle-a) 0%, transparent 70%)',
      }} />
      {/* Medium circle bottom-left */}
      <div style={{
        position: 'absolute', bottom: '-80px', left: '-80px',
        width: '320px', height: '320px', borderRadius: '50%',
        background: 'radial-gradient(circle, var(--login-right-decor-circle-b) 0%, transparent 70%)',
      }} />
      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, var(--login-right-decor-dot) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const { isDark, toggle } = useThemeStore();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(schema) });

  async function onSubmit({ email, password }: LoginFormData) {
    setServerError('');
    try {
      const { token, user } = await authService.login(email, password);
      login(user, token);
      navigate(ROLE_REDIRECT[user.role] ?? '/login', { replace: true });
    } catch {
      setServerError('Email ou senha inválidos. Verifique suas credenciais.');
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--login-shell-bg)' }}
    >
      {/* ── Left panel (brand) ── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{
          width: '45%',
          background: 'var(--login-brand-panel-bg)',
        }}
      >
        <BackgroundDecor />

        {/* Logo */}
        <div className="relative flex items-center gap-3 animate-fade-in">
          <CencosudLogo />
          <div>
            <p className="text-white font-bold text-lg tracking-wide">Cencosud</p>
            <p className="text-sm font-medium" style={{ color: 'var(--cenc-blue-200)' }}>Brasil</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative animate-fade-in" style={{ animationDelay: '150ms' }}>
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-6"
            style={{ background: 'rgba(245,166,35,0.2)', color: 'var(--cenc-gold-400)', border: '1px solid rgba(245,166,35,0.3)' }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cenc-gold-400)', display: 'inline-block' }} />
            Simulador Estratégico
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            CommerceControl
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'var(--login-brand-muted)' }}>
            Gerencie sua loja virtual, tome decisões estratégicas e compete com outros squads em tempo real.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-8">
            {['Gestão de Estoque', 'Análise Financeira', 'Ranking em Tempo Real', 'Simulação por Rodadas'].map((f) => (
              <span
                key={f}
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative animate-fade-in" style={{ animationDelay: '300ms' }}>
          <p className="text-xs" style={{ color: 'var(--login-brand-footer)' }}>
            © 2026 Cencosud Brasil · Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <BackgroundDecor />

        <div className="w-full max-w-sm relative animate-fade-in" style={{ animationDelay: '100ms' }}>
          <button
            type="button"
            onClick={toggle}
            className="login-theme-toggle"
            aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {isDark ? <IconSun /> : <IconMoon />}
          </button>

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <CencosudLogo />
            <div>
              <p className="font-bold text-lg" style={{ color: 'var(--cenc-blue-900)' }}>Cencosud</p>
              <p className="text-xs" style={{ color: 'var(--cenc-gray-500)' }}>CommerceControl</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--cenc-gray-900)' }}>Bem-vindo de volta</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--cenc-gray-500)' }}>
              Acesse sua conta para continuar a simulação
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-8"
            style={{
              background: 'var(--cenc-surface)',
              border: '1px solid var(--cenc-gray-200)',
              boxShadow: 'var(--login-card-shadow)',
            }}
          >
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold" style={{ color: 'var(--cenc-gray-700)' }}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className="input-cenc login-input w-full rounded-xl px-4 py-2.5 text-sm transition-all"
                  style={{
                    border: `1.5px solid ${errors.email ? 'var(--cenc-danger)' : 'var(--cenc-gray-300)'}`,
                    background: errors.email ? 'var(--cenc-danger-bg)' : 'var(--cenc-surface)',
                    color: 'var(--cenc-gray-900)',
                    outline: 'none',
                  }}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs font-medium" style={{ color: 'var(--cenc-danger)' }}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold" style={{ color: 'var(--cenc-gray-700)' }}>
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="input-cenc login-input w-full rounded-xl px-4 py-2.5 pr-11 text-sm transition-all"
                    style={{
                      border: `1.5px solid ${errors.password ? 'var(--cenc-danger)' : 'var(--cenc-gray-300)'}`,
                      background: errors.password ? 'var(--cenc-danger-bg)' : 'var(--cenc-surface)',
                      color: 'var(--cenc-gray-900)',
                      outline: 'none',
                    }}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--cenc-gray-400)' }}
                    aria-pressed={showPassword}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs font-medium" style={{ color: 'var(--cenc-danger)' }}>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Server error */}
              {serverError && (
                <div
                  className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium animate-slide-down"
                  style={{
                    background: 'var(--cenc-danger-bg)',
                    border: '1px solid rgba(220,38,38,0.2)',
                    color: 'var(--cenc-danger)',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {serverError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all duration-200 mt-1"
                style={{
                  background: isSubmitting
                    ? 'var(--cenc-blue-300)'
                    : 'linear-gradient(135deg, var(--cenc-blue-700) 0%, var(--cenc-blue-500) 100%)',
                  boxShadow: isSubmitting ? 'none' : '0 4px 16px rgba(0,85,204,0.35)',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transform: isSubmitting ? 'none' : undefined,
                }}
                onMouseEnter={(e) => { if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; }}
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                      style={{ animation: 'spin 0.7s linear infinite' }} />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs mt-6" style={{ color: 'var(--cenc-gray-400)' }}>
            Acesso restrito a colaboradores Cencosud
          </p>
        </div>
      </div>
    </div>
  );
}
