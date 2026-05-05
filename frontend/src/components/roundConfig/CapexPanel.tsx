import type { Control, UseFormRegister } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { formatCurrency } from '../../utils/formatters';
import type { FormData, CapexDef } from './types';

export const CAPEX_DEFS: CapexDef[] = [
  { key: 'capexSeguranca',    label: 'Segurança',        cost: 50000, desc: 'Monitoramento contra ataques. Risco sem CAPEX: 2+SLA dias sem venda.' },
  { key: 'capexBalanca',      label: 'Balança/Freezer',  cost: 75000, desc: 'Novos equipamentos (garantia). Elimina manutenção de R$400/mês.' },
  { key: 'capexRedes',        label: 'Redes',             cost: 80000, desc: 'Infraestrutura de rede. Risco sem CAPEX: 2+SLA dias sem venda.' },
  { key: 'capexSite',         label: 'Site',              cost: 65000, desc: 'Plataforma digital. Risco sem CAPEX: 1+SLA dias. +30% na licença do site.' },
  { key: 'capexSelfCheckout', label: 'Self Checkout',     cost: 80000, desc: '4 equipamentos. Adiciona licença R$320/mês. Risco sem CAPEX: 2+SLA dias.' },
  { key: 'capexMelhoria',     label: 'Melhoria Contínua', cost: 45000, desc: 'Automação de relatórios e processos. Sem penalidade direta de vendas.' },
];

export function calcCapexTotal(vals: Record<string, boolean>): number {
  const costs: Record<string, number> = {
    capexSeguranca: 50000, capexBalanca: 75000, capexRedes: 80000,
    capexSite: 65000, capexSelfCheckout: 80000, capexMelhoria: 45000,
  };
  return Object.entries(costs).reduce((s, [k, c]) => s + (vals[k] ? c : 0), 0);
}

export function CapexPanel({ register, control }: {
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
