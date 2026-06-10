'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  purchasePrice: string;
}

interface RoundConfigItem {
  productId: string;
  margin: string;
  salesVolume: number;
}

interface ExistingConfig {
  id: string;
  otherExpenses: string;
  cashierOperators: number;
  serviceOperators: number;
  quizScore: string;
  numPdvs: number;
  capexSeguranca: boolean;
  capexBalanca: boolean;
  capexRedes: boolean;
  capexSite: boolean;
  capexSelfCheckout: boolean;
  capexMelhoria: boolean;
  roundConfigItems: RoundConfigItem[];
}

export default function RoundConfigPage() {
  const router = useRouter();
  const [activeRound, setActiveRound] = useState<{ id: string; number: number; endsAt: string } | null>(null);
  const [store, setStore] = useState<{ id: string; name: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingConfig, setExistingConfig] = useState<ExistingConfig | null>(null);

  // Form state
  const [otherExpenses, setOtherExpenses] = useState('0');
  const [cashierOperators, setCashierOperators] = useState('10');
  const [serviceOperators, setServiceOperators] = useState('5');
  const [quizScore, setQuizScore] = useState('1.0');
  const [numPdvs, setNumPdvs] = useState('6');
  const [capexOptions, setCapexOptions] = useState({
    capexSeguranca: false,
    capexBalanca: false,
    capexRedes: false,
    capexSite: false,
    capexSelfCheckout: false,
    capexMelhoria: false,
  });
  const [productConfigs, setProductConfigs] = useState<Record<string, { margin: string; salesVolume: string }>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get active round
      const roundsRes = await api.get('/rounds');
      const active = roundsRes.data.data?.find((r: { status: string }) => r.status === 'OPEN');
      if (!active) {
        setLoading(false);
        return;
      }
      setActiveRound(active);

      // Get player store
      const storeRes = await api.get('/stores/my');
      if (storeRes.data.data) {
        setStore(storeRes.data.data);
      }

      // Get products
      const productsRes = await api.get('/products');
      setProducts(productsRes.data.data || []);

      // Get existing config
      try {
        const configRes = await api.get(`/rounds/${active.id}/my-config`);
        if (configRes.data.data) {
          setExistingConfig(configRes.data.data);
          // Populate form with existing config
          setOtherExpenses(configRes.data.data.otherExpenses);
          setCashierOperators(configRes.data.data.cashierOperators.toString());
          setServiceOperators(configRes.data.data.serviceOperators.toString());
          setQuizScore(configRes.data.data.quizScore);
          setNumPdvs(configRes.data.data.numPdvs.toString());
          setCapexOptions({
            capexSeguranca: configRes.data.data.capexSeguranca,
            capexBalanca: configRes.data.data.capexBalanca,
            capexRedes: configRes.data.data.capexRedes,
            capexSite: configRes.data.data.capexSite,
            capexSelfCheckout: configRes.data.data.capexSelfCheckout,
            capexMelhoria: configRes.data.data.capexMelhoria,
          });

          // Populate product configs
          const configs: Record<string, { margin: string; salesVolume: string }> = {};
          configRes.data.data.roundConfigItems?.forEach((item: RoundConfigItem) => {
            configs[item.productId] = {
              margin: item.margin,
              salesVolume: item.salesVolume.toString(),
            };
          });
          setProductConfigs(configs);
        }
      } catch (e) {
        // No existing config yet
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!activeRound) return;
    setSaving(true);

    try {
      const productsData = products.map((p) => ({
        productId: p.id,
        margin: productConfigs[p.id]?.margin || '0.3',
        salesVolume: parseInt(productConfigs[p.id]?.salesVolume || '100'),
      }));

      await api.post(`/rounds/${activeRound.id}/config`, {
        otherExpenses: parseFloat(otherExpenses),
        cashierOperators: parseInt(cashierOperators),
        serviceOperators: parseInt(serviceOperators),
        quizScore: parseFloat(quizScore),
        numPdvs: parseInt(numPdvs),
        ...capexOptions,
        products: productsData,
      });

      alert('Configuração salva com sucesso!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      alert('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const timeRemaining = () => {
    if (!activeRound) return '';
    const ends = new Date(activeRound.endsAt).getTime();
    const now = Date.now();
    const diff = ends - now;
    if (diff <= 0) return 'Encerrada';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!activeRound) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Nenhuma Rodada Ativa</h1>
        <p className="text-gray-500">Aguarde o administrador iniciar uma nova rodada.</p>
        <button onClick={() => router.push('/dashboard')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurar Rodada {activeRound.number}</h1>
          <p className="text-gray-500">Tempo restante: <span className="font-semibold text-orange-600">{timeRemaining()}</span></p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Voltar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Operacionais */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações Operacionais</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caixas/Operadores de Caixa</label>
              <input
                type="number"
                value={cashierOperators}
                onChange={(e) => setCashierOperators(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Operadores de Serviço</label>
              <input
                type="number"
                value={serviceOperators}
                onChange={(e) => setServiceOperators(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de PDVs</label>
              <input
                type="number"
                value={numPdvs}
                onChange={(e) => setNumPdvs(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pontuação do Quiz (0-1)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={quizScore}
                onChange={(e) => setQuizScore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outros Custos (R$)</label>
              <input
                type="number"
                step="100"
                value={otherExpenses}
                onChange={(e) => setOtherExpenses(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* CAPEX */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Investimentos CAPEX</h2>
          <p className="text-sm text-gray-500 mb-4">Selecione os investimentos de capital (serão deduzidos do seu capital)</p>
          <div className="space-y-3">
            {[
              { key: 'capexSeguranca', label: 'Sistema de Segurança' },
              { key: 'capexBalanca', label: 'Balança Inteligente' },
              { key: 'capexRedes', label: 'Infraestrutura de Redes' },
              { key: 'capexSite', label: 'Site Institucional' },
              { key: 'capexSelfCheckout', label: 'Self Checkout (SCO)' },
              { key: 'capexMelhoria', label: 'Melhorias Gerais' },
            ].map((option) => (
              <label key={option.key} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={capexOptions[option.key as keyof typeof capexOptions]}
                  onChange={(e) => setCapexOptions({ ...capexOptions, [option.key]: e.target.checked })}
                  className="mr-3 w-5 h-5 text-blue-600 rounded"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Produtos */}
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuração de Produtos</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço Custo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margem (%)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Volume Vendas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                  <td className="px-4 py-3 text-gray-600">R$ {parseFloat(product.purchasePrice).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="30"
                      value={productConfigs[product.id]?.margin || ''}
                      onChange={(e) => setProductConfigs({
                        ...productConfigs,
                        [product.id]: { ...productConfigs[product.id], margin: e.target.value }
                      })}
                      className="w-24 px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="100"
                      value={productConfigs[product.id]?.salesVolume || ''}
                      onChange={(e) => setProductConfigs({
                        ...productConfigs,
                        [product.id]: { ...productConfigs[product.id], salesVolume: e.target.value }
                      })}
                      className="w-24 px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-lg"
        >
          {saving ? 'Salvando...' : 'Salvar Configuração'}
        </button>
      </div>
    </div>
  );
}