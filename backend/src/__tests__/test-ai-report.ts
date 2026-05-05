import { generateAiReport } from '../services/aiReportService';

async function main() {
  console.log('Iniciando teste aiReportService...');
  console.log('OPENAI_API_KEY presente:', !!process.env.OPENAI_API_KEY);

  const result = await generateAiReport({
    squadName: 'Squad Alpha',
    storeName: 'Loja Alpha',
    roundNumber: 1,
    dre: {
      grossRevenue: 50000, taxes: 5000, netRevenue: 45000, costs: 20000,
      grossMargin: 25000, totalBreakage: 500, totalAging: 300,
      netMarginMass: 24200, otherExpenses: 15000, ebitda: 9200,
      ebitdaMargin: 0.204, demandShare: 0.55,
    },
    decisions: [{ categoryName: 'Perecíveis', margin: 0.35, salesVolume: 250 }],
    history: [],
    ranking: [
      { position: 1, squadName: 'Squad Alpha', ebitdaMargin: 0.204, demandShare: 0.55 },
      { position: 2, squadName: 'Squad Beta', ebitdaMargin: 0.15, demandShare: 0.45 },
    ],
  });

  if (result) {
    console.log('✓ Relatório gerado com sucesso!');
    console.log('Preview (300 chars):', result.substring(0, 300));
  } else {
    console.log('✗ Relatório retornou null');
  }
}

main().catch((e) => { console.error('Erro:', e.message); process.exit(1); });
