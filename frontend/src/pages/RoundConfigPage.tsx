import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import roundService from '../services/roundService';
import storeService from '../services/storeService';
import productService from '../services/productService';
import PlayerLayout from '../components/layout/PlayerLayout';
import Button from '../components/ui/Button';
import DREPreview from '../components/DREPreview';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import { useToast } from '../hooks/useToast';
import { roundConfigSchema } from '../components/roundConfig/types';
import { OperatorsPanel } from '../components/roundConfig/OperatorsPanel';
import { CapexPanel } from '../components/roundConfig/CapexPanel';
import { LicensingPanel } from '../components/roundConfig/LicensingPanel';
import { CashSummaryPanel } from '../components/roundConfig/CashSummaryPanel';
import { ProductRow } from '../components/roundConfig/ProductRow';
import { CountdownBadge } from '../components/roundConfig/CountdownBadge';
import type { Round, Store, Product, DREResult } from '../types';
import type { FormData } from '../components/roundConfig/types';

export default function RoundConfigPage() {
  const navigate = useNavigate();
  const toast    = useToast();

  const [activeRound,   setActiveRound]   = useState<Round | null>(null);
  const [store,         setStore]         = useState<Store | null>(null);
  const [inventoryMap,  setInventoryMap]  = useState<Record<string, number>>({});
  const [products,      setProducts]      = useState<Product[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [loadError,     setLoadError]     = useState('');
  const [preview,       setPreview]       = useState<DREResult | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { register, handleSubmit, control, getValues, trigger, reset, formState: { errors, isSubmitting } } = useForm<FormData, unknown, FormData>({
    resolver: zodResolver(roundConfigSchema) as never,
    defaultValues: {
      otherExpenses: 0, cashierOperators: 10, serviceOperators: 5, quizScore: 1.0,
      numPdvs: 6, capexSeguranca: false, capexBalanca: false, capexRedes: false,
      capexSite: false, capexSelfCheckout: false, capexMelhoria: false, items: [],
    },
  });

  async function load() {
    setLoadError('');
    try {
      const [rounds, s, prods] = await Promise.all([
        roundService.getRounds(),
        storeService.getMyStore(),
        productService.getProducts(),
      ]);
      const open = (Array.isArray(rounds) ? rounds : (rounds as { content?: Round[] }).content ?? [])
        .find((r: Round) => r.status === 'OPEN');
      setActiveRound(open ?? null);
      setProducts(Array.isArray(prods) ? prods : (prods as { content?: Product[] }).content ?? []);
      setStore(s);
      reset({
        otherExpenses: 0, cashierOperators: 10, serviceOperators: 5, quizScore: 1.0,
        numPdvs: 6, capexSeguranca: false, capexBalanca: false, capexRedes: false,
        capexSite: false, capexSelfCheckout: false, capexMelhoria: false,
        items: (Array.isArray(prods) ? prods : (prods as { content?: Product[] }).content ?? [])
          .map((p: Product) => ({ productId: p.id, margin: 0.12, salesVolume: 1 })),
      });
      if (s) {
        const inv = await storeService.getInventory(s.id);
        setInventoryMap(Object.fromEntries(inv.map((i: { productId: string; quantity: number }) => [i.productId, i.quantity])));
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
      quizScore:         Number(values.quizScore),
      numPdvs:           Number(values.numPdvs),
      capexSeguranca:    !!values.capexSeguranca,
      capexBalanca:      !!values.capexBalanca,
      capexRedes:        !!values.capexRedes,
      capexSite:         !!values.capexSite,
      capexSelfCheckout: !!values.capexSelfCheckout,
      capexMelhoria:     !!values.capexMelhoria,
      items: values.items.map((item) => ({
        productId:   item.productId,
        margin:      Number(item.margin),
        salesVolume: Number(item.salesVolume),
      })),
    };
  }

  async function handlePreview() {
    const isValid = await trigger();
    if (!isValid) return;
    try {
      const result = await roundService.previewSimulation(collectPayload(getValues()));
      setPreview(result.dre);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
      toast.error(axiosErr.response?.data?.error?.message ?? axiosErr.response?.data?.message ?? 'Erro ao simular');
    }
  }

  async function onSubmit(data: FormData) {
    if (!activeRound) return;
    try {
      await roundService.submitConfig(activeRound.id, collectPayload(data));
      toast.success('Estratégia enviada com sucesso!');
      setSubmitSuccess(true);
      setTimeout(() => navigate('/store'), 1500);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
      toast.error(axiosErr.response?.data?.error?.message ?? axiosErr.response?.data?.message ?? 'Erro ao enviar configuração');
    }
  }

  if (loading) {
    return (
      <PlayerLayout>
        <div className="max-w-3xl flex flex-col gap-4">
          <Skeleton variant="line" className="w-64 h-6" />
          <Skeleton variant="card" className="h-28" />
          <Skeleton variant="table" rows={5} />
        </div>
      </PlayerLayout>
    );
  }

  if (loadError) {
    return (
      <PlayerLayout>
        <ErrorMessage message={loadError} onRetry={() => { setLoading(true); load(); }} />
      </PlayerLayout>
    );
  }

  if (!activeRound) {
    return (
      <PlayerLayout>
        <div className="flex flex-col items-center justify-center h-40 gap-2">
          <p className="text-gray-500 font-medium">Nenhuma rodada aberta no momento.</p>
          <p className="text-sm text-gray-400">Aguarde o Game Master iniciar uma nova rodada.</p>
        </div>
      </PlayerLayout>
    );
  }

  if (submitSuccess) {
    return (
      <PlayerLayout>
        <div className="flex flex-col items-center justify-center h-40 gap-2">
          <p className="text-green-600 font-semibold text-lg">Estratégia enviada com sucesso!</p>
          <p className="text-sm text-gray-400">Redirecionando...</p>
        </div>
      </PlayerLayout>
    );
  }

  return (
    <PlayerLayout>
      <div className="max-w-3xl flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Configurar Rodada #{activeRound.number}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Defina margem, volume, operadores, CAPEX e estratégia de caixa.</p>
          </div>
          {activeRound.endsAt && <CountdownBadge endsAt={activeRound.endsAt} />}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <OperatorsPanel register={register} errors={errors} control={control} />
          <CapexPanel register={register} control={control} />
          <LicensingPanel register={register} errors={errors} control={control} />

          {store && (
            <CashSummaryPanel
              initialCapital={store.initialCapital}
              currentCash={store.currentCash}
              products={products}
              control={control}
            />
          )}

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
                />
              ))}
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={handlePreview} className="flex-1">
              Simular
            </Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">
              Enviar Estratégia
            </Button>
          </div>
        </form>

        {/* Preview DRE */}
        <DREPreview dre={preview} loading={false} />
      </div>
    </PlayerLayout>
  );
}
