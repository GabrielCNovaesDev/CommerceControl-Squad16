import { calcularDRE, calcularDREPreview, gerarFeedback, DREItem, InventoryEntry, RoundConfigInput } from '../../services/financeService';

const makeItem = (productId: string, margin: number, salesVolume: number, purchasePrice: number, taxRate = 0, breakageRate = 0, agingRate = 0): DREItem => ({
  productId,
  margin,
  salesVolume,
  product: { purchasePrice, taxRate, breakageRate, agingRate },
});

const makeInventory = (productId: string, quantity: number): InventoryEntry => ({ productId, quantity });

describe('financeService', () => {
  describe('calcularDRE()', () => {
    test('1. calcula corretamente com volume dentro do estoque disponível', () => {
      const roundConfig: RoundConfigInput = { otherExpenses: 150 };
      const items = [makeItem('p1', 0.667, 10, 12)]; // margin ~66.7% → salePrice ≈ 20
      const inventory = [makeInventory('p1', 100)];

      const dre = calcularDRE(roundConfig, items, inventory);

      expect(dre.itemBreakdown[0].effectiveVolume).toBe(10);
      expect(dre.itemBreakdown[0].stockLimited).toBe(false);
      expect(dre.grossRevenue).toBeGreaterThan(0);
    });

    test('2. limita salesVolume pelo estoque disponível (effectiveVolume = min)', () => {
      const roundConfig: RoundConfigInput = { otherExpenses: 0 };
      const items = [makeItem('p1', 0, 50, 5)];
      const inventory = [makeInventory('p1', 20)];

      const dre = calcularDRE(roundConfig, items, inventory);

      expect(dre.itemBreakdown[0].effectiveVolume).toBe(20);
      expect(dre.itemBreakdown[0].stockLimited).toBe(true);
      expect(dre.itemBreakdown[0].plannedVolume).toBe(50);
    });

    test('3. produto com estoque zero gera itemRevenue = 0 e itemCost = 0', () => {
      const roundConfig: RoundConfigInput = { otherExpenses: 0 };
      const items = [makeItem('p1', 1, 10, 50)];
      const inventory = [makeInventory('p1', 0)];

      const dre = calcularDRE(roundConfig, items, inventory);

      expect(dre.itemBreakdown[0].itemRevenue).toBe(0);
      expect(dre.itemBreakdown[0].itemCost).toBe(0);
      expect(dre.itemBreakdown[0].effectiveVolume).toBe(0);
      expect(dre.itemBreakdown[0].stockLimited).toBe(true);
      expect(dre.grossRevenue).toBe(0);
      expect(dre.costs).toBe(0);
    });

    test('4. grossRevenue = 0 → ebitdaMargin = 0 (guard contra divisão por zero)', () => {
      const roundConfig: RoundConfigInput = { otherExpenses: 150 };
      const items = [makeItem('p1', 1, 5, 6)];
      const inventory = [makeInventory('p1', 0)];

      const dre = calcularDRE(roundConfig, items, inventory);

      expect(dre.grossRevenue).toBe(0);
      expect(dre.ebitdaMargin).toBe(0);
      expect(Number.isFinite(dre.ebitdaMargin)).toBe(true);
    });

    test('5. múltiplos produtos com estoques diferentes — agregação correta', () => {
      const roundConfig: RoundConfigInput = { otherExpenses: 0 };
      const items = [
        makeItem('p1', 1, 10, 10), // salePrice = 20, revenue = 200, cost = 100
        makeItem('p2', 1, 5, 15),  // salePrice = 30, revenue = 150, cost = 75
        makeItem('p3', 1, 4, 25),  // salePrice = 50, revenue = 200, cost = 100
      ];
      const inventory = [
        makeInventory('p1', 100),
        makeInventory('p2', 100),
        makeInventory('p3', 100),
      ];

      const dre = calcularDRE(roundConfig, items, inventory);

      expect(dre.grossRevenue).toBeCloseTo(550);
      expect(dre.costs).toBeCloseTo(275);
      expect(dre.itemBreakdown).toHaveLength(3);
    });

    test('6. ebitda negativo (prejuízo) — valor é negativo, não zerado', () => {
      const roundConfig: RoundConfigInput = { otherExpenses: 1500 };
      const items = [makeItem('p1', 0.25, 10, 8)]; // salePrice = 10, revenue = 100, cost = 80
      const inventory = [makeInventory('p1', 100)];

      const dre = calcularDRE(roundConfig, items, inventory);

      expect(dre.ebitda).toBeLessThan(0);
    });

    test('7. itemBreakdown.stockLimited true quando volume foi limitado, false caso contrário', () => {
      const roundConfig: RoundConfigInput = { otherExpenses: 0 };
      const items = [
        makeItem('p1', 1, 5, 5),   // ok
        makeItem('p2', 1, 100, 5), // limitado
      ];
      const inventory = [
        makeInventory('p1', 10),
        makeInventory('p2', 30),
      ];

      const dre = calcularDRE(roundConfig, items, inventory);

      expect(dre.itemBreakdown[0].stockLimited).toBe(false);
      expect(dre.itemBreakdown[1].stockLimited).toBe(true);
      expect(dre.itemBreakdown[1].effectiveVolume).toBe(30);
    });

    test('extra: produto sem entrada no inventory → quantity tratada como 0', () => {
      const roundConfig: RoundConfigInput = { otherExpenses: 0 };
      const items = [makeItem('p1', 1, 5, 5)];
      const inventory: InventoryEntry[] = []; // vazio

      const dre = calcularDRE(roundConfig, items, inventory);

      expect(dre.itemBreakdown[0].effectiveVolume).toBe(0);
      expect(dre.grossRevenue).toBe(0);
    });
  });

  describe('calcularDREPreview()', () => {
    test('retorna preview: true e mesmos valores de calcularDRE', () => {
      const roundConfig: RoundConfigInput = { otherExpenses: 150 };
      const items = [makeItem('p1', 1, 10, 12)];
      const inventory = [makeInventory('p1', 100)];

      const dre = calcularDRE(roundConfig, items, inventory);
      const preview = calcularDREPreview(roundConfig, items, inventory);

      expect(preview.preview).toBe(true);
      expect(preview.grossRevenue).toBe(dre.grossRevenue);
      expect(preview.costs).toBe(dre.costs);
      expect(preview.ebitda).toBe(dre.ebitda);
      expect(preview.itemBreakdown).toEqual(dre.itemBreakdown);
    });
  });

  describe('gerarFeedback()', () => {
    const dreOk = {
      grossRevenue: 1000,
      taxes: 100,
      netRevenue: 900,
      costs: 400,
      grossMargin: 500,
      totalBreakage: 10,
      totalAging: 10,
      netMarginMass: 480,
      otherExpenses: 80,
      ebitda: 400,
      ebitdaMargin: 44.4,
      itemBreakdown: [{ productId: 'p1', plannedVolume: 10, effectiveVolume: 10, unsold: 0, stockLimited: false, salePrice: 100, margin: 0.5, itemRevenue: 1000, itemTax: 100, itemCost: 400, itemBreakage: 10, itemAging: 10, itemGrossMargin: 500 }],
    };

    test('1. ebitda < 0 gera mensagem de prejuízo', () => {
      const dre = { ...dreOk, ebitda: -100 };
      const fb = gerarFeedback(dre);
      expect(fb.some((m) => m.toLowerCase().includes('prejuízo'))).toBe(true);
    });

    test('2. costs > netRevenue gera mensagem de custo > receita', () => {
      const dre = { ...dreOk, costs: 1500 };
      const fb = gerarFeedback(dre);
      expect(fb.some((m) => m.toLowerCase().includes('custo de venda'))).toBe(true);
    });

    test('3. grossRevenue = 0 gera mensagem de nenhuma receita', () => {
      const dre = { ...dreOk, grossRevenue: 0, ebitda: -200 };
      const fb = gerarFeedback(dre);
      expect(fb.some((m) => m.includes('Nenhuma receita'))).toBe(true);
    });

    test('4. produtos com stockLimited geram mensagem de estoque limitado', () => {
      const dre = {
        ...dreOk,
        itemBreakdown: [
          { ...dreOk.itemBreakdown[0], stockLimited: true },
          { ...dreOk.itemBreakdown[0], productId: 'p2', stockLimited: true },
          { ...dreOk.itemBreakdown[0], productId: 'p3', stockLimited: false },
        ],
      };
      const fb = gerarFeedback(dre);
      expect(fb.some((m) => m.includes('2 categoria'))).toBe(true);
    });

    test('5. DRE saudável → array vazio', () => {
      const fb = gerarFeedback(dreOk);
      expect(fb).toEqual([]);
    });
  });
});
