import api from './api';

export interface GameSettings {
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

const settingsService = {
  getSettings: (): Promise<GameSettings> =>
    api.get('/settings').then((r) => r.data),

  updateSettings: (data: Partial<GameSettings>): Promise<GameSettings> =>
    api.put('/settings', data).then((r) => r.data),
};

export default settingsService;
