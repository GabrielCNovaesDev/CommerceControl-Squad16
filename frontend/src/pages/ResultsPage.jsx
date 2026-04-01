import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import roundService from '../services/roundService';
import PlayerLayout from '../components/layout/PlayerLayout';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import { formatCurrency, formatPercent } from '../utils/formatters';

// ─── Helpers ───────────────────────────────────────────────────────────────

function gerarFeedback(dre) {
  const feedbacks = [];

  if (dre.netProfit < 0) {
    feedbacks.push('Resultado negativo: sua loja teve prejuízo nesta rodada.');
  }
  if (dre.costs > dre.grossRevenue) {
    feedbacks.push(
      'Seu custo de compra superou a receita de vendas. Verifique se o preço de venda está acima do custo.'
    );
  }
  if (dre.expenses > dre.grossProfit) {
    feedbacks.push(
      'Suas despesas consumiram todo o lucro bruto. Considere reduzir gastos fixos ou variáveis.'
    );
  }
  if (dre.grossRevenue === 0) {
    feedbacks.push(
      'Nenhuma receita gerada nesta rodada. Verifique se o estoque estava disponível e os volumes configurados.'
    );
  }

  return feedbacks;
}

function classifyFeedback(msg) {
  const errorKeywords = ['prejuízo', 'custo de compra superou'];
  return errorKeywords.some((kw) => msg.toLowerCase().includes(kw)) ? 'error' : 'warning';
}

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

function SummaryCard({ netProfit, netMargin }) {
  const isPositive = netProfit >= 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-5 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
          Lucro Líquido
        </p>
        <p className={`text-3xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '' : '- '}{formatCurrency(Math.abs(netProfit))}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
          Margem Líquida
        </p>
        <p className={`text-2xl font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {formatPercent(netMargin)}
        </p>
      </div>
    </div>
  );
}

function DRETable({ result }) {
  const rows = [
    { label: 'Receita Bruta', value: result.grossRevenue, sign: '' },
    { label: '(-) Custos', value: result.costs, sign: '- ' },
    { label: '(=) Lucro Bruto', value: result.grossProfit, highlight: true },
    { label: '(-) Despesas', value: result.expenses, sign: '- ' },
    { label: '(=) Lucro Líquido', value: result.netProfit, highlight: true },
  ];

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        DRE — Demonstrativo de Resultado
      </h3>
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        {rows.map(({ label, value, highlight, sign = '' }) => {
          const isNegative = value < 0;
          const colorClass = highlight
            ? isNegative ? 'text-red-600' : 'text-green-700'
            : 'text-gray-700';

          return (
            <div
              key={label}
              className={`flex justify-between items-center px-4 py-2.5 text-sm border-b border-gray-50 last:border-0
                ${highlight ? 'font-semibold bg-gray-50' : ''}`}
            >
              <span className="text-gray-600">{label}</span>
              <span className={colorClass}>
                {sign}{formatCurrency(Math.abs(value))}
              </span>
            </div>
          );
        })}
        <div className="flex justify-between items-center px-4 py-2.5 text-sm bg-gray-50 border-t border-gray-100">
          <span className="text-gray-500">Margem Líquida</span>
          <span className={`font-semibold ${result.netMargin < 0 ? 'text-red-600' : 'text-green-700'}`}>
            {formatPercent(result.netMargin)}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProductBreakdownTable({ roundConfigItems }) {
  if (!roundConfigItems || roundConfigItems.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Receita Bruta por Produto
      </h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500">
              <th className="px-3 py-2 font-medium">Produto</th>
              <th className="px-3 py-2 font-medium text-right">Preço venda</th>
              <th className="px-3 py-2 font-medium text-right">Vol. config.</th>
              <th className="px-3 py-2 font-medium text-right">Receita</th>
              <th className="px-3 py-2 font-medium text-right">Custo</th>
              <th className="px-3 py-2 font-medium text-right">Margem unit.</th>
            </tr>
          </thead>
          <tbody>
            {roundConfigItems.map((item) => {
              const revenue = item.salePrice * item.salesVolume;
              const cost = item.product.purchasePrice * item.salesVolume;
              const unitMargin = item.salePrice - item.product.purchasePrice;
              const isNegativeMargin = unitMargin < 0;

              return (
                <tr key={item.productId} className="border-t border-gray-100 bg-white">
                  <td className="px-3 py-2 text-gray-800 font-medium">{item.product.name}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(item.salePrice)}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{item.salesVolume}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(revenue)}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(cost)}</td>
                  <td className={`px-3 py-2 text-right font-medium ${isNegativeMargin ? 'text-red-600' : 'text-green-700'}`}>
                    {isNegativeMargin ? '- ' : ''}{formatCurrency(Math.abs(unitMargin))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FeedbackList({ feedbacks }) {
  if (!feedbacks || feedbacks.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Alertas da Rodada
      </h3>
      {feedbacks.map((msg, i) => {
        const type = classifyFeedback(msg);
        return (
          <div
            key={i}
            className={`flex gap-2.5 items-start rounded-lg px-3 py-2.5 text-sm border
              ${type === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}
          >
            <span className="mt-px shrink-0">{type === 'error' ? '✕' : '⚠'}</span>
            <span>{msg}</span>
          </div>
        );
      })}
    </div>
  );
}

function RankingCard({ position, roundId }) {
  if (position == null) return null;

  const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {medal && <span className="text-2xl">{medal}</span>}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Posição no Ranking
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">
            {position}º lugar
          </p>
        </div>
      </div>
      <Link
        to="/ranking"
        className="text-sm font-medium text-blue-600 hover:text-blue-800 transition"
      >
        Ver ranking completo →
      </Link>
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────

export default function ResultsPage() {
  const [closedRounds, setClosedRounds] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState(null);
  const [result, setResult] = useState(null);
  const [rankingPosition, setRankingPosition] = useState(null);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadingResult, setLoadingResult] = useState(false);
  const [noResult, setNoResult] = useState(false);

  // Carrega lista de rodadas encerradas
  function loadRounds() {
    setLoadError('');
    setLoadingRounds(true);
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
      .catch(() => setLoadError('Não foi possível carregar as rodadas.'))
      .finally(() => setLoadingRounds(false));
  }

  useEffect(() => { loadRounds(); }, []);

  // Carrega resultado e ranking ao mudar a rodada
  useEffect(() => {
    if (!selectedRoundId) return;

    setLoadingResult(true);
    setResult(null);
    setNoResult(false);
    setRankingPosition(null);

    Promise.allSettled([
      roundService.getResults(selectedRoundId),
      roundService.getRanking(selectedRoundId),
    ]).then(([resultResp, rankingResp]) => {
      if (resultResp.status === 'fulfilled') {
        setResult(resultResp.value);

        // Determina posição no ranking
        if (rankingResp.status === 'fulfilled') {
          const storeName = resultResp.value.store?.name;
          const entry = rankingResp.value.find((r) => r.storeName === storeName);
          if (entry) setRankingPosition(entry.position);
        }
      } else {
        const status = resultResp.reason?.response?.status;
        if (status === 404) {
          setNoResult(true);
        }
      }
    }).finally(() => setLoadingResult(false));
  }, [selectedRoundId]);

  if (loadingRounds) {
    return (
      <PlayerLayout>
        <div className="max-w-3xl flex flex-col gap-4">
          <Skeleton variant="line" className="w-40 h-6" />
          <Skeleton variant="card" />
          <Skeleton variant="table" rows={3} />
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
          <p className="text-sm text-gray-400">Os resultados aparecem aqui após o encerramento de cada rodada.</p>
        </div>
      </PlayerLayout>
    );
  }

  const feedbacks = result ? gerarFeedback(result) : [];

  return (
    <PlayerLayout>
      <div className="max-w-3xl flex flex-col gap-6">
        {/* Cabeçalho + seletor */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Resultados</h1>
            <p className="text-sm text-gray-500 mt-0.5">Desempenho da sua loja por rodada.</p>
          </div>
          <RoundSelector
            rounds={closedRounds}
            selectedId={selectedRoundId}
            onChange={setSelectedRoundId}
          />
        </div>

        {loadingResult ? (
          <div className="flex flex-col gap-3">
            <Skeleton variant="card" />
            <Skeleton variant="table" rows={5} />
          </div>
        ) : noResult ? (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-10 flex flex-col items-center gap-2">
            <p className="text-gray-500 font-medium">Sua loja não submeteu configuração nesta rodada.</p>
            <p className="text-sm text-gray-400">Nenhum resultado disponível para exibição.</p>
          </div>
        ) : result ? (
          <>
            {/* Card de resumo */}
            <SummaryCard netProfit={result.netProfit} netMargin={result.netMargin} />

            {/* Posição no ranking */}
            <RankingCard position={rankingPosition} roundId={selectedRoundId} />

            {/* Tabela DRE */}
            <DRETable result={result} />

            {/* Receita por produto */}
            {result.roundConfig?.roundConfigItems && (
              <ProductBreakdownTable roundConfigItems={result.roundConfig.roundConfigItems} />
            )}

            {/* Alertas */}
            <FeedbackList feedbacks={feedbacks} />
          </>
        ) : null}
      </div>
    </PlayerLayout>
  );
}
