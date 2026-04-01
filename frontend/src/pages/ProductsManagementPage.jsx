import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import productService from '../services/productService';
import AdminLayout from '../components/layout/AdminLayout';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/formatters';

// ─── Schema ──────────────────────────────────────────────────────────────────

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  purchasePrice: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .positive('Deve ser positivo'),
  salePrice: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .positive('Deve ser positivo'),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fieldClass(hasError) {
  return `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
  }`;
}

// ─── Modal — Criar / Editar Produto ──────────────────────────────────────────

function ProductModal({ product, onSuccess, onCancel }) {
  const isEdit = !!product;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? { name: product.name, purchasePrice: product.purchasePrice, salePrice: product.salePrice }
      : {},
  });

  const [serverError, setServerError] = useState('');

  // Show warning when purchasePrice is dirty during edit
  const purchasePriceDirty = isEdit && dirtyFields.purchasePrice;

  async function onSubmit(data) {
    setServerError('');
    try {
      const result = isEdit
        ? await productService.updateProduct(product.id, data)
        : await productService.createProduct(data);
      onSuccess(result);
    } catch (err) {
      setServerError(err.response?.data?.message ?? 'Erro ao salvar produto');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        <h2 className="text-base font-semibold text-gray-900">
          {isEdit ? 'Editar Produto' : 'Novo Produto'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Nome</label>
            <input className={fieldClass(errors.name)} {...register('name')} autoFocus={!isEdit} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Preço de compra (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className={fieldClass(errors.purchasePrice)}
              {...register('purchasePrice')}
            />
            {errors.purchasePrice && (
              <p className="text-xs text-red-600">{errors.purchasePrice.message}</p>
            )}
            {purchasePriceDirty && (
              <p className="flex gap-1.5 items-start rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-800">
                <span className="mt-px shrink-0">⚠</span>
                Alterar o preço de compra afetará o cálculo de todas as rodadas futuras.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Preço de venda padrão (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className={fieldClass(errors.salePrice)}
              {...register('salePrice')}
            />
            {errors.salePrice && (
              <p className="text-xs text-red-600">{errors.salePrice.message}</p>
            )}
          </div>

          {serverError && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              {serverError}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? 'Salvar alterações' : 'Criar Produto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal — Confirmar deleção ────────────────────────────────────────────────

function DeleteModal({ product, onConfirm, onCancel, loading, error }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Deletar "{product.name}"?</h2>
          <p className="text-sm text-gray-500 mt-1.5">
            Esta ação removerá o produto permanentemente e não pode ser desfeita.
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} loading={loading}>
            Deletar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ProductsManagementPage() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  function loadProducts() {
    setLoadError('');
    setLoading(true);
    productService.getProducts()
      .then(setProducts)
      .catch(() => setLoadError('Não foi possível carregar os produtos.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadProducts(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  function handleCreated(product) {
    setProducts((prev) => [product, ...prev]);
    setCreateOpen(false);
    toast.success(`Produto "${product.name}" criado com sucesso!`);
  }

  function handleUpdated(updated) {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditProduct(null);
    toast.success('Produto atualizado com sucesso!');
  }

  async function handleDeleteConfirm() {
    if (!deleteProduct) return;
    setDeletingProduct(true);
    setDeleteError('');
    try {
      await productService.deleteProduct(deleteProduct.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteProduct.id));
      setDeleteProduct(null);
      toast.success('Produto removido.');
    } catch (err) {
      const status = err.response?.status;
      setDeleteError(
        status === 409
          ? 'Este produto está em uso e não pode ser removido.'
          : (err.response?.data?.message ?? 'Erro ao deletar produto')
      );
    } finally {
      setDeletingProduct(false);
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl flex flex-col gap-6">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Produtos</h1>
            <p className="text-sm text-gray-500 mt-0.5">Catálogo de produtos disponíveis na simulação.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>+ Novo Produto</Button>
        </div>

        {/* Busca */}
        <input
          type="text"
          placeholder="Buscar produto por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
        />

        {/* Tabela */}
        {loading ? (
          <Skeleton variant="table" rows={4} />
        ) : loadError ? (
          <ErrorMessage message={loadError} onRetry={loadProducts} />
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-12 flex flex-col items-center gap-2">
            {products.length === 0 ? (
              <>
                <p className="text-gray-500 font-medium">Nenhum produto cadastrado.</p>
                <p className="text-sm text-gray-400">Crie o primeiro produto para começar.</p>
              </>
            ) : (
              <p className="text-gray-400">Nenhum produto encontrado para "{search}".</p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 border-b border-gray-200">
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold text-right">Preço de Compra</th>
                  <th className="px-4 py-3 font-semibold text-right">Preço de Venda Padrão</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="border-t border-gray-100 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">{product.name}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatCurrency(product.purchasePrice)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatCurrency(product.salePrice)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setEditProduct(product)}
                          className="text-xs font-medium text-gray-500 hover:text-indigo-700 transition-colors px-2 py-1 rounded hover:bg-indigo-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => { setDeleteError(''); setDeleteProduct(product); }}
                          className="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                        >
                          Deletar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Contador */}
        {!loading && products.length > 0 && (
          <p className="text-xs text-gray-400">
            {filtered.length === products.length
              ? `${products.length} produto(s)`
              : `${filtered.length} de ${products.length} produto(s)`}
          </p>
        )}
      </div>

      {/* Modais */}
      {createOpen && (
        <ProductModal onSuccess={handleCreated} onCancel={() => setCreateOpen(false)} />
      )}

      {editProduct && (
        <ProductModal
          product={editProduct}
          onSuccess={handleUpdated}
          onCancel={() => setEditProduct(null)}
        />
      )}

      {deleteProduct && (
        <DeleteModal
          product={deleteProduct}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setDeleteProduct(null); setDeleteError(''); }}
          loading={deletingProduct}
          error={deleteError}
        />
      )}
    </AdminLayout>
  );
}
