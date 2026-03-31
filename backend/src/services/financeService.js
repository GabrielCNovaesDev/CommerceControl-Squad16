/**
 * financeService.js — v2
 * Squad 16 | Simulador Estratégico de Loja
 *
 * Motor de cálculo financeiro do DRE.
 */

/**
 * Calcula o DRE completo de uma loja para uma rodada.
 *
 * @param {Object} roundConfig  - { fixedExpenses: Float, variableExpenses: Float }
 * @param {Array}  items        - Array de RoundConfigItem com produto incluído:
 *                                [{ productId, salePrice, salesVolume, product: { purchasePrice } }]
 * @param {Array}  inventory    - Array de Inventory da loja:
 *                                [{ productId, quantity }]
 * @returns {Object} DRE completo: { grossRevenue, costs, expenses, grossProfit, netProfit, netMargin, itemBreakdown }
 */
function calcularDRE(roundConfig, items, inventory) {
  const inventoryMap = Object.fromEntries(
    inventory.map((inv) => [inv.productId, inv.quantity])
  );

  let grossRevenue = 0;
  let costs = 0;
  const itemBreakdown = [];

  for (const item of items) {
    const availableStock = inventoryMap[item.productId] ?? 0;
    const effectiveVolume = Math.min(item.salesVolume, availableStock);

    const itemRevenue = item.salePrice * effectiveVolume;
    const itemCost = item.product.purchasePrice * effectiveVolume;

    grossRevenue += itemRevenue;
    costs += itemCost;

    itemBreakdown.push({
      productId: item.productId,
      plannedVolume: item.salesVolume,
      effectiveVolume,
      stockLimited: effectiveVolume < item.salesVolume,
      itemRevenue,
      itemCost,
      itemGrossProfit: itemRevenue - itemCost,
    });
  }

  const expenses = roundConfig.fixedExpenses + roundConfig.variableExpenses;
  const grossProfit = grossRevenue - costs;
  const netProfit = grossProfit - expenses;
  const netMargin = grossRevenue !== 0 ? (netProfit / grossRevenue) * 100 : 0;

  return {
    grossRevenue,
    costs,
    expenses,
    grossProfit,
    netProfit,
    netMargin,
    itemBreakdown,
  };
}

/**
 * Versão preview do cálculo — mesma lógica, sem persistência.
 * Usada pelo endpoint POST /simulation/preview.
 */
function calcularDREPreview(roundConfig, items, inventory) {
  const result = calcularDRE(roundConfig, items, inventory);
  return { ...result, preview: true };
}

/**
 * Gera feedback textual baseado no resultado do DRE.
 *
 * @param {Object} dre - Resultado de calcularDRE()
 * @returns {Array<string>} Lista de mensagens de feedback
 */
function gerarFeedback(dre) {
  const feedbacks = [];

  if (dre.netProfit < 0) {
    feedbacks.push('Resultado negativo: sua loja teve prejuízo nesta rodada.');
  }

  if (dre.costs > dre.grossRevenue) {
    feedbacks.push(
      'Seu custo de compra superou a receita de vendas. Verifique se o preço de venda está acima do custo.'
    );
  }

  if (dre.expenses > dre.grossProfit) {
    feedbacks.push(
      'Suas despesas consumiram todo o lucro bruto. Considere reduzir gastos fixos ou variáveis.'
    );
  }

  const stockLimitedItems = dre.itemBreakdown.filter((i) => i.stockLimited);
  if (stockLimitedItems.length > 0) {
    feedbacks.push(
      `${stockLimitedItems.length} produto(s) tiveram volume de vendas limitado pelo estoque disponível. Revise seu Inventory.`
    );
  }

  if (dre.grossRevenue === 0) {
    feedbacks.push(
      'Nenhuma receita gerada nesta rodada. Verifique se o estoque estava disponível e os volumes configurados.'
    );
  }

  return feedbacks;
}

module.exports = { calcularDRE, calcularDREPreview, gerarFeedback };
