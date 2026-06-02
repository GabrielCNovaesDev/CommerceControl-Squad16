import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import roleMiddleware from '../middlewares/roleMiddleware';
import storeController from '../controllers/storeController';

const router = Router();

router.get('/my', authMiddleware, roleMiddleware(['PLAYER']), storeController.getMyStore);
router.get('/my/previous-capex', authMiddleware, roleMiddleware(['PLAYER']), storeController.getPreviousCapex);
router.post('/', authMiddleware, roleMiddleware(['PLAYER']), storeController.createStore);
router.get('/', authMiddleware, roleMiddleware(['GAME_MASTER']), storeController.listStores);

export default router;
