const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { getInventory, updateInventoryItem, restockInventory } = require('../controllers/inventoryController');

const router = Router({ mergeParams: true });

router.get(
  '/',
  authMiddleware,
  roleMiddleware(['GAME_MASTER', 'PLAYER']),
  getInventory
);

router.put(
  '/:productId',
  authMiddleware,
  roleMiddleware(['GAME_MASTER']),
  updateInventoryItem
);

router.post(
  '/restock',
  authMiddleware,
  roleMiddleware(['GAME_MASTER']),
  restockInventory
);

module.exports = router;
