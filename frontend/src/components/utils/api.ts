'use client';

import { getSession } from 'next-auth/react';

interface ApiResult<T> {
  data: T;
  error: null;
  status: number;
}
interface ApiError {
  data: null;
  error: string;
  status: number;
}
type ApiResponse<T> = ApiResult<T> | ApiError;

/**
 * Fetch helper que lida com erros de API de forma consistente.
 * Inclui automaticamente o token de autenticação do NextAuth.
 * Retorna { data, error } - nunca lança exceções para erros HTTP.
 * Se o status for 401, dispara redirect para /login.
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // Get session to include auth token
    const session = await getSession();
    const token = (session?.user as { token?: string } | undefined)?.token;

    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    // 401 = não autenticado, redireciona para login
    if (res.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      return { data: null, error: 'Não autenticado', status: 401 };
    }

    if (!res.ok) {
      let errMsg = `Erro ${res.status}`;
      try {
        const errBody = await res.json();
        errMsg = errBody.message ?? errBody.error ?? errMsg;
      } catch {
        // ignore parse error
      }
      return { data: null, error: errMsg, status: res.status };
    }

    const body = await res.json();
    // Suporta tanto { data: T } quanto T puro
    const data = body && typeof body === 'object' && 'data' in body ? body.data : body;
    return { data: data as T, error: null, status: res.status };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro de rede';
    return { data: null, error: msg, status: 0 };
  }
}

/**
 * Fetch autenticado que retorna a Response completa.
 * Útil para operações POST/PUT/DELETE que precisam verificar status.
 * Inclui automaticamente o token de autenticação do NextAuth.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = await getSession();
  const token = (session?.user as { token?: string } | undefined)?.token;

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

/**
 * Helper que extrai array de uma resposta que pode ser array puro, { data: [] }, ou undefined.
 * Garante retorno de array mesmo em caso de erro.
 */
export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && 'data' in value) {
    const data = (value as { data: unknown }).data;
    if (Array.isArray(data)) return data as T[];
  }
  return [];
}
