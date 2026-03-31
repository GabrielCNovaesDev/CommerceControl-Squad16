const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { listProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');

const router = Router();

const onlyMaster = roleMiddleware(['GAME_MASTER']);
const masterAndPlayer = roleMiddleware(['GAME_MASTER', 'PLAYER']);

router.get('/', authMiddleware, masterAndPlayer, listProducts);
router.post('/', authMiddleware, onlyMaster, createProduct);
router.put('/:id', authMiddleware, onlyMaster, updateProduct);
router.delete('/:id', authMiddleware, onlyMaster, deleteProduct);

module.exports = router;
