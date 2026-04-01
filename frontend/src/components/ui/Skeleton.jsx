/**
 * Skeleton — placeholder animado durante carregamento.
 *
 * Variantes:
 *  - line   : bloco de texto (altura e largura configuráveis)
 *  - card   : card retangular
 *  - table  : header + N linhas de tabela
 */
export default function Skeleton({ variant = 'line', rows = 4, className = '' }) {
  if (variant === 'table') {
    return (
      <div className={`rounded-xl border border-gray-200 overflow-hidden animate-pulse ${className}`}>
        {/* Header */}
        <div className="flex gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-3 rounded bg-gray-200 flex-1" />
          ))}
        </div>
        {/* Rows */}
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3.5 border-t border-gray-100">
            <div className="w-6 h-4 rounded bg-gray-100" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="h-4 rounded bg-gray-100 flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`rounded-xl border border-gray-200 bg-white shadow-sm p-5 flex flex-col gap-3 animate-pulse ${className}`}
      >
        <div className="h-3 w-24 rounded bg-gray-200" />
        <div className="h-8 w-32 rounded bg-gray-100" />
        <div className="h-3 w-40 rounded bg-gray-100" />
      </div>
    );
  }

  // line (default)
  return (
    <div
      className={`h-4 rounded bg-gray-200 animate-pulse ${className}`}
    />
  );
}
