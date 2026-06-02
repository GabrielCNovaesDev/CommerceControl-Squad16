import prisma, { toNum } from '../utils/prisma';

export interface GameSettingsData {
  licenseSoPerUser: number;
  licenseSoUsers: number;
  licensePdvPerUnit: number;
  licenseScoPerUnit: number;
  licenseScoUnits: number;
  licenseSiteBase: number;
  licenseSiteCapex: number;
  licenseSecurityBase: number;
  licenseSecurityCapex: number;
  maintenanceFee: number;
}

async function getSettings(): Promise<GameSettingsData> {
  const row = await prisma.gameSettings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton' },
    update: {},
  });

  return {
    licenseSoPerUser: toNum(row.licenseSoPerUser),
    licenseSoUsers: row.licenseSoUsers,
    licensePdvPerUnit: toNum(row.licensePdvPerUnit),
    licenseScoPerUnit: toNum(row.licenseScoPerUnit),
    licenseScoUnits: row.licenseScoUnits,
    licenseSiteBase: toNum(row.licenseSiteBase),
    licenseSiteCapex: toNum(row.licenseSiteCapex),
    licenseSecurityBase: toNum(row.licenseSecurityBase),
    licenseSecurityCapex: toNum(row.licenseSecurityCapex),
    maintenanceFee: toNum(row.maintenanceFee),
  };
}

async function updateSettings(data: Partial<GameSettingsData>): Promise<GameSettingsData> {
  const row = await prisma.gameSettings.update({
    where: { id: 'singleton' },
    data,
  });

  return {
    licenseSoPerUser: toNum(row.licenseSoPerUser),
    licenseSoUsers: row.licenseSoUsers,
    licensePdvPerUnit: toNum(row.licensePdvPerUnit),
    licenseScoPerUnit: toNum(row.licenseScoPerUnit),
    licenseScoUnits: row.licenseScoUnits,
    licenseSiteBase: toNum(row.licenseSiteBase),
    licenseSiteCapex: toNum(row.licenseSiteCapex),
    licenseSecurityBase: toNum(row.licenseSecurityBase),
    licenseSecurityCapex: toNum(row.licenseSecurityCapex),
    maintenanceFee: toNum(row.maintenanceFee),
  };
}

const gameSettingsRepository = { getSettings, updateSettings };
export default gameSettingsRepository;
