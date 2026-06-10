import { useAsync } from './useAsync';
import squadService from '../services/squadService';
import type { Squad } from '../types';

export function useSquads() {
  return useAsync<Squad[]>(() => squadService.getSquads());
}
