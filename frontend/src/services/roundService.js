import api from './api';

const roundService = {
  getRounds: () =>
    api.get('/rounds').then((r) => r.data),

  getRound: (id) =>
    api.get(`/rounds/${id}`).then((r) => r.data),

  createRound: (data) =>
    api.post('/rounds', data).then((r) => r.data),

  closeRound: (id) =>
    api.patch(`/rounds/${id}/close`).then((r) => r.data),

  deleteLastRound: () =>
    api.delete('/rounds/last').then((r) => r.data),

  resetGame: () =>
    api.post('/rounds/reset').then((r) => r.data),

  submitConfig: (roundId, data) =>
    api.post(`/rounds/${roundId}/config`, data).then((r) => r.data),

  previewSimulation: (data) =>
    api.post('/simulation/preview', data).then((r) => r.data),

  getResults: (roundId) =>
    api.get(`/rounds/${roundId}/results`).then((r) => r.data),

  getRanking: (roundId) =>
    api.get('/simulation/ranking', { params: { roundId } }).then((r) => r.data),
};

export default roundService;
