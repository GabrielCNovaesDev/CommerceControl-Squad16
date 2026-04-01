const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { previewConfig, getRanking } = require('../controllers/simulationController');

const router = Router();

const masterAndPlayer = roleMiddleware(['GAME_MASTER', 'PLAYER']);

router.post('/preview', authMiddleware, roleMiddleware(['PLAYER']), previewConfig);
router.get('/ranking', authMiddleware, masterAndPlayer, getRanking);

module.exports = router;
