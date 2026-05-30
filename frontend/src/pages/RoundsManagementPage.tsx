import { useEffect, useState, useCallback } from 'react';
import roundService from '../services/roundService';
import AdminLayout from '../components/layout/AdminLayout';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import { useToast } from '../hooks/useToast';
import usePageTitle from "../hooks/usePageTitle";
import {
  CreateRoundModal,
  CloseRoundModal,
  DeleteLastRoundModal,
  ResetGameModal,
  RoundsTable,
} from '../components/rounds/RoundsComponents';
import type { Round, RoundStatus } from '../types';

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

  const loadRounds = useCallback(async () => {
    setLoadError('');
    try {
      const data = await roundService.getRounds();
      const list = Array.isArray(data) ? data : data;
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
      await roundService.closeRound(roundToClose.id);
      setCloseSuccess(true);
      toast.success(`Rodada #${roundToClose.number} encerrada com sucesso!`);
      setRounds((prev) =>
        prev.map((r) => (r.id === roundToClose.id ? { ...r, status: 'CLOSED' as RoundStatus } : r))
      );
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
      toast.error(axiosErr.response?.data?.error?.message ?? axiosErr.response?.data?.message ?? 'Erro ao encerrar rodada');
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
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
      toast.error(axiosErr.response?.data?.error?.message ?? axiosErr.response?.data?.message ?? 'Erro ao excluir rodada');
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
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
      toast.error(axiosErr.response?.data?.error?.message ?? axiosErr.response?.data?.message ?? 'Erro ao reiniciar jogo');
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
