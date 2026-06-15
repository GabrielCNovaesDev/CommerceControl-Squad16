import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// GET /settings - busca configurações do jogo
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'GAME_MASTER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const settings = await prisma.gameSettings.findUnique({
      where: { id: 'singleton' },
    });

    // Retorna valores padrão se não existirem configurações
    const defaults = {
      licenseSoPerUser: 120,
      licenseSoUsers: 5,
      licensePdvPerUnit: 80,
      licenseScoPerUnit: 80,
      licenseScoUnits: 4,
      licenseSiteBase: 500,
      licenseSiteCapex: 650,
      licenseSecurityBase: 500,
      licenseSecurityCapex: 600,
      maintenanceFee: 400,
    };

    if (!settings) {
      return NextResponse.json(defaults);
    }

    return NextResponse.json({
      licenseSoPerUser: settings.licenseSoPerUser ? Number(settings.licenseSoPerUser) : defaults.licenseSoPerUser,
      licenseSoUsers: settings.licenseSoUsers ?? defaults.licenseSoUsers,
      licensePdvPerUnit: settings.licensePdvPerUnit ? Number(settings.licensePdvPerUnit) : defaults.licensePdvPerUnit,
      licenseScoPerUnit: settings.licenseScoPerUnit ? Number(settings.licenseScoPerUnit) : defaults.licenseScoPerUnit,
      licenseScoUnits: settings.licenseScoUnits ?? defaults.licenseScoUnits,
      licenseSiteBase: settings.licenseSiteBase ? Number(settings.licenseSiteBase) : defaults.licenseSiteBase,
      licenseSiteCapex: settings.licenseSiteCapex ? Number(settings.licenseSiteCapex) : defaults.licenseSiteCapex,
      licenseSecurityBase: settings.licenseSecurityBase ? Number(settings.licenseSecurityBase) : defaults.licenseSecurityBase,
      licenseSecurityCapex: settings.licenseSecurityCapex ? Number(settings.licenseSecurityCapex) : defaults.licenseSecurityCapex,
      maintenanceFee: settings.maintenanceFee ? Number(settings.maintenanceFee) : defaults.maintenanceFee,
    });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT /settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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

    return NextResponse.json({
      licenseSoPerUser: settings.licenseSoPerUser ? Number(settings.licenseSoPerUser) : 0,
      licenseSoUsers: settings.licenseSoUsers ?? 0,
      licensePdvPerUnit: settings.licensePdvPerUnit ? Number(settings.licensePdvPerUnit) : 0,
      licenseScoPerUnit: settings.licenseScoPerUnit ? Number(settings.licenseScoPerUnit) : 0,
      licenseScoUnits: settings.licenseScoUnits ?? 0,
      licenseSiteBase: settings.licenseSiteBase ? Number(settings.licenseSiteBase) : 0,
      licenseSiteCapex: settings.licenseSiteCapex ? Number(settings.licenseSiteCapex) : 0,
      licenseSecurityBase: settings.licenseSecurityBase ? Number(settings.licenseSecurityBase) : 0,
      licenseSecurityCapex: settings.licenseSecurityCapex ? Number(settings.licenseSecurityCapex) : 0,
      maintenanceFee: settings.maintenanceFee ? Number(settings.maintenanceFee) : 0,
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}