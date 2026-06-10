import { useAsync } from './useAsync';
import roundService from '../services/roundService';
import type { Round } from '../types';

export function useRounds() {
  return useAsync<Round[]>(() => roundService.getRounds());
}

export function useRound(id: string | null) {
  return useAsync<Round>(
    () => {
      if (!id) return Promise.reject(new Error('ID não fornecido'));
      return roundService.getRound(id);
    },
    [id]
  );
}
