import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import roleMiddleware from '../middlewares/roleMiddleware';
import inventoryController from '../controllers/inventoryController';

const router = Router({ mergeParams: true });

router.get(
  '/',
  authMiddleware,
  roleMiddleware(['GAME_MASTER', 'PLAYER']),
  inventoryController.getInventory
);

router.put(
  '/:productId',
  authMiddleware,
  roleMiddleware(['GAME_MASTER']),
  inventoryController.updateInventoryItem
);

router.post(
  '/restock',
  authMiddleware,
  roleMiddleware(['GAME_MASTER']),
  inventoryController.restockInventory
);

export default router;
