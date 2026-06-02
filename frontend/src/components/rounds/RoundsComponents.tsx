import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import roundService from '../../services/roundService';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useCountdown } from '../../hooks/useCountdown';
import type { Round, RoundStatus } from '../../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const STATUS_BADGE: Record<RoundStatus, { label: string; variant: 'green' | 'yellow' | 'gray' | 'red' | 'blue' }> = {
  OPEN:       { label: 'Aberta',      variant: 'green'  },
  PROCESSING: { label: 'Processando', variant: 'yellow' },
  CLOSED:     { label: 'Encerrada',   variant: 'gray'   },
};

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateString));
}

// ─── Countdown ───────────────────────────────────────────────────────────────

export function RoundCountdown({ endsAt }: { endsAt: string }) {
  const { timeLeft, expired } = useCountdown(endsAt);
  if (expired) return <span className="text-xs text-gray-400 italic">Expirado</span>;
  return <span className="text-xs font-mono font-medium text-orange-600 tabular-nums">{timeLeft}</span>;
}

// ─── Create Round Modal ───────────────────────────────────────────────────────

const createRoundSchema = z.object({
  number: z.coerce.number({ error: 'Número inválido' }).int('Deve ser inteiro').positive('Deve ser positivo'),
  durationHours: z.coerce.number({ error: 'Duração inválida' }).int('Deve ser inteiro').positive('Mínimo 1 hora'),
  demandFactor: z.coerce.number({ error: 'Valor inválido' }).min(0, 'Mínimo 0').max(1, 'Máximo 1'),
});

type CreateRoundFormData = z.infer<typeof createRoundSchema>;

export function CreateRoundModal({
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
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
      setServerError(axiosErr.response?.data?.error?.message ?? axiosErr.response?.data?.message ?? 'Erro ao criar rodada');
    }
  }

  const field = (hasError: boolean) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`;

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

// ─── Close Round Modal ────────────────────────────────────────────────────────

export function CloseRoundModal({
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

// ─── Delete Last Round Modal ──────────────────────────────────────────────────

export function DeleteLastRoundModal({
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

// ─── Reset Game Modal ─────────────────────────────────────────────────────────

export function ResetGameModal({
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

// ─── Rounds Table ─────────────────────────────────────────────────────────────

export function RoundsTable({
  rounds, onClose, onDeleteLast, onExtend, lastRoundId,
}: {
  rounds: Round[];
  onClose: (round: Round) => void;
  onDeleteLast: (round: Round) => void;
  onExtend: (round: Round) => void;
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
                      <button onClick={() => onExtend(round)} className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                        + Tempo
                      </button>
                    )}
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

// ─── Extend Round Modal ──────────────────────────────────────────────────────

export function ExtendRoundModal({
  round, onConfirm, onCancel, loading,
}: {
  round: Round;
  onConfirm: (minutes: number) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [minutes, setMinutes] = useState(30);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm mx-4 p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Adicionar Tempo — Rodada #{round.number}</h2>
          <p className="text-sm text-gray-500 mt-2">Informe quantos minutos extras deseja adicionar ao cronômetro.</p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Minutos adicionais</label>
          <input
            type="number"
            min="1"
            step="1"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button type="button" onClick={() => onConfirm(minutes)} loading={loading} disabled={minutes < 1}>Adicionar</Button>
        </div>
      </div>
    </div>
  );
}
