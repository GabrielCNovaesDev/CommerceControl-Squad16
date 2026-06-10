'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface DashboardStats {
  totalUsers: number;
  totalSquads: number;
  totalStores: number;
  totalRounds: number;
  activeRound: number | null;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, squadsRes, storesRes, roundsRes] = await Promise.all([
          api.get('/users'),
          api.get('/squads'),
          api.get('/stores'),
          api.get('/rounds'),
        ]);

        const activeRound = roundsRes.data.data?.find(
          (r: { status: string }) => r.status === 'OPEN'
        );

        setStats({
          totalUsers: usersRes.data.total || 0,
          totalSquads: squadsRes.data.data?.length || 0,
          totalStores: storesRes.data.data?.length || 0,
          totalRounds: roundsRes.data.data?.length || 0,
          activeRound: activeRound?.number || null,
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total de Usuários</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total de Squads</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{stats?.totalSquads || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total de Lojas</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{stats?.totalStores || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Rodada Ativa</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {stats?.activeRound || 'Nenhuma'}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="space-y-3">
            <a
              href="/admin/rounds?action=new"
              className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
            >
              <div className="font-medium text-blue-900">Criar Nova Rodada</div>
              <div className="text-sm text-blue-700">Iniciar uma nova rodada de simulação</div>
            </a>
            <a
              href="/admin/users?action=new"
              className="block p-4 bg-green-50 rounded-lg hover:bg-green-100 transition"
            >
              <div className="font-medium text-green-900">Adicionar Usuário</div>
              <div className="text-sm text-green-700">Cadastrar novo jogador ou administrador</div>
            </a>
            <a
              href="/admin/products?action=new"
              className="block p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
            >
              <div className="font-medium text-purple-900">Gerenciar Produtos</div>
              <div className="text-sm text-purple-700">Configurar produtos do catálogo</div>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Rodadas</h2>
          <div className="text-sm text-gray-500">
            Total de rodadas: {stats?.totalRounds || 0}
          </div>
        </div>
      </div>
    </div>
  );
}