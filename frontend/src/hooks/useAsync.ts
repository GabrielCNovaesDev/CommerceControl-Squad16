import { useState, useEffect, useCallback } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Hook genérico para operações assíncronas com loading/error state.
 * Elimina o padrão repetido de useState(loading) + useState(error) + useEffect nos pages.
 *
 * @param fn - Função assíncrona que retorna os dados
 * @param deps - Dependências que disparam reload (padrão: [])
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[] = []
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fn()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const axiosErr = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
          const message =
            axiosErr.response?.data?.error?.message ??
            axiosErr.response?.data?.message ??
            'Erro ao carregar dados';
          setError(message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { data, loading, error, reload };
}
