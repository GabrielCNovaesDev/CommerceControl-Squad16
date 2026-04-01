import { useEffect, useState } from 'react';
import roundService from '../services/roundService';
import useAuthStore from '../store/authStore';
import PlayerLayout from '../components/layout/PlayerLayout';
import { formatCurrency, formatPercent } from '../utils/formatters';

// ─── Helpers ───────────────────────────────────────────────────────────────

const POSITION_STYLES = {
  1: {
    badge: 'bg-yellow-400 text-yellow-900 border-yellow-500',
    row: 'bg-yellow-50',
    label: '🥇',
  },
  2: {
    badge: 'bg-gray-300 text-gray-800 border-gray-400',
    row: 'bg-gray-50',
    label: '🥈',
  },
  3: {
    badge: 'bg-amber-600 text-white border-amber-700',
    row: 'bg-orange-50',
    label: '🥉',
  },
};

// ─── Sub-componentes ────────────────────────────────────────────────────────

function RoundSelector({ rounds, selectedId, onChange }) {
  if (rounds.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-gray-600 shrink-0">Rodada</label>
      <select
        value={selectedId ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {rounds.map((r) => (
          <option key={r.id} value={r.id}>
            #{r.number}
          </option>
        ))}
      </select>
    </div>
  );
}

function TopBanner({ position }) {
  const messages = {
    1: { text: 'Parabéns! Sua loja está em 1º lugar nesta rodada!', color: 'bg-yellow-50 border-yellow-300 text-yellow-800' },
    2: { text: 'Muito bem! Sua loja está em 2º lugar nesta rodada!', color: 'bg-gray-100 border-gray-300 text-gray-700' },
    3: { text: 'Ótimo resultado! Sua loja está em 3º lugar nesta rodada!', color: 'bg-orange-50 border-orange-300 text-orange-800' },
  };

  const config = messages[position];
  if (!config) return null;

  const icons = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-5 py-3.5 text-sm font-medium ${config.color}`}>
      <span className="text-xl">{icons[position]}</span>
      <span>{config.text}</span>
    </div>
  );
}

function PositionCell({ position }) {
  const style = POSITION_STYLES[position];

  if (style) {
    return (
      <span
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border ${style.badge}`}
      >
        {position}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
      {position}
    </span>
  );
}

function RankingTable({ ranking, mySquadId }) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs text-gray-500 border-b border-gray-200">
            <th className="px-4 py-3 font-semibold w-14 text-center">#</th>
            <th className="px-4 py-3 font-semibold">Squad</th>
            <th className="px-4 py-3 font-semibold">Loja</th>
            <th className="px-4 py-3 font-semibold text-right">Receita Bruta</th>
            <th className="px-4 py-3 font-semibold text-right">Margem Líq.</th>
            <th className="px-4 py-3 font-semibold text-right">Lucro Líquido</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((entry) => {
            const isMe = entry.squadId === mySquadId;
            const topStyle = POSITION_STYLES[entry.position];
            const isPositive = entry.netProfit >= 0;

            const rowBg = isMe
              ? 'bg-blue-50 border-l-4 border-l-blue-400'
              : topStyle
              ? topStyle.row
              : 'bg-white';

            return (
              <tr
                key={entry.position}
                className={`border-t border-gray-100 ${rowBg}`}
              >
                <td className="px-4 py-3 text-center">
                  <PositionCell position={entry.position} />
                </td>
                <td className="px-4 py-3 text-gray-800 font-medium">
                  {entry.squadName}
                  {isMe && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 border border-blue-200 px-1.5 py-0.5 text-xs font-semibold text-blue-700">
                      você
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{entry.storeName}</td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {formatCurrency(entry.grossRevenue)}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${entry.netMargin < 0 ? 'text-red-600' : 'text-green-700'}`}>
                  {formatPercent(entry.netMargin)}
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${isPositive ? 'text-green-700' : 'text-red-600'}`}>
                  {isPositive ? '' : '- '}{formatCurrency(Math.abs(entry.netProfit))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm animate-pulse">
      <div className="h-10 bg-gray-50 border-b border-gray-200" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-t border-gray-100">
          <div className="w-7 h-7 rounded-full bg-gray-100" />
          <div className="flex-1 h-4 rounded bg-gray-100" />
          <div className="w-24 h-4 rounded bg-gray-100" />
          <div className="w-24 h-4 rounded bg-gray-100" />
          <div className="w-20 h-4 rounded bg-gray-100" />
          <div className="w-24 h-4 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────

export default function RankingPage() {
  const { user } = useAuthStore();
  const [closedRounds, setClosedRounds] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [loadingRanking, setLoadingRanking] = useState(false);

  // Carrega rodadas encerradas
  useEffect(() => {
    roundService.getRounds()
      .then((rounds) => {
        const closed = rounds
          .filter((r) => r.status === 'CLOSED')
          .sort((a, b) => b.number - a.number);
        setClosedRounds(closed);
        if (closed.length > 0) {
          setSelectedRoundId(closed[0].id);
        }
      })
      .finally(() => setLoadingRounds(false));
  }, []);

  // Carrega ranking ao mudar rodada
  useEffect(() => {
    if (!selectedRoundId) return;

    setLoadingRanking(true);
    setRanking([]);

    roundService.getRanking(selectedRoundId)
      .then(setRanking)
      .catch(() => setRanking([]))
      .finally(() => setLoadingRanking(false));
  }, [selectedRoundId]);

  const myEntry = ranking.find((e) => e.squadId === user?.squadId);
  const myPosition = myEntry?.position ?? null;
  const showTopBanner = user?.role === 'PLAYER' && myPosition <= 3 && myPosition != null;

  if (loadingRounds) {
    return (
      <PlayerLayout>
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
          Carregando...
        </div>
      </PlayerLayout>
    );
  }

  if (closedRounds.length === 0) {
    return (
      <PlayerLayout>
        <div className="flex flex-col items-center justify-center h-40 gap-2">
          <p className="text-gray-500 font-medium">Nenhuma rodada encerrada ainda.</p>
          <p className="text-sm text-gray-400">O ranking aparece aqui após o encerramento de cada rodada.</p>
        </div>
      </PlayerLayout>
    );
  }

  return (
    <PlayerLayout>
      <div className="max-w-4xl flex flex-col gap-6">
        {/* Cabeçalho + seletor */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Ranking</h1>
            <p className="text-sm text-gray-500 mt-0.5">Classificação das lojas por rodada.</p>
          </div>
          <RoundSelector
            rounds={closedRounds}
            selectedId={selectedRoundId}
            onChange={setSelectedRoundId}
          />
        </div>

        {/* Banner de destaque para top 3 */}
        {showTopBanner && <TopBanner position={myPosition} />}

        {/* Tabela */}
        {loadingRanking ? (
          <LoadingSkeleton />
        ) : ranking.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-10 flex items-center justify-center">
            <p className="text-gray-400 text-sm">Nenhum dado de ranking disponível para esta rodada.</p>
          </div>
        ) : (
          <RankingTable ranking={ranking} mySquadId={user?.squadId} />
        )}
      </div>
    </PlayerLayout>
  );
}
