const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { previewConfig } = require('../controllers/simulationController');

const router = Router();

router.post('/preview', authMiddleware, roleMiddleware(['PLAYER']), previewConfig);

module.exports = router;
