const {
  calcularDRE,
  calcularDREPreview,
  gerarFeedback,
} = require('../../services/financeService');

/**
 * Helpers para construir fixtures legíveis
 */
const makeItem = (productId, salePrice, salesVolume, purchasePrice) => ({
  productId,
  salePrice,
  salesVolume,
  product: { purchasePrice },
});

const makeInventory = (productId, quantity) => ({ productId, quantity });

describe('financeService', () => {
  // ──────────────────────────────────────────────────────
  describe('calcularDRE()', () => {
    test('1. calcula corretamente com volume dentro do estoque disponível', () => {
      const roundConfig = { fixedExpenses: 100, variableExpenses: 50 };
      const items = [makeItem('p1', 20, 10, 12)];
      const inventory = [makeInventory('p1', 100)];

      const dre = calcularDRE(roundConfig, items, inventory);

      expect(dre.grossRevenue).toBe(200); // 20 * 10
      expect(dre.costs).toBe(120); // 12 * 10
      expect(dre.expenses).toBe(150); // 100 + 50
      expect(dre.grossProfit).toBe(80); // 200 - 120
      expect(dre.netProfit).toBe(-70); // 80 - 150
      expect(dre.netMargin).toBeCloseTo(-35); // -70 / 200 * 100
      expect(dre.itemBreakdown[0].effectiveVolume).toBe(10);
      expect(dre.itemBreakdown[0].stockLimited).toBe(false);
    });

    test('2. limita salesVolume pelo estoque disponível (effectiveVolume = min)', () => {
      const roundConfig = { fixedExpenses: 0, variableExpenses: 0 };
      const items = [makeItem('p1', 10, 50, 5)];
      const inventory = [makeInventory('p1', 20)];

      const dre = calcularDRE(roundConfig, items, inventory);

      expect(dre.itemBreakdown[0].effectiveVolume).toBe(20);
      expect(dre.itemBreakdown[0].stockLimited).toBe(true);
      expect(dre.itemBreakdown[0].plannedVolume).toBe(50);
      expect(dre.grossRevenue).toBe(200); // 10 * 20
      expect(dre.costs).toBe(100); // 5 * 20
    });

    test('3. produto com estoque zero gera itemRevenue = 0 e itemCost = 0', () => {
      const roundConfig = { fixedExpenses: 0, variableExpenses: 0 };
      const items = [makeItem('p1', 100, 10, 50)];
      const inventory = [makeInventory('p1', 0)];

      const dre = calcularDRE(roundConfig, items, inventory);

      expect(dre.itemBreakdown[0].itemRevenue).toBe(0);
      expect(dre.itemBreakdown[0].itemCost).toBe(0);
      expect(dre.itemBreakdown[0].effectiveVolume).toBe(0);
      expect(dre.itemBreakdown[0].stockLimited).toBe(true);
      expect(dre.grossRevenue).toBe(0);
      expect(dre.costs).toBe(0);
    });

    test('4. grossRevenue = 0 → netMargin = 0 (guard contra divisão por zero)', () => {
      const roundConfig = { fixedExpenses: 100, variableExpenses: 50 };
      const items = [makeItem('p1', 10, 5, 6)];
      const inventory = [makeInventory('p1', 0)];

      const dre = calcularDRE(roundConfig, items, inventory);

      expect(dre.grossRevenue).toBe(0);
      expect(dre.netMargin).toBe(0);
      expect(dre.netMargin).not.toBeNaN();
      expect(Number.isFinite(dre.netMargin)).toBe(true);
    });

    test('5. múltiplos produtos com estoques diferentes — agregação correta', () => {
      const roundConfig = { fixedExpenses: 0, variableExpenses: 0 };
      const items = [
        makeItem('p1', 20, 10, 10), // revenue 200, cost 100
        makeItem('p2', 30, 5, 15),  // revenue 150, cost 75
        makeItem('p3', 50, 4, 30),  // revenue 200, cost 120
      ];
      const inventory = [
        makeInventory('p1', 100),
        makeInventory('p2', 100),
        makeInventory('p3', 100),
      ];

      const dre = calcularDRE(roundConfig, items, inventory);

      expect(dre.grossRevenue).toBe(550); // 200 + 150 + 200
      expect(dre.costs).toBe(295); // 100 + 75 + 120
      expect(dre.grossProfit).toBe(255);
      expect(dre.itemBreakdown).toHaveLength(3);
    });

    test('6. netProfit negativo (prejuízo) — valor é negativo, não zerado', () => {
      const roundConfig = { fixedExpenses: 1000, variableExpenses: 500 };
      const items = [makeItem('p1', 10, 10, 8)];
      const inventory = [makeInventory('p1', 100)];

      const dre = calcularDRE(roundConfig, items, inventory);

      expect(dre.grossProfit).toBe(20); // (10-8) * 10
      expect(dre.netProfit).toBe(-1480); // 20 - 1500
      expect(dre.netProfit).toBeLessThan(0);
    });

    test('7. expenses corretamente somando fixedExpenses + variableExpenses', () => {
      const roundConfig = { fixedExpenses: 333.33, variableExpenses: 166.67 };
      const items = [makeItem('p1', 1, 1, 1)];
      const inventory = [makeInventory('p1', 1)];

      const dre = calcularDRE(roundConfig, items, inventory);

      expect(dre.expenses).toBeCloseTo(500);
    });

    test('8. itemBreakdown.stockLimited true quando volume foi limitado, false caso contrário', () => {
      const roundConfig = { fixedExpenses: 0, variableExpenses: 0 };
      const items = [
        makeItem('p1', 10, 5, 5),  // ok
        makeItem('p2', 10, 100, 5), // limitado
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
      const roundConfig = { fixedExpenses: 0, variableExpenses: 0 };
      const items = [makeItem('p1', 10, 5, 5)];
      const inventory = []; // vazio

      const dre = calcularDRE(roundConfig, items, inventory);

      expect(dre.itemBreakdown[0].effectiveVolume).toBe(0);
      expect(dre.grossRevenue).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────
  describe('calcularDREPreview()', () => {
    test('retorna preview: true e mesmos valores de calcularDRE', () => {
      const roundConfig = { fixedExpenses: 100, variableExpenses: 50 };
      const items = [makeItem('p1', 20, 10, 12)];
      const inventory = [makeInventory('p1', 100)];

      const dre = calcularDRE(roundConfig, items, inventory);
      const preview = calcularDREPreview(roundConfig, items, inventory);

      expect(preview.preview).toBe(true);
      expect(preview.grossRevenue).toBe(dre.grossRevenue);
      expect(preview.costs).toBe(dre.costs);
      expect(preview.expenses).toBe(dre.expenses);
      expect(preview.netProfit).toBe(dre.netProfit);
      expect(preview.netMargin).toBe(dre.netMargin);
      expect(preview.itemBreakdown).toEqual(dre.itemBreakdown);
    });
  });

  // ──────────────────────────────────────────────────────
  describe('gerarFeedback()', () => {
    const dreOk = {
      grossRevenue: 1000,
      costs: 400,
      expenses: 200,
      grossProfit: 600,
      netProfit: 400,
      netMargin: 40,
      itemBreakdown: [{ stockLimited: false }],
    };

    test('1. netProfit < 0 gera mensagem de prejuízo', () => {
      const dre = { ...dreOk, netProfit: -100 };
      const fb = gerarFeedback(dre);
      expect(fb.some((m) => m.toLowerCase().includes('prejuízo'))).toBe(true);
    });

    test('2. costs > grossRevenue gera mensagem de custo > receita', () => {
      const dre = { ...dreOk, costs: 1500 };
      const fb = gerarFeedback(dre);
      expect(fb.some((m) => m.includes('custo de compra'))).toBe(true);
    });

    test('3. expenses > grossProfit gera mensagem de despesas consumiram lucro', () => {
      const dre = { ...dreOk, expenses: 700 };
      const fb = gerarFeedback(dre);
      expect(fb.some((m) => m.includes('despesas'))).toBe(true);
    });

    test('4. produtos com stockLimited geram mensagem de estoque limitado', () => {
      const dre = {
        ...dreOk,
        itemBreakdown: [
          { stockLimited: true },
          { stockLimited: true },
          { stockLimited: false },
        ],
      };
      const fb = gerarFeedback(dre);
      expect(fb.some((m) => m.includes('2 produto'))).toBe(true);
    });

    test('5. grossRevenue = 0 gera mensagem de nenhuma receita', () => {
      const dre = { ...dreOk, grossRevenue: 0, netProfit: -200 };
      const fb = gerarFeedback(dre);
      expect(fb.some((m) => m.includes('Nenhuma receita'))).toBe(true);
    });

    test('6. DRE saudável → array sem mensagens negativas', () => {
      const fb = gerarFeedback(dreOk);
      expect(fb).toEqual([]);
    });
  });
});
