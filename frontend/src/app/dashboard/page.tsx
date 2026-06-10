'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface DashboardData {
  store: { id: string; name: string; currentCash: string } | null;
  activeRound: { id: string; number: number; endsAt: string; status: string } | null;
  lastResult: { ebitda: string; rank: number } | null;
}

export default function PlayerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storeRes, roundsRes] = await Promise.all([
          api.get('/stores/my'),
          api.get('/rounds'),
        ]);

        const activeRound = roundsRes.data.data?.find(
          (r: { status: string }) => r.status === 'OPEN'
        );

        // Buscar último resultado se houver rodada ativa
        let lastResult = null;
        if (activeRound) {
          try {
            const resultsRes = await api.get(`/rounds/${activeRound.id}/results`);
            if (resultsRes.data.data?.length > 0) {
              lastResult = resultsRes.data.data[0];
            }
          } catch (e) {
            // Sem resultados ainda
          }
        }

        setData({
          store: storeRes.data.data || null,
          activeRound: activeRound || null,
          lastResult,
        });
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Meu Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Minha Loja */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Minha Loja</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {data?.store?.name || 'Sem loja'}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Capital Atual: R$ {parseFloat(data?.store?.currentCash || '0').toLocaleString('pt-BR')}
          </div>
        </div>

        {/* Rodada Atual */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Rodada Atual</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {data?.activeRound ? `Rodada ${data.activeRound.number}` : 'Nenhuma'}
          </div>
          {data?.activeRound && (
            <div className="mt-4 text-sm text-gray-600">
              Termina em: {new Date(data.activeRound.endsAt).toLocaleString('pt-BR')}
            </div>
          )}
        </div>

        {/* Último Resultado */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Último Resultado</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {data?.lastResult ? `R$ ${parseFloat(data.lastResult.ebitda).toLocaleString('pt-BR')}` : 'Nenhum'}
          </div>
          {data?.lastResult && (
            <div className="mt-4 text-sm text-gray-600">
              Posição: {data.lastResult.rank}º
            </div>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {data?.activeRound ? (
          <Link
            href="/dashboard/round-config"
            className="block p-6 bg-blue-600 rounded-lg hover:bg-blue-700 transition text-white"
          >
            <div className="font-semibold text-lg">Configurar Rodada {data.activeRound.number}</div>
            <div className="text-sm text-blue-200 mt-2">
              Configure sua estratégia para esta rodada
            </div>
          </Link>
        ) : (
          <div className="p-6 bg-gray-200 rounded-lg text-gray-500">
            <div className="font-semibold text-lg">Aguardando Próxima Rodada</div>
            <div className="text-sm mt-2">
              O administrador irá iniciar uma nova rodada em breve
            </div>
          </div>
        )}

        <Link
          href="/dashboard/results"
          className="block p-6 bg-green-600 rounded-lg hover:bg-green-700 transition text-white"
        >
          <div className="font-semibold text-lg">Ver Meus Resultados</div>
          <div className="text-sm text-green-200 mt-2">
            Acompanhe seu desempenho histórico
          </div>
        </Link>
      </div>
    </div>
  );
}