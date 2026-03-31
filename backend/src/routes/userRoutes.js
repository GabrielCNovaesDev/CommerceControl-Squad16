const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { listUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');

const router = Router();

router.use(authMiddleware, roleMiddleware(['GAME_MASTER']));

router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
