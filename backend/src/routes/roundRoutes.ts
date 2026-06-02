import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import roleMiddleware from '../middlewares/roleMiddleware';
import roundController from '../controllers/roundController';
import simulationController from '../controllers/simulationController';

const router = Router();

const masterAndPlayer = roleMiddleware(['GAME_MASTER', 'PLAYER']);
const onlyMaster = roleMiddleware(['GAME_MASTER']);

router.get('/', authMiddleware, masterAndPlayer, roundController.listRounds);
router.get('/:id', authMiddleware, masterAndPlayer, roundController.getRound);
router.post('/', authMiddleware, onlyMaster, roundController.createRound);
router.patch('/:id/close', authMiddleware, onlyMaster, roundController.closeRound);
router.patch('/:id/extend', authMiddleware, onlyMaster, roundController.extendRound);
router.delete('/last', authMiddleware, onlyMaster, roundController.deleteLastRound);
router.post('/reset', authMiddleware, onlyMaster, roundController.resetGame);
router.get('/:id/my-config', authMiddleware, roleMiddleware(['PLAYER']), simulationController.getMyConfig);
router.get('/:id/events', authMiddleware, masterAndPlayer, roundController.getRoundEvents);
router.post('/:id/config', authMiddleware, roleMiddleware(['PLAYER']), simulationController.submitConfig);
router.get('/:id/results', authMiddleware, masterAndPlayer, simulationController.getResults);

export default router;
