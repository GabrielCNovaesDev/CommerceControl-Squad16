import { formatCurrency, formatPercent } from '../utils/formatters';

// ─── Helpers ───────────────────────────────────────────────────────────────

function classifyFeedback(msg) {
  const errorKeywords = ['prejuízo', 'custo de compra superou'];
  const isError = errorKeywords.some((kw) => msg.toLowerCase().includes(kw));
  return isError ? 'error' : 'warning';
}

// ─── Sub-componentes ────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-8 rounded-lg bg-gray-100" />
      ))}
    </div>
  );
}

function DRERow({ label, value, highlight, sign = '' }) {
  const isNegative = value < 0;
  const colorClass = highlight
    ? isNegative
      ? 'text-red-600'
      : 'text-green-700'
    : 'text-gray-700';

  return (
    <div
      className={`flex justify-between items-center px-4 py-2.5 text-sm border-b border-gray-50 last:border-0
        ${highlight ? 'font-semibold bg-gray-50' : ''}`}
    >
      <span className="text-gray-600">{label}</span>
      <span className={colorClass}>
        {sign}{formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}

function ItemBreakdownTable({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Detalhes por Produto
      </h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500">
              <th className="px-3 py-2 font-medium">Produto</th>
              <th className="px-3 py-2 font-medium text-right">Vol. Planejado</th>
              <th className="px-3 py-2 font-medium text-right">Vol. Efetivo</th>
              <th className="px-3 py-2 font-medium text-right">Receita</th>
              <th className="px-3 py-2 font-medium text-right">Custo</th>
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
                <td className="px-3 py-2 text-right text-gray-600">{item.plannedVolume}</td>
                <td className={`px-3 py-2 text-right font-medium ${item.stockLimited ? 'text-yellow-700' : 'text-gray-800'}`}>
                  {item.effectiveVolume}
                </td>
                <td className="px-3 py-2 text-right text-gray-700">
                  {formatCurrency(item.itemRevenue)}
                </td>
                <td className="px-3 py-2 text-right text-gray-700">
                  {formatCurrency(item.itemCost)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FeedbackList({ feedbacks }) {
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

export default function DREPreview({ dre, feedbacks = [], loading = false }) {
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
              <DRERow label="(-) Custos" value={dre.costs} sign="- " />
              <DRERow label="(=) Lucro Bruto" value={dre.grossProfit} highlight />
              <DRERow label="(-) Despesas" value={dre.expenses} sign="- " />
              <DRERow label="(=) Lucro Líquido" value={dre.netProfit} highlight />
              <div className="flex justify-between items-center px-4 py-2.5 text-sm bg-gray-50 border-t border-gray-100">
                <span className="text-gray-500">Margem Líquida</span>
                <span
                  className={`font-semibold ${
                    dre.netMargin < 0 ? 'text-red-600' : 'text-green-700'
                  }`}
                >
                  {formatPercent(dre.netMargin)}
                </span>
              </div>
            </div>

            {/* Breakdown por produto */}
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
