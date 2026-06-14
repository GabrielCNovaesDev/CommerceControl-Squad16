'use client';

import { useEffect, useState, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { useToast } from '@/components/hooks/useToast';
import usePageTitle from '@/components/hooks/usePageTitle';
import {
  CreateRoundModal,
  CloseRoundModal,
  DeleteLastRoundModal,
  ResetGameModal,
  ExtendRoundModal,
  RoundsTable,
} from '@/components/rounds/RoundsComponents';
import type { Round, RoundStatus } from '@/components/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function RoundsManagementPage() {
  usePageTitle("Gerenciar Rodadas");
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
  const [roundToExtend, setRoundToExtend] = useState<Round | null>(null);
  const [extending, setExtending] = useState(false);

  const loadRounds = useCallback(async () => {
    setLoadError('');
    try {
      const res = await fetch(`${API_BASE}/rounds`);
      const data = await res.json();
      const list: Round[] = data.data ?? data ?? [];
      setRounds(list);
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
      const res = await fetch(`${API_BASE}/rounds/${roundToClose.id}/close`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Erro ao encerrar rodada');
      }
      setCloseSuccess(true);
      toast.success(`Rodada #${roundToClose.number} encerrada com sucesso!`);
      setRounds((prev) =>
        prev.map((r) => (r.id === roundToClose.id ? { ...r, status: 'CLOSED' as RoundStatus } : r))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao encerrar rodada');
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
      const res = await fetch(`${API_BASE}/rounds/last`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Erro ao excluir rodada');
      }
      toast.success(`Rodada #${roundToDelete.number} excluída.`);
      setRoundToDelete(null);
      setLoading(true);
      loadRounds();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir rodada');
      setRoundToDelete(null);
    } finally {
      setDeletingRound(false);
    }
  }

  async function handleResetGame() {
    setResetting(true);
    try {
      const res = await fetch(`${API_BASE}/rounds/reset`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Erro ao reiniciar jogo');
      }
      toast.success('Jogo reiniciado com sucesso!');
      setShowResetModal(false);
      setLoading(true);
      loadRounds();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao reiniciar jogo');
    } finally {
      setResetting(false);
    }
  }

  async function handleExtendRound(minutes: number) {
    if (!roundToExtend) return;
    setExtending(true);
    try {
      const res = await fetch(`${API_BASE}/rounds/${roundToExtend.id}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Erro ao adicionar tempo');
      }
      toast.success(`+${minutes} minutos adicionados à Rodada #${roundToExtend.number}`);
      setRoundToExtend(null);
      setLoading(true);
      loadRounds();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao adicionar tempo');
    } finally {
      setExtending(false);
    }
  }

  const hasOpenRound = rounds.some((r) => r.status === 'OPEN' || r.status === 'PROCESSING');
  const nextNumber = rounds.length > 0 ? Math.max(...rounds.map((r) => r.number)) + 1 : 1;
  const lastRoundId = rounds.length > 0 ? rounds[0].id : null;

  return (
    <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--cenc-gray-900)' }}>Rodadas</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--cenc-gray-500)' }}>Gerencie o ciclo de vida das rodadas da simulação.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {rounds.length > 0 && (
            <button
              onClick={() => setShowResetModal(true)}
              style={{ fontSize: '13px', fontWeight: 600, color: '#b91c1c', background: 'none', border: '1.5px solid #fecaca', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
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
        <div style={{ borderRadius: '14px', border: '1px solid var(--cenc-gray-200)', background: 'white', padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--cenc-gray-500)' }}>Nenhuma rodada criada ainda.</p>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--cenc-gray-400)' }}>Crie a primeira rodada para iniciar a simulação.</p>
        </div>
      ) : (
        <RoundsTable
          rounds={rounds}
          onClose={(round) => { setRoundToClose(round); setCloseSuccess(false); }}
          onDeleteLast={(round) => setRoundToDelete(round)}
          onExtend={(round) => setRoundToExtend(round)}
          lastRoundId={lastRoundId}
        />
      )}
    </div>
  );
}
