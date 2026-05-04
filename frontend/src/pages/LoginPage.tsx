import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import authService from '../services/authService';
import useAuthStore from '../store/authStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
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

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [serverError, setServerError] = useState('');

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
      setServerError('Email ou senha inválidos');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Título */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Simulador Estratégico</h1>
          <p className="mt-1 text-sm text-gray-500">Acesse sua conta para continuar</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />

            {serverError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 border border-red-200">
                {serverError}
              </p>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full mt-1">
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
