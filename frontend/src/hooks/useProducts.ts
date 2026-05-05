import { useAsync } from './useAsync';
import productService from '../services/productService';
import type { Product } from '../types';

export function useProducts() {
  return useAsync<Product[]>(() => productService.getProducts());
}
