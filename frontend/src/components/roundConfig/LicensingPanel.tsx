'use client';

import type { Control, UseFormRegister, FieldErrors } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { formatCurrency } from '@/components/utils/formatters';
import { FieldError } from './OperatorsPanel';
import type { FormData } from './types';
import { useTheme } from '@/components/ThemeContext';

export function LicensingPanel({ register, errors, control }: {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  control: Control<FormData>;
}) {
  const { isDark } = useTheme();
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
    <div className="rounded-xl shadow-sm" style={{ background: 'var(--cenc-surface)', border: `1px solid ${isDark ? 'var(--cenc-gray-300)' : 'var(--cenc-gray-200)'}` }}>
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--cenc-gray-700)' }}>Licenças de Software e Manutenção</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--cenc-gray-400)' }}>Custos mensais calculados automaticamente.</p>
      </div>
      <div className="px-5 py-4 flex flex-col gap-4">
        <div className="flex items-end gap-3 max-w-xs">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-medium" style={{ color: 'var(--cenc-gray-700)' }}>Nº de PDVs</label>
            <input
              type="number"
              min="0"
              className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.numPdvs ? 'border-red-400' : 'border-gray-300'}`}
              style={{ background: errors.numPdvs ? (isDark ? '#2a1111' : '#fef2f2') : 'var(--cenc-surface)', color: 'var(--cenc-gray-800)' }}
              {...register('numPdvs')}
            />
            <FieldError error={errors.numPdvs} />
            <p className="text-xs" style={{ color: 'var(--cenc-gray-400)' }}>{formatCurrency(80)}/mês por equipamento</p>
          </div>
        </div>
        <div className="rounded-lg overflow-hidden text-sm" style={{ background: isDark ? 'var(--cenc-gray-100)' : 'var(--cenc-gray-50)', border: `1px solid ${isDark ? 'var(--cenc-gray-300)' : 'var(--cenc-gray-200)'}` }}>
          <div className="grid grid-cols-2 px-4 py-2 border-b text-xs font-semibold uppercase tracking-wide" style={{ borderColor: isDark ? 'var(--cenc-gray-300)' : 'var(--cenc-gray-100)', color: 'var(--cenc-gray-500)' }}>
            <span>Licença</span><span className="text-right">Valor/mês</span>
          </div>
          {rows.map(([label, val]) => (
            <div key={label} className="grid grid-cols-2 px-4 py-1.5 border-b last:border-0" style={{ borderColor: isDark ? 'var(--cenc-gray-300)' : 'var(--cenc-gray-100)' }}>
              <span style={{ color: 'var(--cenc-gray-600)' }}>{label}</span>
              <span className="text-right" style={{ color: 'var(--cenc-gray-700)' }}>{formatCurrency(val)}</span>
            </div>
          ))}
          <div className="grid grid-cols-2 px-4 py-2 font-semibold" style={{ background: isDark ? 'var(--cenc-gray-200)' : 'var(--cenc-gray-100)' }}>
            <span style={{ color: 'var(--cenc-gray-700)' }}>Total Licenças</span>
            <span className="text-right" style={{ color: 'var(--cenc-gray-900)' }}>{formatCurrency(totalLicensing)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg px-4 py-2.5 text-sm border" style={{ background: capexBalanca ? (isDark ? '#072613' : '#f0fdf4') : (isDark ? '#1c1400' : '#fffbeb'), borderColor: capexBalanca ? (isDark ? '#166534' : '#bbf7d0') : (isDark ? '#92400e' : '#fde68a') }}>
          <span style={{ color: capexBalanca ? (isDark ? '#86efac' : '#15803d') : (isDark ? '#fde68a' : '#a16207') }}>
            Manutenção de equipamentos{capexBalanca ? ' — cancelada (CAPEX Balança/Freezer)' : ''}
          </span>
          <span className={`font-semibold ${capexBalanca ? 'line-through' : ''}`} style={{ color: capexBalanca ? (isDark ? '#86efac' : '#16a34a') : (isDark ? '#fde68a' : '#a16207') }}>
            {formatCurrency(400)}
          </span>
          {capexBalanca && <span className="ml-2 font-semibold" style={{ color: isDark ? '#86efac' : '#16a34a' }}>{formatCurrency(0)}</span>}
        </div>
      </div>
    </div>
  );
}
