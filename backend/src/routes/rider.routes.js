const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validation.middleware');
const controller = require('../controllers/rider.controller');
const {
  createRiderSchema,
  updateRiderSchema,
  availabilitySchema,
} = require('../validators/rider.validator');
const { idParam } = require('../validators/auth.validator');

router.use(authenticate);

// Rider self-service (registered before /:id)
router.get('/me/profile', authorize('RIDER'), controller.me);
router.patch(
  '/me/availability',
  authorize('RIDER'),
  validate({ body: availabilitySchema }),
  controller.updateAvailability
);
router.get('/me/dashboard', authorize('RIDER'), controller.dashboard);

// Admin management
router.get('/', authorize('ADMIN'), controller.list);
router.post('/', authorize('ADMIN'), validate({ body: createRiderSchema }), controller.create);
router.get('/:id', authorize('ADMIN'), validate({ params: idParam }), controller.get);
router.patch(
  '/:id',
  authorize('ADMIN'),
  validate({ params: idParam, body: updateRiderSchema }),
  controller.update
);

module.exports = router;
