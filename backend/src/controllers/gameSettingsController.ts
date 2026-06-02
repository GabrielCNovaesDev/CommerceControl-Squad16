import { z } from 'zod';
import { Request, Response } from 'express';
import gameSettingsRepository from '../repositories/gameSettingsRepository';
import asyncHandler from '../utils/asyncHandler';
import { sendError } from '../utils/errorResponse';

const updateSchema = z.object({
  licenseSoPerUser: z.number().min(0).optional(),
  licenseSoUsers: z.number().int().min(1).optional(),
  licensePdvPerUnit: z.number().min(0).optional(),
  licenseScoPerUnit: z.number().min(0).optional(),
  licenseScoUnits: z.number().int().min(0).optional(),
  licenseSiteBase: z.number().min(0).optional(),
  licenseSiteCapex: z.number().min(0).optional(),
  licenseSecurityBase: z.number().min(0).optional(),
  licenseSecurityCapex: z.number().min(0).optional(),
  maintenanceFee: z.number().min(0).optional(),
});

async function getSettings(_req: Request, res: Response): Promise<void> {
  const settings = await gameSettingsRepository.getSettings();
  res.status(200).json(settings);
}

async function updateSettings(req: Request, res: Response): Promise<void> {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Dados invalidos', parsed.error.flatten().fieldErrors);
    return;
  }

  const settings = await gameSettingsRepository.updateSettings(parsed.data);
  res.status(200).json(settings);
}

export default {
  getSettings: asyncHandler(getSettings),
  updateSettings: asyncHandler(updateSettings),
};
