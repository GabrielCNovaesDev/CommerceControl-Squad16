'use client';

import { formatCurrency } from '@/components/utils/formatters';
import type { DREResult, ItemBreakdown } from '@/components/types';

// ─── Helpers ───────────────────────────────────────────────────────────────

function classifyFeedback(msg: string): 'error' | 'warning' {
  const errorKeywords = ['prejuízo', 'negativo', 'custo de venda superou'];
  const isError = errorKeywords.some((kw) => msg.toLowerCase().includes(kw));
  return isError ? 'error' : 'warning';
}

// ─── Sub-componentes ────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-8 rounded-lg bg-gray-100" />
      ))}
    </div>
  );
}

interface DRERowProps {
  label: string;
  value: number;
  highlight?: boolean;
  subtotal?: boolean;
  sign?: string;
}

function DRERow({ label, value, highlight, subtotal, sign = '' }: DRERowProps) {
  const isNegative = value < 0;
  const colorClass = highlight
    ? isNegative ? 'text-red-600' : 'text-green-700'
    : subtotal
    ? isNegative ? 'text-red-500' : 'text-blue-700'
    : 'text-gray-700';

  return (
    <div
      className={`flex justify-between items-center px-4 py-2.5 text-sm border-b border-gray-50 last:border-0
        ${highlight ? 'font-semibold bg-gray-50' : subtotal ? 'font-medium bg-blue-50/40' : ''}`}
    >
      <span className="text-gray-600">{label}</span>
      <span className={colorClass}>
        {sign}{formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}

function ItemBreakdownTable({ items }: { items: ItemBreakdown[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Detalhes por Categoria
      </h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500">
              <th className="px-3 py-2 font-medium">Categoria</th>
              <th className="px-3 py-2 font-medium text-right">Margem</th>
              <th className="px-3 py-2 font-medium text-right">Preço venda</th>
              <th className="px-3 py-2 font-medium text-right">Vol. Plan.</th>
              <th className="px-3 py-2 font-medium text-right">Vol. Efet.</th>
              <th className="px-3 py-2 font-medium text-right">Receita</th>
              <th className="px-3 py-2 font-medium text-right">Quebra+Aging</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.productId}
                className={`border-t border-gray-100 ${item.stockLimited ? 'bg-yellow-50' : 'bg-white'}`}
              >
                <td className="px-3 py-2 text-gray-800">
                  <div className="flex items-center gap-1.5">
                    {item.stockLimited && (
                      <span title="Volume limitado pelo estoque" className="text-yellow-500 text-base leading-none">
                        ⚠
                      </span>
                    )}
                    {item.productId}
                  </div>
                </td>
                <td className="px-3 py-2 text-right text-gray-600">
                  {(item.margin * 100).toFixed(1)}%
                </td>
                <td className="px-3 py-2 text-right text-gray-600">
                  {formatCurrency(item.salePrice)}
                </td>
                <td className="px-3 py-2 text-right text-gray-600">{item.plannedVolume}</td>
                <td className={`px-3 py-2 text-right font-medium ${item.stockLimited ? 'text-yellow-700' : 'text-gray-800'}`}>
                  {item.effectiveVolume}
                </td>
                <td className="px-3 py-2 text-right text-gray-700">
                  {formatCurrency(item.itemRevenue)}
                </td>
                <td className="px-3 py-2 text-right text-gray-600">
                  {formatCurrency(item.itemBreakage + item.itemAging)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FeedbackList({ feedbacks }: { feedbacks: string[] }) {
  if (!feedbacks || feedbacks.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Alertas
      </h3>
      {feedbacks.map((msg, i) => {
        const type = classifyFeedback(msg);
        return (
          <div
            key={i}
            className={`flex gap-2.5 items-start rounded-lg px-3 py-2.5 text-sm border
              ${type === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}
          >
            <span className="mt-px shrink-0">{type === 'error' ? '✕' : '⚠'}</span>
            <span>{msg}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────

interface DREPreviewProps {
  dre?: DREResult | null;
  feedbacks?: string[];
  loading?: boolean;
}

export default function DREPreview({ dre, feedbacks = [], loading = false }: DREPreviewProps) {
  return (
    <div className="rounded-xl border border-blue-200 bg-white shadow-sm overflow-hidden">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-blue-50 border-b border-blue-200">
        <h2 className="text-sm font-semibold text-blue-800">DRE — Resultado Simulado</h2>
        <span className="inline-flex items-center rounded-full bg-blue-100 border border-blue-300 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
          Simulação — Não Confirmada
        </span>
      </div>

      <div className="px-5 py-5 flex flex-col gap-5">
        {loading ? (
          <Skeleton />
        ) : dre ? (
          <>
            {/* Tabela DRE */}
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <DRERow label="Receita Bruta" value={dre.grossRevenue} />
              <DRERow label="(-) Impostos" value={dre.taxes} sign="- " />
              <DRERow label="(=) Receita Líquida" value={dre.netRevenue} subtotal />
              <DRERow label="(-) Custo de Venda" value={dre.costs} sign="- " />
              <DRERow label="(=) Massa Margem Líquida (PDV)" value={dre.grossMargin} subtotal />
              <DRERow label="(-) Quebras" value={dre.totalBreakage} sign="- " />
              <DRERow label="(-) Aging" value={dre.totalAging} sign="- " />
              <DRERow label="(=) Massa Margem Final" value={dre.netMarginMass} subtotal />
              <DRERow label="(-) Outros Gastos" value={dre.otherExpenses} sign="- " />
              <DRERow label="(=) EBITDA" value={dre.ebitda} highlight />
              <div className="flex justify-between items-center px-4 py-2.5 text-sm bg-gray-50 border-t border-gray-100">
                <span className="text-gray-500">Margem EBITDA (% Rec. Líquida)</span>
                <span
                  className={`font-semibold ${
                    dre.ebitdaMargin < 0 ? 'text-red-600' : 'text-green-700'
                  }`}
                >
                  {dre.ebitdaMargin.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Breakdown por categoria */}
            <ItemBreakdownTable items={dre.itemBreakdown} />

            {/* Feedbacks */}
            <FeedbackList feedbacks={feedbacks} />
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            Clique em "Simular" para ver uma prévia do resultado.
          </p>
        )}
      </div>
    </div>
  );
}
