import { useAsync } from './useAsync';
import userService from '../services/userService';
import type { UserRecord } from '../types';

export function useUsers() {
  return useAsync<UserRecord[]>(() => userService.getUsers());
}
