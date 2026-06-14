'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { useToast } from '@/components/hooks/useToast';
import { formatCurrency } from '@/components/utils/formatters';
import type { Product } from '@/components/types';
import React from 'react';
import usePageTitle from '@/components/hooks/usePageTitle';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  purchasePrice: z.coerce.number({ error: 'Valor inválido' }).positive('Deve ser positivo'),
  taxRate: z.coerce.number({ error: 'Valor inválido' }).min(0, 'Não pode ser negativo').max(1, 'Máximo 1 (100%)'),
  breakageRate: z.coerce.number({ error: 'Valor inválido' }).min(0, 'Não pode ser negativo').max(1, 'Máximo 1 (100%)'),
  agingRate: z.coerce.number({ error: 'Valor inválido' }).min(0, 'Não pode ser negativo').max(1, 'Máximo 1 (100%)'),
  mixAvailable: z.coerce.number({ error: 'Valor inválido' }).int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
});

type ProductFormData = z.infer<typeof productSchema>;

function fieldStyle(hasError: boolean): React.CSSProperties {
  return {
    borderRadius: '10px',
    border: `1.5px solid ${hasError ? 'var(--cenc-danger)' : 'var(--cenc-gray-300)'}`,
    padding: '10px 14px',
    fontSize: '14px',
    color: 'var(--cenc-gray-900)',
    background: hasError ? 'var(--cenc-danger-bg)' : 'white',
    width: '100%',
    boxSizing: 'border-box' as const,
  };
}

function formatRate(v: number) {
  return `${(v * 100).toFixed(2)}%`;
}

function ProductModal({ product, onSuccess, onCancel }: { product?: Product; onSuccess: (p: Product) => void; onCancel: () => void }) {
  const isEdit = !!product;
  const { register, handleSubmit, watch, formState: { errors, isSubmitting, dirtyFields } } = useForm<ProductFormData, unknown, ProductFormData>({
    resolver: zodResolver(productSchema) as never,
    defaultValues: product
      ? { name: product.name, purchasePrice: product.purchasePrice, taxRate: product.taxRate, breakageRate: product.breakageRate, agingRate: product.agingRate, mixAvailable: product.mixAvailable }
      : { taxRate: 0, breakageRate: 0, agingRate: 0, mixAvailable: 0 },
  });
  void watch('purchasePrice');
  const [serverError, setServerError] = useState('');
  const purchasePriceDirty = isEdit && dirtyFields.purchasePrice;

  async function onSubmit(data: ProductFormData) {
    setServerError('');
    try {
      const res = isEdit
        ? await fetch(`${API_BASE}/products/${product.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        : await fetch(`${API_BASE}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Erro ao salvar produto');
      }
      const result = await res.json();
      onSuccess(result);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao salvar produto');
    }
  }

  const fs = (hasError: boolean): React.CSSProperties => fieldStyle(hasError);
  return (
    <div style={{ position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.45)',backdropFilter:'blur(4px)' }}>
      <div style={{ background:'white',borderRadius:20,boxShadow:'0 24px 64px rgba(0,0,0,0.18)',border:'1px solid var(--cenc-gray-200)',width:'100%',maxWidth:520,margin:'0 16px',padding:28,display:'flex',flexDirection:'column',gap:20 }}>
        <div>
          <h2 style={{ margin:0,fontSize:16,fontWeight:700,color:'var(--cenc-gray-900)' }}>{isEdit ? 'Editar Categoria' : 'Nova Categoria'}</h2>
          <p style={{ margin:'4px 0 0',fontSize:13,color:'var(--cenc-gray-500)' }}>Preencha os dados da categoria de produto.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Nome</label>
            <input style={fs(!!errors.name)} {...register('name')} autoFocus={!isEdit} />
            {errors.name && <p style={{ margin:0,fontSize:12,color:'var(--cenc-danger)' }}>{errors.name.message}</p>}
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Preço de compra (R$)</label>
            <input type="number" step="0.01" min="0.01" style={fs(!!errors.purchasePrice)} {...register('purchasePrice')} />
            {errors.purchasePrice && <p style={{ margin:0,fontSize:12,color:'var(--cenc-danger)' }}>{errors.purchasePrice.message}</p>}
            {purchasePriceDirty && (
              <div style={{ display:'flex',gap:8,alignItems:'flex-start',borderRadius:10,background:'#fffbeb',border:'1px solid #fde047',padding:'8px 12px',fontSize:12,color:'#92400e' }}>
                <span style={{ flexShrink:0 }}>⚠</span>
                Alterar o preço de compra afetará o cálculo de todas as rodadas futuras.
              </div>
            )}
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12 }}>
            {[{label:'Imposto (0–1)',key:'taxRate',err:errors.taxRate},{label:'Quebra (0–1)',key:'breakageRate',err:errors.breakageRate},{label:'Aging (0–1)',key:'agingRate',err:errors.agingRate}].map(({label,key,err}) => (
              <div key={key} style={{ display:'flex',flexDirection:'column',gap:6 }}>
                <label style={{ fontSize:12,fontWeight:600,color:'var(--cenc-gray-700)' }}>{label}</label>
                <input type="number" step="0.001" min="0" max="1" style={fs(!!err)} {...register(key as keyof ProductFormData)} />
                {err && <p style={{ margin:0,fontSize:11,color:'var(--cenc-danger)' }}>{err.message}</p>}
              </div>
            ))}
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Mix disponível (un.)</label>
            <input type="number" min="0" step="1" style={fs(!!errors.mixAvailable)} {...register('mixAvailable')} />
            {errors.mixAvailable && <p style={{ margin:0,fontSize:12,color:'var(--cenc-danger)' }}>{errors.mixAvailable.message}</p>}
          </div>
          {serverError && <div style={{ borderRadius:10,background:'var(--cenc-danger-bg)',border:'1px solid #fecaca',padding:'10px 14px',fontSize:13,color:'var(--cenc-danger)' }}>{serverError}</div>}
          <div style={{ display:'flex',gap:10,justifyContent:'flex-end',paddingTop:4 }}>
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>{isEdit ? 'Salvar alterações' : 'Criar Categoria'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ product, onConfirm, onCancel, loading, error }: { product: Product; onConfirm: () => void; onCancel: () => void; loading: boolean; error: string }) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.45)',backdropFilter:'blur(4px)' }}>
      <div style={{ background:'white',borderRadius:20,boxShadow:'0 24px 64px rgba(0,0,0,0.18)',border:'1px solid var(--cenc-gray-200)',width:'100%',maxWidth:440,margin:'0 16px',padding:28,display:'flex',flexDirection:'column',gap:20 }}>
        <div style={{ display:'flex',alignItems:'flex-start',gap:14 }}>
          <div style={{ width:44,height:44,borderRadius:12,flexShrink:0,background:'#fee2e2',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </div>
          <div>
            <h2 style={{ margin:0,fontSize:16,fontWeight:700,color:'var(--cenc-gray-900)' }}>Deletar "{product.name}"?</h2>
            <p style={{ margin:'6px 0 0',fontSize:13,color:'var(--cenc-gray-500)',lineHeight:1.5 }}>Esta ação removerá a categoria permanentemente e não pode ser desfeita.</p>
          </div>
        </div>
        {error && <div style={{ borderRadius:10,background:'var(--cenc-danger-bg)',border:'1px solid #fecaca',padding:'10px 14px',fontSize:13,color:'var(--cenc-danger)' }}>{error}</div>}
        <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button type="button" variant="danger" onClick={onConfirm} loading={loading}>Deletar</Button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsManagementPage() {
  usePageTitle("Gerenciar Produtos");
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
    fetch(`${API_BASE}/products`)
      .then(r => r.json())
      .then(data => setProducts(data.data ?? data ?? []))
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
      const res = await fetch(`${API_BASE}/products/${deleteProduct.id}`, { method: 'DELETE' });
      if (!res.ok) {
        if (res.status === 409) throw new Error('Esta categoria está em uso e não pode ser removida.');
        const err = await res.json();
        throw new Error(err.message ?? 'Erro ao deletar categoria');
      }
      setProducts((prev) => prev.filter((p) => p.id !== deleteProduct.id));
      setDeleteProduct(null);
      toast.success('Categoria removida.');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao deletar categoria');
    } finally {
      setDeletingProduct(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 24 }} className="page-enter">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--cenc-gray-900)' }}>Categorias de Produto</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--cenc-gray-500)' }}>Categorias disponíveis na simulação com suas taxas e preços.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}>Nova Categoria</Button>
      </div>

      <input type="text" placeholder="Buscar categoria por nome..." value={search} onChange={(e) => setSearch(e.target.value)}
        style={{ maxWidth: 320, borderRadius: 10, border: '1.5px solid var(--cenc-gray-300)', padding: '10px 14px', fontSize: 13, color: 'var(--cenc-gray-900)', background: 'white', outline: 'none', boxSizing: 'border-box' }} />

      {loading ? <Skeleton variant="table" rows={4} /> : loadError ? <ErrorMessage message={loadError} onRetry={loadProducts} /> : filtered.length === 0 ? (
        <div style={{ borderRadius: 14, border: '1px solid var(--cenc-gray-200)', background: 'white', padding: '48px 24px', textAlign: 'center' }}>
          {products.length === 0 ? (
            <><p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--cenc-gray-500)' }}>Nenhuma categoria cadastrada.</p><p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--cenc-gray-400)' }}>Crie a primeira categoria para começar.</p></>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--cenc-gray-400)' }}>Nenhuma categoria encontrada para "{search}".</p>
          )}
        </div>
      ) : (
        <div style={{ borderRadius: 14, border: '1px solid var(--cenc-gray-200)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--cenc-gray-50)', borderBottom: '1px solid var(--cenc-gray-200)' }}>
                {['Nome','Preço de Compra','Imposto','Quebra','Aging','Mix Disp.','Ações'].map((h, i) => (
                  <th key={h} style={{ padding: '12px 16px', fontWeight: 700, fontSize: 11, color: 'var(--cenc-gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="table-row-hover" style={{ borderTop: '1px solid var(--cenc-gray-100)', background: 'white' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--cenc-gray-800)' }}>{product.name}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--cenc-gray-600)' }}>{formatCurrency(product.purchasePrice)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--cenc-gray-600)' }}>{formatRate(product.taxRate)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--cenc-gray-600)' }}>{formatRate(product.breakageRate)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--cenc-gray-600)' }}>{formatRate(product.agingRate)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--cenc-gray-600)' }}>{product.mixAvailable.toLocaleString('pt-BR')}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <button onClick={() => setEditProduct(product)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--cenc-blue-600)', background: 'var(--cenc-blue-50)', border: '1px solid var(--cenc-blue-100)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--cenc-blue-100)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--cenc-blue-50)'; }}>Editar</button>
                      <button onClick={() => { setDeleteError(''); setDeleteProduct(product); }} style={{ fontSize: 12, fontWeight: 600, color: 'var(--cenc-danger)', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fecaca'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'; }}>Deletar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && products.length > 0 && (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--cenc-gray-400)' }}>
          {filtered.length === products.length ? `${products.length} categoria(s)` : `${filtered.length} de ${products.length} categoria(s)`}
        </p>
      )}
    </div>
  );
}
