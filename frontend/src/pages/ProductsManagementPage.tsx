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
import type { Product } from '../types';

// ─── Schema ──────────────────────────────────────────────────────────────────

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  purchasePrice: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .positive('Deve ser positivo'),
  taxRate: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .min(0, 'Não pode ser negativo')
    .max(1, 'Máximo 1 (100%)'),
  breakageRate: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .min(0, 'Não pode ser negativo')
    .max(1, 'Máximo 1 (100%)'),
  agingRate: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .min(0, 'Não pode ser negativo')
    .max(1, 'Máximo 1 (100%)'),
  mixAvailable: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .int('Deve ser inteiro')
    .min(0, 'Não pode ser negativo'),
});

type ProductFormData = z.infer<typeof productSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fieldClass(hasError: boolean) {
  return `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
  }`;
}

function formatRate(v: number) {
  return `${(v * 100).toFixed(2)}%`;
}

// ─── Modal — Criar / Editar Produto ──────────────────────────────────────────

function ProductModal({
  product,
  onSuccess,
  onCancel,
}: {
  product?: Product;
  onSuccess: (p: Product) => void;
  onCancel: () => void;
}) {
  const isEdit = !!product;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          purchasePrice: product.purchasePrice,
          taxRate: product.taxRate,
          breakageRate: product.breakageRate,
          agingRate: product.agingRate,
          mixAvailable: product.mixAvailable,
        }
      : { taxRate: 0, breakageRate: 0, agingRate: 0, mixAvailable: 0 },
  });

  // watch is used to trigger re-renders for the dirty check
  void watch('purchasePrice');

  const [serverError, setServerError] = useState('');
  const purchasePriceDirty = isEdit && dirtyFields.purchasePrice;

  async function onSubmit(data: ProductFormData) {
    setServerError('');
    try {
      const result = isEdit
        ? await productService.updateProduct(product.id, data)
        : await productService.createProduct(data);
      onSuccess(result);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setServerError(axiosErr.response?.data?.message ?? 'Erro ao salvar produto');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg mx-4 p-6 flex flex-col gap-5">
        <h2 className="text-base font-semibold text-gray-900">
          {isEdit ? 'Editar Categoria' : 'Nova Categoria'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Nome</label>
            <input className={fieldClass(!!errors.name)} {...register('name')} autoFocus={!isEdit} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Preço de compra (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className={fieldClass(!!errors.purchasePrice)}
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

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Imposto (0–1)</label>
              <input type="number" step="0.001" min="0" max="1" className={fieldClass(!!errors.taxRate)} {...register('taxRate')} />
              {errors.taxRate && <p className="text-xs text-red-600">{errors.taxRate.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Quebra (0–1)</label>
              <input type="number" step="0.001" min="0" max="1" className={fieldClass(!!errors.breakageRate)} {...register('breakageRate')} />
              {errors.breakageRate && <p className="text-xs text-red-600">{errors.breakageRate.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Aging (0–1)</label>
              <input type="number" step="0.001" min="0" max="1" className={fieldClass(!!errors.agingRate)} {...register('agingRate')} />
              {errors.agingRate && <p className="text-xs text-red-600">{errors.agingRate.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Mix disponível (un.)</label>
            <input type="number" min="0" step="1" className={fieldClass(!!errors.mixAvailable)} {...register('mixAvailable')} />
            {errors.mixAvailable && <p className="text-xs text-red-600">{errors.mixAvailable.message}</p>}
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
              {isEdit ? 'Salvar alterações' : 'Criar Categoria'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal — Confirmar deleção ────────────────────────────────────────────────

function DeleteModal({
  product,
  onConfirm,
  onCancel,
  loading,
  error,
}: {
  product: Product;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Deletar &quot;{product.name}&quot;?</h2>
          <p className="text-sm text-gray-500 mt-1.5">
            Esta ação removerá a categoria permanentemente e não pode ser desfeita.
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
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

  function handleCreated(product: Product) {
    setProducts((prev) => [product, ...prev]);
    setCreateOpen(false);
    toast.success(`Categoria "${product.name}" criada com sucesso!`);
  }

  function handleUpdated(updated: Product) {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditProduct(null);
    toast.success('Categoria atualizada com sucesso!');
  }

  async function handleDeleteConfirm() {
    if (!deleteProduct) return;
    setDeletingProduct(true);
    setDeleteError('');
    try {
      await productService.deleteProduct(deleteProduct.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteProduct.id));
      setDeleteProduct(null);
      toast.success('Categoria removida.');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      const status = axiosErr.response?.status;
      setDeleteError(
        status === 409
          ? 'Esta categoria está em uso e não pode ser removida.'
          : (axiosErr.response?.data?.message ?? 'Erro ao deletar categoria')
      );
    } finally {
      setDeletingProduct(false);
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl flex flex-col gap-6">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Categorias de Produto</h1>
            <p className="text-sm text-gray-500 mt-0.5">Categorias disponíveis na simulação com suas taxas e preços.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>+ Nova Categoria</Button>
        </div>

        {/* Busca */}
        <input
          type="text"
          placeholder="Buscar categoria por nome..."
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
                <p className="text-gray-500 font-medium">Nenhuma categoria cadastrada.</p>
                <p className="text-sm text-gray-400">Crie a primeira categoria para começar.</p>
              </>
            ) : (
              <p className="text-gray-400">Nenhuma categoria encontrada para &quot;{search}&quot;.</p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 border-b border-gray-200">
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold text-right">Preço de Compra</th>
                  <th className="px-4 py-3 font-semibold text-right">Imposto</th>
                  <th className="px-4 py-3 font-semibold text-right">Quebra</th>
                  <th className="px-4 py-3 font-semibold text-right">Aging</th>
                  <th className="px-4 py-3 font-semibold text-right">Mix Disp.</th>
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
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(product.purchasePrice)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatRate(product.taxRate)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatRate(product.breakageRate)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatRate(product.agingRate)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{product.mixAvailable.toLocaleString('pt-BR')}</td>
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
              ? `${products.length} categoria(s)`
              : `${filtered.length} de ${products.length} categoria(s)`}
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
