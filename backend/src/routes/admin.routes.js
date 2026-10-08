const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validation.middleware');
const controller = require('../controllers/admin.controller');
const { userListQuery, createAdministratorSchema, userRoleSchema } = require('../validators/admin.validator');
const { idParam, userStatusSchema } = require('../validators/auth.validator');

router.use(authenticate, authorize('ADMIN'));

router.get('/users', validate({ query: userListQuery }), controller.list);
router.patch(
  '/users/:id/status',
  validate({ params: idParam, body: userStatusSchema }),
  controller.updateStatus
);
router.patch(
  '/users/:id/role',
  validate({ params: idParam, body: userRoleSchema }),
  controller.updateRole
);

// Maximum-administrator business rule (count <= 5) lives in
// admin.service.js + the enforce_max_admins database trigger.
router.get('/administrators', controller.administrators);
router.post(
  '/administrators',
  validate({ body: createAdministratorSchema }),
  controller.createAdministrator
);

module.exports = router;
