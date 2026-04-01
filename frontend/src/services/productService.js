import api from './api';

const productService = {
  getProducts: () =>
    api.get('/products').then((r) => r.data),

  createProduct: (data) =>
    api.post('/products', data).then((r) => r.data),

  updateProduct: (id, data) =>
    api.put(`/products/${id}`, data).then((r) => r.data),

  deleteProduct: (id) =>
    api.delete(`/products/${id}`).then((r) => r.data),
};

export default productService;
