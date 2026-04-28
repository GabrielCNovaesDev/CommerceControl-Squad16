import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import roundService from '../services/roundService';
import storeService from '../services/storeService';
import productService from '../services/productService';
import PlayerLayout from '../components/layout/PlayerLayout';
import Button from '../components/ui/Button';
import DREPreview from '../components/DREPreview';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/formatters';

// ─── Zod schema ─────────────────────────────────────────────────────────────

const schema = z.object({
  otherExpenses: z.coerce.number({ invalid_type_error: 'Valor inválido' }).min(0, 'Não pode ser negativo'),
  cashierOperators: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .int('Deve ser inteiro')
    .min(0, 'Mínimo 0'),
  serviceOperators: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .int('Deve ser inteiro')
    .min(0, 'Mínimo 0'),
  quizScore: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .min(0, 'Mínimo 0%')
    .max(1, 'Máximo 100%'),
  items: z.array(
    z.object({
      productId: z.string(),
      margin: z.coerce
        .number({ invalid_type_error: 'Valor inválido' })
        .min(0, 'Não pode ser negativo'),
      salesVolume: z.coerce
        .number({ invalid_type_error: 'Valor inválido' })
        .int('Deve ser inteiro')
        .positive('Deve ser positivo'),
    })
  ).min(1),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcSalePrice(purchasePrice, margin, taxRate) {
  if (taxRate >= 1) return purchasePrice * (1 + margin);
  return (purchasePrice * (1 + margin)) / (1 - taxRate);
}

const IDEAL_CASHIER  = 10;
const CASHIER_COST   = 1000;  // R$/month
const SERVICE_COST   = 1200;  // R$/month

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function FieldError({ error }) {
  if (!error) return null;
  return <p className="text-xs text-red-600 mt-0.5">{error.message}</p>;
}

function CashSummaryPanel({ initialCapital, stockCost, payroll, products, items, control }) {
  // Live calculation as the user changes volumes
  const watchedItems = useWatch({ control, name: 'items' });

  const liveStockCost = (watchedItems ?? items).reduce((sum, item, idx) => {
    const product = products[idx];
    if (!product) return sum;
    return sum + (Number(item.salesVolume) || 0) * product.purchasePrice;
  }, 0);

  const balance = initialCapital - liveStockCost;
  const isOver  = liveStockCost > initialCapital;
  const interest = isOver ? (liveStockCost - initialCapital) * 0.12 : 0;

  return (
    <div className={`rounded-xl border shadow-sm px-5 py-4 flex flex-col gap-3
      ${isOver ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Validação de Caixa</h2>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
          ${isOver ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {isOver ? 'Revisar Caixa' : 'Caixa OK'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Capital disponível</span>
          <span className="font-medium text-gray-800">{formatCurrency(initialCapital)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Custo do estoque</span>
          <span className={`font-medium ${isOver ? 'text-red-700' : 'text-gray-800'}`}>
            {formatCurrency(liveStockCost)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Folha de pagamento</span>
          <span className="font-medium text-gray-800">{formatCurrency(payroll)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Saldo após estoque</span>
          <span className={`font-semibold ${isOver ? 'text-red-700' : 'text-green-700'}`}>
            {formatCurrency(balance)}
          </span>
        </div>
        {isOver && (
          <div className="col-span-2 flex justify-between border-t border-red-200 pt-2 mt-1">
            <span className="text-red-600 text-xs">Juros sobre excesso (12%/mês)</span>
            <span className="text-red-700 font-semibold text-xs">{formatCurrency(interest)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function OperatorsPanel({ register, errors, control }) {
  const cashierOps = Number(useWatch({ control, name: 'cashierOperators' })) || 0;
  const quizScore  = Number(useWatch({ control, name: 'quizScore' }))        || 0;

  const csatPct    = (Math.min(1, cashierOps / IDEAL_CASHIER) * quizScore * 100).toFixed(1);
  const payroll    = cashierOps * CASHIER_COST +
                     (Number(useWatch({ control, name: 'serviceOperators' })) || 0) * SERVICE_COST;

  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Operadores e CSAT</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          CSAT = min(1, Operadores&nbsp;Caixa / 10) × Resultado&nbsp;Teste
        </p>
      </div>
      <div className="px-5 py-4 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Operadores de Caixa */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Operadores de Caixa
            </label>
            <input
              type="number"
              min="0"
              className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition
                ${errors.cashierOperators ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              {...register('cashierOperators')}
            />
            <FieldError error={errors.cashierOperators} />
            <p className="text-xs text-gray-400">Ideal: {IDEAL_CASHIER} · {formatCurrency(CASHIER_COST)}/mês cada</p>
          </div>

          {/* Operadores de Serviço */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Operadores de Serviço
            </label>
            <input
              type="number"
              min="0"
              className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition
                ${errors.serviceOperators ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              {...register('serviceOperators')}
            />
            <FieldError error={errors.serviceOperators} />
            <p className="text-xs text-gray-400">Ideal: 5 · {formatCurrency(SERVICE_COST)}/mês cada</p>
          </div>

          {/* Resultado do Teste */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Resultado do Teste (0–1)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition
                ${errors.quizScore ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              {...register('quizScore')}
            />
            <FieldError error={errors.quizScore} />
            <p className="text-xs text-gray-400">Percentual de acertos: ex. 0.9 = 90%</p>
          </div>
        </div>

        {/* CSAT Preview */}
        <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">CSAT Estimado</p>
            <p className="text-2xl font-bold text-blue-800 mt-0.5">{csatPct}%</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-600">Folha de pagamento</p>
            <p className="text-base font-semibold text-blue-800">{formatCurrency(payroll)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductRow({ index, product, availableQty, control, register, errors }) {
  const margin      = useWatch({ control, name: `items.${index}.margin` });
  const salesVolume = useWatch({ control, name: `items.${index}.salesVolume` });

  register(`items.${index}.productId`);

  const marginNum    = Number(margin) || 0;
  const salePrice    = calcSalePrice(product.purchasePrice, marginNum, product.taxRate);
  const volumeNum    = Number(salesVolume) || 0;
  const stockCostRow = volumeNum * product.purchasePrice;
  const volumeWarning = volumeNum > availableQty && availableQty > 0;

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-start py-3 border-b border-gray-100 last:border-0">
      {/* Produto */}
      <div>
        <p className="text-sm font-medium text-gray-900">{product.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Custo: {formatCurrency(product.purchasePrice)} · Imposto: {(product.taxRate * 100).toFixed(0)}%
        </p>
        <p className="text-xs text-gray-400">
          Custo do estoque: <span className="font-medium text-gray-600">{formatCurrency(stockCostRow)}</span>
        </p>
      </div>

      {/* Estoque */}
      <div className="text-right">
        <p className="text-xs text-gray-400 mb-1">Estoque</p>
        <p className="text-sm font-medium text-gray-700">{availableQty}</p>
      </div>

      {/* Margem */}
      <div className="w-32">
        <label className="text-xs text-gray-500 mb-1 block">Margem (%)</label>
        <input
          type="number"
          step="0.1"
          min="0"
          className={`w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition
            ${errors?.items?.[index]?.margin ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
          {...register(`items.${index}.margin`)}
        />
        {errors?.items?.[index]?.margin && (
          <p className="text-xs text-red-600 mt-0.5">{errors.items[index].margin.message}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">
          Preço: {formatCurrency(salePrice)}
        </p>
      </div>

      {/* Volume */}
      <div className="w-28">
        <label className="text-xs text-gray-500 mb-1 block">Volume (un.)</label>
        <input
          type="number"
          min="1"
          className={`w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition
            ${volumeWarning ? 'border-orange-400 bg-orange-50' : 'border-gray-300'}
            ${errors?.items?.[index]?.salesVolume ? 'border-red-400 bg-red-50' : ''}`}
          {...register(`items.${index}.salesVolume`)}
        />
        {volumeWarning && (
          <p className="text-xs text-orange-600 mt-0.5">Acima do estoque</p>
        )}
        {errors?.items?.[index]?.salesVolume && (
          <p className="text-xs text-red-600 mt-0.5">{errors.items[index].salesVolume.message}</p>
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function RoundConfigPage() {
  const navigate = useNavigate();
  const toast    = useToast();

  const [activeRound,  setActiveRound]  = useState(null);
  const [store,        setStore]        = useState(null);
  const [inventoryMap, setInventoryMap] = useState({});
  const [products,     setProducts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState('');
  const [preview,      setPreview]      = useState(null);
  const [submitSuccess,setSubmitSuccess]= useState(false);

  const {
    register,
    handleSubmit,
    control,
    getValues,
    trigger,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      otherExpenses:    0,
      cashierOperators: 10,
      serviceOperators: 5,
      quizScore:        1.0,
      items: [],
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

      const open = rounds.find((r) => r.status === 'OPEN');
      setActiveRound(open ?? null);
      setProducts(prods);
      setStore(s);

      reset({
        otherExpenses:    0,
        cashierOperators: 10,
        serviceOperators: 5,
        quizScore:        1.0,
        items: prods.map((p) => ({
          productId:   p.id,
          margin:      0.12,
          salesVolume: 1,
        })),
      });

      if (s) {
        const inv = await storeService.getInventory(s.id);
        const map = Object.fromEntries(inv.map((i) => [i.productId, i.quantity]));
        setInventoryMap(map);
      }
    } catch {
      setLoadError('Não foi possível carregar os dados da rodada.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handlePreview() {
    const isValid = await trigger();
    if (!isValid) return;
    const values = getValues();
    try {
      const result = await roundService.previewSimulation({
        otherExpenses:    Number(values.otherExpenses),
        cashierOperators: Number(values.cashierOperators),
        serviceOperators: Number(values.serviceOperators),
        quizScore:        Number(values.quizScore),
        items: values.items.map((item) => ({
          productId:   item.productId,
          margin:      Number(item.margin),
          salesVolume: Number(item.salesVolume),
        })),
      });
      setPreview(result);
    } catch (err) {
      toast.error(err.response?.data?.message ?? err.response?.data?.error ?? 'Erro ao simular');
    }
  }

  async function onSubmit(data) {
    try {
      await roundService.submitConfig(activeRound.id, {
        otherExpenses:    Number(data.otherExpenses),
        cashierOperators: Number(data.cashierOperators),
        serviceOperators: Number(data.serviceOperators),
        quizScore:        Number(data.quizScore),
        items: data.items.map((item) => ({
          productId:   item.productId,
          margin:      Number(item.margin),
          salesVolume: Number(item.salesVolume),
        })),
      });
      toast.success('Estratégia enviada com sucesso!');
      setSubmitSuccess(true);
      setTimeout(() => navigate('/store'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message ?? err.response?.data?.error ?? 'Erro ao enviar configuração');
    }
  }

  // ── Loading / Error / Empty states ──────────────────────────────────────────

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

  // ── Payroll computed for cash panel (non-reactive, passed as baseline) ──────
  const watchedOps = getValues('cashierOperators') || 10;
  const watchedSvc = getValues('serviceOperators') || 5;
  const payrollBaseline = (Number(watchedOps) || 10) * CASHIER_COST +
                          (Number(watchedSvc) || 5) * SERVICE_COST;

  return (
    <PlayerLayout>
      <div className="max-w-3xl flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Configurar Rodada #{activeRound.number}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Defina margem, volume, operadores e estratégia de caixa.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

          {/* Operadores e CSAT */}
          <OperatorsPanel register={register} errors={errors} control={control} />

          {/* Validação de Caixa */}
          {store && (
            <CashSummaryPanel
              initialCapital={store.initialCapital}
              stockCost={0}
              payroll={payrollBaseline}
              products={products}
              items={[]}
              control={control}
            />
          )}

          {/* Outros gastos */}
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Outros Gastos da Loja</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Manutenção, licenças, CAPEX e demais despesas adicionais.
                Folha de pagamento é calculada automaticamente com base nos operadores.
              </p>
            </div>
            <div className="px-5 py-4">
              <div className="flex flex-col gap-1 max-w-xs">
                <label className="text-sm font-medium text-gray-700">Outros Gastos (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition
                    ${errors.otherExpenses ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  {...register('otherExpenses')}
                />
                {errors.otherExpenses && (
                  <span className="text-xs text-red-600">{errors.otherExpenses.message}</span>
                )}
              </div>
            </div>
          </div>

          {/* Produtos */}
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Margem e Volume por Categoria</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Preço de venda: Custo × (1 + Margem) / (1 − Imposto)
              </p>
            </div>
            <div className="px-5">
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

          {/* Preview DRE */}
          {preview && (
            <>
              {preview.cashSummary && (
                <div className={`rounded-xl border px-5 py-4 flex flex-col gap-2
                  ${preview.cashSummary.cashOk ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">Resumo Financeiro (Simulação)</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                      ${preview.cashSummary.cashOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {preview.cashSummary.cashOk ? 'Caixa OK' : 'Revisar Caixa'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm mt-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Custo estoque</span>
                      <span className="font-medium">{formatCurrency(preview.cashSummary.stockCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Folha</span>
                      <span className="font-medium">{formatCurrency(preview.cashSummary.payroll)}</span>
                    </div>
                    {preview.cashSummary.interestPenalty > 0 && (
                      <div className="flex justify-between col-span-2 text-red-700">
                        <span>Juros sobre excesso de caixa (12%)</span>
                        <span className="font-semibold">{formatCurrency(preview.cashSummary.interestPenalty)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">CSAT</span>
                      <span className="font-medium text-blue-700">
                        {(preview.cashSummary.csat * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Saldo após estoque</span>
                      <span className={`font-semibold ${preview.cashSummary.cashOk ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency(preview.cashSummary.balance)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <DREPreview
                dre={preview.dre}
                feedbacks={preview.feedbacks}
              />
            </>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={handlePreview}>
              Simular
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Confirmar Estratégia
            </Button>
          </div>
        </form>
      </div>
    </PlayerLayout>
  );
}
