const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const controller = require('../controllers/cart.controller');
const { addItemSchema, updateItemSchema } = require('../validators/cart.validator');
const { idParam } = require('../validators/auth.validator');

router.use(authenticate);

router.get('/', controller.get);
router.post('/items', validate({ body: addItemSchema }), controller.addItem);
router.patch('/items/:itemId', validate({ params: idParam, body: updateItemSchema }), controller.updateItem);
router.delete('/items/:itemId', validate({ params: idParam }), controller.removeItem);
router.delete('/', controller.clear);

module.exports = router;
