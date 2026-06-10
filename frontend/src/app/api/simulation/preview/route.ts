import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

// POST /simulation/preview
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== 'PLAYER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { products, cashierOperators, serviceOperators, otherExpenses } = body;

    // Calcular preview básico dos custos
    const operatorCostPerHour = 15; // R$15/hora por operador
    const workHoursPerDay = 8;
    const daysInPeriod = 30;

    const totalOperatorCost =
      (parseInt(cashierOperators) + parseInt(serviceOperators)) *
      operatorCostPerHour *
      workHoursPerDay *
      daysInPeriod;

    const totalCost = totalOperatorCost + parseFloat(otherExpenses || 0);

    // Calcular margem bruta estimada
    let totalRevenue = 0;
    let totalCosts = 0;

    if (products?.length) {
      for (const p of products) {
        const price = parseFloat(p.purchasePrice) * (1 + parseFloat(p.margin));
        totalRevenue += price * parseInt(p.salesVolume);
        totalCosts += parseFloat(p.purchasePrice) * parseInt(p.salesVolume);
      }
    }

    const grossMargin = totalRevenue - totalCosts;
    const ebitda = grossMargin - totalCost;
    const ebitdaMargin = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;

    return NextResponse.json({
      data: {
        estimatedRevenue: totalRevenue,
        estimatedCosts: totalCosts,
        operatorCost: totalOperatorCost,
        otherExpenses: parseFloat(otherExpenses || 0),
        totalCost,
        grossMargin,
        ebitda,
        ebitdaMargin: ebitdaMargin.toFixed(2),
      },
    });
  } catch (error) {
    console.error('Erro ao gerar preview:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}