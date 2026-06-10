'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Round {
  id: string;
  number: number;
  status: 'OPEN' | 'PROCESSING' | 'CLOSED';
  endsAt: string;
  durationHours: number;
  demandFactor: string;
  createdAt: string;
  _count?: {
    roundConfigs: number;
    financialResults: number;
  };
}

export default function RoundsManagementPage() {
  const router = useRouter();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRound, setNewRound] = useState({ number: '', durationHours: '1', demandFactor: '0.5' });

  useEffect(() => {
    fetchRounds();
  }, []);

  const fetchRounds = async () => {
    try {
      const res = await api.get('/rounds');
      setRounds(res.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar rodadas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRound = async () => {
    try {
      await api.post('/rounds', {
        number: parseInt(newRound.number),
        durationHours: parseInt(newRound.durationHours),
        demandFactor: parseFloat(newRound.demandFactor),
      });
      setShowCreateModal(false);
      setNewRound({ number: '', durationHours: '1', demandFactor: '0.5' });
      fetchRounds();
    } catch (error) {
      console.error('Erro ao criar rodada:', error);
      alert('Erro ao criar rodada');
    }
  };

  const handleCloseRound = async (id: string) => {
    if (!confirm('Tem certeza que deseja encerrar esta rodada?')) return;
    try {
      await api.patch(`/rounds/${id}/close`);
      fetchRounds();
    } catch (error) {
      console.error('Erro ao encerrar rodada:', error);
    }
  };

  const handleDeleteLastRound = async () => {
    if (!confirm('Tem certeza que deseja deletar a última rodada?')) return;
    try {
      await api.delete('/rounds/last');
      fetchRounds();
    } catch (error) {
      console.error('Erro ao deletar rodada:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      OPEN: 'bg-green-100 text-green-800',
      PROCESSING: 'bg-yellow-100 text-yellow-800',
      CLOSED: 'bg-gray-100 text-gray-800',
    };
    const labels = { OPEN: 'Aberta', PROCESSING: 'Processando', CLOSED: 'Encerrada' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Rodadas</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Nova Rodada
          </button>
          <button
            onClick={handleDeleteLastRound}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Deletar Última
          </button>
        </div>
      </div>

      {/* Rounds Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Termina em</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duração</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Configs</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resultados</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rounds.map((round) => (
              <tr key={round.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  Rodada {round.number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(round.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(round.endsAt).toLocaleString('pt-BR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {round.durationHours}h
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {round._count?.roundConfigs || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {round._count?.financialResults || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {round.status === 'OPEN' && (
                    <button
                      onClick={() => handleCloseRound(round.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Encerrar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rounds.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Nenhuma rodada encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nova Rodada</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número da Rodada</label>
                <input
                  type="number"
                  value={newRound.number}
                  onChange={(e) => setNewRound({ ...newRound, number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duração (horas)</label>
                <input
                  type="number"
                  value={newRound.durationHours}
                  onChange={(e) => setNewRound({ ...newRound, durationHours: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fator de Demanda</label>
                <input
                  type="number"
                  step="0.1"
                  value={newRound.demandFactor}
                  onChange={(e) => setNewRound({ ...newRound, demandFactor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateRound}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}