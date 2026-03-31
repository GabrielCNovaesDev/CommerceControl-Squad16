const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { getMyStore, createStore, listStores } = require('../controllers/storeController');

const router = Router();

router.get('/my', authMiddleware, roleMiddleware(['PLAYER']), getMyStore);
router.post('/', authMiddleware, roleMiddleware(['PLAYER']), createStore);
router.get('/', authMiddleware, roleMiddleware(['GAME_MASTER']), listStores);

module.exports = router;
