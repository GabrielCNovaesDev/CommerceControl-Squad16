import api from './api';
import { Store, InventoryItem } from '../types';

interface CreateStoreData {
  name: string;
  initialCapital: number;
}

const storeService = {
  getMyStore: (): Promise<Store> =>
    api.get('/stores/my').then((r) => r.data),

  createStore: (data: CreateStoreData): Promise<Store> =>
    api.post('/stores', data).then((r) => r.data),

  getInventory: (storeId: string): Promise<InventoryItem[]> =>
    api.get(`/stores/${storeId}/inventory`).then((r) => r.data),
};

export default storeService;
