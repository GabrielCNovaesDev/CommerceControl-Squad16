import { useEffect, useState } from 'react';
import roundService from '../services/roundService';
import useAuthStore from '../store/authStore';
import PlayerLayout from '../components/layout/PlayerLayout';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import { formatCurrency, formatPercent } from '../utils/formatters';
import type { Round, RankingEntry } from '../types';

// ─── Helpers ───────────────────────────────────────────────────────────────

const POSITION_STYLES: Record<number, { badge: string; row: string; label: string }> = {
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

function RoundSelector({
  rounds,
  selectedId,
  onChange,
}: {
  rounds: Round[];
  selectedId: string | null;
  onChange: (id: string) => void;
}) {
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

function TopBanner({ position }: { position: number }) {
  const messages: Record<number, { text: string; color: string }> = {
    1: { text: 'Parabéns! Sua loja está em 1º lugar nesta rodada!', color: 'bg-yellow-50 border-yellow-300 text-yellow-800' },
    2: { text: 'Muito bem! Sua loja está em 2º lugar nesta rodada!', color: 'bg-gray-100 border-gray-300 text-gray-700' },
    3: { text: 'Ótimo resultado! Sua loja está em 3º lugar nesta rodada!', color: 'bg-orange-50 border-orange-300 text-orange-800' },
  };

  const config = messages[position];
  if (!config) return null;

  const icons: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-5 py-3.5 text-sm font-medium ${config.color}`}>
      <span className="text-xl">{icons[position]}</span>
      <span>{config.text}</span>
    </div>
  );
}

function PositionCell({ position }: { position: number }) {
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

function RankingTable({ ranking, mySquadId }: { ranking: RankingEntry[]; mySquadId: string | null | undefined }) {
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
            const isPositive = entry.ebitda >= 0;

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
                <td className={`px-4 py-3 text-right font-medium ${entry.ebitdaMargin < 0 ? 'text-red-600' : 'text-green-700'}`}>
                  {formatPercent(entry.ebitdaMargin)}
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${isPositive ? 'text-green-700' : 'text-red-600'}`}>
                  {isPositive ? '' : '- '}{formatCurrency(Math.abs(entry.ebitda))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────

export default function RankingPage() {
  const { user } = useAuthStore();
  const [closedRounds, setClosedRounds] = useState<Round[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadingRanking, setLoadingRanking] = useState(false);

  function loadRounds() {
    setLoadError('');
    setLoadingRounds(true);
    roundService.getRounds()
      .then((rounds: Round[]) => {
        const closed = rounds
          .filter((r) => r.status === 'CLOSED')
          .sort((a, b) => b.number - a.number);
        setClosedRounds(closed);
        if (closed.length > 0) {
          setSelectedRoundId(closed[0].id);
        }
      })
      .catch(() => setLoadError('Não foi possível carregar as rodadas.'))
      .finally(() => setLoadingRounds(false));
  }

  useEffect(() => { loadRounds(); }, []);

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
  const showTopBanner = user?.role === 'PLAYER' && myPosition != null && myPosition <= 3;

  if (loadingRounds) {
    return (
      <PlayerLayout>
        <div className="max-w-4xl flex flex-col gap-4">
          <Skeleton variant="line" className="w-32 h-6" />
          <Skeleton variant="table" rows={5} />
        </div>
      </PlayerLayout>
    );
  }

  if (loadError) {
    return (
      <PlayerLayout>
        <ErrorMessage message={loadError} onRetry={loadRounds} />
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
          <Skeleton variant="table" rows={5} />
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
