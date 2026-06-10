/**
 * Formata um número para moeda brasileira.
 * Exemplo: 1234.56 → "R$ 1.234,56"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata um número para percentual com duas casas decimais.
 * Exemplo: 12.345 → "12,35%"
 * Retorna "—" se value for null ou undefined.
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + '%';
}

/**
 * Formata uma string de data para o padrão dd/mm/aaaa.
 * Exemplo: "2024-03-15T00:00:00.000Z" → "15/03/2024"
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
}
