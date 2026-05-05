import { useEffect, useState } from 'react';
import roundService from '../services/roundService';
import useAuthStore from '../store/authStore';
import PlayerLayout from '../components/layout/PlayerLayout';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import { formatCurrency, formatPercent } from '../utils/formatters';
import type { Round, RankingEntry } from '../types';

// ─── Position medal colors ────────────────────────────────────────────────────

const MEDAL: Record<number, { bg: string; color: string; border: string; emoji: string; rowBg: string }> = {
  1: { bg: '#fef9c3', color: '#854d0e', border: '#fde047', emoji: '🥇', rowBg: '#fefce8' },
  2: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', emoji: '🥈', rowBg: '#f8fafc' },
  3: { bg: '#fff7ed', color: '#9a3412', border: '#fdba74', emoji: '🥉', rowBg: '#fff7ed' },
};

// ─── Round Selector ───────────────────────────────────────────────────────────

function RoundSelector({ rounds, selectedId, onChange }: {
  rounds: Round[]; selectedId: string | null; onChange: (id: string) => void;
}) {
  if (rounds.length === 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cenc-gray-600)', whiteSpace: 'nowrap' }}>Rodada</label>
      <select
        value={selectedId ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="input-cenc"
        style={{
          borderRadius: 10, border: '1.5px solid var(--cenc-gray-300)',
          padding: '7px 12px', fontSize: '13px', fontWeight: 600,
          color: 'var(--cenc-gray-800)', background: 'white', outline: 'none', cursor: 'pointer',
        }}
      >
        {rounds.map((r) => (
          <option key={r.id} value={r.id}>Rodada #{r.number}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Top Banner ───────────────────────────────────────────────────────────────

function TopBanner({ position }: { position: number }) {
  const configs: Record<number, { text: string; bg: string; border: string; color: string }> = {
    1: { text: 'Parabéns! Sua loja está em 1º lugar nesta rodada!', bg: '#fefce8', border: '#fde047', color: '#854d0e' },
    2: { text: 'Muito bem! Sua loja está em 2º lugar nesta rodada!', bg: '#f8fafc', border: '#cbd5e1', color: '#475569' },
    3: { text: 'Ótimo resultado! Sua loja está em 3º lugar nesta rodada!', bg: '#fff7ed', border: '#fdba74', color: '#9a3412' },
  };
  const cfg = configs[position];
  if (!cfg) return null;
  const medal = MEDAL[position];
  return (
    <div className="animate-slide-down" style={{
      display: 'flex', alignItems: 'center', gap: 14,
      borderRadius: 14, padding: '14px 20px',
      background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      <span style={{ fontSize: '28px', lineHeight: 1 }}>{medal.emoji}</span>
      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: cfg.color }}>{cfg.text}</p>
    </div>
  );
}

// ─── Position Cell ────────────────────────────────────────────────────────────

function PositionCell({ position }: { position: number }) {
  const medal = MEDAL[position];
  if (medal) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 30, height: 30, borderRadius: '50%',
        background: medal.bg, border: `1.5px solid ${medal.border}`,
        fontSize: '13px', fontWeight: 800, color: medal.color,
      }}>
        {position}
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 30, height: 30, borderRadius: '50%',
      background: 'var(--cenc-gray-100)', border: '1px solid var(--cenc-gray-200)',
      fontSize: '12px', fontWeight: 600, color: 'var(--cenc-gray-600)',
    }}>
      {position}
    </span>
  );
}

// ─── Ranking Table ────────────────────────────────────────────────────────────

function RankingTable({ ranking, mySquadId }: { ranking: RankingEntry[]; mySquadId: string | null | undefined }) {
  return (
    <div style={{ borderRadius: 14, border: '1px solid var(--cenc-gray-200)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: 'var(--cenc-gray-50)', borderBottom: '1px solid var(--cenc-gray-200)' }}>
            {[
              { label: '#', align: 'center', width: 56 },
              { label: 'Squad', align: 'left' },
              { label: 'Loja', align: 'left' },
              { label: 'Receita Bruta', align: 'right' },
              { label: 'Margem Líq.', align: 'right' },
              { label: 'Lucro Líquido', align: 'right' },
            ].map((col) => (
              <th key={col.label} style={{
                padding: '12px 16px', fontWeight: 700, fontSize: '11px',
                color: 'var(--cenc-gray-500)', textTransform: 'uppercase',
                letterSpacing: '0.06em', textAlign: col.align as 'left' | 'right' | 'center',
                width: col.width,
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ranking.map((entry) => {
            const isMe = entry.squadId === mySquadId;
            const medal = MEDAL[entry.position];
            const isPositive = entry.ebitda >= 0;

            return (
              <tr key={entry.position} className="table-row-hover" style={{
                borderTop: '1px solid var(--cenc-gray-100)',
                background: isMe
                  ? 'var(--cenc-blue-50)'
                  : medal ? medal.rowBg : 'white',
                borderLeft: isMe ? '3px solid var(--cenc-blue-500)' : '3px solid transparent',
              }}>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <PositionCell position={entry.position} />
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--cenc-gray-800)' }}>
                  {entry.squadName}
                  {isMe && (
                    <span style={{
                      marginLeft: 8, display: 'inline-flex', alignItems: 'center',
                      borderRadius: 99, padding: '2px 8px', fontSize: '11px', fontWeight: 700,
                      background: 'var(--cenc-blue-100)', color: 'var(--cenc-blue-700)',
                      border: '1px solid var(--cenc-blue-200)',
                    }}>você</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--cenc-gray-600)' }}>{entry.storeName}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--cenc-gray-700)', fontWeight: 500 }}>
                  {formatCurrency(entry.grossRevenue)}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: entry.ebitdaMargin < 0 ? 'var(--cenc-danger)' : 'var(--cenc-success)' }}>
                  {formatPercent(entry.ebitdaMargin)}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: isPositive ? 'var(--cenc-success)' : 'var(--cenc-danger)' }}>
                  {isPositive ? '' : '−'}{formatCurrency(Math.abs(entry.ebitda))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function RankingPage() {
  const { user } = useAuthStore();
  const [closedRounds, setClosedRounds] = useState<Round[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadingRanking, setLoadingRanking] = useState(false);

  function loadRounds() {
    setLoadError(''); setLoadingRounds(true);
    roundService.getRounds()
      .then((rounds: Round[]) => {
        const closed = rounds.filter((r) => r.status === 'CLOSED').sort((a, b) => b.number - a.number);
        setClosedRounds(closed);
        if (closed.length > 0) setSelectedRoundId(closed[0].id);
      })
      .catch(() => setLoadError('Não foi possível carregar as rodadas.'))
      .finally(() => setLoadingRounds(false));
  }

  useEffect(() => { loadRounds(); }, []);

  useEffect(() => {
    if (!selectedRoundId) return;
    setLoadingRanking(true); setRanking([]);
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
        <div style={{ maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Skeleton variant="line" width="140px" height="28px" />
          <Skeleton variant="table" rows={5} />
        </div>
      </PlayerLayout>
    );
  }

  if (loadError) {
    return <PlayerLayout><ErrorMessage message={loadError} onRetry={loadRounds} /></PlayerLayout>;
  }

  if (closedRounds.length === 0) {
    return (
      <PlayerLayout>
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 240, gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--cenc-blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--cenc-blue-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--cenc-gray-700)' }}>Nenhuma rodada encerrada ainda</p>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--cenc-gray-400)' }}>O ranking aparece aqui após o encerramento de cada rodada.</p>
        </div>
      </PlayerLayout>
    );
  }

  return (
    <PlayerLayout>
      <div style={{ maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 24 }} className="page-enter">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--cenc-gray-900)' }}>Ranking</h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--cenc-gray-500)' }}>Classificação das lojas por rodada.</p>
          </div>
          <RoundSelector rounds={closedRounds} selectedId={selectedRoundId} onChange={setSelectedRoundId} />
        </div>

        {showTopBanner && myPosition && <TopBanner position={myPosition} />}

        {loadingRanking ? (
          <Skeleton variant="table" rows={5} />
        ) : ranking.length === 0 ? (
          <div style={{ borderRadius: 14, border: '1px solid var(--cenc-gray-200)', background: 'white', padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--cenc-gray-400)' }}>Nenhum dado de ranking disponível para esta rodada.</p>
          </div>
        ) : (
          <RankingTable ranking={ranking} mySquadId={user?.squadId} />
        )}
      </div>
    </PlayerLayout>
  );
}
