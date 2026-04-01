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
import { formatCurrency } from '../utils/formatters';

const ROUND_STATUS_BADGE = {
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

export default function StoresDashboardPage() {
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [activeRound, setActiveRound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(createStoreSchema) });

  useEffect(() => {
    async function load() {
      try {
        const s = await storeService.getMyStore();
        setStore(s);
        const [inv, rounds] = await Promise.all([
          storeService.getInventory(s.id),
          roundService.getRounds(),
        ]);
        setInventory(inv);
        const open = rounds.find((r) => r.status === 'OPEN' || r.status === 'PROCESSING');
        setActiveRound(open ?? null);
      } catch (err) {
        if (err.response?.status === 404) {
          setStore(null);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function onCreateStore(data) {
    setCreateError('');
    try {
      const s = await storeService.createStore(data);
      setStore(s);
      setCreating(false);
    } catch (err) {
      setCreateError(err.response?.data?.message ?? 'Erro ao criar loja');
    }
  }

  if (loading) {
    return (
      <PlayerLayout>
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
          Carregando...
        </div>
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
                {createError && (
                  <p className="text-xs text-red-600">{createError}</p>
                )}
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
        <div>
          <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Capital inicial: {formatCurrency(store.initialCapital)}
          </p>
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
                      <th className="pb-2 font-medium">Produto</th>
                      <th className="pb-2 font-medium text-right">Qtd.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => (
                      <tr
                        key={item.productId}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="py-2 text-gray-700">{item.product.name}</td>
                        <td className="py-2 text-right font-medium text-gray-900">
                          {item.quantity}
                        </td>
                      </tr>
                    ))}
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
