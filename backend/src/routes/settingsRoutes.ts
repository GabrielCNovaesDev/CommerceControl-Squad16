import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import roleMiddleware from '../middlewares/roleMiddleware';
import gameSettingsController from '../controllers/gameSettingsController';

const router = Router();

router.get('/', authMiddleware, gameSettingsController.getSettings);
router.put('/', authMiddleware, roleMiddleware(['GAME_MASTER']), gameSettingsController.updateSettings);

export default router;
