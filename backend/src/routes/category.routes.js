const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validation.middleware');
const controller = require('../controllers/category.controller');
const v = require('../validators/product.validator');
const { idParam } = require('../validators/auth.validator');

router.get('/', controller.list);
router.get('/:idOrSlug', controller.get);

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate({ body: v.categorySchema }),
  controller.create
);
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam, body: v.updateCategorySchema }),
  controller.update
);
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam }),
  controller.remove
);

module.exports = router;
