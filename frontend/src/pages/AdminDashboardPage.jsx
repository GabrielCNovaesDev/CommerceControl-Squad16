import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import roundService from '../services/roundService';
import squadService from '../services/squadService';
import AdminLayout from '../components/layout/AdminLayout';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

// ─── Helpers ───────────────────────────────────────────────────────────────

const ROUND_STATUS_BADGE = {
  OPEN: { label: 'Aberta', variant: 'green' },
  PROCESSING: { label: 'Processando', variant: 'yellow' },
  CLOSED: { label: 'Encerrada', variant: 'gray' },
};

const createRoundSchema = z.object({
  number: z.coerce
    .number({ invalid_type_error: 'Número inválido' })
    .int('Deve ser inteiro')
    .positive('Deve ser positivo'),
  startDate: z.string().min(1, 'Data de início obrigatória'),
  endDate: z.string().min(1, 'Data de término obrigatória'),
}).refine((d) => new Date(d.endDate) > new Date(d.startDate), {
  message: 'Data de término deve ser após o início',
  path: ['endDate'],
});

// ─── Sub-componentes ────────────────────────────────────────────────────────

function StatCard({ label, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-5 py-4 flex flex-col gap-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      {children}
    </div>
  );
}

function ConfirmCloseModal({ round, onConfirm, onCancel, loading, error }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Encerrar Rodada #{round.number}?</h2>
          <p className="text-sm text-gray-500 mt-1.5">
            Isso irá processar todas as configurações submetidas, calcular os resultados e encerrar a rodada permanentemente. Esta ação não pode ser desfeita.
          </p>
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} loading={loading}>
            Encerrar Rodada
          </Button>
        </div>
      </div>
    </div>
  );
}

function CreateRoundModal({ onSuccess, onCancel, nextNumber }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createRoundSchema),
    defaultValues: { number: nextNumber },
  });

  const [serverError, setServerError] = useState('');

  async function onSubmit(data) {
    setServerError('');
    try {
      const round = await roundService.createRound({
        number: Number(data.number),
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      });
      onSuccess(round);
    } catch (err) {
      setServerError(err.response?.data?.message ?? 'Erro ao criar rodada');
    }
  }

  const inputClass = (hasError) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition
     ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        <h2 className="text-base font-semibold text-gray-900">Nova Rodada</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Número da rodada</label>
            <input type="number" min="1" className={inputClass(errors.number)} {...register('number')} />
            {errors.number && <p className="text-xs text-red-600">{errors.number.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Data de início</label>
            <input type="datetime-local" className={inputClass(errors.startDate)} {...register('startDate')} />
            {errors.startDate && <p className="text-xs text-red-600">{errors.startDate.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Data de término</label>
            <input type="datetime-local" className={inputClass(errors.endDate)} {...register('endDate')} />
            {errors.endDate && <p className="text-xs text-red-600">{errors.endDate.message}</p>}
          </div>

          {serverError && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              {serverError}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Criar Rodada
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SquadsTable({ squads, submittedStoreIds }) {
  const submittedSet = new Set(submittedStoreIds ?? []);
  const hasActiveRound = submittedStoreIds !== null;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs text-gray-500 border-b border-gray-200">
            <th className="px-4 py-3 font-semibold">Squad</th>
            <th className="px-4 py-3 font-semibold">Loja</th>
            <th className="px-4 py-3 font-semibold text-center">Submeteu</th>
            <th className="px-4 py-3 font-semibold text-center">Membros</th>
          </tr>
        </thead>
        <tbody>
          {squads.map((squad) => {
            const store = squad.stores?.[0] ?? null;
            const submitted = store ? submittedSet.has(store.id) : false;
            const highlight = hasActiveRound && store && !submitted;

            return (
              <tr
                key={squad.id}
                className={`border-t border-gray-100 ${highlight ? 'bg-yellow-50' : 'bg-white'}`}
              >
                <td className="px-4 py-3 font-medium text-gray-800">{squad.name}</td>
                <td className="px-4 py-3 text-gray-600">
                  {store ? store.name : <span className="text-gray-400 italic">Sem loja</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  {!hasActiveRound || !store ? (
                    <span className="text-gray-300 text-xs">—</span>
                  ) : submitted ? (
                    <span className="inline-flex items-center gap-1 text-green-700 font-medium text-xs">
                      <span className="text-base leading-none">✓</span> Sim
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-yellow-700 font-medium text-xs">
                      <span className="text-base leading-none">⚠</span> Não
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-gray-700">
                  {squad.users?.length ?? 0}
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

export default function AdminDashboardPage() {
  const [activeRound, setActiveRound] = useState(null);
  const [roundDetail, setRoundDetail] = useState(null);
  const [squads, setSquads] = useState([]);
  const [allRounds, setAllRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingRound, setClosingRound] = useState(false);
  const [closeError, setCloseError] = useState('');

  async function loadData() {
    try {
      const [rounds, squadList] = await Promise.all([
        roundService.getRounds(),
        squadService.getSquads(),
      ]);

      setAllRounds(rounds);
      setSquads(squadList);

      const open = rounds.find((r) => r.status === 'OPEN' || r.status === 'PROCESSING');
      setActiveRound(open ?? null);

      if (open) {
        const detail = await roundService.getRound(open.id);
        setRoundDetail(detail);
      } else {
        setRoundDetail(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCloseRound() {
    if (!activeRound) return;
    setClosingRound(true);
    setCloseError('');
    try {
      await roundService.closeRound(activeRound.id);
      setShowCloseModal(false);
      setLoading(true);
      await loadData();
    } catch (err) {
      setCloseError(err.response?.data?.message ?? 'Erro ao encerrar rodada');
    } finally {
      setClosingRound(false);
    }
  }

  function handleRoundCreated() {
    setShowCreateModal(false);
    setLoading(true);
    loadData();
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
          Carregando...
        </div>
      </AdminLayout>
    );
  }

  const hasOpenRound = activeRound?.status === 'OPEN';
  const hasActiveRound = !!activeRound;
  const nextNumber = allRounds.length > 0
    ? Math.max(...allRounds.map((r) => r.number)) + 1
    : 1;

  const submittedStoreIds = roundDetail?.submittedStoreIds ?? null;
  const submittedCount = submittedStoreIds?.length ?? 0;
  const squadsWithStore = squads.filter((s) => s.stores?.length > 0);
  const roundBadge = activeRound ? ROUND_STATUS_BADGE[activeRound.status] : null;

  return (
    <AdminLayout>
      <div className="max-w-5xl flex flex-col gap-6">
        {/* Cabeçalho + ações */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Visão geral da simulação.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="secondary"
              disabled={hasActiveRound}
              onClick={() => setShowCreateModal(true)}
              title={hasActiveRound ? 'Encerre a rodada atual antes de criar uma nova' : undefined}
            >
              Nova Rodada
            </Button>
            <Button
              variant="danger"
              disabled={!hasOpenRound}
              onClick={() => setShowCloseModal(true)}
              title={!hasOpenRound ? 'Somente rodadas abertas podem ser encerradas' : undefined}
            >
              Encerrar Rodada
            </Button>
          </div>
        </div>

        {/* Cards de status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total de Squads">
            <p className="text-3xl font-bold text-gray-900">{squads.length}</p>
            <p className="text-xs text-gray-400">{squadsWithStore.length} com loja cadastrada</p>
          </StatCard>

          <StatCard label="Rodada Atual">
            {activeRound ? (
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-2xl font-bold text-gray-900">#{activeRound.number}</p>
                {roundBadge && <Badge variant={roundBadge.variant}>{roundBadge.label}</Badge>}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mt-1">Nenhuma rodada ativa</p>
            )}
          </StatCard>

          <StatCard label="Submissões">
            {activeRound ? (
              <>
                <p className="text-3xl font-bold text-gray-900">
                  {submittedCount}
                  <span className="text-lg font-normal text-gray-400"> / {squadsWithStore.length}</span>
                </p>
                <p className="text-xs text-gray-400">squads submeteram configuração</p>
              </>
            ) : (
              <p className="text-sm text-gray-400 mt-1">Sem rodada ativa</p>
            )}
          </StatCard>
        </div>

        {/* Tabela de squads */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Squads</h2>
            {hasActiveRound && (
              <p className="text-xs text-gray-400">Linhas em amarelo = ainda não submeteram</p>
            )}
          </div>

          {squads.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-10 flex items-center justify-center">
              <p className="text-sm text-gray-400">Nenhum squad cadastrado.</p>
            </div>
          ) : (
            <SquadsTable
              squads={squads}
              submittedStoreIds={hasActiveRound ? submittedStoreIds : null}
            />
          )}
        </div>
      </div>

      {/* Modal — Nova Rodada */}
      {showCreateModal && (
        <CreateRoundModal
          nextNumber={nextNumber}
          onSuccess={handleRoundCreated}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {/* Modal — Encerrar Rodada */}
      {showCloseModal && activeRound && (
        <ConfirmCloseModal
          round={activeRound}
          onConfirm={handleCloseRound}
          onCancel={() => { setShowCloseModal(false); setCloseError(''); }}
          loading={closingRound}
          error={closeError}
        />
      )}
    </AdminLayout>
  );
}
