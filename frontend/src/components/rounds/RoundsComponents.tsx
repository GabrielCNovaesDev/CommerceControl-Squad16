import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useCountdown } from '@/components/hooks/useCountdown';
import type { Round, RoundStatus } from '@/components/types';

const API_BASE = 'https://commerce-control-squad16.vercel.app/api';

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
  if (expired) return <span style={{ fontSize: '12px', color: 'var(--cenc-gray-400)', fontStyle: 'italic' }}>Expirado</span>;
  return <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, color: '#ea580c', fontVariantNumeric: 'tabular-nums' }}>{timeLeft}</span>;
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
      const res = await fetch(`${API_BASE}/rounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: Number(data.number),
          durationHours: Number(data.durationHours),
          demandFactor: Number(data.demandFactor),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Erro ao criar rodada');
      }
      const round = await res.json();
      onSuccess(round);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao criar rodada');
    }
  }

  const field = (hasError: boolean) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', border: '1px solid var(--cenc-gray-200)', width: '100%', maxWidth: 460, margin: '0 16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--cenc-gray-900)' }}>Nova Rodada</h2>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cenc-gray-700)' }}>Número da rodada</label>
            <input type="number" min="1" style={{ width: '100%', borderRadius: '10px', border: `1.5px solid ${!!errors.number ? 'var(--cenc-danger)' : 'var(--cenc-gray-300)'}`, padding: '10px 14px', fontSize: '14px', color: 'var(--cenc-gray-900)', background: !!errors.number ? 'var(--cenc-danger-bg)' : 'white', outline: 'none', boxSizing: 'border-box' }} {...register('number')} />
            {errors.number && <p style={{ margin: 0, fontSize: '12px', color: 'var(--cenc-danger)' }}>{errors.number.message}</p>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cenc-gray-700)' }}>Duração (horas)</label>
            <input type="number" min="1" step="1" style={{ width: '100%', borderRadius: '10px', border: `1.5px solid ${!!errors.durationHours ? 'var(--cenc-danger)' : 'var(--cenc-gray-300)'}`, padding: '10px 14px', fontSize: '14px', color: 'var(--cenc-gray-900)', background: !!errors.durationHours ? 'var(--cenc-danger-bg)' : 'white', outline: 'none', boxSizing: 'border-box' }} {...register('durationHours')} />
            {errors.durationHours && <p style={{ margin: 0, fontSize: '12px', color: 'var(--cenc-danger)' }}>{errors.durationHours.message}</p>}
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--cenc-gray-400)' }}>O cronômetro começa a contar a partir do momento da criação.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cenc-gray-700)' }}>Fator de demanda (0–1)</label>
            <input type="number" step="0.05" min="0" max="1" style={{ width: '100%', borderRadius: '10px', border: `1.5px solid ${!!errors.demandFactor ? 'var(--cenc-danger)' : 'var(--cenc-gray-300)'}`, padding: '10px 14px', fontSize: '14px', color: 'var(--cenc-gray-900)', background: !!errors.demandFactor ? 'var(--cenc-danger-bg)' : 'white', outline: 'none', boxSizing: 'border-box' }} {...register('demandFactor')} />
            {errors.demandFactor && <p style={{ margin: 0, fontSize: '12px', color: 'var(--cenc-danger)' }}>{errors.demandFactor.message}</p>}
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--cenc-gray-400)' }}>% do mix disponível que compõe a demanda desta rodada.</p>
          </div>
          {serverError && <p style={{ borderRadius: '10px', background: 'var(--cenc-danger-bg)', border: '1px solid #fecaca', padding: '10px 14px', fontSize: '13px', color: 'var(--cenc-danger)' }}>{serverError}</p>}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '4px' }}>
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', border: '1px solid var(--cenc-gray-200)', width: '100%', maxWidth: 460, margin: '0 16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {success ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', paddingTop: '8px' }}>
              <span style={{ fontSize: '48px' }}>✓</span>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--cenc-gray-900)' }}>Rodada encerrada!</h2>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--cenc-gray-500)', textAlign: 'center' }}>Os resultados da Rodada #{round.number} foram calculados com sucesso.</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="button" onClick={onCancel}>Fechar</Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--cenc-gray-900)' }}>Encerrar Rodada #{round.number}?</h2>
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--cenc-gray-500)', lineHeight: 1.6 }}>Isso irá processar o DRE de todos os squads. Esta ação não pode ser desfeita.</p>
            </div>
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '10px', background: '#fef3c7', border: '1px solid #fde047', padding: '10px 14px', fontSize: '13px', color: '#92400e' }}>
                <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Processando resultados...
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', border: '1px solid var(--cenc-gray-200)', width: '100%', maxWidth: 460, margin: '0 16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--cenc-gray-900)' }}>Excluir Rodada #{round.number}?</h2>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--cenc-gray-500)', lineHeight: 1.6 }}>
            {round.status === 'CLOSED'
              ? 'A rodada será excluída e as vendas serão revertidas no estoque. Resultados financeiros serão apagados.'
              : 'A rodada e todas as configurações submetidas serão apagadas permanentemente.'}
            {' '}Esta ação não pode ser desfeita.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', border: '1px solid var(--cenc-gray-200)', width: '100%', maxWidth: 460, margin: '0 16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#b91c1c' }}>Atenção: Reiniciar Jogo</h2>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--cenc-gray-600)', lineHeight: 1.6 }}>
            Isso irá <strong>excluir todas as rodadas</strong>, zerar o estoque de todas as lojas e restaurar o capital inicial. Esta ação é <strong>irreversível</strong>.
          </p>
          <p style={{ margin: '12px 0 0', fontSize: '13px', color: 'var(--cenc-gray-600)' }}>
            Para confirmar, digite <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#b91c1c' }}>REINICIAR</span> abaixo:
          </p>
        </div>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="REINICIAR"
          style={{ width: '100%', borderRadius: '10px', border: '1.5px solid var(--cenc-gray-300)', padding: '10px 14px', fontSize: '14px', fontFamily: 'monospace', color: 'var(--cenc-gray-900)', background: 'white', outline: 'none', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
    <div style={{ borderRadius: '14px', border: '1px solid var(--cenc-gray-200)', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: 'var(--cenc-gray-50)', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: 'var(--cenc-gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--cenc-gray-200)' }}>
            <th style={{ padding: '12px 16px' }}>Rodada</th>
            <th style={{ padding: '12px 16px' }}>Encerra em</th>
            <th style={{ padding: '12px 16px' }}>Duração</th>
            <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
            <th style={{ padding: '12px 16px', textAlign: 'center' }}>Demanda</th>
            <th style={{ padding: '12px 16px', textAlign: 'center' }}>Configs</th>
            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Ação</th>
          </tr>
        </thead>
        <tbody>
          {rounds.map((round) => {
            const badge = STATUS_BADGE[round.status];
            const isLast = round.id === lastRoundId;
            return (
              <tr key={round.id} style={{ borderTop: '1px solid var(--cenc-gray-100)', background: 'white' }}>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--cenc-gray-800)' }}>#{round.number}</td>
                <td style={{ padding: '12px 16px', color: 'var(--cenc-gray-600)' }}>
                  {round.status === 'OPEN'
                    ? <RoundCountdown endsAt={round.endsAt} />
                    : formatDateTime(round.endsAt)}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--cenc-gray-500)', fontSize: '12px' }}>{round.durationHours}h</td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--cenc-gray-700)', fontSize: '12px' }}>
                  {round.demandFactor != null ? `${(round.demandFactor * 100).toFixed(0)}%` : '—'}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--cenc-gray-700)' }}>
                  {round.submittedConfigsCount ?? '—'}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                    {round.status === 'OPEN' && (
                      <button onClick={() => onExtend(round)} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cenc-blue-600)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        + Tempo
                      </button>
                    )}
                    {round.status === 'OPEN' && (
                      <button onClick={() => onClose(round)} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cenc-danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Encerrar
                      </button>
                    )}
                    {round.status === 'CLOSED' && (
                      <Link href={`/admin/results?roundId=${round.id}`} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cenc-blue-600)' }}>
                        Ver resultados →
                      </Link>
                    )}
                    {round.status === 'PROCESSING' && (
                      <span style={{ fontSize: '12px', color: 'var(--cenc-gray-400)', fontStyle: 'italic' }}>Processando...</span>
                    )}
                    {isLast && round.status !== 'PROCESSING' && (
                      <button onClick={() => onDeleteLast(round)} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cenc-gray-400)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} title="Excluir última rodada">
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)', border: '1px solid var(--cenc-gray-200)', width: '100%', maxWidth: 380, margin: '0 16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--cenc-gray-900)' }}>Adicionar Tempo — Rodada #{round.number}</h2>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--cenc-gray-500)' }}>Informe quantos minutos extras deseja adicionar ao cronômetro.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cenc-gray-700)' }}>Minutos adicionais</label>
          <input
            type="number"
            min="1"
            step="1"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            style={{ width: '100%', borderRadius: '10px', border: '1.5px solid var(--cenc-gray-300)', padding: '10px 14px', fontSize: '14px', color: 'var(--cenc-gray-900)', background: 'white', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button type="button" onClick={() => onConfirm(minutes)} loading={loading} disabled={minutes < 1}>Adicionar</Button>
        </div>
      </div>
    </div>
  );
}
