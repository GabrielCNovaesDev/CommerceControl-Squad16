const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const {
  listSquads,
  createSquad,
  updateSquad,
  deleteSquad,
  addUserToSquad,
  removeUserFromSquad,
} = require('../controllers/squadController');

const router = Router();

router.use(authMiddleware, roleMiddleware(['GAME_MASTER']));

router.get('/', listSquads);
router.post('/', createSquad);
router.put('/:id', updateSquad);
router.delete('/:id', deleteSquad);
router.post('/:id/users', addUserToSquad);
router.delete('/:id/users/:userId', removeUserFromSquad);

module.exports = router;
