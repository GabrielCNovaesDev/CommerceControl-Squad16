'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface RankingEntry {
  rank: number;
  storeId: string;
  storeName: string;
  squadName: string;
  totalEbitda: number;
  avgEbitda: number;
  roundsPlayed: number;
}

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [roundId, setRoundId] = useState<string>('');

  useEffect(() => {
    fetchRanking();
  }, [roundId]);

  const fetchRanking = async () => {
    try {
      const params = roundId ? `?roundId=${roundId}` : '';
      const res = await api.get(`/simulation/ranking${params}`);
      setRanking(res.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800';
    if (rank === 2) return 'bg-gray-100 text-gray-800';
    if (rank === 3) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-50 text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Ranking</h1>

      {/* Ranking Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posição</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loja</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Squad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total EBITDA</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Média EBITDA</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rodadas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ranking.map((entry) => (
              <tr key={entry.storeId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${getRankStyle(entry.rank)}`}>
                    {entry.rank}º
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {entry.storeName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                  {entry.squadName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">
                  R$ {entry.totalEbitda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                  R$ {entry.avgEbitda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                  {entry.roundsPlayed}
                </td>
              </tr>
            ))}
            {ranking.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Nenhum resultado encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}