import { useAsync } from './useAsync';
import squadService from '../services/squadService';
import type { Squad } from '../types';

/**
 * Carrega a lista de squads com loading/error state.
 * Expõe `reload` para forçar refetch após mutações.
 */
export function useSquads() {
  return useAsync<Squad[]>(() =>
    squadService.getSquads().then((res) => {
      const data = res as unknown as { content?: Squad[] } | Squad[];
      return Array.isArray(data) ? data : (data as { content: Squad[] }).content ?? [];
    })
  );
}
