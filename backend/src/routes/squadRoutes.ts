import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import roleMiddleware from '../middlewares/roleMiddleware';
import squadController from '../controllers/squadController';

const router = Router();

router.use(authMiddleware, roleMiddleware(['GAME_MASTER']));

router.get('/', squadController.listSquads);
router.post('/', squadController.createSquad);
router.put('/:id', squadController.updateSquad);
router.delete('/:id', squadController.deleteSquad);
router.post('/:id/users', squadController.addUserToSquad);
router.delete('/:id/users/:userId', squadController.removeUserFromSquad);

export default router;
