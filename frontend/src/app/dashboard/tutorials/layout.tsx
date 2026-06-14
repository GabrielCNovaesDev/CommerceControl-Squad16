'use client';

import { useSession } from 'next-auth/react';
import PlayerLayout from '@/app/dashboard/layout';
import AdminLayout from '@/app/admin/layout';
import { usePathname } from 'next/navigation';

// Componente wrapper que escolhe o layout baseado no role do usuário
function RoleAwareLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  // Enquanto carrega a sessão, não renderiza nada (evita flash de layout)
  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cenc-gray-50)' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--cenc-gray-200)', borderTopColor: 'var(--cenc-blue-600)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  // Redireciona se não estiver logado
  if (status === 'unauthenticated' || !session) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  // Game Master usa AdminLayout (a rota /tutorials é compartilhada com sidebar admin)
  if (role === 'GAME_MASTER') {
    return <AdminLayout>{children}</AdminLayout>;
  }

  // Player usa PlayerLayout
  return <PlayerLayout>{children}</PlayerLayout>;
}

export default function TutorialsLayout({ children }: { children: React.ReactNode }) {
  return <RoleAwareLayout>{children}</RoleAwareLayout>;
}
