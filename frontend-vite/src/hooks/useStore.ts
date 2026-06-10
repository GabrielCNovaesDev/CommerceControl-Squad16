import { useAsync } from './useAsync';
import storeService from '../services/storeService';
import type { Store, InventoryItem } from '../types';

/**
 * Carrega a loja do squad do usuário autenticado.
 */
export function useMyStore() {
  return useAsync<Store>(() => storeService.getMyStore());
}

/**
 * Carrega o inventário de uma loja específica.
 */
export function useInventory(storeId: string | null) {
  return useAsync<InventoryItem[]>(
    () => {
      if (!storeId) return Promise.reject(new Error('storeId não fornecido'));
      return storeService.getInventory(storeId);
    },
    [storeId]
  );
}
