import api from './api';

const userService = {
  getUsers: () =>
    api.get('/users').then((r) => r.data),

  createUser: (data) =>
    api.post('/users', data).then((r) => r.data),

  updateUser: (id, data) =>
    api.put(`/users/${id}`, data).then((r) => r.data),

  deleteUser: (id) =>
    api.delete(`/users/${id}`).then((r) => r.data),
};

export default userService;
