import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import roleMiddleware from '../middlewares/roleMiddleware';
import productController from '../controllers/productController';

const router = Router();

const onlyMaster = roleMiddleware(['GAME_MASTER']);
const masterAndPlayer = roleMiddleware(['GAME_MASTER', 'PLAYER']);

router.get('/', authMiddleware, masterAndPlayer, productController.listProducts);
router.post('/', authMiddleware, onlyMaster, productController.createProduct);
router.put('/:id', authMiddleware, onlyMaster, productController.updateProduct);
router.delete('/:id', authMiddleware, onlyMaster, productController.deleteProduct);

export default router;
