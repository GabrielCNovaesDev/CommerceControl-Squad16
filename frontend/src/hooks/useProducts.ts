import { useAsync } from './useAsync';
import productService from '../services/productService';
import type { Product } from '../types';

/**
 * Carrega a lista de produtos com loading/error state.
 * Expõe `reload` para forçar refetch após mutações.
 */
export function useProducts() {
  return useAsync<Product[]>(() =>
    productService.getProducts().then((res) => {
      const data = res as unknown as { content?: Product[] } | Product[];
      return Array.isArray(data) ? data : (data as { content: Product[] }).content ?? [];
    })
  );
}
