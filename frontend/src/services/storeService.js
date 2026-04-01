import api from './api';

const storeService = {
  getMyStore: () =>
    api.get('/stores/my').then((r) => r.data),

  createStore: (data) =>
    api.post('/stores', data).then((r) => r.data),

  getInventory: (storeId) =>
    api.get(`/stores/${storeId}/inventory`).then((r) => r.data),
};

export default storeService;
