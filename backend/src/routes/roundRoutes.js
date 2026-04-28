const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const {
  listRounds,
  getRound,
  createRound,
  closeRound,
  deleteLastRound,
  resetGame,
} = require('../controllers/roundController');
const { submitConfig, getResults } = require('../controllers/simulationController');

const router = Router();

const masterAndPlayer = roleMiddleware(['GAME_MASTER', 'PLAYER']);
const onlyMaster = roleMiddleware(['GAME_MASTER']);

router.get('/', authMiddleware, masterAndPlayer, listRounds);
router.get('/:id', authMiddleware, masterAndPlayer, getRound);
router.post('/', authMiddleware, onlyMaster, createRound);
router.patch('/:id/close', authMiddleware, onlyMaster, closeRound);
router.delete('/last', authMiddleware, onlyMaster, deleteLastRound);
router.post('/reset', authMiddleware, onlyMaster, resetGame);
router.post('/:id/config', authMiddleware, roleMiddleware(['PLAYER']), submitConfig);
router.get('/:id/results', authMiddleware, masterAndPlayer, getResults);

module.exports = router;
