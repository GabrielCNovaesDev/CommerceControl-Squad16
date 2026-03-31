const { calcularDRE, calcularDREPreview, gerarFeedback } = require('./financeService');

// Fixtures reutilizáveis
const roundConfigNormal = { fixedExpenses: 500, variableExpenses: 200 };

const itemsNormal = [
  {
    productId: 'prod-arroz',
    salePrice: 18.00,
    salesVolume: 50,
    product: { purchasePrice: 12.00 },
  },
  {
    productId: 'prod-feijao',
    salePrice: 7.50,
    salesVolume: 30,
    product: { purchasePrice: 4.50 },
  },
];

const inventoryFull = [
  { productId: 'prod-arroz', quantity: 100 },
  { productId: 'prod-feijao', quantity: 100 },
];

// ─────────────────────────────────────────────
// calcularDRE — cenário normal
// ─────────────────────────────────────────────
describe('calcularDRE — cenário normal', () => {
  let dre;

  beforeEach(() => {
    dre = calcularDRE(roundConfigNormal, itemsNormal, inventoryFull);
  });

  test('calcula grossRevenue corretamente', () => {
    // (18 * 50) + (7.50 * 30) = 900 + 225 = 1125
    expect(dre.grossRevenue).toBeCloseTo(1125);
  });

  test('calcula costs corretamente', () => {
    // (12 * 50) + (4.50 * 30) = 600 + 135 = 735
    expect(dre.costs).toBeCloseTo(735);
  });

  test('calcula expenses corretamente', () => {
    // 500 + 200 = 700
    expect(dre.expenses).toBeCloseTo(700);
  });

  test('calcula grossProfit corretamente', () => {
    // 1125 - 735 = 390
    expect(dre.grossProfit).toBeCloseTo(390);
  });

  test('calcula netProfit corretamente', () => {
    // 390 - 700 = -310
    expect(dre.netProfit).toBeCloseTo(-310);
  });

  test('calcula netMargin corretamente', () => {
    // (-310 / 1125) * 100 ≈ -27.56
    expect(dre.netMargin).toBeCloseTo(-27.56, 1);
  });

  test('retorna itemBreakdown com um registro por produto', () => {
    expect(dre.itemBreakdown).toHaveLength(2);
  });

  test('nenhum item é marcado como stockLimited', () => {
    expect(dre.itemBreakdown.every((i) => i.stockLimited === false)).toBe(true);
  });

  test('effectiveVolume igual ao salesVolume quando estoque suficiente', () => {
    expect(dre.itemBreakdown[0].effectiveVolume).toBe(50);
    expect(dre.itemBreakdown[1].effectiveVolume).toBe(30);
  });
});

// ─────────────────────────────────────────────
// calcularDRE — volume limitado pelo estoque
// ─────────────────────────────────────────────
describe('calcularDRE — volume limitado pelo estoque', () => {
  const inventoryLimitado = [
    { productId: 'prod-arroz', quantity: 20 }, // menos que salesVolume 50
    { productId: 'prod-feijao', quantity: 100 },
  ];

  let dre;

  beforeEach(() => {
    dre = calcularDRE(roundConfigNormal, itemsNormal, inventoryLimitado);
  });

  test('effectiveVolume é limitado ao estoque disponível', () => {
    const arroz = dre.itemBreakdown.find((i) => i.productId === 'prod-arroz');
    expect(arroz.effectiveVolume).toBe(20);
    expect(arroz.plannedVolume).toBe(50);
  });

  test('item com estoque insuficiente é marcado como stockLimited', () => {
    const arroz = dre.itemBreakdown.find((i) => i.productId === 'prod-arroz');
    expect(arroz.stockLimited).toBe(true);
  });

  test('item com estoque suficiente não é marcado como stockLimited', () => {
    const feijao = dre.itemBreakdown.find((i) => i.productId === 'prod-feijao');
    expect(feijao.stockLimited).toBe(false);
  });

  test('grossRevenue usa effectiveVolume, não salesVolume', () => {
    // (18 * 20) + (7.50 * 30) = 360 + 225 = 585
    expect(dre.grossRevenue).toBeCloseTo(585);
  });

  test('produto sem estoque no inventory tem effectiveVolume zero', () => {
    const inventorySemProduto = [{ productId: 'prod-feijao', quantity: 100 }];
    const dreLocal = calcularDRE(roundConfigNormal, itemsNormal, inventorySemProduto);
    const arroz = dreLocal.itemBreakdown.find((i) => i.productId === 'prod-arroz');
    expect(arroz.effectiveVolume).toBe(0);
  });
});

// ─────────────────────────────────────────────
// calcularDRE — divisão por zero (grossRevenue = 0)
// ─────────────────────────────────────────────
describe('calcularDRE — grossRevenue igual a zero', () => {
  test('netMargin retorna 0 quando grossRevenue é 0', () => {
    const inventoryVazio = [
      { productId: 'prod-arroz', quantity: 0 },
      { productId: 'prod-feijao', quantity: 0 },
    ];
    const dre = calcularDRE(roundConfigNormal, itemsNormal, inventoryVazio);
    expect(dre.grossRevenue).toBe(0);
    expect(dre.netMargin).toBe(0);
  });

  test('não lança exceção quando não há itens', () => {
    expect(() => calcularDRE(roundConfigNormal, [], [])).not.toThrow();
  });

  test('retorna todos os campos zerados com itens e estoque vazio', () => {
    const inventoryVazio = [{ productId: 'prod-arroz', quantity: 0 }];
    const items = [{ productId: 'prod-arroz', salePrice: 18, salesVolume: 50, product: { purchasePrice: 12 } }];
    const dre = calcularDRE(roundConfigNormal, items, inventoryVazio);
    expect(dre.grossRevenue).toBe(0);
    expect(dre.costs).toBe(0);
    expect(dre.grossProfit).toBe(0);
  });
});

// ─────────────────────────────────────────────
// calcularDREPreview
// ─────────────────────────────────────────────
describe('calcularDREPreview', () => {
  test('retorna campo preview: true', () => {
    const result = calcularDREPreview(roundConfigNormal, itemsNormal, inventoryFull);
    expect(result.preview).toBe(true);
  });

  test('produz os mesmos valores financeiros que calcularDRE', () => {
    const dre = calcularDRE(roundConfigNormal, itemsNormal, inventoryFull);
    const preview = calcularDREPreview(roundConfigNormal, itemsNormal, inventoryFull);
    expect(preview.grossRevenue).toBe(dre.grossRevenue);
    expect(preview.netProfit).toBe(dre.netProfit);
    expect(preview.netMargin).toBe(dre.netMargin);
  });
});

// ─────────────────────────────────────────────
// gerarFeedback
// ─────────────────────────────────────────────
describe('gerarFeedback — prejuízo', () => {
  test('alerta de prejuízo quando netProfit < 0', () => {
    const dre = calcularDRE(roundConfigNormal, itemsNormal, inventoryFull);
    // netProfit = -310 neste cenário
    const feedbacks = gerarFeedback(dre);
    expect(feedbacks).toContain('Resultado negativo: sua loja teve prejuízo nesta rodada.');
  });

  test('alerta de despesas consumindo lucro bruto', () => {
    // expenses (700) > grossProfit (390)
    const dre = calcularDRE(roundConfigNormal, itemsNormal, inventoryFull);
    const feedbacks = gerarFeedback(dre);
    expect(feedbacks).toContain(
      'Suas despesas consumiram todo o lucro bruto. Considere reduzir gastos fixos ou variáveis.'
    );
  });

  test('alerta de estoque limitante quando há itens stockLimited', () => {
    const inventoryLimitado = [
      { productId: 'prod-arroz', quantity: 10 },
      { productId: 'prod-feijao', quantity: 100 },
    ];
    const dre = calcularDRE(roundConfigNormal, itemsNormal, inventoryLimitado);
    const feedbacks = gerarFeedback(dre);
    expect(feedbacks).toContain(
      '1 produto(s) tiveram volume de vendas limitado pelo estoque disponível. Revise seu Inventory.'
    );
  });

  test('alerta de receita zero quando estoque está vazio', () => {
    const inventoryVazio = [
      { productId: 'prod-arroz', quantity: 0 },
      { productId: 'prod-feijao', quantity: 0 },
    ];
    const dre = calcularDRE(roundConfigNormal, itemsNormal, inventoryVazio);
    const feedbacks = gerarFeedback(dre);
    expect(feedbacks).toContain(
      'Nenhuma receita gerada nesta rodada. Verifique se o estoque estava disponível e os volumes configurados.'
    );
  });

  test('não gera feedbacks negativos em cenário saudável', () => {
    const roundConfigLucro = { fixedExpenses: 50, variableExpenses: 50 };
    const dre = calcularDRE(roundConfigLucro, itemsNormal, inventoryFull);
    const feedbacks = gerarFeedback(dre);
    expect(feedbacks).toHaveLength(0);
  });
});
