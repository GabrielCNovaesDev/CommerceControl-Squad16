import OpenAI from 'openai';

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export interface AiReportInput {
  squadName: string;
  storeName: string;
  roundNumber: number;
  dre: {
    grossRevenue: number;
    taxes: number;
    netRevenue: number;
    costs: number;
    grossMargin: number;
    totalBreakage: number;
    totalAging: number;
    netMarginMass: number;
    otherExpenses: number;
    ebitda: number;
    ebitdaMargin: number;
    demandShare: number;
  };
  decisions: Array<{
    categoryName: string;
    margin: number;
    salesVolume: number;
  }>;
  history: Array<{
    roundNumber: number;
    ebitda: number;
    ebitdaMargin: number;
    grossRevenue: number;
    demandShare: number;
  }>;
  ranking: Array<{
    position: number;
    squadName: string;
    ebitdaMargin: number;
    demandShare: number;
  }>;
}

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

function buildPrompt(input: AiReportInput): string {
  const { squadName, storeName, roundNumber, dre, decisions, history, ranking } = input;

  const myPosition = ranking.find((r) => r.squadName === squadName);
  const totalSquads = ranking.length;

  const historyText = history.length > 0
    ? history.map((h) => `  - Rodada #${h.roundNumber}: EBITDA ${fmt(h.ebitda)} | Margem ${(h.ebitdaMargin * 100).toFixed(2)}% | Part. Mercado ${pct(h.demandShare)}`).join('\n')
    : '  (primeira rodada — sem histórico anterior)';

  const decisionsText = decisions.map((d) =>
    `  - ${d.categoryName}: margem ${(d.margin * 100).toFixed(1)}%, volume ${d.salesVolume} unidades`
  ).join('\n');

  const rankingText = ranking.map((r) =>
    `  ${r.position}º ${r.squadName}${r.squadName === squadName ? ' ← você' : ''}: margem EBITDA ${(r.ebitdaMargin * 100).toFixed(2)}%, part. mercado ${pct(r.demandShare)}`
  ).join('\n');

  return `Você é um analista sênior de varejo da Cencosud. Analise o desempenho da loja abaixo e gere um relatório pedagógico em português para o time participante do simulador.

## Dados da Rodada #${roundNumber} — ${storeName} (${squadName})

### DRE
- Receita Bruta: ${fmt(dre.grossRevenue)}
- Impostos: ${fmt(dre.taxes)}
- Receita Líquida: ${fmt(dre.netRevenue)}
- Custo de Venda: ${fmt(dre.costs)}
- Massa Margem Líquida (PDV): ${fmt(dre.grossMargin)}
- Quebras: ${fmt(dre.totalBreakage)}
- Aging: ${fmt(dre.totalAging)}
- Massa Margem Final: ${fmt(dre.netMarginMass)}
- Outros Gastos: ${fmt(dre.otherExpenses)}
- EBITDA: ${fmt(dre.ebitda)}
- Margem EBITDA: ${(dre.ebitdaMargin * 100).toFixed(2)}%
- Participação de Mercado: ${pct(dre.demandShare)}

### Decisões tomadas
${decisionsText}

### Histórico do squad
${historyText}

### Ranking da rodada (${totalSquads} squads)
${rankingText}
${myPosition ? `\nSua posição: ${myPosition.position}º de ${totalSquads}` : ''}

## Instruções para o relatório

Gere um relatório com exatamente estas 5 seções em markdown, usando os títulos abaixo:

### Resumo Executivo
2-3 frases diretas sobre o resultado geral da rodada.

### O que funcionou
Pontos positivos com base nos números. Se não houver nenhum ponto positivo claro, seja honesto mas construtivo.

### Pontos de Atenção
Análise de quebras, aging, relação margem vs. volume, outros gastos. Seja específico com os números.

### Comparativo com o Mercado
Posição no ranking, participação de mercado, comparação com os outros squads. Não revele as decisões dos outros times.

### Recomendação para a Próxima Rodada
1-2 ações concretas e específicas baseadas nos dados desta rodada e no histórico.

Seja direto, pedagógico e use os números reais do DRE. Não use jargão excessivo. Escreva para gestores em formação.`;
}

export async function generateAiReport(input: AiReportInput): Promise<string | null> {
  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: 'Você é um analista sênior de varejo da Cencosud especializado em treinamento de gestores. Seus relatórios são diretos, baseados em dados e pedagogicamente eficazes. Responda sempre em português brasileiro.',
        },
        {
          role: 'user',
          content: buildPrompt(input),
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;
    return content;
  } catch (err) {
    const error = err as Error;
    console.error(JSON.stringify({
      level: 'error',
      service: 'aiReportService',
      message: 'Falha ao gerar relatório de IA',
      error: error.message,
      timestamp: new Date().toISOString(),
    }));
    return null;
  }
}
