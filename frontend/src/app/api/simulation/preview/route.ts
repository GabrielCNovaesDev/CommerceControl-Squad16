import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiHandler } from '@/lib/apiAuth';
import { previewConfigSchema } from '@/lib/validators/simulation';

// POST /simulation/preview
// Cálculo simplificado de preview de DRE para o jogador.
export const POST = withApiHandler(async (request: NextRequest) => {
  await requireRole(['PLAYER']);
  const body = await request.json();
  const parsed = previewConfigSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
  }
  const { cashierOperators, serviceOperators, otherExpenses, products } = parsed.data;

  const operatorCostPerHour = 15;
  const workHoursPerDay = 8;
  const daysInPeriod = 30;

  const totalOperatorCost =
    (cashierOperators + serviceOperators) * operatorCostPerHour * workHoursPerDay * daysInPeriod;
  const totalCost = totalOperatorCost + otherExpenses;

  let totalRevenue = 0;
  let totalCosts = 0;
  for (const p of products) {
    const price = p.purchasePrice * (1 + p.margin);
    totalRevenue += price * p.salesVolume;
    totalCosts += p.purchasePrice * p.salesVolume;
  }

  const grossMargin = totalRevenue - totalCosts;
  const ebitda = grossMargin - totalCost;
  const ebitdaMargin = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;

  return NextResponse.json({
    data: {
      estimatedRevenue: totalRevenue,
      estimatedCosts: totalCosts,
      operatorCost: totalOperatorCost,
      otherExpenses,
      totalCost,
      grossMargin,
      ebitda,
      ebitdaMargin: Number(ebitdaMargin.toFixed(2)),
    },
  });
});
