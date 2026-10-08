const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validation.middleware');
const controller = require('../controllers/admin.controller');
const { userListQuery } = require('../validators/admin.validator');
const { idParam, userStatusSchema } = require('../validators/auth.validator');

router.use(authenticate, authorize('ADMIN'));

router.get('/users', validate({ query: userListQuery }), controller.list);
router.patch(
  '/users/:id/status',
  validate({ params: idParam, body: userStatusSchema }),
  controller.updateStatus
);

module.exports = router;
