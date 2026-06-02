import type { Control, UseFormRegister } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { formatCurrency } from '../../utils/formatters';
import type { FormData, CapexDef } from './types';
import useThemeStore from '../../store/themeStore';

export const CAPEX_DEFS: CapexDef[] = [
  {
    key: 'capexSeguranca', label: 'Segurança', cost: 50000,
    desc: 'Monitoramento contra ataques cibernéticos.',
    benefits: 'Proteção contra invasões e vazamento de dados.',
    strategicImpact: 'Garante continuidade operacional e confiança do cliente.',
    penaltyAvoided: 'Evita penalidade de R$15.000 por ataque cibernético.',
    operationalRisk: 'Sem este CAPEX: risco de 2+SLA dias sem venda em caso de ataque.',
  },
  {
    key: 'capexBalanca', label: 'Balança/Freezer', cost: 75000,
    desc: 'Novos equipamentos com garantia.',
    benefits: 'Elimina custo de manutenção de R$400/mês.',
    strategicImpact: 'Equipamentos novos reduzem quebras e perdas.',
    penaltyAvoided: 'Evita penalidade de R$12.000 por falha em refrigeração.',
    operationalRisk: 'Sem este CAPEX: manutenção mensal obrigatória + risco de falha.',
  },
  {
    key: 'capexRedes', label: 'Redes', cost: 80000,
    desc: 'Infraestrutura de rede robusta.',
    benefits: 'Conexão estável para PDVs e sistemas.',
    strategicImpact: 'Suporta operações digitais e self-checkout.',
    penaltyAvoided: 'Evita penalidade de R$18.000 por queda de rede.',
    operationalRisk: 'Sem este CAPEX: risco de 2+SLA dias sem venda por instabilidade.',
  },
  {
    key: 'capexSite', label: 'Site', cost: 65000,
    desc: 'Plataforma digital de vendas.',
    benefits: 'Canal de vendas online complementar.',
    strategicImpact: 'Amplia alcance e diversifica receita.',
    penaltyAvoided: 'Evita penalidade de R$10.000 por indisponibilidade digital.',
    operationalRisk: 'Sem este CAPEX: +30% na licença do site + risco de 1+SLA dias.',
  },
  {
    key: 'capexSelfCheckout', label: 'Self Checkout', cost: 80000,
    desc: '4 terminais de autoatendimento.',
    benefits: 'Reduz filas e melhora experiência do cliente.',
    strategicImpact: 'Otimiza operadores de caixa necessários.',
    penaltyAvoided: 'Evita penalidade de R$14.000 por falha nos terminais.',
    operationalRisk: 'Sem este CAPEX: risco de 2+SLA dias sem autoatendimento.',
  },
  {
    key: 'capexMelhoria', label: 'Melhoria Contínua', cost: 45000,
    desc: 'Automação de relatórios e processos.',
    benefits: 'Ganho de eficiência operacional.',
    strategicImpact: 'Reduz retrabalho e melhora tomada de decisão.',
    penaltyAvoided: 'Evita penalidade de R$8.000 por ineficiência operacional.',
    operationalRisk: 'Sem este CAPEX: processos manuais sujeitos a erros.',
  },
];

export function calcCapexTotal(vals: Record<string, boolean>): number {
  const costs: Record<string, number> = {
    capexSeguranca: 50000, capexBalanca: 75000, capexRedes: 80000,
    capexSite: 65000, capexSelfCheckout: 80000, capexMelhoria: 45000,
  };
  return Object.entries(costs).reduce((s, [k, c]) => s + (vals[k] ? c : 0), 0);
}

export function CapexPanel({ register, control, previousCapex = [] }: {
  register: UseFormRegister<FormData>;
  control: Control<FormData>;
  previousCapex?: string[];
}) {
  const watched = useWatch({
    control,
    name: ['capexSeguranca', 'capexBalanca', 'capexRedes', 'capexSite', 'capexSelfCheckout', 'capexMelhoria'],
  });
  const capexValues = Object.fromEntries(CAPEX_DEFS.map((d, i) => [d.key, watched[i]])) as Record<string, boolean>;
  const totalCapex = calcCapexTotal(capexValues);
  const isDark = useThemeStore((state) => state.isDark);

  // Max 1 CAPEX per round: find which one is currently selected
  const selectedKey = CAPEX_DEFS.find((d) => capexValues[d.key])?.key ?? null;

  return (
    <div className="rounded-xl shadow-sm" style={{ background: 'var(--cenc-surface)', border: `1px solid ${isDark ? 'var(--cenc-gray-300)' : 'var(--cenc-gray-200)'}` }}>
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--cenc-gray-700)' }}>CAPEX — Investimentos</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--cenc-gray-400)' }}>Escolha até 1 investimento por rodada. Não é possível repetir em rodadas futuras.</p>
        </div>
        {totalCapex > 0 && (
          <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: isDark ? '#241a00' : '#fffbeb', color: isDark ? '#fcd34d' : '#c2410c', border: `1px solid ${isDark ? '#92400e' : '#fed7aa'}` }}>
            Total: {formatCurrency(totalCapex)}
          </span>
        )}
      </div>
      <div className="px-5 py-4 flex flex-col gap-2">
        {CAPEX_DEFS.map((def) => {
          const checked = capexValues[def.key];
          const alreadyUsed = previousCapex.includes(def.key);
          const disabledByLimit = !checked && selectedKey !== null;
          const isDisabled = alreadyUsed || disabledByLimit;

          return (
            <div key={def.key}>
              <label
                className={`flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                style={{
                  background: checked ? (isDark ? '#0f1b34' : '#eef2ff') : alreadyUsed ? (isDark ? '#1a1a1a' : '#f9fafb') : (isDark ? 'var(--cenc-gray-100)' : 'var(--cenc-gray-50)'),
                  borderColor: checked ? (isDark ? '#1d4ed8' : '#c7d2fe') : (isDark ? 'var(--cenc-gray-300)' : 'var(--cenc-gray-200)'),
                }}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 focus:ring-indigo-500"
                  disabled={isDisabled}
                  {...register(def.key)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--cenc-gray-800)' }}>{def.label}</span>
                    <span className="text-xs font-semibold" style={{ color: isDark ? '#bfdbfe' : '#4338ca' }}>{formatCurrency(def.cost)}</span>
                    {alreadyUsed && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">Já investido</span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--cenc-gray-500)' }}>{def.desc}</p>
                </div>
              </label>

              {/* Expanded details when selected */}
              {checked && (
                <div className="ml-7 mt-2 mb-1 rounded-lg border px-4 py-3 text-xs" style={{ background: isDark ? '#0c1929' : '#f0f4ff', borderColor: isDark ? '#1e3a5f' : '#dbeafe' }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="font-semibold text-green-700 mb-0.5">✓ Benefícios</p>
                      <p style={{ color: 'var(--cenc-gray-600)' }}>{def.benefits}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-700 mb-0.5">↗ Impacto Estratégico</p>
                      <p style={{ color: 'var(--cenc-gray-600)' }}>{def.strategicImpact}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-purple-700 mb-0.5">🛡 Penalidade Evitada</p>
                      <p style={{ color: 'var(--cenc-gray-600)' }}>{def.penaltyAvoided}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-red-700 mb-0.5">⚠ Risco Operacional</p>
                      <p style={{ color: 'var(--cenc-gray-600)' }}>{def.operationalRisk}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
