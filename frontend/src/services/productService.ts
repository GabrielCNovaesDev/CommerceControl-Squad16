import api from './api';
import { Product } from '../types';

interface CreateProductData {
  name: string;
  purchasePrice: number;
  taxRate: number;
  breakageRate: number;
  agingRate: number;
  mixAvailable: number;
}

type UpdateProductData = Partial<CreateProductData>;

const productService = {
  getProducts: (): Promise<Product[]> =>
    api.get('/products').then((r) => r.data?.content ?? r.data),

  createProduct: (data: CreateProductData): Promise<Product> =>
    api.post('/products', data).then((r) => r.data),

  updateProduct: (id: string, data: UpdateProductData): Promise<Product> =>
    api.put(`/products/${id}`, data).then((r) => r.data),

  deleteProduct: (id: string): Promise<{ deleted: boolean }> =>
    api.delete(`/products/${id}`).then((r) => r.data),
};

export default productService;
