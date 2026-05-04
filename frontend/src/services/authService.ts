import api from './api';
import { User } from '../types';

interface LoginResponse {
  token: string;
  user: User;
}

const authService = {
  login: (email: string, password: string): Promise<LoginResponse> =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
};

export default authService;
