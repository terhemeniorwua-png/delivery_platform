const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validation.middleware');
const riderApplicationController = require('../controllers/riderApplication.controller');
const {
  createRiderApplicationSchema,
  applicationListQuery,
  rejectSchema,
  idParam,
} = require('../validators/riderApplication.validator');

const router = express.Router();

// Anyone with a session may query their own application.
router.use(authenticate);

// Only customers may apply. Status always starts PENDING and role is NEVER
// promoted here — promotion happens only in admin approval.
router.post(
  '/',
  authorize('CUSTOMER'),
  validate({ body: createRiderApplicationSchema }),
  riderApplicationController.create
);

router.get('/me', authorize('CUSTOMER', 'RIDER'), riderApplicationController.me);
router.get('/', authorize('ADMIN'), validate({ query: applicationListQuery }), riderApplicationController.list);
router.patch(
  '/:id/approve',
  authorize('ADMIN'),
  validate({ params: idParam }),
  riderApplicationController.approve
);
router.patch(
  '/:id/reject',
  authorize('ADMIN'),
  validate({ params: idParam, body: rejectSchema }),
  riderApplicationController.reject
);

module.exports = router;