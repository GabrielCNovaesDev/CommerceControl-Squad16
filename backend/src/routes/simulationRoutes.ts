import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import roleMiddleware from '../middlewares/roleMiddleware';
import simulationController from '../controllers/simulationController';

const router = Router();

const masterAndPlayer = roleMiddleware(['GAME_MASTER', 'PLAYER']);

router.post('/preview', authMiddleware, roleMiddleware(['PLAYER']), simulationController.previewConfig);
router.get('/ranking', authMiddleware, masterAndPlayer, simulationController.getRanking);

export default router;
