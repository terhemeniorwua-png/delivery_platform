const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validation.middleware');
const controller = require('../controllers/delivery.controller');
const {
  createDeliverySchema,
  assignSchema,
  statusUpdateSchema,
  deliveryListQuery,
} = require('../validators/delivery.validator');
const { idParam } = require('../validators/auth.validator');

router.use(authenticate);

router.get('/', validate({ query: deliveryListQuery }), controller.list);
router.post('/', authorize('ADMIN'), validate({ body: createDeliverySchema }), controller.create);
router.get('/:id', validate({ params: idParam }), controller.get);
router.patch(
  '/:id/reassign',
  authorize('ADMIN'),
  validate({ params: idParam, body: assignSchema }),
  controller.reassign
);
router.patch(
  '/:id/status',
  authorize('ADMIN', 'RIDER'),
  validate({ params: idParam, body: statusUpdateSchema }),
  controller.updateStatus
);

module.exports = router;
