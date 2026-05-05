import prisma from '../../utils/prisma';
import { getRanking } from '../../services/rankingService';

jest.mock('../../utils/prisma', () => ({
  __esModule: true,
  default: {
    financialResult: {
      findMany: jest.fn(),
    },
  },
}));

const mockFindMany = (prisma.financialResult.findMany as jest.Mock);

interface MockResult {
  id: string;
  ebitdaMargin: number;
  ebitda: number;
  grossRevenue: number;
  netRevenue: number;
  store: {
    id: string;
    name: string;
    squad: { id: string; name: string };
  };
}

const makeResult = (overrides: Partial<MockResult> = {}): MockResult => ({
  id: 'r-' + Math.random(),
  ebitdaMargin: 0,
  ebitda: 0,
  grossRevenue: 0,
  netRevenue: 0,
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

  test('1. ordena por ebitdaMargin DESC como critério primário', async () => {
    mockFindMany.mockResolvedValue([
      makeResult({ ebitdaMargin: 10, ebitda: 100, store: { id: 's1', name: 'A', squad: { id: 'sqA', name: 'A' } } }),
      makeResult({ ebitdaMargin: 30, ebitda: 50,  store: { id: 's2', name: 'B', squad: { id: 'sqB', name: 'B' } } }),
      makeResult({ ebitdaMargin: 20, ebitda: 200, store: { id: 's3', name: 'C', squad: { id: 'sqC', name: 'C' } } }),
    ]);

    const ranking = await getRanking('round-1');

    expect(ranking[0].ebitdaMargin).toBe(30);
    expect(ranking[1].ebitdaMargin).toBe(20);
    expect(ranking[2].ebitdaMargin).toBe(10);
  });

  test('2. desempate por ebitda DESC quando ebitdaMargin é igual', async () => {
    mockFindMany.mockResolvedValue([
      makeResult({ ebitdaMargin: 25, ebitda: 100, store: { id: 's1', name: 'A', squad: { id: 'sqA', name: 'A' } } }),
      makeResult({ ebitdaMargin: 25, ebitda: 300, store: { id: 's2', name: 'B', squad: { id: 'sqB', name: 'B' } } }),
      makeResult({ ebitdaMargin: 25, ebitda: 200, store: { id: 's3', name: 'C', squad: { id: 'sqC', name: 'C' } } }),
    ]);

    const ranking = await getRanking('round-1');

    expect(ranking[0].ebitda).toBe(300);
    expect(ranking[1].ebitda).toBe(200);
    expect(ranking[2].ebitda).toBe(100);
  });

  test('3. retorna array vazio se não há FinancialResult', async () => {
    mockFindMany.mockResolvedValue([]);

    const ranking = await getRanking('round-1');

    expect(ranking).toEqual([]);
  });

  test('4. retorna apenas os campos esperados no RankingEntry', async () => {
    mockFindMany.mockResolvedValue([
      makeResult({
        ebitdaMargin: 10,
        ebitda: 100,
        grossRevenue: 1000,
        netRevenue: 800,
        store: { id: 's1', name: 'Loja A', squad: { id: 'sqA', name: 'Squad A' } },
      }),
    ]);

    const ranking = await getRanking('round-1');
    const item = ranking[0];

    expect(item).toHaveProperty('position');
    expect(item).toHaveProperty('squadId');
    expect(item).toHaveProperty('squadName');
    expect(item).toHaveProperty('storeName');
    expect(item).toHaveProperty('ebitdaMargin');
    expect(item).toHaveProperty('ebitda');
    expect(item).toHaveProperty('grossRevenue');
    expect(item).toHaveProperty('netRevenue');
    expect(item).not.toHaveProperty('itemBreakdown');
    expect(item).not.toHaveProperty('costs');
  });

  test('5. position começa em 1 e incrementa corretamente', async () => {
    mockFindMany.mockResolvedValue([
      makeResult({ ebitdaMargin: 40, store: { id: 's1', name: 'A', squad: { id: 'sq1', name: 'A' } } }),
      makeResult({ ebitdaMargin: 30, store: { id: 's2', name: 'B', squad: { id: 'sq2', name: 'B' } } }),
      makeResult({ ebitdaMargin: 20, store: { id: 's3', name: 'C', squad: { id: 'sq3', name: 'C' } } }),
      makeResult({ ebitdaMargin: 10, store: { id: 's4', name: 'D', squad: { id: 'sq4', name: 'D' } } }),
    ]);

    const ranking = await getRanking('round-1');

    expect(ranking.map((r) => r.position)).toEqual([1, 2, 3, 4]);
  });
});
