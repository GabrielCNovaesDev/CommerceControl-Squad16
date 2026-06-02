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
import usePageTitle from "../hooks/usePageTitle";

export default function RoundConfigPage() {
  usePageTitle("Configurar Rodada");
  const navigate = useNavigate();
  const toast    = useToast();

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

  const { register, handleSubmit, control, getValues, trigger, reset, formState: { errors, isSubmitting } } = useForm<FormData, unknown, FormData>({
    resolver: zodResolver(roundConfigSchema) as never,
    defaultValues: {
      otherExpenses: 0, cashierOperators: 10, serviceOperators: 5, quizScore: 100,
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
      const roundsList = Array.isArray(rounds)
        ? rounds
        : Array.isArray((rounds as { content?: Round[] } | null)?.content)
          ? (rounds as { content?: Round[] }).content ?? []
          : [];

      const open = roundsList
        .find((r: Round) => r.status === 'OPEN');
      setActiveRound(open ?? null);
      setProducts(Array.isArray(prods) ? prods : []);
      setStore(s);
      reset({
        otherExpenses: 0, cashierOperators: 10, serviceOperators: 5, quizScore: 100,
        numPdvs: 6, capexSeguranca: false, capexBalanca: false, capexRedes: false,
        capexSite: false, capexSelfCheckout: false, capexMelhoria: false,
        items: (Array.isArray(prods) ? prods : [])
          .map((p: Product) => ({ productId: p.id, margin: 12, salesVolume: open && open.number >= 3 ? 0 : 1 })),
      });

      // Check for existing config (resubmission)
      if (open) {
        try {
          const existingConfig = await roundService.getMyConfig(open.id) as {
            otherExpenses: number;
            cashierOperators: number;
            serviceOperators: number;
            quizScore: number;
            numPdvs: number;
            capexSeguranca: boolean;
            capexBalanca: boolean;
            capexRedes: boolean;
            capexSite: boolean;
            capexSelfCheckout: boolean;
            capexMelhoria: boolean;
            roundConfigItems: Array<{ productId: string; margin: number; salesVolume: number }>;
          } | null;
          if (existingConfig) {
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
              items: existingConfig.roundConfigItems.map((item) => ({
                productId: item.productId,
                margin: Math.round(Number(item.margin) * 100),
                salesVolume: item.salesVolume,
              })),
            });
          }
        } catch {
          // No existing config — first submission
        }
      }
      if (s) {
        const inv = await storeService.getInventory(s.id);
        setInventoryMap(Object.fromEntries(inv.map((i: { productId: string; quantity: number }) => [i.productId, i.quantity])));
        try {
          const prevCapex = await storeService.getPreviousCapex();
          setPreviousCapex(prevCapex);
        } catch {
          // Non-critical — continue without previous capex info
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
      toast.success(isResubmit ? 'Estratégia reenviada com sucesso!' : 'Estratégia enviada com sucesso!');
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
            <Button type="button" variant="secondary" onClick={() => navigate('/store')}>
              Voltar ao dashboard
            </Button>
            <Button type="button" onClick={() => { setLoading(true); load(); }}>
              Recarregar
            </Button>
          </div>
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
    </PlayerLayout>
  );
}
