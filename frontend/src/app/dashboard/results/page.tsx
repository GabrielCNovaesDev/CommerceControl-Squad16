'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Skeleton from '@/components/ui/Skeleton';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { formatCurrency } from '@/components/utils/formatters';
import { apiFetch, asArray } from '@/components/utils/api';
import type { Round, FinancialResult, RankingEntry, RoundConfigItem, RoundEvent } from '@/components/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

// ─── Helpers ───────────────────────────────────────────────────────────────

function gerarFeedback(result: FinancialResult): string[] {
  const feedbacks: string[] = [];

  if (result.ebitda < 0) {
    feedbacks.push('EBITDA negativo: sua loja teve prejuízo nesta rodada.');
  }
  if (result.costs > result.netRevenue) {
    feedbacks.push(
      'Custo de venda superou a receita líquida. Revise a margem comercial — ela precisa cobrir impostos e gerar lucro.'
    );
  }
  if (result.grossMargin < 0) {
    feedbacks.push(
      'Margem bruta negativa: os impostos e custos consumiram toda a receita líquida.'
    );
  }
  if (result.grossRevenue === 0) {
    feedbacks.push(
      'Nenhuma receita gerada nesta rodada. Verifique se o estoque estava disponível e os volumes configurados.'
    );
  }

  const items = result.roundConfig?.roundConfigItems ?? [];
  const stockLimited = items.filter(
    (item) => item.salesVolume > 0 && item.product?.purchasePrice != null
  );
  if (
    stockLimited.length > 0 &&
    result.grossRevenue < stockLimited.reduce(
      (sum, item) => {
        const purchasePrice = item.product?.purchasePrice ?? 0;
        const estimatedSalePrice = purchasePrice * (1 + item.margin);
        return sum + estimatedSalePrice * item.salesVolume;
      },
      0
    )
  ) {
    feedbacks.push(
      'Um ou mais produtos tiveram volume de vendas limitado pelo estoque disponível. Revise seu estoque.'
    );
  }

  return feedbacks;
}

function classifyFeedback(msg: string): 'error' | 'warning' {
  const errorKeywords = ['prejuízo', 'negativo', 'custo de venda superou'];
  return errorKeywords.some((kw) => msg.toLowerCase().includes(kw)) ? 'error' : 'warning';
}

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
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        style={{ background: 'var(--cenc-surface)', color: 'var(--cenc-gray-800)' }}
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

function SummaryCard({
  ebitda,
  ebitdaMargin,
  demandShare,
}: {
  ebitda: number;
  ebitdaMargin: number;
  demandShare: number;
}) {
  const isPositive = ebitda >= 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-5 flex items-center justify-between gap-6">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">EBITDA</p>
        <p className={`text-3xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '' : '- '}{formatCurrency(Math.abs(ebitda))}
        </p>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
          Participação de Mercado
        </p>
        <p className="text-2xl font-semibold text-blue-600">
          {(demandShare * 100).toFixed(1)}%
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
          Margem EBITDA
        </p>
        <p className={`text-2xl font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {ebitdaMargin.toFixed(2)}%
        </p>
      </div>
    </div>
  );
}

function DRERow({
  label,
  value,
  highlight,
  subtotal,
  sign = '',
}: {
  label: string;
  value: number;
  highlight?: boolean;
  subtotal?: boolean;
  sign?: string;
}) {
  const isNegative = value < 0;
  const colorClass = highlight
    ? isNegative ? 'text-red-600' : 'text-green-700'
    : subtotal
      ? isNegative ? 'text-red-500' : 'text-blue-700'
      : 'text-gray-700';

  return (
    <div
      className={`flex justify-between items-center px-4 py-2.5 text-sm border-b border-gray-50 last:border-0
        ${highlight ? 'font-semibold bg-gray-50' : subtotal ? 'font-medium bg-blue-50/40' : ''}`}
    >
      <span className="text-gray-600">{label}</span>
      <span className={colorClass}>
        {sign}{formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}

function DRETable({ result }: { result: FinancialResult }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        DRE — Demonstrativo de Resultado
      </h3>
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <DRERow label="Receita Bruta" value={result.grossRevenue} />
        <DRERow label="(-) Impostos" value={result.taxes} sign="- " />
        <DRERow label="(=) Receita Líquida" value={result.netRevenue} subtotal />
        <DRERow label="(-) Custo de Venda" value={result.costs} sign="- " />
        <DRERow label="(=) Massa Margem Líquida (PDV)" value={result.grossMargin} subtotal />
        <DRERow label="(-) Quebras" value={result.totalBreakage} sign="- " />
        <DRERow label="(-) Aging" value={result.totalAging} sign="- " />
        <DRERow label="(=) Massa Margem Final" value={result.netMarginMass} subtotal />
        <DRERow label="(-) Outros Gastos" value={result.otherExpenses} sign="- " />
        <DRERow label="(=) EBITDA" value={result.ebitda} highlight />
        <div className="flex justify-between items-center px-4 py-2.5 text-sm bg-gray-50 border-t border-gray-100">
          <span className="text-gray-500">Margem EBITDA (% Rec. Líquida)</span>
          <span className={`font-semibold ${result.ebitdaMargin < 0 ? 'text-red-600' : 'text-green-700'}`}>
            {result.ebitdaMargin.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}

function ProductBreakdownTable({ roundConfigItems }: { roundConfigItems: RoundConfigItem[] }) {
  if (!roundConfigItems || roundConfigItems.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Configuração por Categoria
      </h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500">
              <th className="px-3 py-2 font-medium">Categoria</th>
              <th className="px-3 py-2 font-medium text-right">Margem config.</th>
              <th className="px-3 py-2 font-medium text-right">Vol. config.</th>
            </tr>
          </thead>
          <tbody>
            {roundConfigItems.map((item) => (
              <tr key={item.productId} className="border-t border-gray-100 bg-white">
                <td className="px-3 py-2 text-gray-800 font-medium">{item.product?.name}</td>
                <td className="px-3 py-2 text-right text-gray-600">
                  {(item.margin * 100).toFixed(1)}%
                </td>
                <td className="px-3 py-2 text-right text-gray-600">{item.salesVolume}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FeedbackList({ feedbacks }: { feedbacks: string[] }) {
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
            className="flex gap-2.5 items-start rounded-lg px-3 py-2.5 text-sm border"
            style={type === 'error'
              ? {
                background: 'var(--cenc-danger-bg)',
                borderColor: 'rgba(220, 38, 38, 0.25)',
                color: 'var(--cenc-danger)',
              }
              : {
                background: 'var(--cenc-warning-bg)',
                borderColor: 'rgba(217, 119, 6, 0.25)',
                color: 'var(--cenc-warning)',
              }}
          >
            <span className="mt-px shrink-0">{type === 'error' ? '✕' : '⚠'}</span>
            <span>{msg}</span>
          </div>
        );
      })}
    </div>
  );
}

function RankingCard({ position, roundId }: { position: number | null; roundId: string | null }) {
  if (position == null || roundId == null) return null;

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
        href="/dashboard/ranking"
        className="text-sm font-medium text-blue-600 hover:text-blue-800 transition"
      >
        Ver ranking completo →
      </Link>
    </div>
  );
}

function AiReportCard({ aiReport }: { aiReport?: string | null }) {
  if (!aiReport) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">✦</span>
          <h3 className="text-sm font-semibold text-gray-700">Análise da IA</h3>
          <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full border" style={{ background: 'var(--cenc-warning-bg)', color: 'var(--cenc-warning)', borderColor: 'rgba(217, 119, 6, 0.25)' }}>
            Em desenvolvimento
          </span>
        </div>
        <p className="text-sm text-gray-400">
          Análise não disponível para esta rodada. Esta funcionalidade está em fase de desenvolvimento.
        </p>
      </div>
    );
  }

  let currentSection = '';

  return (
    <div className="rounded-xl border border-blue-200 bg-white shadow-sm px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">✦</span>
        <h3 className="text-sm font-semibold text-blue-700">Análise da IA</h3>
      </div>
      <div className="prose prose-sm max-w-none text-gray-700">
        {aiReport.split('\n').map((line, i) => {
          if (line.startsWith('### ')) {
            currentSection = line.replace('### ', '');
            const isAlert = currentSection === 'Alertas Operacionais';
            const isBenchmark = currentSection === 'Benchmarking Comparativo';
            const isMarket = currentSection === 'Resumo do Mercado';
            const colorClass = isAlert
              ? 'text-orange-700'
              : isBenchmark
                ? 'text-blue-700'
                : isMarket
                  ? 'text-indigo-700'
                  : 'text-gray-800';
            return <h4 key={i} className={`text-sm font-bold mt-4 mb-2 ${colorClass}`}>{currentSection}</h4>;
          }
          if (line.startsWith('- ')) {
            const isAlertSection = currentSection === 'Alertas Operacionais';
            return (
              <li key={i} className={`text-sm ml-4 ${isAlertSection ? 'text-orange-700' : ''}`}>
                {line.replace('- ', '')}
              </li>
            );
          }
          if (line.trim() === '') return null;
          return <p key={i} className="text-sm mb-2">{line}</p>;
        })}
      </div>
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────

export default function ResultsPage() {
  const [closedRounds, setClosedRounds] = useState<Round[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [result, setResult] = useState<FinancialResult | null>(null);
  const [rankingPosition, setRankingPosition] = useState<number | null>(null);
  const [playerEvents, setPlayerEvents] = useState<RoundEvent[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadingResult, setLoadingResult] = useState(false);
  const [noResult, setNoResult] = useState(false);

  async function loadRounds() {
    setLoadError('');
    setLoadingRounds(true);
    const res = await apiFetch<unknown>(`${API_BASE}/rounds`);
    if (res.error) {
      setLoadError(res.error);
      setLoadingRounds(false);
      return;
    }
    const rounds = asArray<Round>(res.data);
    const closed = rounds
      .filter((r: Round) => r.status === 'CLOSED')
      .sort((a: Round, b: Round) => b.number - a.number);
    setClosedRounds(closed);
    if (closed.length > 0) {
      setSelectedRoundId(closed[0].id);
    }
    setLoadingRounds(false);
  }

  useEffect(() => { loadRounds(); }, []);

  useEffect(() => {
    if (!selectedRoundId) return;

    setLoadingResult(true);
    setResult(null);
    setNoResult(false);
    setRankingPosition(null);
    setPlayerEvents([]);

    Promise.all([
      apiFetch<unknown>(`${API_BASE}/rounds/${selectedRoundId}/results`),
      apiFetch<unknown>(`${API_BASE}/rounds/${selectedRoundId}/ranking`),
      apiFetch<unknown>(`${API_BASE}/rounds/${selectedRoundId}/events`),
    ]).then(([resultResp, rankingResp, eventsResp]) => {
      if (resultResp.error && resultResp.status === 404) {
        setNoResult(true);
      } else if (!resultResp.error && resultResp.data) {
        const res = resultResp.data as FinancialResult;
        setResult(res);

        if (!rankingResp.error) {
          const ranking = asArray<RankingEntry>(rankingResp.data);
          const storeName = res.store?.name;
          const entry = ranking.find((r) => r.storeName === storeName);
          if (entry) setRankingPosition(entry.position);
        }
      }
      if (!eventsResp.error) {
        setPlayerEvents(asArray<RoundEvent>(eventsResp.data));
      }
    }).finally(() => setLoadingResult(false));
  }, [selectedRoundId]);

  if (loadingRounds) {
    return (
      <div className="max-w-3xl flex flex-col gap-4">
        <Skeleton variant="line" className="w-40 h-6" />
        <Skeleton variant="card" />
        <Skeleton variant="table" rows={3} />
      </div>
    );
  }

  if (loadError) {
    return <ErrorMessage message={loadError} onRetry={loadRounds} />;
  }

  if (closedRounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--cenc-blue-50)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--cenc-blue-400)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">Nenhuma rodada encerrada ainda.</p>
        <p className="text-sm text-gray-400">Os resultados aparecem aqui após o encerramento de cada rodada.</p>
      </div>
    );
  }

  const feedbacks = result ? gerarFeedback(result) : [];

  return (
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
          <SummaryCard
            ebitda={result.ebitda}
            ebitdaMargin={result.ebitdaMargin}
            demandShare={result.demandShare ?? 0}
          />

          {/* Posição no ranking */}
          <RankingCard position={rankingPosition} roundId={selectedRoundId} />

          {/* Tabela DRE */}
          <DRETable result={result} />

          {/* Configuração por categoria */}
          {result.roundConfig?.roundConfigItems && (
            <ProductBreakdownTable roundConfigItems={result.roundConfig.roundConfigItems} />
          )}

          {/* Alertas */}
          <FeedbackList feedbacks={feedbacks} />

          {/* Eventos da rodada */}
          {playerEvents.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-5 py-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                ⚡ Eventos da Rodada
              </h3>
              <div className="flex flex-col gap-2">
                {playerEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-lg px-4 py-3 text-sm border"
                    style={{
                      background: event.mitigated ? '#f0fdf4' : '#fef2f2',
                      borderColor: event.mitigated ? '#bbf7d0' : '#fecaca',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span>{event.mitigated ? '🛡' : '⚠'}</span>
                      <span className={event.mitigated ? 'text-green-800' : 'text-red-800'}>
                        {event.description}
                      </span>
                    </div>
                    <span className={`font-semibold ${event.mitigated ? 'text-green-700' : 'text-red-700'}`}>
                      {event.mitigated ? 'Mitigado' : `−${formatCurrency(event.penalty)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Relatório de IA */}
          <AiReportCard aiReport={result.aiReport} />
        </>
      ) : null}
    </div>
  );
}
