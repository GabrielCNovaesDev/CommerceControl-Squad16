import OpenAI from 'openai';

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export interface MarketAggregates {
  avgEbitdaMargin: number;
  avgDemandShare: number;
  avgGrossRevenue: number;
  medianMarginByCategory: Array<{ categoryName: string; medianMargin: number }>;
  totalSquads: number;
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
  marketAggregates: MarketAggregates;
}

export interface GmReportInput {
  roundNumber: number;
  allSquadResults: Array<{
    squadName: string;
    storeName: string;
    dre: AiReportInput['dre'];
    decisions: AiReportInput['decisions'];
  }>;
  ranking: AiReportInput['ranking'];
  marketAggregates: MarketAggregates;
}

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

function buildPrompt(input: AiReportInput): string {
  const { squadName, storeName, roundNumber, dre, decisions, history, ranking, marketAggregates } = input;

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

  const marketText = marketAggregates.totalSquads >= 2
    ? `### Dados Agregados do Mercado (anônimos)
- Margem EBITDA média do mercado: ${(marketAggregates.avgEbitdaMargin * 100).toFixed(2)}%
- Participação de mercado média: ${pct(marketAggregates.avgDemandShare)}
- Receita bruta média: ${fmt(marketAggregates.avgGrossRevenue)}
- Margens medianas por categoria:
${marketAggregates.medianMarginByCategory.map((c) => `  - ${c.categoryName}: ${(c.medianMargin * 100).toFixed(1)}%`).join('\n')}`
    : '### Dados Agregados do Mercado\n  (dados insuficientes — apenas 1 squad na rodada)';

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

${marketText}

## Instruções para o relatório

Gere um relatório com exatamente estas 7 seções em markdown, usando os títulos abaixo:

### Resumo Executivo
2-3 frases diretas sobre o resultado geral da rodada.

### O que funcionou
Pontos positivos com base nos números. Se não houver nenhum ponto positivo claro, seja honesto mas construtivo.

### Pontos de Atenção
Análise de quebras, aging, relação margem vs. volume, outros gastos. Seja específico com os números.

### Alertas Operacionais
Avisos proativos sobre fatores de risco identificados: tendência de queda na participação de mercado, quebras acima da média, margem insustentável, gastos excessivos com CAPEX ou operadores. Se não houver riscos claros, indique que a operação está saudável.

### Benchmarking Comparativo
Compare o desempenho do squad com as médias anônimas do mercado. Indique onde estão acima ou abaixo da média em margem, receita e participação. Compare as margens por categoria com a mediana do mercado.${marketAggregates.totalSquads < 2 ? ' (Se houver apenas 1 squad, pule esta seção informando que não há dados comparativos.)' : ''}

### Resumo do Mercado
Descreva de forma agregada e anônima o que o mercado fez nesta rodada: tendência geral de margens, nível de competitividade, dispersão de resultados.${marketAggregates.totalSquads < 2 ? ' (Se houver apenas 1 squad, pule esta seção.)' : ''}

### Recomendação para a Próxima Rodada
2-3 ações concretas e específicas baseadas nos dados desta rodada, no histórico e no posicionamento relativo ao mercado.

Seja direto, pedagógico e use os números reais do DRE. Não use jargão excessivo. Escreva para gestores em formação.`;
}

function buildGmPrompt(input: GmReportInput): string {
  const { roundNumber, allSquadResults, ranking, marketAggregates } = input;

  const squadsText = allSquadResults.map((s) => {
    const decisionsText = s.decisions.map((d) =>
      `    - ${d.categoryName}: margem ${(d.margin * 100).toFixed(1)}%, volume ${d.salesVolume}`
    ).join('\n');
    return `  **${s.squadName}** (${s.storeName})
  - EBITDA: ${fmt(s.dre.ebitda)} | Margem: ${(s.dre.ebitdaMargin * 100).toFixed(2)}% | Part. Mercado: ${pct(s.dre.demandShare)}
  - Quebras: ${fmt(s.dre.totalBreakage)} | Aging: ${fmt(s.dre.totalAging)} | Outros Gastos: ${fmt(s.dre.otherExpenses)}
  - Decisões:
${decisionsText}`;
  }).join('\n\n');

  const rankingText = ranking.map((r) =>
    `  ${r.position}º ${r.squadName}: margem EBITDA ${(r.ebitdaMargin * 100).toFixed(2)}%, part. mercado ${pct(r.demandShare)}`
  ).join('\n');

  return `Você é um consultor pedagógico especializado em treinamento de gestores de varejo. Analise os resultados da rodada abaixo e gere um relatório para o Game Master (instrutor) que precisa entender os padrões comportamentais dos participantes para conduzir o debriefing.

## Dados da Rodada #${roundNumber} — ${allSquadResults.length} squads

### Métricas Consolidadas
- Margem EBITDA média: ${(marketAggregates.avgEbitdaMargin * 100).toFixed(2)}%
- Participação de mercado média: ${pct(marketAggregates.avgDemandShare)}
- Receita bruta média: ${fmt(marketAggregates.avgGrossRevenue)}
- Margens medianas por categoria:
${marketAggregates.medianMarginByCategory.map((c) => `  - ${c.categoryName}: ${(c.medianMargin * 100).toFixed(1)}%`).join('\n')}

### Ranking
${rankingText}

### Detalhamento por Squad
${squadsText}

## Instruções para o relatório

Gere um relatório com exatamente estas 5 seções em markdown, usando os títulos abaixo:

### Visão Geral da Rodada
Resumo executivo da rodada: saúde geral do mercado simulado, dispersão de resultados, nível de competitividade entre os squads.

### Padrões Comportamentais
Identifique padrões nas decisões dos gestores: estratégias comuns (ex: todos priorizaram margem alta), divergências significativas, comportamentos de risco vs. conservadores. Analise se há convergência ou divergência nas abordagens.

### Destaques Individuais
Para cada squad, uma nota breve (2-3 frases) sobre o padrão de decisão observado — não repita o DRE, foque no COMPORTAMENTO: perfil de risco, estratégia de precificação, gestão de custos operacionais.

### Pontos de Atenção Pedagógicos
Identifique conceitos que os participantes parecem não dominar com base nas decisões tomadas (ex: relação margem-volume, impacto de quebras, gestão de CAPEX). Sugira tópicos para reforço.

### Sugestões para Debriefing
3-4 perguntas provocativas que o Game Master pode usar na discussão pós-rodada para estimular reflexão e aprendizado entre os participantes.

Seja analítico, pedagógico e objetivo. Use os números para embasar suas observações. Escreva para um instrutor experiente que precisa de insights acionáveis.`;
}

export async function generateAiReport(input: AiReportInput): Promise<string | null> {
  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
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
      message: 'Falha ao gerar relatório de IA (player)',
      error: error.message,
      timestamp: new Date().toISOString(),
    }));
    return null;
  }
}

export async function generateGmReport(input: GmReportInput): Promise<string | null> {
  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: 'Você é um consultor pedagógico especializado em treinamento de gestores de varejo. Seu público é o Game Master (instrutor) que conduz simulações de gestão. Seus relatórios são analíticos, focados em padrões comportamentais e pedagogicamente acionáveis. Responda sempre em português brasileiro.',
        },
        {
          role: 'user',
          content: buildGmPrompt(input),
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
      message: 'Falha ao gerar relatório de IA (game master)',
      error: error.message,
      timestamp: new Date().toISOString(),
    }));
    return null;
  }
}
