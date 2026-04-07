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
  fixedExpenses: z.coerce.number({ invalid_type_error: 'Valor inválido' }).min(0, 'Não pode ser negativo'),
  variableExpenses: z.coerce.number({ invalid_type_error: 'Valor inválido' }).min(0, 'Não pode ser negativo'),
  items: z.array(
    z.object({
      productId: z.string(),
      salePrice: z.coerce
        .number({ invalid_type_error: 'Valor inválido' })
        .positive('Deve ser positivo'),
      salesVolume: z.coerce
        .number({ invalid_type_error: 'Valor inválido' })
        .int('Deve ser inteiro')
        .positive('Deve ser positivo'),
    })
  ).min(1),
});

function ProductRow({ index, product, availableQty, control, register, errors }) {
  const salePrice = useWatch({ control, name: `items.${index}.salePrice` });
  const salesVolume = useWatch({ control, name: `items.${index}.salesVolume` });

  const priceWarning = salePrice && Number(salePrice) < product.purchasePrice;
  const volumeWarning = salesVolume && Number(salesVolume) > availableQty;

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-start py-3 border-b border-gray-100 last:border-0">
      {/* Produto */}
      <div>
        <p className="text-sm font-medium text-gray-900">{product.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Custo: {formatCurrency(product.purchasePrice)}
        </p>
      </div>

      {/* Estoque */}
      <div className="text-right">
        <p className="text-xs text-gray-400 mb-1">Estoque</p>
        <p className="text-sm font-medium text-gray-700">{availableQty}</p>
      </div>

      {/* Preço de venda */}
      <div className="w-32">
        <label className="text-xs text-gray-500 mb-1 block">Preço venda (R$)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          className={`w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition
            ${priceWarning ? 'border-orange-400 bg-orange-50' : 'border-gray-300'}
            ${errors?.items?.[index]?.salePrice ? 'border-red-400 bg-red-50' : ''}`}
          {...register(`items.${index}.salePrice`)}
        />
        {priceWarning && (
          <p className="text-xs text-orange-600 mt-0.5">Abaixo do custo</p>
        )}
        {errors?.items?.[index]?.salePrice && (
          <p className="text-xs text-red-600 mt-0.5">
            {errors.items[index].salePrice.message}
          </p>
        )}
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
          <p className="text-xs text-red-600 mt-0.5">
            {errors.items[index].salesVolume.message}
          </p>
        )}
      </div>
    </div>
  );
}

export default function RoundConfigPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeRound, setActiveRound] = useState(null);
  const [store, setStore] = useState(null);
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
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fixedExpenses: 0, variableExpenses: 0, items: [] },
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
      setStore(s);
      setProducts(prods);
      reset({
        fixedExpenses: 0,
        variableExpenses: 0,
        items: prods.map((p) => ({
          productId: p.id,
          salePrice: p.salePrice,
          salesVolume: '',
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
    const values = getValues();
    try {
      const result = await roundService.previewSimulation({
        fixedExpenses: Number(values.fixedExpenses),
        variableExpenses: Number(values.variableExpenses),
        items: values.items.map((item) => ({
          productId: item.productId,
          salePrice: Number(item.salePrice),
          salesVolume: Number(item.salesVolume),
        })),
      });
      setPreview(result);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erro ao simular');
    }
  }

  async function onSubmit(data) {
    try {
      await roundService.submitConfig(activeRound.id, {
        fixedExpenses: Number(data.fixedExpenses),
        variableExpenses: Number(data.variableExpenses),
        items: data.items.map((item) => ({
          productId: item.productId,
          salePrice: Number(item.salePrice),
          salesVolume: Number(item.salesVolume),
        })),
      });
      toast.success('Estratégia enviada com sucesso!');
      setSubmitSuccess(true);
      setTimeout(() => navigate('/store'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erro ao enviar configuração');
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
          <p className="text-sm text-gray-500 mt-0.5">Defina sua estratégia para esta rodada.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {/* Despesas */}
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Despesas da Loja</h2>
            </div>
            <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Despesas Fixas R$</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition
                    ${errors.fixedExpenses ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  {...register('fixedExpenses')}
                />
                {errors.fixedExpenses && (
                  <span className="text-xs text-red-600">{errors.fixedExpenses.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Despesas Variáveis R$</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition
                    ${errors.variableExpenses ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  {...register('variableExpenses')}
                />
                {errors.variableExpenses && (
                  <span className="text-xs text-red-600">{errors.variableExpenses.message}</span>
                )}
              </div>
            </div>
          </div>

          {/* Produtos */}
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Configuração por Produto</h2>
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
