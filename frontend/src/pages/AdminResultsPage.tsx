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
import { formatCurrency } from '../utils/formatters';
import type { Round, FinancialResult } from '../types';

// ─── Cencosud chart palette ───────────────────────────────────────────────────

const LINE_COLORS = [
  '#003087', '#f5a623', '#0066ff', '#16a34a',
  '#dc2626', '#7c3aed', '#0891b2', '#db2777',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sortByEbitda(results: FinancialResult[]): FinancialResult[] {
  return [...results].sort((a, b) => {
    if (b.ebitdaMargin !== a.ebitdaMargin) return b.ebitdaMargin - a.ebitdaMargin;
    return b.ebitda - a.ebitda;
  });
}

function exportToCsv(rows: FinancialResult[]) {
  const headers = ['Posição','Squad','Loja','Part. Mercado (%)','Receita Bruta','Impostos','Receita Líquida','Custos','Massa Mg Líquida','Quebras','Aging','Massa Mg Final','Outros Gastos','EBITDA','Margem EBITDA (%)'];
  const escape = (v: unknown) => { const s = String(v).replace(/"/g, '""'); return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s; };
  const lines = [headers.join(','), ...rows.map((r, i) => [i+1, escape(r.store?.squad?.name ?? '—'), escape(r.store?.name ?? '—'), ((r.demandShare ?? 0)*100).toFixed(2), r.grossRevenue.toFixed(2), r.taxes.toFixed(2), r.netRevenue.toFixed(2), r.costs.toFixed(2), r.grossMargin.toFixed(2), r.totalBreakage.toFixed(2), r.totalAging.toFixed(2), r.netMarginMass.toFixed(2), r.otherExpenses.toFixed(2), r.ebitda.toFixed(2), r.ebitdaMargin.toFixed(2)].join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'resultados.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ─── Round Selector ───────────────────────────────────────────────────────────

function RoundSelector({ rounds, selectedId, onChange }: { rounds: Round[]; selectedId: string | null; onChange: (id: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cenc-gray-600)', whiteSpace: 'nowrap' }}>Rodada</label>
      <select value={selectedId ?? ''} onChange={(e) => onChange(e.target.value)} className="input-cenc"
        style={{ borderRadius: 10, border: '1.5px solid var(--cenc-gray-300)', padding: '7px 12px', fontSize: '13px', fontWeight: 600, color: 'var(--cenc-gray-800)', background: 'white', outline: 'none', cursor: 'pointer' }}>
        {rounds.map((r) => (
          <option key={r.id} value={r.id}>#{r.number} — {r.status === 'CLOSED' ? 'Encerrada' : r.status === 'OPEN' ? 'Aberta' : 'Processando'}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Results Table ────────────────────────────────────────────────────────────

function ResultsTable({ sorted }: { sorted: FinancialResult[] }) {
  return (
    <div style={{ borderRadius: 14, border: '1px solid var(--cenc-gray-200)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--cenc-gray-50)', borderBottom: '1px solid var(--cenc-gray-200)' }}>
              {['#','Squad','Loja','Rec. Bruta','Rec. Líquida','Massa Mg Final','Part. Mercado','EBITDA','Margem EBITDA'].map((h, i) => (
                <th key={h} style={{ padding: '12px 14px', fontWeight: 700, fontSize: '11px', color: 'var(--cenc-gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i <= 2 ? 'left' : 'right', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={r.id} className="table-row-hover" style={{ borderTop: '1px solid var(--cenc-gray-100)', background: 'white' }}>
                <td style={{ padding: '11px 14px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: i === 0 ? 'var(--cenc-blue-50)' : 'var(--cenc-gray-100)', fontSize: '12px', fontWeight: 700, color: i === 0 ? 'var(--cenc-blue-700)' : 'var(--cenc-gray-600)' }}>{i+1}</span>
                </td>
                <td style={{ padding: '11px 14px', fontWeight: 600, color: 'var(--cenc-gray-800)' }}>{r.store?.squad?.name ?? '—'}</td>
                <td style={{ padding: '11px 14px', color: 'var(--cenc-gray-600)' }}>{r.store?.name ?? '—'}</td>
                <td style={{ padding: '11px 14px', textAlign: 'right', color: 'var(--cenc-gray-700)' }}>{formatCurrency(r.grossRevenue)}</td>
                <td style={{ padding: '11px 14px', textAlign: 'right', color: 'var(--cenc-gray-700)' }}>{formatCurrency(r.netRevenue)}</td>
                <td style={{ padding: '11px 14px', textAlign: 'right', color: 'var(--cenc-gray-700)' }}>{formatCurrency(r.netMarginMass)}</td>
                <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--cenc-blue-700)' }}>{((r.demandShare ?? 0)*100).toFixed(1)}%</td>
                <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: r.ebitda >= 0 ? 'var(--cenc-success)' : 'var(--cenc-danger)' }}>
                  {r.ebitda >= 0 ? '' : '−'}{formatCurrency(Math.abs(r.ebitda))}
                </td>
                <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, color: r.ebitdaMargin >= 0 ? 'var(--cenc-success)' : 'var(--cenc-danger)' }}>
                  {r.ebitdaMargin.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface BarDataPoint { squad: string; ebitdaMargin: number }
interface LineDataPoint { round: number; squadName: string; ebitdaMargin: number }

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--cenc-gray-200)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '20px 24px' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: 'var(--cenc-gray-800)' }}>{title}</h3>
      {children}
    </div>
  );
}

function EbitdaBarChart({ data }: { data: BarDataPoint[] }) {
  return (
    <ChartCard title="Margem EBITDA por Squad">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" />
          <XAxis dataKey="squad" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} />
          <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}%`} tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(v) => [`${Number(v ?? 0).toFixed(2)}%`, 'Margem EBITDA']} contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid var(--cenc-gray-200)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 2" />
          <Bar dataKey="ebitdaMargin" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.ebitdaMargin >= 0 ? '#003087' : '#dc2626'} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function EbitdaLineChart({ historyData, squadNames }: { historyData: LineDataPoint[]; squadNames: string[] }) {
  return (
    <ChartCard title="Evolução da Margem EBITDA por Rodada">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" />
          <XAxis dataKey="round" type="category" allowDuplicatedCategory={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} tickFormatter={(v: number) => `#${v}`} />
          <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}%`} tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(v, name) => [`${Number(v ?? 0).toFixed(2)}%`, name]} contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid var(--cenc-gray-200)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} labelFormatter={(l) => `Rodada #${l}`} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 2" />
          {squadNames.map((name, i) => (
            <Line key={name} data={historyData.filter((d) => d.squadName === name)} dataKey="ebitdaMargin" name={name} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2.5} dot={{ r: 4, fill: LINE_COLORS[i % LINE_COLORS.length] }} activeDot={{ r: 6 }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function AiReportsSection({ results }: { results: FinancialResult[] }) {
  const withReports = results.filter((r) => r.aiReport);
  const withoutReports = results.filter((r) => !r.aiReport);

  if (results.length === 0) return null;

  return (
    <ChartCard title="✦ Análises da IA por Squad">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {withReports.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--cenc-gray-400)' }}>
              Análises não disponíveis para esta rodada.{' '}
              <span style={{ color: '#ea580c', fontWeight: 600 }}>Esta funcionalidade está em fase de desenvolvimento.</span>
            </p>
          </div>
        )}
        {withReports.map((r) => (
          <div key={r.id} style={{ borderRadius: 12, border: '1px solid var(--cenc-blue-200)', background: '#f8faff', padding: '16px 20px' }}>
            <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: 'var(--cenc-blue-700)' }}>
              {r.store?.squad?.name ?? r.store?.name ?? '—'}
            </p>
            <div style={{ fontSize: '13px', color: 'var(--cenc-gray-700)', lineHeight: 1.6 }}>
              {r.aiReport!.split('\n').map((line, i) => {
                if (line.startsWith('### ')) return <p key={i} style={{ margin: '12px 0 4px', fontWeight: 700, fontSize: '13px', color: 'var(--cenc-gray-800)' }}>{line.replace('### ', '')}</p>;
                if (line.startsWith('- ')) return <li key={i} style={{ marginLeft: 16, fontSize: '13px' }}>{line.replace('- ', '')}</li>;
                if (line.trim() === '') return null;
                return <p key={i} style={{ margin: '0 0 6px', fontSize: '13px' }}>{line}</p>;
              })}
            </div>
          </div>
        ))}
        {withoutReports.length > 0 && withReports.length > 0 && (
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--cenc-gray-400)' }}>
            {withoutReports.length} squad(s) sem análise disponível: {withoutReports.map((r) => r.store?.squad?.name ?? '—').join(', ')}
          </p>
        )}
      </div>
    </ChartCard>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminResultsPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allRounds, setAllRounds] = useState<Round[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(searchParams.get('roundId') ?? null);
  const [results, setResults] = useState<FinancialResult[]>([]);
  const [historyData, setHistoryData] = useState<LineDataPoint[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadingResults, setLoadingResults] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  function loadRounds() {
    setLoadError(''); setLoadingRounds(true);
    roundService.getRounds()
      .then((rounds: Round[]) => {
        const sorted = [...rounds].sort((a, b) => b.number - a.number);
        setAllRounds(sorted);
        if (!selectedRoundId && sorted.length > 0) setSelectedRoundId(sorted[0].id);
      })
      .catch(() => setLoadError('Não foi possível carregar as rodadas.'))
      .finally(() => setLoadingRounds(false));
  }

  useEffect(() => { loadRounds(); }, []);
  useEffect(() => { if (selectedRoundId) setSearchParams({ roundId: selectedRoundId }, { replace: true }); }, [selectedRoundId, setSearchParams]);

  useEffect(() => {
    if (!selectedRoundId) return;
    const round = allRounds.find((r) => r.id === selectedRoundId);
    if (!round || round.status !== 'CLOSED') { setResults([]); return; }
    setLoadingResults(true); setResults([]);
    roundService.getResults(selectedRoundId)
      .then((data: unknown) => setResults(Array.isArray(data) ? data as FinancialResult[] : []))
      .catch((err: unknown) => {
        const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
        const msg = axiosErr.response?.data?.error?.message ?? 'Não foi possível carregar os resultados.';
        toast.error(msg);
        setResults([]);
      })
      .finally(() => setLoadingResults(false));
  }, [selectedRoundId, allRounds]);

  useEffect(() => {
    const closedRounds = allRounds.filter((r) => r.status === 'CLOSED');
    if (closedRounds.length < 2) { setHistoryData([]); return; }
    setLoadingHistory(true);
    Promise.allSettled(closedRounds.map((r) => roundService.getResults(r.id).then((res: unknown) => ({ round: r.number, results: res }))))
      .then((settled) => {
        const points: LineDataPoint[] = [];
        settled.forEach((s) => {
          if (s.status !== 'fulfilled') return;
          const { round, results: res } = s.value as { round: number; results: unknown };
          if (!Array.isArray(res)) return;
          (res as FinancialResult[]).forEach((r) => points.push({ round, squadName: r.store?.squad?.name ?? r.store?.name ?? '—', ebitdaMargin: r.ebitdaMargin }));
        });
        setHistoryData(points);
      }).finally(() => setLoadingHistory(false));
  }, [allRounds]);

  const selectedRound = allRounds.find((r) => r.id === selectedRoundId);
  const sorted = useMemo(() => sortByEbitda(results), [results]);
  const barData = useMemo(() => sorted.map((r) => ({ squad: r.store?.squad?.name ?? r.store?.name ?? '—', ebitdaMargin: r.ebitdaMargin })), [sorted]);
  const squadNames = useMemo(() => { const seen = new Set<string>(); historyData.forEach((d) => seen.add(d.squadName)); return [...seen]; }, [historyData]);
  const closedCount = allRounds.filter((r) => r.status === 'CLOSED').length;

  if (loadingRounds) {
    return <AdminLayout><div style={{ maxWidth: 1000, display: 'flex', flexDirection: 'column', gap: 20 }}><Skeleton variant="line" width="160px" height="28px" /><Skeleton variant="table" rows={4} /></div></AdminLayout>;
  }
  if (loadError) return <AdminLayout><ErrorMessage message={loadError} onRetry={loadRounds} /></AdminLayout>;
  if (allRounds.length === 0) {
    return (
      <AdminLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 160, gap: 8 }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--cenc-gray-500)' }}>Nenhuma rodada cadastrada.</p>
        </div>
      </AdminLayout>
    );
  }

  const isNotClosed = selectedRound && selectedRound.status !== 'CLOSED';

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1000, display: 'flex', flexDirection: 'column', gap: 24 }} className="page-enter">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--cenc-gray-900)' }}>Resultados</h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--cenc-gray-500)' }}>Visão consolidada do desempenho de todas as lojas.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {sorted.length > 0 && (
              <button onClick={() => { exportToCsv(sorted); toast.success('Arquivo CSV baixado.'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, fontSize: '13px', fontWeight: 600, color: 'var(--cenc-blue-700)', background: 'var(--cenc-blue-50)', border: '1px solid var(--cenc-blue-200)', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--cenc-blue-100)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--cenc-blue-50)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Exportar CSV
              </button>
            )}
            <RoundSelector rounds={allRounds} selectedId={selectedRoundId} onChange={setSelectedRoundId} />
          </div>
        </div>

        {/* Not closed warning */}
        {isNotClosed && (
          <div className="animate-slide-down" style={{ borderRadius: 14, border: '1px solid #fde047', background: '#fefce8', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a16207" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#854d0e' }}>Esta rodada ainda não foi encerrada.</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#92400e' }}>Os resultados estarão disponíveis após o encerramento da Rodada #{selectedRound.number}.</p>
            </div>
            <Badge variant={selectedRound.status === 'OPEN' ? 'green' : 'yellow'} dot>{selectedRound.status === 'OPEN' ? 'Aberta' : 'Processando'}</Badge>
          </div>
        )}

        {/* Content */}
        {!isNotClosed && (
          <>
            {loadingResults ? <Skeleton variant="table" rows={4} /> : sorted.length === 0 ? (
              <div style={{ borderRadius: 14, border: '1px solid var(--cenc-gray-200)', background: 'white', padding: '48px 24px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--cenc-gray-400)' }}>Nenhum resultado disponível para esta rodada.</p>
              </div>
            ) : <ResultsTable sorted={sorted} />}

            {sorted.length > 0 && <EbitdaBarChart data={barData} />}

            {closedCount >= 2 && (
              loadingHistory ? (
                <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--cenc-gray-200)', padding: '40px 24px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--cenc-gray-400)' }}>Carregando histórico...</p>
                </div>
              ) : historyData.length > 0 ? <EbitdaLineChart historyData={historyData} squadNames={squadNames} /> : null
            )}

            {sorted.length > 0 && <AiReportsSection results={sorted} />}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
