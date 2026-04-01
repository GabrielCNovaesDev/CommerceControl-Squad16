import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import roundService from '../services/roundService';
import AdminLayout from '../components/layout/AdminLayout';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import { useToast } from '../hooks/useToast';
import { formatCurrency, formatPercent } from '../utils/formatters';

// ─── Paleta de squads para o gráfico de linhas ───────────────────────────────

const LINE_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sortByMargin(results) {
  return [...results].sort((a, b) => {
    if (b.netMargin !== a.netMargin) return b.netMargin - a.netMargin;
    return b.netProfit - a.netProfit;
  });
}

function exportToCsv(rows) {
  const headers = [
    'Posição', 'Squad', 'Loja',
    'Receita Bruta', 'Custos', 'Lucro Bruto',
    'Despesas', 'Lucro Líquido', 'Margem Líquida (%)',
  ];

  const escape = (v) => {
    const s = String(v).replace(/"/g, '""');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
  };

  const lines = [
    headers.join(','),
    ...rows.map((r, i) => [
      i + 1,
      escape(r.store.squad?.name ?? '—'),
      escape(r.store.name),
      r.grossRevenue.toFixed(2),
      r.costs.toFixed(2),
      r.grossProfit.toFixed(2),
      r.expenses.toFixed(2),
      r.netProfit.toFixed(2),
      r.netMargin.toFixed(2),
    ].join(',')),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'resultados.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function RoundSelector({ rounds, selectedId, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-gray-600 shrink-0">Rodada</label>
      <select
        value={selectedId ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
      >
        {rounds.map((r) => (
          <option key={r.id} value={r.id}>
            #{r.number} — {r.status === 'CLOSED' ? 'Encerrada' : r.status === 'OPEN' ? 'Aberta' : 'Processando'}
          </option>
        ))}
      </select>
    </div>
  );
}

function ResultsTable({ sorted }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs text-gray-500 border-b border-gray-200">
            <th className="px-3 py-3 font-semibold w-12 text-center">#</th>
            <th className="px-3 py-3 font-semibold">Squad</th>
            <th className="px-3 py-3 font-semibold">Loja</th>
            <th className="px-3 py-3 font-semibold text-right">Rec. Bruta</th>
            <th className="px-3 py-3 font-semibold text-right">Custos</th>
            <th className="px-3 py-3 font-semibold text-right">Luc. Bruto</th>
            <th className="px-3 py-3 font-semibold text-right">Despesas</th>
            <th className="px-3 py-3 font-semibold text-right">Luc. Líquido</th>
            <th className="px-3 py-3 font-semibold text-right">Margem</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={r.id} className="border-t border-gray-100 bg-white hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2.5 text-center">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  {i + 1}
                </span>
              </td>
              <td className="px-3 py-2.5 font-medium text-gray-800">
                {r.store.squad?.name ?? '—'}
              </td>
              <td className="px-3 py-2.5 text-gray-600">{r.store.name}</td>
              <td className="px-3 py-2.5 text-right text-gray-700">{formatCurrency(r.grossRevenue)}</td>
              <td className="px-3 py-2.5 text-right text-gray-600">{formatCurrency(r.costs)}</td>
              <td className="px-3 py-2.5 text-right text-gray-700">{formatCurrency(r.grossProfit)}</td>
              <td className="px-3 py-2.5 text-right text-gray-600">{formatCurrency(r.expenses)}</td>
              <td className={`px-3 py-2.5 text-right font-semibold ${r.netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {r.netProfit >= 0 ? '' : '- '}{formatCurrency(Math.abs(r.netProfit))}
              </td>
              <td className={`px-3 py-2.5 text-right font-semibold ${r.netMargin >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {formatPercent(r.netMargin)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MarginBarChart({ data }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Margem Líquida por Squad</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="squad"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `${v.toFixed(0)}%`}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(v) => [`${v.toFixed(2)}%`, 'Margem Líquida']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 2" />
          <Bar dataKey="netMargin" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.netMargin >= 0 ? '#10b981' : '#ef4444'}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MarginLineChart({ historyData, squadNames }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Evolução da Margem por Rodada</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="round"
            type="category"
            allowDuplicatedCategory={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            tickFormatter={(v) => `#${v}`}
          />
          <YAxis
            tickFormatter={(v) => `${v.toFixed(0)}%`}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(v, name) => [`${Number(v).toFixed(2)}%`, name]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            labelFormatter={(l) => `Rodada #${l}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 2" />
          {squadNames.map((name, i) => (
            <Line
              key={name}
              data={historyData.filter((d) => d.squadName === name)}
              dataKey="netMargin"
              name={name}
              stroke={LINE_COLORS[i % LINE_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminResultsPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allRounds, setAllRounds] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState(searchParams.get('roundId') ?? null);
  const [results, setResults] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadingResults, setLoadingResults] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Carrega lista de rodadas
  function loadRounds() {
    setLoadError('');
    setLoadingRounds(true);
    roundService.getRounds()
      .then((rounds) => {
        const sorted = [...rounds].sort((a, b) => b.number - a.number);
        setAllRounds(sorted);

        if (!selectedRoundId && sorted.length > 0) {
          setSelectedRoundId(sorted[0].id);
        }
      })
      .catch(() => setLoadError('Não foi possível carregar as rodadas.'))
      .finally(() => setLoadingRounds(false));
  }

  useEffect(() => { loadRounds(); }, []);

  // Atualiza query param quando seletor muda
  useEffect(() => {
    if (selectedRoundId) {
      setSearchParams({ roundId: selectedRoundId }, { replace: true });
    }
  }, [selectedRoundId]);

  // Carrega resultados da rodada selecionada
  useEffect(() => {
    if (!selectedRoundId) return;

    const round = allRounds.find((r) => r.id === selectedRoundId);
    if (!round || round.status !== 'CLOSED') {
      setResults([]);
      return;
    }

    setLoadingResults(true);
    setResults([]);

    roundService.getResults(selectedRoundId)
      .then((data) => setResults(Array.isArray(data) ? data : []))
      .catch(() => setResults([]))
      .finally(() => setLoadingResults(false));
  }, [selectedRoundId, allRounds]);

  // Carrega histórico para o gráfico de linha (todas as rodadas CLOSED)
  useEffect(() => {
    const closedRounds = allRounds.filter((r) => r.status === 'CLOSED');
    if (closedRounds.length < 2) {
      setHistoryData([]);
      return;
    }

    setLoadingHistory(true);

    Promise.allSettled(
      closedRounds.map((r) => roundService.getResults(r.id).then((res) => ({ round: r.number, results: res })))
    ).then((settled) => {
      const points = [];
      settled.forEach((s) => {
        if (s.status !== 'fulfilled') return;
        const { round, results: res } = s.value;
        if (!Array.isArray(res)) return;
        res.forEach((r) => {
          points.push({
            round,
            squadName: r.store.squad?.name ?? r.store.name,
            netMargin: r.netMargin,
          });
        });
      });
      setHistoryData(points);
    }).finally(() => setLoadingHistory(false));
  }, [allRounds]);

  // ── Dados derivados ───────────────────────────────────────────────────────

  const selectedRound = allRounds.find((r) => r.id === selectedRoundId);
  const sorted = useMemo(() => sortByMargin(results), [results]);

  const barData = useMemo(() =>
    sorted.map((r) => ({
      squad: r.store.squad?.name ?? r.store.name,
      netMargin: r.netMargin,
    })),
  [sorted]);

  const squadNames = useMemo(() => {
    const seen = new Set();
    historyData.forEach((d) => seen.add(d.squadName));
    return [...seen];
  }, [historyData]);

  const closedCount = allRounds.filter((r) => r.status === 'CLOSED').length;

  // ── Render ────────────────────────────────────────────────────────────────

  if (loadingRounds) {
    return (
      <AdminLayout>
        <div className="max-w-6xl flex flex-col gap-4">
          <Skeleton variant="line" className="w-40 h-6" />
          <Skeleton variant="table" rows={4} />
        </div>
      </AdminLayout>
    );
  }

  if (loadError) {
    return (
      <AdminLayout>
        <ErrorMessage message={loadError} onRetry={loadRounds} />
      </AdminLayout>
    );
  }

  if (allRounds.length === 0) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-40 gap-2">
          <p className="text-gray-500 font-medium">Nenhuma rodada cadastrada.</p>
        </div>
      </AdminLayout>
    );
  }

  const isNotClosed = selectedRound && selectedRound.status !== 'CLOSED';

  return (
    <AdminLayout>
      <div className="max-w-6xl flex flex-col gap-6">
        {/* Cabeçalho + seletor */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Resultados</h1>
            <p className="text-sm text-gray-500 mt-0.5">Visão consolidada do desempenho de todas as lojas.</p>
          </div>
          <div className="flex items-center gap-3">
            {sorted.length > 0 && (
              <button
                onClick={() => { exportToCsv(sorted); toast.success('Arquivo CSV baixado.'); }}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 rounded-lg px-3 py-1.5 transition-colors"
              >
                Exportar CSV
              </button>
            )}
            <RoundSelector
              rounds={allRounds}
              selectedId={selectedRoundId}
              onChange={setSelectedRoundId}
            />
          </div>
        </div>

        {/* Rodada não encerrada */}
        {isNotClosed && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 flex items-center gap-3">
            <span className="text-yellow-600">⚠</span>
            <div>
              <p className="text-sm font-medium text-yellow-800">Esta rodada ainda não foi encerrada.</p>
              <p className="text-xs text-yellow-700 mt-0.5">
                Os resultados estarão disponíveis após o encerramento da Rodada #{selectedRound.number}.
              </p>
            </div>
            <span className="ml-auto">
              <Badge variant={selectedRound.status === 'OPEN' ? 'green' : 'yellow'}>
                {selectedRound.status === 'OPEN' ? 'Aberta' : 'Processando'}
              </Badge>
            </span>
          </div>
        )}

        {/* Conteúdo — só exibe quando rodada está CLOSED */}
        {!isNotClosed && (
          <>
            {/* Tabela */}
            {loadingResults ? (
              <Skeleton variant="table" rows={4} />
            ) : sorted.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-10 flex items-center justify-center">
                <p className="text-sm text-gray-400">Nenhum resultado disponível para esta rodada.</p>
              </div>
            ) : (
              <ResultsTable sorted={sorted} />
            )}

            {/* Gráfico de barras */}
            {sorted.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                <MarginBarChart data={barData} />
              </div>
            )}

            {/* Gráfico de linha histórico */}
            {closedCount >= 2 && (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                {loadingHistory ? (
                  <div className="h-40 flex items-center justify-center text-sm text-gray-400 animate-pulse">
                    Carregando histórico...
                  </div>
                ) : historyData.length > 0 ? (
                  <MarginLineChart historyData={historyData} squadNames={squadNames} />
                ) : null}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
