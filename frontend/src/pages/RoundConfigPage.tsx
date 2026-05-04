import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Control, UseFormRegister, FieldErrors } from 'react-hook-form';
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
import { useCountdown } from '../hooks/useCountdown';
import type { Round, Store, Product, DREResult } from '../types';

// ─── Schema ──────────────────────────────────────────────────────────────────

const schema = z.object({
  otherExpenses:     z.coerce.number({ invalid_type_error: 'Valor inválido' }).min(0),
  cashierOperators:  z.coerce.number({ invalid_type_error: 'Valor inválido' }).int().min(0),
  serviceOperators:  z.coerce.number({ invalid_type_error: 'Valor inválido' }).int().min(0),
  quizScore:         z.coerce.number({ invalid_type_error: 'Valor inválido' }).min(0).max(1),
  numPdvs:           z.coerce.number({ invalid_type_error: 'Valor inválido' }).int().min(0),
  capexSeguranca:    z.boolean().default(false),
  capexBalanca:      z.boolean().default(false),
  capexRedes:        z.boolean().default(false),
  capexSite:         z.boolean().default(false),
  capexSelfCheckout: z.boolean().default(false),
  capexMelhoria:     z.boolean().default(false),
  items: z.array(
    z.object({
      productId:   z.string(),
      margin:      z.coerce.number({ invalid_type_error: 'Valor inválido' }).min(0),
      salesVolume: z.coerce.number({ invalid_type_error: 'Valor inválido' }).int().positive(),
    })
  ).min(1),
});

type FormData = z.infer<typeof schema>;

// ─── Constants ───────────────────────────────────────────────────────────────

const IDEAL_CASHIER  = 10;
const CASHIER_COST   = 1000;
const SERVICE_COST   = 1200;
const SLA_TABLE      = [6, 5, 4, 3, 2, 1];

interface CapexDef {
  key: keyof Pick<FormData, 'capexSeguranca' | 'capexBalanca' | 'capexRedes' | 'capexSite' | 'capexSelfCheckout' | 'capexMelhoria'>;
  label: string;
  cost: number;
  desc: string;
}

const CAPEX_DEFS: CapexDef[] = [
  { key: 'capexSeguranca',    label: 'Segurança',        cost: 50000, desc: 'Monitoramento contra ataques. Risco sem CAPEX: 2+SLA dias sem venda.' },
  { key: 'capexBalanca',      label: 'Balança/Freezer',  cost: 75000, desc: 'Novos equipamentos (garantia). Elimina manutenção de R$400/mês.' },
  { key: 'capexRedes',        label: 'Redes',             cost: 80000, desc: 'Infraestrutura de rede. Risco sem CAPEX: 2+SLA dias sem venda.' },
  { key: 'capexSite',         label: 'Site',              cost: 65000, desc: 'Plataforma digital. Risco sem CAPEX: 1+SLA dias. +30% na licença do site.' },
  { key: 'capexSelfCheckout', label: 'Self Checkout',     cost: 80000, desc: '4 equipamentos. Adiciona licença R$320/mês. Risco sem CAPEX: 2+SLA dias.' },
  { key: 'capexMelhoria',     label: 'Melhoria Contínua', cost: 45000, desc: 'Automação de relatórios e processos. Sem penalidade direta de vendas.' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcSalePrice(purchasePrice: number, margin: number, taxRate: number): number {
  if (taxRate >= 1) return purchasePrice * (1 + margin);
  return (purchasePrice * (1 + margin)) / (1 - taxRate);
}

function calcSlaFromOps(serviceOperators: number): number {
  return SLA_TABLE[Math.min(Number(serviceOperators) || 0, 5)];
}

function calcLicensingLocal({ numPdvs, capexSite, capexSeguranca, capexSelfCheckout }: {
  numPdvs: number; capexSite: boolean; capexSeguranca: boolean; capexSelfCheckout: boolean;
}): number {
  const so   = 5 * 120;
  const pdvs = (Number(numPdvs) || 6) * 80;
  const sc   = capexSelfCheckout ? 4 * 80 : 0;
  const site = capexSite ? 650 : 500;
  const sec  = capexSeguranca ? 600 : 500;
  return so + pdvs + sc + site + sec;
}

function calcCapexTotal(vals: Record<string, boolean>): number {
  const costs: Record<string, number> = {
    capexSeguranca: 50000, capexBalanca: 75000, capexRedes: 80000,
    capexSite: 65000, capexSelfCheckout: 80000, capexMelhoria: 45000,
  };
  return Object.entries(costs).reduce((s, [k, c]) => s + (vals[k] ? c : 0), 0);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldError({ error }: { error?: { message?: string } }) {
  if (!error) return null;
  return <p className="text-xs text-red-600 mt-0.5">{error.message}</p>;
}

function OperatorsPanel({ register, errors, control }: {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  control: Control<FormData>;
}) {
  const cashierOps = Number(useWatch({ control, name: 'cashierOperators' })) || 0;
  const serviceOps = Number(useWatch({ control, name: 'serviceOperators' })) || 0;
  const quizScore  = Number(useWatch({ control, name: 'quizScore' }))       || 0;

  const csatPct = (Math.min(1, cashierOps / IDEAL_CASHIER) * quizScore * 100).toFixed(1);
  const payroll = cashierOps * CASHIER_COST + serviceOps * SERVICE_COST;
  const sla     = calcSlaFromOps(serviceOps);

  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Operadores e CSAT</h2>
        <p className="text-xs text-gray-400 mt-0.5">CSAT = min(1, Op.&nbsp;Caixa / 10) × Resultado&nbsp;Teste</p>
      </div>
      <div className="px-5 py-4 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Op. de Caixa</label>
            <input type="number" min="0"
              className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.cashierOperators ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              {...register('cashierOperators')} />
            <FieldError error={errors.cashierOperators} />
            <p className="text-xs text-gray-400">Ideal: 10 · {formatCurrency(CASHIER_COST)}/mês</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Op. de Serviço</label>
            <input type="number" min="0"
              className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.serviceOperators ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              {...register('serviceOperators')} />
            <FieldError error={errors.serviceOperators} />
            <p className="text-xs text-gray-400">Ideal: 5 · {formatCurrency(SERVICE_COST)}/mês</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Resultado do Teste (0–1)</label>
            <input type="number" step="0.01" min="0" max="1"
              className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.quizScore ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              {...register('quizScore')} />
            <FieldError error={errors.quizScore} />
            <p className="text-xs text-gray-400">Ex.: 0.9 = 90% de acertos</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">CSAT</p>
              <p className="text-2xl font-bold text-blue-800">{csatPct}%</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-600">Folha</p>
              <p className="text-base font-semibold text-blue-800">{formatCurrency(payroll)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-purple-50 border border-purple-100 px-4 py-3">
            <div>
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">SLA de Serviços</p>
              <p className="text-2xl font-bold text-purple-800">{sla} dias</p>
            </div>
            <div className="text-right text-xs text-purple-600 max-w-[120px] leading-tight">
              Janela de risco em caso de CAPEX não realizado
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CapexPanel({ register, control }: {
  register: UseFormRegister<FormData>;
  control: Control<FormData>;
}) {
  const watched = useWatch({
    control,
    name: ['capexSeguranca', 'capexBalanca', 'capexRedes', 'capexSite', 'capexSelfCheckout', 'capexMelhoria'],
  });
  const capexValues = Object.fromEntries(CAPEX_DEFS.map((d, i) => [d.key, watched[i]])) as Record<string, boolean>;
  const totalCapex = calcCapexTotal(capexValues);

  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">CAPEX — Investimentos</h2>
          <p className="text-xs text-gray-400 mt-0.5">Investimentos únicos deduzidos do capital inicial.</p>
        </div>
        {totalCapex > 0 && (
          <span className="text-sm font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full">
            Total: {formatCurrency(totalCapex)}
          </span>
        )}
      </div>
      <div className="px-5 py-4 flex flex-col gap-2">
        {CAPEX_DEFS.map((def) => {
          const checked = capexValues[def.key];
          return (
            <label key={def.key} className={`flex items-start gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${checked ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
              <input type="checkbox" className="mt-0.5 h-4 w-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500" {...register(def.key)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{def.label}</span>
                  <span className="text-xs font-semibold text-indigo-700">{formatCurrency(def.cost)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{def.desc}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function LicensingPanel({ register, errors, control }: {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  control: Control<FormData>;
}) {
  const numPdvs        = Number(useWatch({ control, name: 'numPdvs' })) || 6;
  const capexSite      = useWatch({ control, name: 'capexSite' });
  const capexSeguranca = useWatch({ control, name: 'capexSeguranca' });
  const capexSCO       = useWatch({ control, name: 'capexSelfCheckout' });
  const capexBalanca   = useWatch({ control, name: 'capexBalanca' });

  const so          = 5 * 120;
  const pdvCost     = numPdvs * 80;
  const scoCost     = capexSCO ? 4 * 80 : 0;
  const siteCost    = capexSite ? 650 : 500;
  const secCost     = capexSeguranca ? 600 : 500;
  const maintenance = capexBalanca ? 0 : 400;
  const totalLicensing = so + pdvCost + scoCost + siteCost + secCost;

  const rows: Array<[string, number]> = [
    ['Sistema Operacional (5 usuários)', so],
    [`PDVs (${numPdvs} × R$80)`, pdvCost],
    ...(capexSCO ? [['Self Checkout (4 × R$80)', scoCost] as [string, number]] : []),
    [`Site${capexSite ? ' (+30% CAPEX)' : ''}`, siteCost],
    [`Sistemas de Segurança${capexSeguranca ? ' (+20% CAPEX)' : ''}`, secCost],
  ];

  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Licenças de Software e Manutenção</h2>
        <p className="text-xs text-gray-400 mt-0.5">Custos mensais calculados automaticamente.</p>
      </div>
      <div className="px-5 py-4 flex flex-col gap-4">
        <div className="flex items-end gap-3 max-w-xs">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium text-gray-700">Nº de PDVs</label>
            <input type="number" min="0"
              className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.numPdvs ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              {...register('numPdvs')} />
            <FieldError error={errors.numPdvs} />
            <p className="text-xs text-gray-400">{formatCurrency(80)}/mês por equipamento</p>
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-200 overflow-hidden text-sm">
          <div className="grid grid-cols-2 px-4 py-2 border-b border-gray-100 text-xs text-gray-500 font-semibold uppercase tracking-wide">
            <span>Licença</span><span className="text-right">Valor/mês</span>
          </div>
          {rows.map(([label, val]) => (
            <div key={label} className="grid grid-cols-2 px-4 py-1.5 border-b border-gray-100 last:border-0">
              <span className="text-gray-600">{label}</span>
              <span className="text-right text-gray-700">{formatCurrency(val)}</span>
            </div>
          ))}
          <div className="grid grid-cols-2 px-4 py-2 bg-gray-100 font-semibold">
            <span className="text-gray-700">Total Licenças</span>
            <span className="text-right text-gray-900">{formatCurrency(totalLicensing)}</span>
          </div>
        </div>
        <div className={`flex items-center justify-between rounded-lg px-4 py-2.5 text-sm border ${capexBalanca ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <span className={capexBalanca ? 'text-green-700' : 'text-yellow-800'}>
            Manutenção de equipamentos{capexBalanca ? ' — cancelada (CAPEX Balança/Freezer)' : ''}
          </span>
          <span className={`font-semibold ${capexBalanca ? 'text-green-600 line-through' : 'text-yellow-800'}`}>
            {formatCurrency(400)}
          </span>
          {capexBalanca && <span className="ml-2 text-green-700 font-semibold">{formatCurrency(0)}</span>}
        </div>
      </div>
    </div>
  );
}

function CashSummaryPanel({ initialCapital, currentCash, products, control }: {
  initialCapital: number;
  currentCash: number | null;
  products: Product[];
  control: Control<FormData>;
}) {
  const watchedItems   = useWatch({ control, name: 'items' }) ?? [];
  const capexFields    = useWatch({ control, name: ['capexSeguranca', 'capexBalanca', 'capexRedes', 'capexSite', 'capexSelfCheckout', 'capexMelhoria'] });
  const numPdvs        = Number(useWatch({ control, name: 'numPdvs' })) || 6;
  const capexSite      = capexFields[3] as boolean;
  const capexSeguranca = capexFields[0] as boolean;
  const capexSCO       = capexFields[4] as boolean;
  const capexBalanca   = capexFields[1] as boolean;

  const capexValues = Object.fromEntries(CAPEX_DEFS.map((d, i) => [d.key, capexFields[i]])) as Record<string, boolean>;
  const capexCost   = calcCapexTotal(capexValues);

  const stockCost = watchedItems.reduce((sum: number, item: { salesVolume: number }, idx: number) => {
    const product = products[idx];
    return sum + (product ? (Number(item.salesVolume) || 0) * product.purchasePrice : 0);
  }, 0);

  const budget      = currentCash ?? initialCapital;
  const totalOutlay = stockCost + capexCost;
  const balance     = budget - totalOutlay;
  const isOver      = totalOutlay > budget;
  const interest    = isOver ? (totalOutlay - budget) * 0.12 : 0;
  const licensing   = calcLicensingLocal({ numPdvs, capexSite, capexSeguranca, capexSelfCheckout: capexSCO });
  const maintenance = capexBalanca ? 0 : 400;

  return (
    <div className={`rounded-xl border shadow-sm px-5 py-4 flex flex-col gap-3 ${isOver ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Validação de Caixa</h2>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isOver ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {isOver ? 'Revisar Caixa' : 'Caixa OK'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Caixa disponível</span>
          <span className="font-medium">{formatCurrency(budget)}</span>
        </div>
        {currentCash != null && currentCash !== initialCapital && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Capital inicial</span>
            <span className="text-gray-400">{formatCurrency(initialCapital)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">Custo do estoque</span>
          <span className={`font-medium ${isOver ? 'text-red-700' : ''}`}>{formatCurrency(stockCost)}</span>
        </div>
        {capexCost > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">CAPEX (total)</span>
            <span className="font-medium text-orange-700">{formatCurrency(capexCost)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">Saldo após investimentos</span>
          <span className={`font-semibold ${isOver ? 'text-red-700' : 'text-green-700'}`}>{formatCurrency(balance)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Licenças/mês</span>
          <span className="text-gray-700">{formatCurrency(licensing)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Manutenção/mês</span>
          <span className="text-gray-700">{formatCurrency(maintenance)}</span>
        </div>
        {isOver && (
          <div className="col-span-2 flex justify-between border-t border-red-200 pt-2 mt-1">
            <span className="text-red-600 text-xs">Juros sobre excesso (12%/mês)</span>
            <span className="text-red-700 font-semibold">{formatCurrency(interest)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductRow({ index, product, availableQty, control, register, errors }: {
  index: number;
  product: Product;
  availableQty: number;
  control: Control<FormData>;
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
}) {
  const margin      = useWatch({ control, name: `items.${index}.margin` });
  const salesVolume = useWatch({ control, name: `items.${index}.salesVolume` });

  register(`items.${index}.productId`);

  const marginNum     = Number(margin) || 0;
  const salePrice     = calcSalePrice(product.purchasePrice, marginNum, product.taxRate);
  const volumeNum     = Number(salesVolume) || 0;
  const stockCostRow  = volumeNum * product.purchasePrice;
  const volumeWarning = volumeNum > availableQty && availableQty > 0;

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-start py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{product.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Custo: {formatCurrency(product.purchasePrice)} · Imposto: {(product.taxRate * 100).toFixed(0)}%
        </p>
        <p className="text-xs text-gray-400">
          Custo do estoque: <span className="font-medium text-gray-600">{formatCurrency(stockCostRow)}</span>
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-400 mb-1">Estoque</p>
        <p className="text-sm font-medium text-gray-700">{availableQty}</p>
      </div>
      <div className="w-32">
        <label className="text-xs text-gray-500 mb-1 block">Margem (%)</label>
        <input type="number" step="0.1" min="0"
          className={`w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors?.items?.[index]?.margin ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
          {...register(`items.${index}.margin`)} />
        {errors?.items?.[index]?.margin && (
          <p className="text-xs text-red-600 mt-0.5">{errors.items[index]?.margin?.message}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">Preço: {formatCurrency(salePrice)}</p>
      </div>
      <div className="w-28">
        <label className="text-xs text-gray-500 mb-1 block">Volume (un.)</label>
        <input type="number" min="1"
          className={`w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${volumeWarning ? 'border-orange-400 bg-orange-50' : errors?.items?.[index]?.salesVolume ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
          {...register(`items.${index}.salesVolume`)} />
        {volumeWarning && <p className="text-xs text-orange-600 mt-0.5">Acima do estoque</p>}
        {errors?.items?.[index]?.salesVolume && (
          <p className="text-xs text-red-600 mt-0.5">{errors.items[index]?.salesVolume?.message}</p>
        )}
      </div>
    </div>
  );
}

function CountdownBadge({ endsAt }: { endsAt: string }) {
  const { timeLeft, expired } = useCountdown(endsAt);
  return (
    <div className={`shrink-0 rounded-xl border px-4 py-2 text-right ${expired ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-100'}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tempo restante</p>
      <p className={`text-xl font-mono font-bold tabular-nums mt-0.5 ${expired ? 'text-orange-600' : 'text-blue-700'}`}>
        {expired ? 'Expirado' : timeLeft}
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

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

  const { register, handleSubmit, control, getValues, trigger, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
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
      const open = rounds.find((r: Round) => r.status === 'OPEN');
      setActiveRound(open ?? null);
      setProducts(prods);
      setStore(s);
      reset({
        otherExpenses: 0, cashierOperators: 10, serviceOperators: 5, quizScore: 1.0,
        numPdvs: 6, capexSeguranca: false, capexBalanca: false, capexRedes: false,
        capexSite: false, capexSelfCheckout: false, capexMelhoria: false,
        items: prods.map((p: Product) => ({ productId: p.id, margin: 0.12, salesVolume: 1 })),
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
      setPreview(result);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message ?? 'Erro ao simular');
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
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message ?? 'Erro ao enviar configuração');
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
            <FieldError error={errors.otherExpenses} />
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
