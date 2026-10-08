const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const controller = require('../controllers/auth.controller');
const v = require('../validators/auth.validator');

router.post('/register', validate({ body: v.registerSchema }), controller.register);
router.post('/login', validate({ body: v.loginSchema }), controller.login);
router.get('/me', authenticate, controller.me);
router.patch('/me', authenticate, validate({ body: v.updateProfileSchema }), controller.updateMe);
router.patch(
  '/password',
  authenticate,
  validate({ body: v.changePasswordSchema }),
  controller.changePassword
);

module.exports = router;
