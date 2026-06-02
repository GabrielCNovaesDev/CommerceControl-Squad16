import type { Control, UseFormRegister, FieldErrors } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { formatCurrency } from '../../utils/formatters';
import type { FormData } from './types';

const IDEAL_CASHIER = 10;
const CASHIER_COST  = 1000;
const SERVICE_COST  = 1200;
const SLA_TABLE     = [6, 5, 4, 3, 2, 1];

function calcSlaFromOps(serviceOperators: number): number {
  return SLA_TABLE[Math.min(Number(serviceOperators) || 0, 5)];
}

export function FieldError({ error }: { error?: { message?: string } }) {
  if (!error) return null;
  return <p className="text-xs text-red-600 mt-0.5">{error.message}</p>;
}

export function OperatorsPanel({ register, errors, control }: {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  control: Control<FormData>;
}) {
  const cashierOps = Number(useWatch({ control, name: 'cashierOperators' })) || 0;
  const serviceOps = Number(useWatch({ control, name: 'serviceOperators' })) || 0;
  const quizScore  = Number(useWatch({ control, name: 'quizScore' }))       || 0;

  const csatPct = (Math.min(1, cashierOps / IDEAL_CASHIER) * (quizScore / 100) * 100).toFixed(1);
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
            <input type="number" min="0" max="10"
              className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.cashierOperators ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              {...register('cashierOperators')} />
            <FieldError error={errors.cashierOperators} />
            <p className="text-xs text-gray-400">Máximo: 10 · {formatCurrency(CASHIER_COST)}/mês</p>
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
            <label className="text-sm font-medium text-gray-700">Resultado do Teste (%)</label>
            <input type="number" step="1" min="0" max="100"
              className={`rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.quizScore ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              {...register('quizScore')} />
            <FieldError error={errors.quizScore} />
            <p className="text-xs text-gray-400">Ex.: 90 = 90% de acertos</p>
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
