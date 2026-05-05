import api from './api';
import { UserRecord, UserRole } from '../types';

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  squadId?: string | null;
}

interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  leader?: boolean;
  squadId?: string | null;
}

export interface BulkCreateResult {
  created: UserRecord[];
  errors: { index: number; email: string; reason: string }[];
  password: string;
}

const userService = {
  getUsers: (): Promise<UserRecord[]> =>
    api.get('/users').then((r) => r.data?.content ?? r.data),

  createUser: (data: CreateUserData): Promise<UserRecord> =>
    api.post('/users', data).then((r) => r.data),

  updateUser: (id: string, data: UpdateUserData): Promise<UserRecord> =>
    api.put(`/users/${id}`, data).then((r) => r.data),

  deleteUser: (id: string): Promise<{ deleted: boolean }> =>
    api.delete(`/users/${id}`).then((r) => r.data),

  bulkCreateUsers: (squadId: string, count: number): Promise<BulkCreateResult> =>
    api.post('/users/bulk', { squadId, count }).then((r) => r.data),
};

export default userService;
