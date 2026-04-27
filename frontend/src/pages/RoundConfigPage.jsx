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

const schema = z.object({
  otherExpenses: z.coerce.number({ invalid_type_error: 'Valor inválido' }).min(0, 'Não pode ser negativo'),
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

function calcSalePrice(purchasePrice, margin, taxRate) {
  if (taxRate >= 1) return purchasePrice * (1 + margin);
  return (purchasePrice * (1 + margin)) / (1 - taxRate);
}

function ProductRow({ index, product, availableQty, control, register, errors }) {
  const margin = useWatch({ control, name: `items.${index}.margin` });
  const salesVolume = useWatch({ control, name: `items.${index}.salesVolume` });

  register(`items.${index}.productId`);

  const marginNum = Number(margin) || 0;
  const salePrice = calcSalePrice(product.purchasePrice, marginNum, product.taxRate);
  const volumeWarning = salesVolume && Number(salesVolume) > availableQty;

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-start py-3 border-b border-gray-100 last:border-0">
      {/* Produto */}
      <div>
        <p className="text-sm font-medium text-gray-900">{product.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Custo: {formatCurrency(product.purchasePrice)} · Imposto: {(product.taxRate * 100).toFixed(0)}%
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

export default function RoundConfigPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeRound, setActiveRound] = useState(null);

  const [inventoryMap, setInventoryMap] = useState({});
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [preview, setPreview] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
    defaultValues: { otherExpenses: 0, items: [] },
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
      reset({
        otherExpenses: 0,
        items: prods.map((p) => ({
          productId: p.id,
          margin: 0.12,
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
        otherExpenses: Number(values.otherExpenses),
        items: values.items.map((item) => ({
          productId: item.productId,
          margin: Number(item.margin),
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
        otherExpenses: Number(data.otherExpenses),
        items: data.items.map((item) => ({
          productId: item.productId,
          margin: Number(item.margin),
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
        <div>
          <h1 className="text-xl font-bold text-gray-900">Configurar Rodada #{activeRound.number}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Defina margem e volume de vendas por categoria.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {/* Outros gastos */}
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Outros Gastos da Loja</h2>
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
                <p className="text-xs text-gray-400 mt-0.5">
                  Folha, manutenção, licenças, juros e demais despesas operacionais.
                </p>
              </div>
            </div>
          </div>

          {/* Produtos */}
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Margem e Volume por Categoria</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                O preço de venda é calculado automaticamente: Custo × (1 + Margem) / (1 − Imposto)
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
            <DREPreview
              dre={preview.dre}
              feedbacks={preview.feedbacks}
            />
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
