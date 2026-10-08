const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validation.middleware');
const controller = require('../controllers/order.controller');
const { createOrderSchema, orderListQuery, updateStatusSchema } = require('../validators/order.validator');
const { assignSchema } = require('../validators/delivery.validator');
const { idParam } = require('../validators/auth.validator');

router.use(authenticate);

router.post('/', authorize('CUSTOMER'), validate({ body: createOrderSchema }), controller.create);
router.get(
  '/',
  authorize('CUSTOMER', 'ADMIN'),
  validate({ query: orderListQuery }),
  controller.list
);
router.get('/:id', authorize('CUSTOMER', 'ADMIN'), validate({ params: idParam }), controller.get);
router.post('/:id/cancel', authorize('CUSTOMER', 'ADMIN'), validate({ params: idParam }), controller.cancel);
router.patch(
  '/:id/status',
  authorize('ADMIN'),
  validate({ params: idParam, body: updateStatusSchema }),
  controller.updateStatus
);
router.post(
  '/:id/assign',
  authorize('ADMIN'),
  validate({ params: idParam, body: assignSchema }),
  controller.assignDelivery
);

module.exports = router;
