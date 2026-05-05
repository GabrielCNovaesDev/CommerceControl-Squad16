import type { Control } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { formatCurrency } from '../../utils/formatters';
import { CAPEX_DEFS, calcCapexTotal } from './CapexPanel';
import type { FormData } from './types';
import type { Product } from '../../types';

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
