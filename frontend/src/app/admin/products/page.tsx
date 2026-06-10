'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Product {
  id: string;
  name: string;
  purchasePrice: string;
  taxRate: string;
  breakageRate: string;
  agingRate: string;
  mixAvailable: number;
  createdAt: string;
}

export default function ProductsManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    purchasePrice: '',
    taxRate: '0',
    breakageRate: '0',
    agingRate: '0',
    mixAvailable: '0',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      setShowModal(false);
      setEditingProduct(null);
      setFormData({ name: '', purchasePrice: '', taxRate: '0', breakageRate: '0', agingRate: '0', mixAvailable: '0' });
      fetchProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      purchasePrice: product.purchasePrice,
      taxRate: product.taxRate,
      breakageRate: product.breakageRate,
      agingRate: product.agingRate,
      mixAvailable: product.mixAvailable.toString(),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Produtos</h1>
        <button
          onClick={() => { setEditingProduct(null); setShowModal(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Novo Produto
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Imposto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breakage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aging</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mix</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">R$ {parseFloat(product.purchasePrice).toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{parseFloat(product.taxRate).toFixed(2)}%</td>
                <td className="px-6 py-4 whitespace-nowrap">{parseFloat(product.breakageRate).toFixed(2)}%</td>
                <td className="px-6 py-4 whitespace-nowrap">{parseFloat(product.agingRate).toFixed(2)}%</td>
                <td className="px-6 py-4 whitespace-nowrap">{product.mixAvailable}</td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-800 text-sm">Editar</button>
                  <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800 text-sm">Deletar</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">Nenhum produto encontrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Editar' : 'Novo'} Produto</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Compra</label>
                <input type="number" step="0.01" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imposto %</label>
                  <input type="number" step="0.01" value={formData.taxRate} onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Breakage %</label>
                  <input type="number" step="0.01" value={formData.breakageRate} onChange={(e) => setFormData({ ...formData, breakageRate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aging %</label>
                  <input type="number" step="0.01" value={formData.agingRate} onChange={(e) => setFormData({ ...formData, agingRate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mix Disponível</label>
                <input type="number" value={formData.mixAvailable} onChange={(e) => setFormData({ ...formData, mixAvailable: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancelar</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}