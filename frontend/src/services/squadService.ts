import api from './api';
import { Squad } from '../types';

const squadService = {
  getSquads: (): Promise<Squad[]> =>
    api.get('/squads').then((r) => r.data),

  createSquad: (data: { name: string }): Promise<Squad> =>
    api.post('/squads', data).then((r) => r.data),

  updateSquad: (id: string, data: { name: string }): Promise<Squad> =>
    api.put(`/squads/${id}`, data).then((r) => r.data),

  deleteSquad: (id: string): Promise<{ deleted: boolean }> =>
    api.delete(`/squads/${id}`).then((r) => r.data),

  addUser: (squadId: string, userId: string): Promise<unknown> =>
    api.post(`/squads/${squadId}/users`, { userId }).then((r) => r.data),

  removeUser: (squadId: string, userId: string): Promise<unknown> =>
    api.delete(`/squads/${squadId}/users/${userId}`).then((r) => r.data),
};

export default squadService;
