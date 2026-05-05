import type { Control, UseFormRegister, FieldErrors } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { formatCurrency } from '../../utils/formatters';
import { FieldError } from './OperatorsPanel';
import type { FormData } from './types';

export function LicensingPanel({ register, errors, control }: {
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
