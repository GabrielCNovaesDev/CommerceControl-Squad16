// Mock @prisma/client antes de importar o serviço
const mockFindMany = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    financialResult: {
      findMany: mockFindMany,
    },
  })),
}));

const rankingService = require('../../services/rankingService');

const makeResult = (overrides) => ({
  id: 'r-' + Math.random(),
  netMargin: 0,
  netProfit: 0,
  grossRevenue: 0,
  store: {
    id: 's-1',
    name: 'Loja',
    squad: { id: 'sq-1', name: 'Squad' },
  },
  ...overrides,
});

describe('rankingService', () => {
  beforeEach(() => {
    mockFindMany.mockReset();
  });

  test('1. ordena por netMargin DESC como critério primário', async () => {
    mockFindMany.mockResolvedValue([
      makeResult({ netMargin: 10, netProfit: 100, store: { id: 's1', name: 'A', squad: { id: 'sqA', name: 'A' } } }),
      makeResult({ netMargin: 30, netProfit: 50, store: { id: 's2', name: 'B', squad: { id: 'sqB', name: 'B' } } }),
      makeResult({ netMargin: 20, netProfit: 200, store: { id: 's3', name: 'C', squad: { id: 'sqC', name: 'C' } } }),
    ]);

    const ranking = await rankingService.getRanking('round-1');

    expect(ranking[0].netMargin).toBe(30);
    expect(ranking[1].netMargin).toBe(20);
    expect(ranking[2].netMargin).toBe(10);
  });

  test('2. desempate por netProfit DESC quando netMargin é igual', async () => {
    mockFindMany.mockResolvedValue([
      makeResult({ netMargin: 25, netProfit: 100, store: { id: 's1', name: 'A', squad: { id: 'sqA', name: 'A' } } }),
      makeResult({ netMargin: 25, netProfit: 300, store: { id: 's2', name: 'B', squad: { id: 'sqB', name: 'B' } } }),
      makeResult({ netMargin: 25, netProfit: 200, store: { id: 's3', name: 'C', squad: { id: 'sqC', name: 'C' } } }),
    ]);

    const ranking = await rankingService.getRanking('round-1');

    expect(ranking[0].netProfit).toBe(300);
    expect(ranking[1].netProfit).toBe(200);
    expect(ranking[2].netProfit).toBe(100);
  });

  test('3. retorna array vazio se não há FinancialResult', async () => {
    mockFindMany.mockResolvedValue([]);

    const ranking = await rankingService.getRanking('round-1');

    expect(ranking).toEqual([]);
  });

  test('4. não expõe itemBreakdown nem campos internos', async () => {
    mockFindMany.mockResolvedValue([
      makeResult({
        netMargin: 10,
        netProfit: 100,
        grossRevenue: 1000,
        costs: 500, // não deve aparecer
        grossProfit: 500, // não deve aparecer
        itemBreakdown: [{ x: 1 }], // não deve aparecer
        store: { id: 's1', name: 'A', squad: { id: 'sqA', name: 'A' } },
      }),
    ]);

    const ranking = await rankingService.getRanking('round-1');
    const item = ranking[0];

    expect(item).toHaveProperty('position');
    expect(item).toHaveProperty('squadId');
    expect(item).toHaveProperty('squadName');
    expect(item).toHaveProperty('storeName');
    expect(item).toHaveProperty('netMargin');
    expect(item).toHaveProperty('netProfit');
    expect(item).toHaveProperty('grossRevenue');
    expect(item).not.toHaveProperty('itemBreakdown');
    expect(item).not.toHaveProperty('costs');
    expect(item).not.toHaveProperty('grossProfit');
  });

  test('5. position começa em 1 e incrementa corretamente', async () => {
    mockFindMany.mockResolvedValue([
      makeResult({ netMargin: 40 }),
      makeResult({ netMargin: 30 }),
      makeResult({ netMargin: 20 }),
      makeResult({ netMargin: 10 }),
    ]);

    const ranking = await rankingService.getRanking('round-1');

    expect(ranking.map((r) => r.position)).toEqual([1, 2, 3, 4]);
  });
});
