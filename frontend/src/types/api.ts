export type UserRole = 'GAME_MASTER' | 'PLAYER' | 'OBSERVER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  cargo?: string;
  leader: boolean;
  squadId: string | null;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}