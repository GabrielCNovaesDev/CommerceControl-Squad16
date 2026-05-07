import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import roundService from '../services/roundService';
import squadService from '../services/squadService';
import AdminLayout from '../components/layout/AdminLayout';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import { useToast } from '../hooks/useToast';
import type { Round, Squad, RoundStatus } from '../types';
import React from 'react';

type BadgeVariant = 'green' | 'yellow' | 'gray' | 'red' | 'blue';

const ROUND_STATUS_BADGE: Record<RoundStatus, { label: string; variant: BadgeVariant }> = {
  OPEN: { label: 'Aberta', variant: 'green' },
  PROCESSING: { label: 'Processando', variant: 'yellow' },
  CLOSED: { label: 'Encerrada', variant: 'gray' },
};

const createRoundSchema = z.object({
  number: z.coerce.number({ error: 'Número inválido' }).int('Deve ser inteiro').positive('Deve ser positivo'),
  durationHours: z.coerce.number({ error: 'Duração inválida' }).int('Deve ser inteiro').positive('Mínimo 1 hora'),
  demandFactor: z.coerce.number({ error: 'Valor inválido' }).min(0, 'Mínimo 0').max(1, 'Máximo 1'),
});

type CreateRoundFormData = z.infer<typeof createRoundSchema>;

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, icon, children, accent }: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="animate-fade-in card-hover" style={{
      background: 'white',
      borderRadius: '16px',
      border: '1px solid var(--cenc-gray-200)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      borderTop: `3px solid ${accent ?? 'var(--cenc-blue-600)'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cenc-gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          {label}
        </p>
        <div style={{
          width: 36, height: 36, borderRadius: '10px',
          background: 'var(--cenc-blue-50)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--cenc-blue-600)',
        }}>
          {icon}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Modal base ───────────────────────────────────────────────────────────────

function ModalOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
    }}>
      <div className="animate-scale-in" style={{
        background: 'white', borderRadius: '20px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        border: '1px solid var(--cenc-gray-200)',
        width: '100%', maxWidth: '460px', margin: '0 16px',
        padding: '28px',
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── Confirm Close Modal ──────────────────────────────────────────────────────

function ConfirmCloseModal({ round, onConfirm, onCancel, loading, error }: {
  round: Round; onConfirm: () => void; onCancel: () => void; loading: boolean; error: string;
}) {
  return (
    <ModalOverlay>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
            background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--cenc-gray-900)' }}>
              Encerrar Rodada #{round.number}?
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--cenc-gray-500)', lineHeight: 1.5 }}>
              Isso irá processar todas as configurações submetidas, calcular os resultados e encerrar a rodada permanentemente. Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>
        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#b91c1c' }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>Encerrar Rodada</Button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Create Round Modal ───────────────────────────────────────────────────────

function CreateRoundModal({ onSuccess, onCancel, nextNumber }: {
  onSuccess: (round: Round) => void; onCancel: () => void; nextNumber: number;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateRoundFormData, unknown, CreateRoundFormData>({
    resolver: zodResolver(createRoundSchema) as never,
    defaultValues: { number: nextNumber, durationHours: 2, demandFactor: 0.5 },
  });
  const [serverError, setServerError] = useState('');

  async function onSubmit(data: CreateRoundFormData) {
    setServerError('');
    try {
      const round = await roundService.createRound({
        number: Number(data.number),
        durationHours: Number(data.durationHours),
        demandFactor: Number(data.demandFactor),
      });
      onSuccess(round);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setServerError(axiosErr.response?.data?.message ?? 'Erro ao criar rodada');
    }
  }

  const fieldStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%', borderRadius: '10px', padding: '10px 14px', fontSize: '14px',
    border: `1.5px solid ${hasError ? 'var(--cenc-danger)' : 'var(--cenc-gray-300)'}`,
    background: hasError ? 'var(--cenc-danger-bg)' : 'white',
    outline: 'none', color: 'var(--cenc-gray-900)', boxSizing: 'border-box',
  });

  return (
    <ModalOverlay>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--cenc-gray-900)' }}>Nova Rodada</h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--cenc-gray-500)' }}>Preencha os dados para criar uma nova rodada.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cenc-gray-700)' }}>Número da rodada</label>
            <input type="number" min="1" style={fieldStyle(!!errors.number)} {...register('number')} />
            {errors.number && <p style={{ margin: 0, fontSize: '12px', color: 'var(--cenc-danger)' }}>{errors.number.message}</p>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cenc-gray-700)' }}>Duração (horas)</label>
            <input type="number" min="1" step="1" style={fieldStyle(!!errors.durationHours)} {...register('durationHours')} />
            {errors.durationHours && <p style={{ margin: 0, fontSize: '12px', color: 'var(--cenc-danger)' }}>{errors.durationHours.message}</p>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cenc-gray-700)' }}>Fator de demanda (0–1)</label>
            <input type="number" step="0.05" min="0" max="1" style={fieldStyle(!!errors.demandFactor)} {...register('demandFactor')} />
            {errors.demandFactor && <p style={{ margin: 0, fontSize: '12px', color: 'var(--cenc-danger)' }}>{errors.demandFactor.message}</p>}
          </div>
          {serverError && (
            <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#b91c1c' }}>
              {serverError}
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Criar Rodada</Button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

// ─── Squads Table ─────────────────────────────────────────────────────────────

function SquadsTable({ squads, submittedStoreIds }: { squads: Squad[]; submittedStoreIds: string[] | null }) {
  const submittedSet = new Set(submittedStoreIds ?? []);
  const hasActiveRound = submittedStoreIds !== null;

  return (
    <div style={{ borderRadius: '14px', border: '1px solid var(--cenc-gray-200)', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: 'var(--cenc-gray-50)', borderBottom: '1px solid var(--cenc-gray-200)' }}>
            {['Squad', 'Loja', 'Submeteu', 'Membros'].map((h, i) => (
              <th key={h} style={{ padding: '12px 16px', fontWeight: 600, fontSize: '11px', color: 'var(--cenc-gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i >= 2 ? 'center' : 'left' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {squads.map((squad) => {
            const store = squad.stores?.[0] ?? null;
            const submitted = store ? submittedSet.has(store.id) : false;
            const highlight = hasActiveRound && store != null && !submitted;
            return (
              <tr key={squad.id} className="table-row-hover" style={{
                borderTop: '1px solid var(--cenc-gray-100)',
                background: highlight ? 'var(--cenc-warning-bg)' : 'white',
              }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--cenc-gray-800)' }}>{squad.name}</td>
                <td style={{ padding: '12px 16px', color: 'var(--cenc-gray-600)' }}>
                  {store ? store.name : <span style={{ color: 'var(--cenc-gray-400)', fontStyle: 'italic' }}>Sem loja</span>}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  {!hasActiveRound || !store ? (
                    <span style={{ color: 'var(--cenc-gray-300)', fontSize: '12px' }}>—</span>
                  ) : submitted ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--cenc-success)', fontWeight: 600, fontSize: '12px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Sim
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--cenc-warning)', fontWeight: 600, fontSize: '12px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      Pendente
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--cenc-gray-700)', fontWeight: 500 }}>{squad.users?.length ?? 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const toast = useToast();
  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [roundDetail, setRoundDetail] = useState<Round | null>(null);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [allRounds, setAllRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingRound, setClosingRound] = useState(false);
  const [closeError, setCloseError] = useState('');

  async function loadData() {
    setLoadError('');
    try {
      const [rounds, squadList] = await Promise.all([roundService.getRounds(), squadService.getSquads()]);
      setAllRounds(rounds);
      setSquads(squadList);
      const open = rounds.find((r: Round) => r.status === 'OPEN' || r.status === 'PROCESSING');
      setActiveRound(open ?? null);
      if (open) {
        const detail = await roundService.getRound(open.id);
        setRoundDetail(detail);
      } else {
        setRoundDetail(null);
      }
    } catch {
      setLoadError('Não foi possível carregar os dados do dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleCloseRound() {
    if (!activeRound) return;
    setClosingRound(true); setCloseError('');
    try {
      await roundService.closeRound(activeRound.id);
      setShowCloseModal(false);
      toast.success('Rodada encerrada e resultados calculados!');
      setLoading(true);
      await loadData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setCloseError(axiosErr.response?.data?.message ?? 'Erro ao encerrar rodada');
    } finally {
      setClosingRound(false);
    }
  }

  function handleRoundCreated() {
    setShowCreateModal(false);
    toast.success('Rodada criada com sucesso!');
    setLoading(true);
    loadData();
  }

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Skeleton variant="line" width="160px" height="28px" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            <Skeleton variant="stat" /><Skeleton variant="stat" /><Skeleton variant="stat" />
          </div>
          <Skeleton variant="table" rows={4} />
        </div>
      </AdminLayout>
    );
  }

  if (loadError) {
    return <AdminLayout><ErrorMessage message={loadError} onRetry={() => { setLoading(true); loadData(); }} /></AdminLayout>;
  }

  const hasOpenRound = activeRound?.status === 'OPEN';
  const hasActiveRound = !!activeRound;
  const nextNumber = allRounds.length > 0 ? Math.max(...allRounds.map((r) => r.number)) + 1 : 1;
  const submittedStoreIds = roundDetail?.submittedStoreIds ?? null;
  const submittedCount = submittedStoreIds?.length ?? 0;
  const squadsWithStore = squads.filter((s) => (s.stores?.length ?? 0) > 0);
  const roundBadge = activeRound ? ROUND_STATUS_BADGE[activeRound.status] : null;
  const submissionPct = squadsWithStore.length > 0 ? Math.round((submittedCount / squadsWithStore.length) * 100) : 0;

  return (
    <AdminLayout>
      <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 24 }} className="page-enter">

        {/* Header */}
        {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div>
      <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--cenc-gray-900)' }}>Dashboard</h1>
      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--cenc-gray-500)' }}>Visão geral da simulação em tempo real.</p>
  </div>
  <div style={{ display: 'flex', gap: 10 }}>
            <Button
              variant="secondary"
              disabled={hasActiveRound}
              onClick={() => setShowCreateModal(true)}
              title={hasActiveRound ? 'Encerre a rodada atual antes de criar uma nova' : undefined}
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}
            >
              Nova Rodada
            </Button>
            <Button
              variant="danger"
              disabled={!hasOpenRound}
              onClick={() => setShowCloseModal(true)}
              title={!hasOpenRound ? 'Somente rodadas abertas podem ser encerradas' : undefined}
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>}
            >
              Encerrar Rodada
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }} className="stagger">
          <StatCard label="Total de Squads" accent="var(--cenc-blue-600)"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          >
            <p className="stat-number" style={{ margin: 0, fontSize: '36px', fontWeight: 800, color: 'var(--cenc-gray-900)', lineHeight: 1 }}>{squads.length}</p>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--cenc-gray-400)' }}>{squadsWithStore.length} com loja cadastrada</p>
          </StatCard>

          <StatCard label="Rodada Atual" accent={activeRound ? 'var(--cenc-gold-500)' : 'var(--cenc-gray-300)'}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          >
            {activeRound ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <p className="stat-number" style={{ margin: 0, fontSize: '36px', fontWeight: 800, color: 'var(--cenc-gray-900)', lineHeight: 1 }}>#{activeRound.number}</p>
                {roundBadge && <Badge variant={roundBadge.variant} dot pulse={activeRound.status === 'OPEN'}>{roundBadge.label}</Badge>}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--cenc-gray-400)' }}>Nenhuma rodada ativa</p>
            )}
          </StatCard>

          <StatCard label="Submissões" accent={submittedCount === squadsWithStore.length && squadsWithStore.length > 0 ? 'var(--cenc-success)' : 'var(--cenc-blue-600)'}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
          >
            {activeRound ? (
              <>
                <p className="stat-number" style={{ margin: 0, fontSize: '36px', fontWeight: 800, color: 'var(--cenc-gray-900)', lineHeight: 1 }}>
                  {submittedCount}<span style={{ fontSize: '18px', fontWeight: 400, color: 'var(--cenc-gray-400)' }}> / {squadsWithStore.length}</span>
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'var(--cenc-gray-100)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${submissionPct}%`, background: submissionPct === 100 ? 'var(--cenc-success)' : 'var(--cenc-blue-500)', borderRadius: 99, transition: 'width 0.6s ease' }} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--cenc-gray-400)' }}>{submissionPct}%</span>
                </div>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--cenc-gray-400)' }}>Sem rodada ativa</p>
            )}
          </StatCard>
        </div>

        {/* Squads Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--cenc-gray-800)' }}>Squads</h2>
            {hasActiveRound && (
              <span style={{ fontSize: '12px', color: 'var(--cenc-gray-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cenc-warning)', display: 'inline-block' }} />
                Linhas destacadas = pendentes de submissão
              </span>
            )}
          </div>
          {squads.length === 0 ? (
            <div style={{ borderRadius: 14, border: '1px solid var(--cenc-gray-200)', background: 'white', padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--cenc-gray-400)' }}>Nenhum squad cadastrado.</p>
            </div>
          ) : (
            <SquadsTable squads={squads} submittedStoreIds={hasActiveRound ? submittedStoreIds : null} />
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateRoundModal nextNumber={nextNumber} onSuccess={handleRoundCreated} onCancel={() => setShowCreateModal(false)} />
      )}
      {showCloseModal && activeRound && (
        <ConfirmCloseModal round={activeRound} onConfirm={handleCloseRound} onCancel={() => { setShowCloseModal(false); setCloseError(''); }} loading={closingRound} error={closeError} />
      )}
    </AdminLayout>
  );
}
