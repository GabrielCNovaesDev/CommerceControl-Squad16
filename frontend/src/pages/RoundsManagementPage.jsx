import { useEffect, useState } from 'react';
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
import { formatDate } from '../utils/formatters';

// ─── Helpers ───────────────────────────────────────────────────────────────

const STATUS_BADGE = {
  OPEN:       { label: 'Aberta',       variant: 'green'  },
  PROCESSING: { label: 'Processando',  variant: 'yellow' },
  CLOSED:     { label: 'Encerrada',    variant: 'gray'   },
};

function formatDateTime(dateString) {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateString));
}

const createRoundSchema = z
  .object({
    number: z.coerce
      .number({ invalid_type_error: 'Número inválido' })
      .int('Deve ser inteiro')
      .positive('Deve ser positivo'),
    startDate: z.string().min(1, 'Data de início obrigatória'),
    endDate:   z.string().min(1, 'Data de término obrigatória'),
    demandFactor: z.coerce
      .number({ invalid_type_error: 'Valor inválido' })
      .min(0, 'Mínimo 0')
      .max(1, 'Máximo 1'),
  })
  .refine((d) => new Date(d.endDate) > new Date(d.startDate), {
    message: 'Data de término deve ser após o início',
    path: ['endDate'],
  });

// ─── Modais ─────────────────────────────────────────────────────────────────

function CreateRoundModal({ onSuccess, onCancel, nextNumber }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createRoundSchema),
    defaultValues: { number: nextNumber, demandFactor: 0.5 },
  });
  const [serverError, setServerError] = useState('');

  async function onSubmit(data) {
    setServerError('');
    try {
      const round = await roundService.createRound({
        number:       Number(data.number),
        startDate:    new Date(data.startDate).toISOString(),
        endDate:      new Date(data.endDate).toISOString(),
        demandFactor: Number(data.demandFactor),
      });
      onSuccess(round);
    } catch (err) {
      setServerError(err.response?.data?.message ?? 'Erro ao criar rodada');
    }
  }

  const field = (hasError) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition
     ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        <h2 className="text-base font-semibold text-gray-900">Nova Rodada</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Número da rodada</label>
            <input type="number" min="1" className={field(errors.number)} {...register('number')} />
            {errors.number && <p className="text-xs text-red-600">{errors.number.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Data de início</label>
            <input type="datetime-local" className={field(errors.startDate)} {...register('startDate')} />
            {errors.startDate && <p className="text-xs text-red-600">{errors.startDate.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Data de término</label>
            <input type="datetime-local" className={field(errors.endDate)} {...register('endDate')} />
            {errors.endDate && <p className="text-xs text-red-600">{errors.endDate.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Fator de demanda (0–1)
            </label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              className={field(errors.demandFactor)}
              {...register('demandFactor')}
            />
            {errors.demandFactor && (
              <p className="text-xs text-red-600">{errors.demandFactor.message}</p>
            )}
            <p className="text-xs text-gray-400">
              Define a % do mix disponível que compõe a demanda de mercado desta rodada.
              Ex.: 0.5 = 50% do estoque disponível. Rodada 1 → 0.5 · Rodada 2 → 0.2 · Rodada 3 → 0.3
            </p>
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

function CloseRoundModal({ round, onConfirm, onCancel, loading, success }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        {success ? (
          <>
            <div className="flex flex-col items-center gap-3 py-2">
              <span className="text-3xl">✓</span>
              <h2 className="text-base font-semibold text-gray-900">Rodada encerrada!</h2>
              <p className="text-sm text-gray-500 text-center">
                Os resultados da Rodada #{round.number} foram calculados com sucesso.
              </p>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={onCancel}>
                Fechar
              </Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Encerrar Rodada #{round.number}?
              </h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Isso irá processar o DRE de todos os squads que submeteram configuração. Esta ação não pode ser desfeita. Confirma?
              </p>
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
              <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
                Cancelar
              </Button>
              <Button type="button" variant="danger" onClick={onConfirm} loading={loading}>
                Confirmar encerramento
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Tabela de rodadas ───────────────────────────────────────────────────────

function RoundsTable({ rounds, hasOpenRound, onClose }) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs text-gray-500 border-b border-gray-200">
            <th className="px-4 py-3 font-semibold w-16">Rodada</th>
            <th className="px-4 py-3 font-semibold">Data início</th>
            <th className="px-4 py-3 font-semibold">Data término</th>
            <th className="px-4 py-3 font-semibold text-center">Status</th>
            <th className="px-4 py-3 font-semibold text-center">Demanda</th>
            <th className="px-4 py-3 font-semibold text-center">Configs</th>
            <th className="px-4 py-3 font-semibold text-right">Ação</th>
          </tr>
        </thead>
        <tbody>
          {rounds.map((round) => {
            const badge = STATUS_BADGE[round.status];
            return (
              <tr key={round.id} className="border-t border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-semibold text-gray-800">#{round.number}</td>
                <td className="px-4 py-3 text-gray-600">{formatDateTime(round.startDate)}</td>
                <td className="px-4 py-3 text-gray-600">{formatDateTime(round.endDate)}</td>
                <td className="px-4 py-3 text-center">
                  {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
                </td>
                <td className="px-4 py-3 text-center text-gray-700 text-xs">
                  {round.demandFactor != null
                    ? `${(round.demandFactor * 100).toFixed(0)}%`
                    : '—'}
                </td>
                <td className="px-4 py-3 text-center text-gray-700">
                  {round.submittedConfigsCount ?? '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {round.status === 'OPEN' && (
                    <button
                      onClick={() => onClose(round)}
                      className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
                    >
                      Encerrar
                    </button>
                  )}
                  {round.status === 'CLOSED' && (
                    <Link
                      to={`/admin/results?roundId=${round.id}`}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Ver resultados →
                    </Link>
                  )}
                  {round.status === 'PROCESSING' && (
                    <span className="text-xs text-gray-400 italic">Processando...</span>
                  )}
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
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roundToClose, setRoundToClose] = useState(null);
  const [closingRound, setClosingRound] = useState(false);
  const [closeSuccess, setCloseSuccess] = useState(false);

  async function loadRounds() {
    setLoadError('');
    try {
      const data = await roundService.getRounds();
      setRounds(data);
    } catch {
      setLoadError('Não foi possível carregar as rodadas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRounds();
  }, []);

  function handleRoundCreated(newRound) {
    setShowCreateModal(false);
    toast.success(`Rodada #${newRound.number} criada com sucesso!`);
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
        prev.map((r) => (r.id === roundToClose.id ? { ...r, status: 'CLOSED' } : r))
      );
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erro ao encerrar rodada');
      setRoundToClose(null);
      loadRounds();
    } finally {
      setClosingRound(false);
    }
  }

  function handleCloseModalDismiss() {
    setRoundToClose(null);
    setCloseSuccess(false);
  }

  const hasOpenRound = rounds.some((r) => r.status === 'OPEN' || r.status === 'PROCESSING');
  const nextNumber = rounds.length > 0
    ? Math.max(...rounds.map((r) => r.number)) + 1
    : 1;

  return (
    <AdminLayout>
      <div className="max-w-5xl flex flex-col gap-6">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Rodadas</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gerencie o ciclo de vida das rodadas da simulação.</p>
          </div>
          <Button
            disabled={hasOpenRound}
            onClick={() => setShowCreateModal(true)}
            title={hasOpenRound ? 'Encerre a rodada atual antes de criar uma nova' : undefined}
          >
            + Nova Rodada
          </Button>
        </div>

        {/* Lista */}
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
            hasOpenRound={hasOpenRound}
            onClose={(round) => { setRoundToClose(round); setCloseSuccess(false); }}
          />
        )}
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
      {roundToClose && (
        <CloseRoundModal
          round={roundToClose}
          onConfirm={handleCloseRound}
          onCancel={handleCloseModalDismiss}
          loading={closingRound}
          success={closeSuccess}
        />
      )}
    </AdminLayout>
  );
}
