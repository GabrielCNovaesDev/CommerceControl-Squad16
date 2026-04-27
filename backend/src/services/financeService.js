/**
 * financeService.js — v3
 * Motor de cálculo financeiro do DRE conforme regras do cliente.
 *
 * Estrutura do DRE:
 *   Receita Bruta
 *   (-) Impostos (por categoria: taxRate × receita)
 *   (=) Receita Líquida
 *   (-) Custo de Venda (purchasePrice × qtd vendida)
 *   (=) Massa Margem Líquida (PDV)
 *   (-) Quebras (estoque não vendido × purchasePrice × breakageRate)
 *   (-) Aging  (estoque não vendido × purchasePrice × agingRate)
 *   (=) Massa Margem Final
 *   (-) Outros Gastos (outras despesas do time)
 *   (=) EBITDA
 *
 * Preço de venda calculado pela margem comercial:
 *   salePrice = (purchasePrice × (1 + margin)) / (1 - taxRate)
 */

function calcularPreco(purchasePrice, margin, taxRate) {
  if (taxRate >= 1) return purchasePrice * (1 + margin);
  return (purchasePrice * (1 + margin)) / (1 - taxRate);
}

function calcularDRE(roundConfig, items, inventory) {
  const inventoryMap = Object.fromEntries(
    inventory.map((inv) => [inv.productId, inv.quantity])
  );

  let grossRevenue = 0;
  let taxes = 0;
  let costs = 0;
  let totalBreakage = 0;
  let totalAging = 0;
  const itemBreakdown = [];

  for (const item of items) {
    const availableStock = inventoryMap[item.productId] ?? 0;
    const effectiveVolume = Math.min(item.salesVolume, availableStock);
    const unsold = availableStock - effectiveVolume;

    const salePrice = calcularPreco(
      item.product.purchasePrice,
      item.margin,
      item.product.taxRate
    );

    const itemRevenue = salePrice * effectiveVolume;
    const itemTax = itemRevenue * item.product.taxRate;
    const itemCost = item.product.purchasePrice * effectiveVolume;
    const itemBreakage = unsold * item.product.purchasePrice * item.product.breakageRate;
    const itemAging = unsold * item.product.purchasePrice * item.product.agingRate;

    grossRevenue += itemRevenue;
    taxes += itemTax;
    costs += itemCost;
    totalBreakage += itemBreakage;
    totalAging += itemAging;

    itemBreakdown.push({
      productId: item.productId,
      plannedVolume: item.salesVolume,
      effectiveVolume,
      unsold,
      stockLimited: effectiveVolume < item.salesVolume,
      salePrice,
      margin: item.margin,
      itemRevenue,
      itemTax,
      itemCost,
      itemBreakage,
      itemAging,
      itemGrossMargin: itemRevenue - itemTax - itemCost,
    });
  }

  const netRevenue = grossRevenue - taxes;
  const grossMargin = netRevenue - costs;
  const netMarginMass = grossMargin - totalBreakage - totalAging;
  const otherExpenses = roundConfig.otherExpenses ?? 0;
  const ebitda = netMarginMass - otherExpenses;
  const ebitdaMargin = netRevenue !== 0 ? (ebitda / netRevenue) * 100 : 0;

  return {
    grossRevenue,
    taxes,
    netRevenue,
    costs,
    grossMargin,
    totalBreakage,
    totalAging,
    netMarginMass,
    otherExpenses,
    ebitda,
    ebitdaMargin,
    itemBreakdown,
  };
}

function calcularDREPreview(roundConfig, items, inventory) {
  return { ...calcularDRE(roundConfig, items, inventory), preview: true };
}

function gerarFeedback(dre) {
  const feedbacks = [];

  if (dre.ebitda < 0) {
    feedbacks.push('EBITDA negativo: sua loja teve prejuízo nesta rodada.');
  }

  if (dre.costs > dre.netRevenue) {
    feedbacks.push(
      'Custo de venda superou a receita líquida. Revise a margem comercial — ela precisa cobrir impostos e gerar lucro.'
    );
  }

  if (dre.grossMargin < 0) {
    feedbacks.push(
      'Margem bruta negativa: os impostos e custos consumiram toda a receita líquida.'
    );
  }

  if (dre.totalBreakage + dre.totalAging > dre.grossMargin * 0.3) {
    feedbacks.push(
      'Quebras e aging representam mais de 30% da margem bruta. Revise o volume de estoque comprado.'
    );
  }

  const stockLimitedItems = dre.itemBreakdown.filter((i) => i.stockLimited);
  if (stockLimitedItems.length > 0) {
    feedbacks.push(
      `${stockLimitedItems.length} categoria(s) tiveram vendas limitadas pelo estoque. Considere comprar mais unidades.`
    );
  }

  if (dre.grossRevenue === 0) {
    feedbacks.push(
      'Nenhuma receita gerada. Verifique se o estoque está disponível e os volumes configurados.'
    );
  }

  return feedbacks;
}

module.exports = { calcularDRE, calcularDREPreview, gerarFeedback, calcularPreco };
