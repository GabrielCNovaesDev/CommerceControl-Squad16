import type { Control } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { formatCurrency } from '../../utils/formatters';
import { CAPEX_DEFS, calcCapexTotal } from './CapexPanel';
import type { FormData } from './types';
import type { Product } from '../../types';
import useThemeStore from '../../store/themeStore';

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

export function CashSummaryPanel({ initialCapital, currentCash, products, control }: {
  initialCapital: number;
  currentCash: number | null;
  products: Product[];
  control: Control<FormData>;
}) {
  const isDark = useThemeStore((state) => state.isDark);
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
    <div
      className="rounded-xl border shadow-sm px-5 py-4 flex flex-col gap-3"
      style={{
        background: isOver ? (isDark ? '#2a1111' : 'var(--cenc-danger-bg)') : (isDark ? '#072613' : 'var(--cenc-success-bg)'),
        borderColor: isOver ? (isDark ? '#7f1d1d' : 'rgba(220, 38, 38, 0.25)') : (isDark ? '#166534' : 'rgba(22, 163, 74, 0.25)'),
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: isDark ? 'var(--cenc-gray-800)' : 'var(--cenc-gray-700)' }}>Validação de Caixa</h2>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: isOver ? (isDark ? '#3f1212' : '#fee2e2') : (isDark ? '#123524' : '#dcfce7'),
            color: isOver ? (isDark ? '#fca5a5' : '#b91c1c') : (isDark ? '#86efac' : '#15803d'),
          }}
        >
          {isOver ? 'Revisar Caixa' : 'Caixa OK'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <div className="flex justify-between">
          <span style={{ color: 'var(--cenc-gray-500)' }}>Caixa disponível</span>
          <span className="font-medium" style={{ color: 'var(--cenc-gray-900)' }}>{formatCurrency(budget)}</span>
        </div>
        {currentCash != null && currentCash !== initialCapital && (
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--cenc-gray-400)' }}>Capital inicial</span>
            <span style={{ color: 'var(--cenc-gray-400)' }}>{formatCurrency(initialCapital)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span style={{ color: 'var(--cenc-gray-500)' }}>Custo do estoque</span>
          <span className="font-medium" style={{ color: isOver ? (isDark ? '#fca5a5' : '#b91c1c') : 'var(--cenc-gray-800)' }}>{formatCurrency(stockCost)}</span>
        </div>
        {capexCost > 0 && (
          <div className="flex justify-between">
            <span style={{ color: 'var(--cenc-gray-500)' }}>CAPEX (total)</span>
            <span className="font-medium" style={{ color: isDark ? '#fcd34d' : '#c2410c' }}>{formatCurrency(capexCost)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span style={{ color: 'var(--cenc-gray-500)' }}>Saldo após investimentos</span>
          <span className="font-semibold" style={{ color: isOver ? (isDark ? '#fca5a5' : '#b91c1c') : (isDark ? '#86efac' : '#15803d') }}>{formatCurrency(balance)}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--cenc-gray-500)' }}>Licenças/mês</span>
          <span style={{ color: 'var(--cenc-gray-800)' }}>{formatCurrency(licensing)}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--cenc-gray-500)' }}>Manutenção/mês</span>
          <span style={{ color: 'var(--cenc-gray-800)' }}>{formatCurrency(maintenance)}</span>
        </div>
        {isOver && (
          <div className="col-span-2 flex justify-between border-t pt-2 mt-1" style={{ borderColor: isDark ? '#7f1d1d' : 'rgba(220, 38, 38, 0.25)' }}>
            <span className="text-xs" style={{ color: isDark ? '#fca5a5' : '#dc2626' }}>Juros sobre excesso (12%/mês)</span>
            <span className="font-semibold" style={{ color: isDark ? '#fca5a5' : '#b91c1c' }}>{formatCurrency(interest)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
