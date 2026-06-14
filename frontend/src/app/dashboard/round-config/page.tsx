'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/ui/Button';
import DREPreview from '@/components/DREPreview';
import Skeleton from '@/components/ui/Skeleton';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { roundConfigSchema } from '@/components/roundConfig/types';
import { OperatorsPanel } from '@/components/roundConfig/OperatorsPanel';
import { CapexPanel } from '@/components/roundConfig/CapexPanel';
import { LicensingPanel } from '@/components/roundConfig/LicensingPanel';
import { CashSummaryPanel } from '@/components/roundConfig/CashSummaryPanel';
import { ProductRow } from '@/components/roundConfig/ProductRow';
import { CountdownBadge } from '@/components/roundConfig/CountdownBadge';
import { apiFetch, authFetch, asArray } from '@/components/utils/api';
import type { Round, Store, Product, DREResult } from '@/components/types';
import type { FormData } from '@/components/roundConfig/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function RoundConfigPage() {
  const router = useRouter();
  const [activeRound,   setActiveRound]   = useState<Round | null>(null);
  const [store,         setStore]         = useState<Store | null>(null);
  const [inventoryMap,  setInventoryMap]  = useState<Record<string, number>>({});
  const [products,      setProducts]      = useState<Product[]>([]);
  const [previousCapex, setPreviousCapex] = useState<string[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [loadError,     setLoadError]     = useState('');
  const [preview,       setPreview]       = useState<DREResult | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isResubmit,    setIsResubmit]    = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { register, handleSubmit, control, getValues, trigger, reset, formState: { errors, isSubmitting } } = useForm<FormData, unknown, FormData>({
    resolver: zodResolver(roundConfigSchema) as never,
    defaultValues: {
      otherExpenses: 0, cashierOperators: 10, serviceOperators: 5, quizScore: 100,
      numPdvs: 6, capexSeguranca: false, capexBalanca: false, capexRedes: false,
      capexSite: false, capexSelfCheckout: false, capexMelhoria: false, items: [],
    },
  });

  function showToast(type: 'success' | 'error', text: string) {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  }

  async function load() {
    setLoadError('');
    try {
      const [roundsRes, storeRes, prodsRes] = await Promise.all([
        apiFetch<unknown>(`${API_BASE}/rounds`),
        apiFetch<unknown>(`${API_BASE}/stores/me`),
        apiFetch<unknown>(`${API_BASE}/products`),
      ]);

      if (roundsRes.error || storeRes.error || prodsRes.error) {
        const err = roundsRes.error || storeRes.error || prodsRes.error;
        setLoadError(err || 'Erro ao carregar dados');
        setLoading(false);
        return;
      }

      const roundsList = asArray<Round>(roundsRes.data);
      const open = roundsList.find((r: Round) => r.status === 'OPEN');
      setActiveRound(open ?? null);
      const prods = asArray<Product>(prodsRes.data);
      setProducts(prods);

      const s = storeRes.data as Store | null;
      if (s && s.id) {
        setStore(s);
        reset({
          otherExpenses: 0, cashierOperators: 10, serviceOperators: 5, quizScore: 100,
          numPdvs: 6, capexSeguranca: false, capexBalanca: false, capexRedes: false,
          capexSite: false, capexSelfCheckout: false, capexMelhoria: false,
          items: prods.map((p: Product) => ({ productId: p.id, margin: 12, salesVolume: open && open.number >= 3 ? 0 : 1 })),
        });
      }

      // Check for existing config (resubmission)
      if (open) {
        const configRes = await apiFetch<unknown>(`${API_BASE}/rounds/${open.id}/my-config`);
        if (configRes.data && !configRes.error) {
          const existingConfig = configRes.data as {
            otherExpenses: number; cashierOperators: number; serviceOperators: number;
            quizScore: number; numPdvs: number;
            capexSeguranca: boolean; capexBalanca: boolean; capexRedes: boolean;
            capexSite: boolean; capexSelfCheckout: boolean; capexMelhoria: boolean;
            roundConfigItems: Array<{ productId: string; margin: number; salesVolume: number }>;
          };
          setIsResubmit(true);
          reset({
            otherExpenses: Number(existingConfig.otherExpenses) || 0,
            cashierOperators: Number(existingConfig.cashierOperators) ?? 10,
            serviceOperators: Number(existingConfig.serviceOperators) ?? 5,
            quizScore: Math.round((Number(existingConfig.quizScore) || 1) * 100),
            numPdvs: Number(existingConfig.numPdvs) ?? 6,
            capexSeguranca: !!existingConfig.capexSeguranca,
            capexBalanca: !!existingConfig.capexBalanca,
            capexRedes: !!existingConfig.capexRedes,
            capexSite: !!existingConfig.capexSite,
            capexSelfCheckout: !!existingConfig.capexSelfCheckout,
            capexMelhoria: !!existingConfig.capexMelhoria,
            items: (existingConfig.roundConfigItems || []).map((item) => ({
              productId: item.productId,
              margin: Math.round(Number(item.margin) * 100),
              salesVolume: item.salesVolume,
            })),
          });
        }
      }

      if (s && s.id) {
        const invRes = await apiFetch<unknown>(`${API_BASE}/stores/${s.id}/inventory`);
        if (!invRes.error) {
          const inv = asArray<{ productId: string; quantity: number }>(invRes.data);
          setInventoryMap(Object.fromEntries(inv.map((i) => [i.productId, i.quantity])));
        }

        const capexRes = await apiFetch<unknown>(`${API_BASE}/stores/${s.id}/previous-capex`);
        if (!capexRes.error && capexRes.data) {
          setPreviousCapex(Array.isArray(capexRes.data) ? capexRes.data : []);
        }
      }
    } catch {
      setLoadError('Não foi possível carregar os dados da rodada.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function collectPayload(values: FormData) {
    return {
      otherExpenses:     Number(values.otherExpenses),
      cashierOperators:  Number(values.cashierOperators),
      serviceOperators:  Number(values.serviceOperators),
      quizScore:         Number(values.quizScore) / 100,
      numPdvs:           Number(values.numPdvs),
      capexSeguranca:    !!values.capexSeguranca,
      capexBalanca:      !!values.capexBalanca,
      capexRedes:        !!values.capexRedes,
      capexSite:         !!values.capexSite,
      capexSelfCheckout: !!values.capexSelfCheckout,
      capexMelhoria:     !!values.capexMelhoria,
      items: values.items.map((item) => ({
        productId:   item.productId,
        margin:      Number(item.margin) / 100,
        salesVolume: Number(item.salesVolume),
      })),
    };
  }

  async function handlePreview() {
    const isValid = await trigger();
    if (!isValid) return;
    try {
      const res = await authFetch(`${API_BASE}/rounds/${activeRound?.id}/preview`, {
        method: 'POST',
        body: JSON.stringify(collectPayload(getValues())),
      }).then(r => r.json());

      if (res.error) throw new Error(res.error.message || res.message);
      setPreview(res.data?.dre || res.dre);
    } catch (err: unknown) {
      const error = err as Error;
      showToast('error', error.message || 'Erro ao simular');
    }
  }

  async function onSubmit(data: FormData) {
    if (!activeRound) return;
    try {
      const res = await authFetch(`${API_BASE}/rounds/${activeRound.id}/config`, {
        method: 'POST',
        body: JSON.stringify(collectPayload(data)),
      }).then(r => r.json());

      if (res.error) throw new Error(res.error.message || res.message);
      showToast('success', isResubmit ? 'Estratégia reenviada com sucesso!' : 'Estratégia enviada com sucesso!');
      setSubmitSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: unknown) {
      const error = err as Error;
      showToast('error', error.message || 'Erro ao enviar configuração');
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl flex flex-col gap-4">
        <Skeleton variant="line" className="w-64 h-6" />
        <Skeleton variant="card" className="h-28" />
        <Skeleton variant="table" rows={5} />
      </div>
    );
  }

  if (loadError) {
    return <ErrorMessage message={loadError} onRetry={() => { setLoading(true); load(); }} />;
  }

  if (!activeRound) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--cenc-gray-300)] bg-[var(--cenc-surface)] px-6 py-12 text-center shadow-sm">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--cenc-blue-50)] text-[var(--cenc-blue-700)]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5" />
            <path d="M12 16h.01" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--cenc-gray-900)]">Configurar Rodada</h1>
        <p className="mt-2 max-w-lg text-sm text-[var(--cenc-gray-500)]">
          Nenhuma rodada aberta no momento. Esta tela só libera a configuração quando o Game Master inicia uma rodada com status aberta.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button type="button" variant="secondary" onClick={() => router.push('/dashboard')}>
            Voltar ao dashboard
          </Button>
          <Button type="button" onClick={() => { setLoading(true); load(); }}>
            Recarregar
          </Button>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <p className="text-green-600 font-semibold text-lg">Estratégia enviada com sucesso!</p>
        <p className="text-sm text-gray-400">Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 1000,
          padding: '12px 20px', borderRadius: 10,
          background: toastMsg.type === 'success' ? 'var(--cenc-success-bg)' : 'var(--cenc-danger-bg)',
          border: `1px solid ${toastMsg.type === 'success' ? 'rgba(22, 163, 74, 0.25)' : 'rgba(220, 38, 38, 0.25)'}`,
          color: toastMsg.type === 'success' ? 'var(--cenc-success)' : 'var(--cenc-danger)',
          fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {toastMsg.text}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Configurar Rodada #{activeRound.number}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Defina margem, volume, operadores, CAPEX e estratégia de caixa.</p>
        </div>
        {activeRound.endsAt && <CountdownBadge endsAt={activeRound.endsAt} />}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <OperatorsPanel register={register} errors={errors} control={control} />
        <CapexPanel register={register} control={control} previousCapex={previousCapex} />
        <LicensingPanel register={register} errors={errors} control={control} />

        {/* Outros gastos */}
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm px-5 py-4 flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">Outros Gastos (R$)</label>
          <input type="number" step="0.01" min="0"
            className={`w-full max-w-xs rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.otherExpenses ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            {...register('otherExpenses')} />
          {errors.otherExpenses && <p className="text-xs text-red-600 mt-0.5">{errors.otherExpenses.message}</p>}
          <p className="text-xs text-gray-400">Despesas adicionais não cobertas pelas categorias acima.</p>
        </div>

        {/* Produtos */}
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Estratégia por Categoria</h2>
            <p className="text-xs text-gray-400 mt-0.5">Defina margem e volume de vendas para cada categoria.</p>
          </div>
          {activeRound.number >= 3 && (
            <div className="mx-5 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-800">Sem novas compras a partir da rodada 3</p>
              <p className="text-xs text-amber-600 mt-0.5">Você vende apenas o estoque existente. Defina apenas a margem desejada.</p>
            </div>
          )}
          <div className="px-5 py-2">
            {products.map((product, index) => (
              <ProductRow
                key={product.id}
                index={index}
                product={product}
                availableQty={inventoryMap[product.id] ?? 0}
                control={control}
                register={register}
                errors={errors}
                purchaseDisabled={activeRound.number >= 3}
              />
            ))}
          </div>
        </div>

        {/* Validação de Caixa — última seção antes do envio */}
        {store && (
          <CashSummaryPanel
            initialCapital={store.initialCapital}
            currentCash={store.currentCash}
            products={products}
            control={control}
          />
        )}

        {/* Ações */}
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={handlePreview} className="flex-1">
            Simular
          </Button>
          <Button type="submit" loading={isSubmitting} className="flex-1">
            {isResubmit ? 'Reenviar Estratégia' : 'Enviar Estratégia'}
          </Button>
        </div>
      </form>

      {/* Preview DRE */}
      <DREPreview dre={preview} loading={false} />
    </div>
  );
}
