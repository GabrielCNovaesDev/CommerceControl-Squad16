import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import storeService from '../services/storeService';
import roundService from '../services/roundService';
import PlayerLayout from '../components/layout/PlayerLayout';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/formatters';
import { useCountdown } from '../hooks/useCountdown';
import type { Store, InventoryItem, Round, RoundStatus } from '../types';

const ROUND_STATUS_BADGE: Record<RoundStatus, { label: string; variant: 'green' | 'yellow' | 'gray' | 'red' | 'blue' }> = {
  OPEN: { label: 'Aberta', variant: 'green' },
  PROCESSING: { label: 'Processando', variant: 'yellow' },
  CLOSED: { label: 'Encerrada', variant: 'gray' },
};

const createStoreSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  initialCapital: z.coerce.number({ error: 'Informe um valor numérico' }).positive('O capital deve ser positivo'),
});
type CreateStoreFormData = z.infer<typeof createStoreSchema>;

// ─── Timer ────────────────────────────────────────────────────────────────────

function RoundTimer({ endsAt }: { endsAt: string }) {
  const { timeLeft, expired } = useCountdown(endsAt);
  if (expired) {
    return (
      <div style={{ borderRadius: 10, background: '#fff7ed', border: '1px solid #fed7aa', padding: '10px 14px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#c2410c', fontWeight: 600 }}>Tempo esgotado — aguardando encerramento</p>
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
  const navigate = useNavigate();
  const toast = useToast();
  const [store, setStore] = useState<Store | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [creating, setCreating] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateStoreFormData, unknown, CreateStoreFormData>({
    resolver: zodResolver(createStoreSchema) as never,
  });

  async function load() {
    setLoadError('');
    try {
      const s = await storeService.getMyStore();
      setStore(s);
      const [inv, rounds] = await Promise.all([storeService.getInventory(s.id), roundService.getRounds()]);
      setInventory(inv);
      const open = rounds.find((r: Round) => r.status === 'OPEN' || r.status === 'PROCESSING');
      setActiveRound(open ?? null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 404) setStore(null);
      else setLoadError('Não foi possível carregar os dados da loja.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onCreateStore(data: CreateStoreFormData) {
    try {
      const s = await storeService.createStore(data);
      setStore(s);
      setCreating(false);
      toast.success('Loja criada com sucesso!');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message ?? 'Erro ao criar loja');
    }
  }

  if (loading) {
    return (
      <PlayerLayout>
        <div style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Skeleton variant="line" width="200px" height="28px" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Skeleton variant="stat" /><Skeleton variant="stat" />
          </div>
          <Skeleton variant="table" rows={4} />
        </div>
      </PlayerLayout>
    );
  }

  if (loadError) {
    return <PlayerLayout><ErrorMessage message={loadError} onRetry={() => { setLoading(true); load(); }} /></PlayerLayout>;
  }

  // No store yet
  if (!store) {
    return (
      <PlayerLayout>
        <div style={{ maxWidth: 420, margin: '48px auto' }} className="animate-fade-in">
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid var(--cenc-gray-200)', boxShadow: '0 4px 24px rgba(0,48,135,0.08)', overflow: 'hidden' }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--cenc-gray-100)', background: 'linear-gradient(135deg, var(--cenc-blue-900), var(--cenc-blue-700))', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'white' }}>Criar sua Loja</h2>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Seu squad ainda não possui uma loja</p>
            </div>
            <div style={{ padding: '24px 28px' }}>
              {!creating ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--cenc-gray-500)', textAlign: 'center' }}>
                    Crie uma loja para começar a participar das rodadas de simulação.
                  </p>
                  <Button onClick={() => setCreating(true)} icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  }>Criar Loja</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onCreateStore)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Input label="Nome da loja" placeholder="Ex: Supermercado Alpha" error={errors.name?.message} {...register('name')} />
                  <Input label="Capital inicial (R$)" type="number" step="0.01" placeholder="10000.00" error={errors.initialCapital?.message} {...register('initialCapital')} />
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <Button type="submit" loading={isSubmitting} style={{ flex: 1 }}>Criar</Button>
                    <Button type="button" variant="secondary" onClick={() => setCreating(false)}>Cancelar</Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </PlayerLayout>
    );
  }

  const roundBadge = activeRound ? ROUND_STATUS_BADGE[activeRound.status] : null;
  const cashPct = ((store.currentCash ?? store.initialCapital) / store.initialCapital) * 100;
  const cashPositive = (store.currentCash ?? store.initialCapital) >= 0;

  return (
    <PlayerLayout>
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
            background: cashPositive ? '#f0fdf4' : '#fff1f2',
            border: `1px solid ${cashPositive ? '#86efac' : '#fca5a5'}`,
          }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cenc-gray-400)' }}>Caixa Atual</p>
            <p style={{ margin: '4px 0 2px', fontSize: '28px', fontWeight: 800, color: cashPositive ? '#15803d' : '#b91c1c', lineHeight: 1 }}>
              {formatCurrency(store.currentCash ?? store.initialCapital)}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: cashPositive ? '#16a34a' : '#dc2626' }}>
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
              {roundBadge && <Badge variant={roundBadge.variant} dot pulse={activeRound?.status === 'OPEN'}>{roundBadge.label}</Badge>}
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeRound ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--cenc-gray-900)' }}>#{activeRound.number}</span>
                  </div>
                  {activeRound.status === 'OPEN' && activeRound.endsAt && <RoundTimer endsAt={activeRound.endsAt} />}
                  <Button onClick={() => navigate('/store/round')} disabled={activeRound.status !== 'OPEN'} style={{ width: '100%' }}
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
                          <tr key={item.productId} className="table-row-hover" style={{ borderTop: '1px solid var(--cenc-gray-50)' }}>
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
    </PlayerLayout>
  );
}
