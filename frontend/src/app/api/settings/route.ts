import { NextRequest, NextResponse } from 'next/server';
import { requireRole, withApiHandler } from '@/lib/apiAuth';
import { updateSettingsSchema } from '@/lib/validators/settings';
import { ApiError } from '@/lib/apiAuth';
import prisma from '@/lib/prisma';

const DEFAULTS = {
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

function toNumber(value: unknown, fallback: number): number {
  if (value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// GET /settings
export const GET = withApiHandler(async (_request: NextRequest) => {
  await requireRole(['GAME_MASTER']);
  const settings = await prisma.gameSettings.findUnique({ where: { id: 'singleton' } });
  if (!settings) return NextResponse.json(DEFAULTS);

  return NextResponse.json({
    licenseSoPerUser: toNumber(settings.licenseSoPerUser, DEFAULTS.licenseSoPerUser),
    licenseSoUsers: settings.licenseSoUsers ?? DEFAULTS.licenseSoUsers,
    licensePdvPerUnit: toNumber(settings.licensePdvPerUnit, DEFAULTS.licensePdvPerUnit),
    licenseScoPerUnit: toNumber(settings.licenseScoPerUnit, DEFAULTS.licenseScoPerUnit),
    licenseScoUnits: settings.licenseScoUnits ?? DEFAULTS.licenseScoUnits,
    licenseSiteBase: toNumber(settings.licenseSiteBase, DEFAULTS.licenseSiteBase),
    licenseSiteCapex: toNumber(settings.licenseSiteCapex, DEFAULTS.licenseSiteCapex),
    licenseSecurityBase: toNumber(settings.licenseSecurityBase, DEFAULTS.licenseSecurityBase),
    licenseSecurityCapex: toNumber(settings.licenseSecurityCapex, DEFAULTS.licenseSecurityCapex),
    maintenanceFee: toNumber(settings.maintenanceFee, DEFAULTS.maintenanceFee),
  });
});

// PUT /settings
export const PUT = withApiHandler(async (request: NextRequest) => {
  await requireRole(['GAME_MASTER']);
  const body = await request.json();
  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Dados inválidos', parsed.error.flatten().fieldErrors);
  }
  // O schema cobre só os campos "novos". Os campos de licença continuam sendo
  // recebidos via body cru. Mantemos compatibilidade repassando o body inteiro
  // para o upsert, com coerce de tipos:
  const data: Record<string, unknown> = { id: 'singleton' };
  for (const [k, v] of Object.entries(body)) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'number') { data[k] = v; continue; }
    const n = Number(v);
    if (Number.isFinite(n)) data[k] = n;
  }

  const settings = await prisma.gameSettings.upsert({
    where: { id: 'singleton' },
    create: { ...DEFAULTS, ...data } as never,
    update: data,
  });

  return NextResponse.json({
    licenseSoPerUser: toNumber(settings.licenseSoPerUser, 0),
    licenseSoUsers: settings.licenseSoUsers ?? 0,
    licensePdvPerUnit: toNumber(settings.licensePdvPerUnit, 0),
    licenseScoPerUnit: toNumber(settings.licenseScoPerUnit, 0),
    licenseScoUnits: settings.licenseScoUnits ?? 0,
    licenseSiteBase: toNumber(settings.licenseSiteBase, 0),
    licenseSiteCapex: toNumber(settings.licenseSiteCapex, 0),
    licenseSecurityBase: toNumber(settings.licenseSecurityBase, 0),
    licenseSecurityCapex: toNumber(settings.licenseSecurityCapex, 0),
    maintenanceFee: toNumber(settings.maintenanceFee, 0),
  });
});
