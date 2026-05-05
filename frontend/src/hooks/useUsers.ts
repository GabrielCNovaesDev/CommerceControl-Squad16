import { useAsync } from './useAsync';
import userService from '../services/userService';
import type { UserRecord } from '../types';

/**
 * Carrega a lista de usuários com loading/error state.
 * Expõe `reload` para forçar refetch após mutações.
 */
export function useUsers() {
  return useAsync<UserRecord[]>(() =>
    userService.getUsers().then((res) => {
      const data = res as unknown as { content?: UserRecord[] } | UserRecord[];
      return Array.isArray(data) ? data : (data as { content: UserRecord[] }).content ?? [];
    })
  );
}
