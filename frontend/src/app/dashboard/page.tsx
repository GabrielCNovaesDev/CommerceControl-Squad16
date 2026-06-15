'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { useCountdown } from '@/components/hooks/useCountdown';
import { formatCurrency } from '@/components/utils/formatters';
import { apiFetch, asArray } from '@/components/utils/api';
import type { Store, InventoryItem, Round, RoundStatus } from '@/components/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

const ROUND_STATUS_BADGE: Record<RoundStatus, { label: string; variant: 'green' | 'yellow' | 'gray' | 'red' | 'blue' }> = {
  OPEN: { label: 'Aberta', variant: 'green' },
  PROCESSING: { label: 'Processando', variant: 'yellow' },
  CLOSED: { label: 'Encerrada', variant: 'gray' },
};

// ─── Timer ────────────────────────────────────────────────────────────────────

function RoundTimer({ endsAt }: { endsAt: string }) {
  const { timeLeft, expired } = useCountdown(endsAt);
  if (expired) {
    return (
      <div style={{ borderRadius: 10, background: 'var(--cenc-warning-bg)', border: '1px solid rgba(217, 119, 6, 0.25)', padding: '10px 14px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--cenc-warning)', fontWeight: 600 }}>Tempo esgotado — aguardando encerramento</p>
      </div>
    );
  }
  return (
    <div style={{ borderRadius: 10, background: 'var(--cenc-blue-50)', border: '1px solid var(--cenc-blue-100)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '12px', color: 'var(--cenc-blue-500)', fontWeight: 600 }}>Tempo restante</span>
      <span style={{ fontSize: '20px', fontFamily: 'monospace', fontWeight: 800, color: 'var(--cenc-blue-700)', letterSpacing: '0.05em' }}>{timeLeft}</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function StoresDashboardPage() {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  async function load() {
    setLoadError('');
    try {
      const storeRes = await apiFetch<Store>(`${API_BASE}/stores/my`);
      // 404 = usuário não tem loja ainda (estado normal — GM é quem cria)
      if (storeRes.status === 404) {
        setStore(null);
        setLoading(false);
        return;
      }
      if (storeRes.error) {
        setLoadError(storeRes.error);
        setLoading(false);
        return;
      }
      if (!storeRes.data) {
        setStore(null);
        setLoading(false);
        return;
      }
      const s = storeRes.data;
      setStore(s);

      const [invRes, roundsRes] = await Promise.all([
        apiFetch<unknown>(`${API_BASE}/stores/${s.id}/inventory`),
        apiFetch<unknown>(`${API_BASE}/rounds`),
      ]);
      setInventory(asArray<InventoryItem>(invRes.data));
      const rounds = asArray<Round>(roundsRes.data);
      const open = rounds.find((r: Round) => r.status === 'OPEN' || r.status === 'PROCESSING');
      setActiveRound(open ?? null);
    } catch {
      setLoadError('Não foi possível carregar os dados da loja.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Skeleton variant="line" width="200px" height="28px" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Skeleton variant="stat" /><Skeleton variant="stat" />
        </div>
        <Skeleton variant="table" rows={4} />
      </div>
    );
  }

  if (loadError) {
    return <ErrorMessage message={loadError} onRetry={() => { setLoading(true); load(); }} />;
  }

  // Squad ainda não tem loja. Quem cria é o Game Master.
  if (!store) {
    return (
      <div style={{ maxWidth: 480, margin: '48px auto' }} className="animate-fade-in">
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid var(--cenc-gray-200)', boxShadow: '0 4px 24px rgba(0,48,135,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '32px 28px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--cenc-blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--cenc-blue-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--cenc-gray-900)' }}>Aguardando Game Master</h2>
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--cenc-gray-500)', lineHeight: 1.5 }}>
              Seu squad ainda não possui uma loja cadastrada. O Game Master é responsável por criar a loja e definir o capital inicial.
            </p>
            <p style={{ margin: '16px 0 0', fontSize: '12px', color: 'var(--cenc-gray-400)' }}>
              Você será notificado assim que a loja for criada.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const roundBadge = activeRound ? ROUND_STATUS_BADGE[activeRound.status] : null;
  const cashPct = ((store.currentCash ?? store.initialCapital) / store.initialCapital) * 100;
  const cashPositive = (store.currentCash ?? store.initialCapital) >= 0;

  return (
    <div style={{ maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 24 }} className="page-enter">

      {/* Store header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--cenc-blue-700), var(--cenc-blue-500))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--cenc-gray-900)' }}>{store.name}</h1>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--cenc-gray-500)' }}>Capital inicial: {formatCurrency(store.initialCapital)}</p>
        </div>

        {/* Cash card */}
        <div style={{
          borderRadius: 14, padding: '14px 20px', textAlign: 'right',
          background: cashPositive ? 'var(--cenc-success-bg)' : 'var(--cenc-danger-bg)',
          border: `1px solid ${cashPositive ? 'rgba(22, 163, 74, 0.25)' : 'rgba(220, 38, 38, 0.25)'}`,
        }}>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cenc-gray-400)' }}>Caixa Atual</p>
          <p style={{ margin: '4px 0 2px', fontSize: '28px', fontWeight: 800, color: cashPositive ? 'var(--cenc-success)' : 'var(--cenc-danger)', lineHeight: 1 }}>
            {formatCurrency(store.currentCash ?? store.initialCapital)}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: cashPositive ? 'var(--cenc-success)' : 'var(--cenc-danger)' }}>
            {cashPct.toFixed(1)}% do capital inicial
          </p>
        </div>
      </div>

      {/* Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>

        {/* Round card */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--cenc-gray-200)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--cenc-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--cenc-gray-700)' }}>Rodada Atual</h2>
            {roundBadge && <span style={{
              padding: '3px 10px', borderRadius: 99, fontSize: '11px', fontWeight: 700,
              background: roundBadge.variant === 'green' ? 'var(--cenc-success-bg)' : roundBadge.variant === 'yellow' ? 'var(--cenc-warning-bg)' : 'var(--cenc-gray-100)',
              color: roundBadge.variant === 'green' ? 'var(--cenc-success)' : roundBadge.variant === 'yellow' ? 'var(--cenc-warning)' : 'var(--cenc-gray-500)',
              border: `1px solid ${roundBadge.variant === 'green' ? 'rgba(22, 163, 74, 0.25)' : roundBadge.variant === 'yellow' ? 'rgba(217, 119, 6, 0.25)' : 'var(--cenc-gray-200)'}`,
            }}>{roundBadge.label}</span>}
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeRound ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--cenc-gray-900)' }}>#{activeRound.number}</span>
                </div>
                {activeRound.status === 'OPEN' && activeRound.endsAt && <RoundTimer endsAt={activeRound.endsAt} />}
                <Button onClick={() => router.push('/dashboard/round-config')} disabled={activeRound.status !== 'OPEN'} style={{ width: '100%' }}
                  icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>}
                >
                  Configurar Rodada
                </Button>
                {activeRound.status !== 'OPEN' && (
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--cenc-gray-400)', textAlign: 'center' }}>
                    Configuração disponível somente em rodadas abertas
                  </p>
                )}
              </>
            ) : (
              <div style={{ padding: '16px 0', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--cenc-gray-400)' }}>Nenhuma rodada ativa no momento.</p>
              </div>
            )}
          </div>
        </div>

        {/* Inventory card */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--cenc-gray-200)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--cenc-gray-100)' }}>
            <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--cenc-gray-700)' }}>Estoque Disponível</h2>
          </div>
          <div style={{ padding: '0' }}>
            {inventory.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--cenc-gray-400)' }}>Estoque não disponível.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--cenc-gray-100)' }}>
                      {['Categoria', 'Qtd.', 'Disp.', 'Valor'].map((h, i) => (
                        <th key={h} style={{ padding: '10px 16px', fontWeight: 600, fontSize: '11px', color: 'var(--cenc-gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => {
                      const pct = item.product.mixAvailable > 0 ? ((item.quantity / item.product.mixAvailable) * 100).toFixed(0) : '—';
                      const val = item.quantity * item.product.purchasePrice;
                      return (
                        <tr key={item.productId} style={{ borderTop: '1px solid var(--cenc-gray-50)' }}>
                          <td style={{ padding: '10px 16px', color: 'var(--cenc-gray-700)', fontWeight: 500 }}>{item.product.name}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--cenc-gray-900)' }}>{item.quantity}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '12px', color: 'var(--cenc-gray-500)' }}>{pct}%</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '12px', color: 'var(--cenc-gray-500)' }}>{formatCurrency(val)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
