import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import storeService from '../services/storeService';
import roundService from '../services/roundService';
import PlayerLayout from '../components/layout/PlayerLayout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/formatters';
import { useCountdown } from '../hooks/useCountdown';
import type { Store, InventoryItem, Round, RoundStatus } from '../types';

const ROUND_STATUS_BADGE: Record<RoundStatus, { label: string; variant: string }> = {
  OPEN: { label: 'Aberta', variant: 'green' },
  PROCESSING: { label: 'Processando', variant: 'yellow' },
  CLOSED: { label: 'Encerrada', variant: 'gray' },
};

const createStoreSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  initialCapital: z.coerce
    .number({ invalid_type_error: 'Informe um valor numérico' })
    .positive('O capital deve ser positivo'),
});

type CreateStoreFormData = z.infer<typeof createStoreSchema>;

function RoundTimer({ endsAt }: { endsAt: string }) {
  const { timeLeft, expired } = useCountdown(endsAt);
  if (expired) {
    return (
      <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-center">
        <p className="text-xs text-orange-600 font-medium">Tempo esgotado — aguardando encerramento</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 flex items-center justify-between">
      <span className="text-xs text-blue-500 font-medium">Tempo restante</span>
      <span className="text-lg font-mono font-bold text-blue-700 tabular-nums">{timeLeft}</span>
    </div>
  );
}

export default function StoresDashboardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [store, setStore] = useState<Store | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [creating, setCreating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateStoreFormData>({ resolver: zodResolver(createStoreSchema) });

  async function load() {
    setLoadError('');
    try {
      const s = await storeService.getMyStore();
      setStore(s);
      const [inv, rounds] = await Promise.all([
        storeService.getInventory(s.id),
        roundService.getRounds(),
      ]);
      setInventory(inv);
      const open = rounds.find((r: Round) => r.status === 'OPEN' || r.status === 'PROCESSING');
      setActiveRound(open ?? null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 404) {
        setStore(null);
      } else {
        setLoadError('Não foi possível carregar os dados da loja.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onCreateStore(data: CreateStoreFormData) {
    try {
      const s = await storeService.createStore(data);
      setStore(s);
      setCreating(false);
      toast.success('Loja criada com sucesso!');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message ?? 'Erro ao criar loja');
    }
  }

  if (loading) {
    return (
      <PlayerLayout>
        <div className="max-w-4xl flex flex-col gap-4">
          <Skeleton variant="line" className="w-48 h-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </div>
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

  // Sem loja — exibir formulário de criação
  if (!store) {
    return (
      <PlayerLayout>
        <div className="max-w-sm mx-auto mt-12">
          <Card title="Criar sua loja">
            {!creating ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <p className="text-sm text-gray-500 text-center">
                  Seu squad ainda não possui uma loja. Crie uma para começar.
                </p>
                <Button onClick={() => setCreating(true)}>Criar Loja</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onCreateStore)} className="flex flex-col gap-4">
                <Input
                  label="Nome da loja"
                  placeholder="Ex: Supermercado Alpha"
                  error={errors.name?.message}
                  {...register('name')}
                />
                <Input
                  label="Capital inicial (R$)"
                  type="number"
                  step="0.01"
                  placeholder="10000.00"
                  error={errors.initialCapital?.message}
                  {...register('initialCapital')}
                />
                <div className="flex gap-2 mt-1">
                  <Button type="submit" loading={isSubmitting} className="flex-1">
                    Criar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setCreating(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </PlayerLayout>
    );
  }

  const roundBadge = activeRound ? ROUND_STATUS_BADGE[activeRound.status] : null;

  return (
    <PlayerLayout>
      <div className="flex flex-col gap-6 max-w-4xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Capital inicial: {formatCurrency(store.initialCapital)}
            </p>
          </div>
          {/* Caixa atual */}
          <div className={`rounded-xl border px-5 py-3 text-right
            ${store.currentCash >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Caixa Atual</p>
            <p className={`text-2xl font-bold mt-0.5
              ${store.currentCash >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {formatCurrency(store.currentCash ?? store.initialCapital)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {(((store.currentCash ?? store.initialCapital) / store.initialCapital) * 100).toFixed(1)}% do capital inicial
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card — Rodada atual */}
          <Card title="Rodada atual">
            {activeRound ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Rodada #{activeRound.number}
                  </span>
                  {roundBadge && (
                    <Badge variant={roundBadge.variant}>{roundBadge.label}</Badge>
                  )}
                </div>
                {activeRound.status === 'OPEN' && activeRound.endsAt && (
                  <RoundTimer endsAt={activeRound.endsAt} />
                )}
                <Button
                  onClick={() => navigate('/store/round')}
                  disabled={activeRound.status !== 'OPEN'}
                  className="w-full"
                >
                  Configurar Rodada
                </Button>
                {activeRound.status !== 'OPEN' && (
                  <p className="text-xs text-gray-400 text-center">
                    Configuração disponível somente em rodadas abertas
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Nenhuma rodada ativa no momento.</p>
            )}
          </Card>

          {/* Card — Resumo do estoque */}
          <Card title="Estoque disponível">
            {inventory.length === 0 ? (
              <p className="text-sm text-gray-400">Estoque não disponível.</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                      <th className="pb-2 font-medium">Categoria</th>
                      <th className="pb-2 font-medium text-right">Qtd.</th>
                      <th className="pb-2 font-medium text-right">Disp.</th>
                      <th className="pb-2 font-medium text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => {
                      const pct = item.product.mixAvailable > 0
                        ? ((item.quantity / item.product.mixAvailable) * 100).toFixed(0)
                        : '—';
                      const val = item.quantity * item.product.purchasePrice;
                      return (
                        <tr key={item.productId} className="border-b border-gray-50 last:border-0">
                          <td className="py-2 text-gray-700">{item.product.name}</td>
                          <td className="py-2 text-right font-medium text-gray-900">{item.quantity}</td>
                          <td className="py-2 text-right text-gray-500 text-xs">{pct}%</td>
                          <td className="py-2 text-right text-gray-500 text-xs">
                            {formatCurrency(val)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PlayerLayout>
  );
}
