const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validation.middleware');
const controller = require('../controllers/payment.controller');
const {
  createPaymentSchema,
  paymentStatusSchema,
  paymentListQuery,
} = require('../validators/payment.validator');
const { idParam } = require('../validators/auth.validator');

router.use(authenticate);

router.post(
  '/',
  authorize('CUSTOMER', 'ADMIN'),
  validate({ body: createPaymentSchema }),
  controller.create
);
router.get('/', authorize('CUSTOMER', 'ADMIN'), validate({ query: paymentListQuery }), controller.list);
router.get('/:id', authorize('CUSTOMER', 'ADMIN'), validate({ params: idParam }), controller.get);
router.patch(
  '/:id/status',
  authorize('ADMIN'),
  validate({ params: idParam, body: paymentStatusSchema }),
  controller.updateStatus
);

module.exports = router;
