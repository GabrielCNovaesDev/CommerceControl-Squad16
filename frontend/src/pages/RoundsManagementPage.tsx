import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import roundService from '../services/roundService';
import AdminLayout from '../components/layout/AdminLayout';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import { useToast } from '../hooks/useToast';
import { useCountdown } from '../hooks/useCountdown';
import type { Round, RoundStatus } from '../types';

// ─── Helpers ───────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<RoundStatus, { label: string; variant: 'green' | 'yellow' | 'gray' | 'red' | 'blue' }> = {
  OPEN:       { label: 'Aberta',      variant: 'green'  },
  PROCESSING: { label: 'Processando', variant: 'yellow' },
  CLOSED:     { label: 'Encerrada',   variant: 'gray'   },
};

function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateString));
}

const createRoundSchema = z.object({
  number: z.coerce
    .number({ error: 'Número inválido' })
    .int('Deve ser inteiro')
    .positive('Deve ser positivo'),
  durationHours: z.coerce
    .number({ error: 'Duração inválida' })
    .int('Deve ser inteiro')
    .positive('Mínimo 1 hora'),
  demandFactor: z.coerce
    .number({ error: 'Valor inválido' })
    .min(0, 'Mínimo 0')
    .max(1, 'Máximo 1'),
});

type CreateRoundFormData = z.infer<typeof createRoundSchema>;

// ─── Countdown inline ────────────────────────────────────────────────────────

function RoundCountdown({ endsAt }: { endsAt: string }) {
  const { timeLeft, expired } = useCountdown(endsAt);
  if (expired) return <span className="text-xs text-gray-400 italic">Expirado</span>;
  return <span className="text-xs font-mono font-medium text-orange-600 tabular-nums">{timeLeft}</span>;
}

// ─── Modais ─────────────────────────────────────────────────────────────────

function CreateRoundModal({
  onSuccess, onCancel, nextNumber,
}: {
  onSuccess: (round: Round) => void;
  onCancel: () => void;
  nextNumber: number;
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

  const field = (hasError: boolean) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition
     ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        <h2 className="text-base font-semibold text-gray-900">Nova Rodada</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Número da rodada</label>
            <input type="number" min="1" className={field(!!errors.number)} {...register('number')} />
            {errors.number && <p className="text-xs text-red-600">{errors.number.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Duração (horas)</label>
            <input type="number" min="1" step="1" className={field(!!errors.durationHours)} {...register('durationHours')} />
            {errors.durationHours && <p className="text-xs text-red-600">{errors.durationHours.message}</p>}
            <p className="text-xs text-gray-400">O cronômetro começa a contar a partir do momento da criação.</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Fator de demanda (0–1)</label>
            <input type="number" step="0.05" min="0" max="1" className={field(!!errors.demandFactor)} {...register('demandFactor')} />
            {errors.demandFactor && <p className="text-xs text-red-600">{errors.demandFactor.message}</p>}
            <p className="text-xs text-gray-400">% do mix disponível que compõe a demanda desta rodada.</p>
          </div>
          {serverError && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{serverError}</p>}
          <div className="flex gap-3 justify-end pt-1">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Criar Rodada</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CloseRoundModal({
  round, onConfirm, onCancel, loading, success,
}: {
  round: Round;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  success: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        {success ? (
          <>
            <div className="flex flex-col items-center gap-3 py-2">
              <span className="text-3xl">✓</span>
              <h2 className="text-base font-semibold text-gray-900">Rodada encerrada!</h2>
              <p className="text-sm text-gray-500 text-center">Os resultados da Rodada #{round.number} foram calculados com sucesso.</p>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={onCancel}>Fechar</Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Encerrar Rodada #{round.number}?</h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">Isso irá processar o DRE de todos os squads. Esta ação não pode ser desfeita.</p>
            </div>
            {loading && (
              <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
                <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Processando resultados...
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
              <Button type="button" variant="danger" onClick={onConfirm} loading={loading}>Confirmar encerramento</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DeleteLastRoundModal({
  round, onConfirm, onCancel, loading,
}: {
  round: Round;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Excluir Rodada #{round.number}?</h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            {round.status === 'CLOSED'
              ? 'A rodada será excluída e as vendas serão revertidas no estoque. Resultados financeiros serão apagados.'
              : 'A rodada e todas as configurações submetidas serão apagadas permanentemente.'}
            {' '}Esta ação não pode ser desfeita.
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button type="button" variant="danger" onClick={onConfirm} loading={loading}>Excluir rodada</Button>
        </div>
      </div>
    </div>
  );
}

function ResetGameModal({
  onConfirm, onCancel, loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [typed, setTyped] = useState('');
  const confirmed = typed === 'REINICIAR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-base font-semibold text-red-700">⚠ Reiniciar Jogo</h2>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            Isso irá <strong>excluir todas as rodadas</strong>, zerar o estoque de todas as lojas e restaurar o capital inicial. Esta ação é <strong>irreversível</strong>.
          </p>
          <p className="text-sm text-gray-600 mt-3">
            Para confirmar, digite <span className="font-mono font-bold text-red-700">REINICIAR</span> abaixo:
          </p>
        </div>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="REINICIAR"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-red-400"
        />
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button type="button" variant="danger" onClick={onConfirm} loading={loading} disabled={!confirmed}>
            Reiniciar jogo
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Tabela de rodadas ───────────────────────────────────────────────────────

function RoundsTable({
  rounds, onClose, onDeleteLast, lastRoundId,
}: {
  rounds: Round[];
  onClose: (round: Round) => void;
  onDeleteLast: (round: Round) => void;
  lastRoundId: string | null;
}) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs text-gray-500 border-b border-gray-200">
            <th className="px-4 py-3 font-semibold w-16">Rodada</th>
            <th className="px-4 py-3 font-semibold">Encerra em</th>
            <th className="px-4 py-3 font-semibold">Duração</th>
            <th className="px-4 py-3 font-semibold text-center">Status</th>
            <th className="px-4 py-3 font-semibold text-center">Demanda</th>
            <th className="px-4 py-3 font-semibold text-center">Configs</th>
            <th className="px-4 py-3 font-semibold text-right">Ação</th>
          </tr>
        </thead>
        <tbody>
          {rounds.map((round) => {
            const badge = STATUS_BADGE[round.status];
            const isLast = round.id === lastRoundId;
            return (
              <tr key={round.id} className="border-t border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-semibold text-gray-800">#{round.number}</td>
                <td className="px-4 py-3 text-gray-600">
                  {round.status === 'OPEN'
                    ? <RoundCountdown endsAt={round.endsAt} />
                    : formatDateTime(round.endsAt)}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{round.durationHours}h</td>
                <td className="px-4 py-3 text-center">
                  {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
                </td>
                <td className="px-4 py-3 text-center text-gray-700 text-xs">
                  {round.demandFactor != null ? `${(round.demandFactor * 100).toFixed(0)}%` : '—'}
                </td>
                <td className="px-4 py-3 text-center text-gray-700">
                  {round.submittedConfigsCount ?? '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {round.status === 'OPEN' && (
                      <button onClick={() => onClose(round)} className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors">
                        Encerrar
                      </button>
                    )}
                    {round.status === 'CLOSED' && (
                      <Link to={`/admin/results?roundId=${round.id}`} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                        Ver resultados →
                      </Link>
                    )}
                    {round.status === 'PROCESSING' && (
                      <span className="text-xs text-gray-400 italic">Processando...</span>
                    )}
                    {isLast && round.status !== 'PROCESSING' && (
                      <button onClick={() => onDeleteLast(round)} className="text-xs font-medium text-gray-400 hover:text-red-600 transition-colors" title="Excluir última rodada">
                        Excluir
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function RoundsManagementPage() {
  const toast = useToast();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roundToClose, setRoundToClose] = useState<Round | null>(null);
  const [closingRound, setClosingRound] = useState(false);
  const [closeSuccess, setCloseSuccess] = useState(false);
  const [roundToDelete, setRoundToDelete] = useState<Round | null>(null);
  const [deletingRound, setDeletingRound] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  const loadRounds = useCallback(async () => {
    setLoadError('');
    try {
      const data = await roundService.getRounds();
      setRounds(data);
    } catch {
      setLoadError('Não foi possível carregar as rodadas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRounds(); }, [loadRounds]);

  function handleRoundCreated(newRound: Round) {
    setShowCreateModal(false);
    toast.success(`Rodada #${newRound.number} criada! Encerra em ${newRound.durationHours}h.`);
    setRounds((prev) =>
      [...prev, { ...newRound, submittedConfigsCount: 0 }].sort((a, b) => b.number - a.number)
    );
  }

  async function handleCloseRound() {
    if (!roundToClose) return;
    setClosingRound(true);
    try {
      await roundService.closeRound(roundToClose.id);
      setCloseSuccess(true);
      toast.success(`Rodada #${roundToClose.number} encerrada com sucesso!`);
      setRounds((prev) =>
        prev.map((r) => (r.id === roundToClose.id ? { ...r, status: 'CLOSED' as RoundStatus } : r))
      );
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message ?? 'Erro ao encerrar rodada');
      setRoundToClose(null);
      loadRounds();
    } finally {
      setClosingRound(false);
    }
  }

  async function handleDeleteLastRound() {
    if (!roundToDelete) return;
    setDeletingRound(true);
    try {
      await roundService.deleteLastRound();
      toast.success(`Rodada #${roundToDelete.number} excluída.`);
      setRoundToDelete(null);
      setLoading(true);
      loadRounds();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message ?? 'Erro ao excluir rodada');
      setRoundToDelete(null);
    } finally {
      setDeletingRound(false);
    }
  }

  async function handleResetGame() {
    setResetting(true);
    try {
      await roundService.resetGame();
      toast.success('Jogo reiniciado com sucesso!');
      setShowResetModal(false);
      setLoading(true);
      loadRounds();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message ?? 'Erro ao reiniciar jogo');
    } finally {
      setResetting(false);
    }
  }

  const hasOpenRound = rounds.some((r) => r.status === 'OPEN' || r.status === 'PROCESSING');
  const nextNumber = rounds.length > 0 ? Math.max(...rounds.map((r) => r.number)) + 1 : 1;
  const lastRoundId = rounds.length > 0 ? rounds[0].id : null;

  return (
    <AdminLayout>
      <div className="max-w-5xl flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Rodadas</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gerencie o ciclo de vida das rodadas da simulação.</p>
          </div>
          <div className="flex items-center gap-3">
            {rounds.length > 0 && (
              <button
                onClick={() => setShowResetModal(true)}
                className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50"
              >
                ↺ Reiniciar jogo
              </button>
            )}
            <Button
              disabled={hasOpenRound}
              onClick={() => setShowCreateModal(true)}
              title={hasOpenRound ? 'Encerre a rodada atual antes de criar uma nova' : undefined}
            >
              + Nova Rodada
            </Button>
          </div>
        </div>

        {loading ? (
          <Skeleton variant="table" rows={3} />
        ) : loadError ? (
          <ErrorMessage message={loadError} onRetry={() => { setLoading(true); loadRounds(); }} />
        ) : rounds.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-12 flex flex-col items-center gap-2">
            <p className="text-gray-500 font-medium">Nenhuma rodada criada ainda.</p>
            <p className="text-sm text-gray-400">Crie a primeira rodada para iniciar a simulação.</p>
          </div>
        ) : (
          <RoundsTable
            rounds={rounds}
            onClose={(round) => { setRoundToClose(round); setCloseSuccess(false); }}
            onDeleteLast={(round) => setRoundToDelete(round)}
            lastRoundId={lastRoundId}
          />
        )}
      </div>

      {showCreateModal && (
        <CreateRoundModal nextNumber={nextNumber} onSuccess={handleRoundCreated} onCancel={() => setShowCreateModal(false)} />
      )}
      {roundToClose && (
        <CloseRoundModal
          round={roundToClose}
          onConfirm={handleCloseRound}
          onCancel={() => { setRoundToClose(null); setCloseSuccess(false); }}
          loading={closingRound}
          success={closeSuccess}
        />
      )}
      {roundToDelete && (
        <DeleteLastRoundModal
          round={roundToDelete}
          onConfirm={handleDeleteLastRound}
          onCancel={() => setRoundToDelete(null)}
          loading={deletingRound}
        />
      )}
      {showResetModal && (
        <ResetGameModal
          onConfirm={handleResetGame}
          onCancel={() => setShowResetModal(false)}
          loading={resetting}
        />
      )}
    </AdminLayout>
  );
}
