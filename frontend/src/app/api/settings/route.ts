import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

// PUT /settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== 'GAME_MASTER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();

    const settings = await prisma.gameSettings.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        licenseSoPerUser: body.licenseSoPerUser ? parseFloat(body.licenseSoPerUser) : 120,
        licenseSoUsers: body.licenseSoUsers ? parseInt(body.licenseSoUsers) : 5,
        licensePdvPerUnit: body.licensePdvPerUnit ? parseFloat(body.licensePdvPerUnit) : 80,
        licenseScoPerUnit: body.licenseScoPerUnit ? parseFloat(body.licenseScoPerUnit) : 80,
        licenseScoUnits: body.licenseScoUnits ? parseInt(body.licenseScoUnits) : 4,
        licenseSiteBase: body.licenseSiteBase ? parseFloat(body.licenseSiteBase) : 500,
        licenseSiteCapex: body.licenseSiteCapex ? parseFloat(body.licenseSiteCapex) : 650,
        licenseSecurityBase: body.licenseSecurityBase ? parseFloat(body.licenseSecurityBase) : 500,
        licenseSecurityCapex: body.licenseSecurityCapex ? parseFloat(body.licenseSecurityCapex) : 600,
        maintenanceFee: body.maintenanceFee ? parseFloat(body.maintenanceFee) : 400,
      },
      update: {
        licenseSoPerUser: body.licenseSoPerUser !== undefined ? parseFloat(body.licenseSoPerUser) : undefined,
        licenseSoUsers: body.licenseSoUsers !== undefined ? parseInt(body.licenseSoUsers) : undefined,
        licensePdvPerUnit: body.licensePdvPerUnit !== undefined ? parseFloat(body.licensePdvPerUnit) : undefined,
        licenseScoPerUnit: body.licenseScoPerUnit !== undefined ? parseFloat(body.licenseScoPerUnit) : undefined,
        licenseScoUnits: body.licenseScoUnits !== undefined ? parseInt(body.licenseScoUnits) : undefined,
        licenseSiteBase: body.licenseSiteBase !== undefined ? parseFloat(body.licenseSiteBase) : undefined,
        licenseSiteCapex: body.licenseSiteCapex !== undefined ? parseFloat(body.licenseSiteCapex) : undefined,
        licenseSecurityBase: body.licenseSecurityBase !== undefined ? parseFloat(body.licenseSecurityBase) : undefined,
        licenseSecurityCapex: body.licenseSecurityCapex !== undefined ? parseFloat(body.licenseSecurityCapex) : undefined,
        maintenanceFee: body.maintenanceFee !== undefined ? parseFloat(body.maintenanceFee) : undefined,
      },
    });

    return NextResponse.json({ data: settings, message: 'Configurações atualizadas' });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}