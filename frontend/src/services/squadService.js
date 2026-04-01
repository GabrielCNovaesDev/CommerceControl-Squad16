import api from './api';

const squadService = {
  getSquads: () =>
    api.get('/squads').then((r) => r.data),

  createSquad: (data) =>
    api.post('/squads', data).then((r) => r.data),

  updateSquad: (id, data) =>
    api.put(`/squads/${id}`, data).then((r) => r.data),

  deleteSquad: (id) =>
    api.delete(`/squads/${id}`).then((r) => r.data),

  addUser: (squadId, userId) =>
    api.post(`/squads/${squadId}/users`, { userId }).then((r) => r.data),

  removeUser: (squadId, userId) =>
    api.delete(`/squads/${squadId}/users/${userId}`).then((r) => r.data),
};

export default squadService;
