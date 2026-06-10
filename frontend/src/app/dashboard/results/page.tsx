'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Result {
  id: string;
  store: { id: string; name: string };
  grossRevenue: string;
  ebitda: string;
  ebitdaMargin: string;
  totalScore: number | null;
  round: { number: number };
  calculatedAt: string;
}

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      // Buscar todas as rodadas e seus resultados
      const roundsRes = await api.get('/rounds');
      const rounds = roundsRes.data.data || [];

      const allResults: Result[] = [];
      for (const round of rounds) {
        try {
          const resultsRes = await api.get(`/rounds/${round.id}/results`);
          if (resultsRes.data.data?.length > 0) {
            allResults.push(...resultsRes.data.data);
          }
        } catch (e) {
          // Sem resultados para esta rodada
        }
      }

      setResults(allResults);
    } catch (error) {
      console.error('Erro ao carregar resultados:', error);
    } finally {
      setLoading(false);
    }
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
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Meus Resultados</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total de Rodadas</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {new Set(results.map((r) => r.round.number)).size}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Melhor EBITDA</div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            R$ {Math.max(...results.map((r) => parseFloat(r.ebitda)), 0).toLocaleString('pt-BR')}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Média EBITDA</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            R$ {(results.length > 0 ? results.reduce((acc, r) => acc + parseFloat(r.ebitda), 0) / results.length : 0).toLocaleString('pt-BR')}
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rodada</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receita Bruta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">EBITDA</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margem</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {results.map((result) => (
              <tr key={result.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  Rodada {result.round.number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                  R$ {parseFloat(result.grossRevenue).toLocaleString('pt-BR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">
                  R$ {parseFloat(result.ebitda).toLocaleString('pt-BR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                  {parseFloat(result.ebitdaMargin).toFixed(2)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {result.totalScore ? `${result.totalScore} pts` : '-'}
                </td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
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