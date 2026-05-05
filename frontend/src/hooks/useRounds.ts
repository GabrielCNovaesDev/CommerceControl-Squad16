import { useAsync } from './useAsync';
import roundService from '../services/roundService';
import type { Round } from '../types';

/**
 * Carrega a lista de rodadas com loading/error state.
 * Expõe `reload` para forçar refetch após mutações.
 */
export function useRounds() {
  return useAsync<Round[]>(() =>
    roundService.getRounds().then((res) => {
      // Suporta tanto resposta paginada { content: Round[] } quanto array direto
      const data = res as unknown as { content?: Round[] } | Round[];
      return Array.isArray(data) ? data : (data as { content: Round[] }).content ?? [];
    })
  );
}

/**
 * Carrega uma rodada específica por ID.
 */
export function useRound(id: string | null) {
  return useAsync<Round>(
    () => {
      if (!id) return Promise.reject(new Error('ID não fornecido'));
      return roundService.getRound(id);
    },
    [id]
  );
}
