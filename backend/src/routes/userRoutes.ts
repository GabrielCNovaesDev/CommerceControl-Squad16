import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import roleMiddleware from '../middlewares/roleMiddleware';
import userController from '../controllers/userController';

const router = Router();

router.use(authMiddleware, roleMiddleware(['GAME_MASTER']));

router.get('/', userController.listUsers);
router.post('/', userController.createUser);
router.post('/bulk', userController.bulkCreateUsers);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
