const router = require('express').Router();
const { z } = require('zod');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validation.middleware');
const controller = require('../controllers/product.controller');
const v = require('../validators/product.validator');
const { idParam } = require('../validators/auth.validator');

const id = z.coerce.number().int().positive();
const variantParams = z.object({ id, variantId: id });
const imageParams = z.object({ id, imageId: id });
const stockParams = z.object({ variantId: id });

const adminOnly = [authenticate, authorize('ADMIN')];

// Admin catalogue (registered before the public :idOrSlug routes)
router.get('/admin', ...adminOnly, validate({ query: v.productListQuery }), controller.listAdmin);
router.get('/admin/:idOrSlug', ...adminOnly, controller.getAdmin);

// Public catalogue
router.get('/', validate({ query: v.productListQuery }), controller.list);
router.get('/:idOrSlug', controller.get);

// Admin mutations
router.post('/', ...adminOnly, validate({ body: v.createProductSchema }), controller.create);
router.patch('/:id', ...adminOnly, validate({ params: idParam, body: v.updateProductSchema }), controller.update);
router.delete('/:id', ...adminOnly, validate({ params: idParam }), controller.remove);

// Variants
router.post(
  '/:id/variants',
  ...adminOnly,
  validate({ params: idParam, body: v.variantSchema }),
  controller.createVariant
);
router.patch(
  '/:id/variants/:variantId',
  ...adminOnly,
  validate({ params: variantParams, body: v.updateVariantSchema }),
  controller.updateVariant
);
router.delete(
  '/:id/variants/:variantId',
  ...adminOnly,
  validate({ params: variantParams }),
  controller.deleteVariant
);
router.put(
  '/variants/:variantId/stock',
  ...adminOnly,
  validate({ params: stockParams, body: v.stockSchema }),
  controller.updateStock
);

// Images
router.post(
  '/:id/images',
  ...adminOnly,
  validate({ params: idParam, body: v.imageSchema }),
  controller.addImage
);
router.patch(
  '/:id/images/:imageId',
  ...adminOnly,
  validate({ params: imageParams }),
  controller.setPrimaryImage
);
router.delete(
  '/:id/images/:imageId',
  ...adminOnly,
  validate({ params: imageParams }),
  controller.deleteImage
);

module.exports = router;
