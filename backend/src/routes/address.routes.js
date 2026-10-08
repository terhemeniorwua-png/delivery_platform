const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const controller = require('../controllers/address.controller');
const v = require('../validators/auth.validator');

router.use(authenticate);

router.get('/', controller.list);
router.post('/', validate({ body: v.addressSchema }), controller.create);
router.patch(
  '/:id',
  validate({ params: v.idParam, body: v.addressUpdateSchema }),
  controller.update
);
router.delete('/:id', validate({ params: v.idParam }), controller.remove);
router.post('/:id/default', validate({ params: v.idParam }), controller.setDefault);

module.exports = router;
