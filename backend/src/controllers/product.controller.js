const productService = require('../services/product.service');
const { success } = require('../utils/response');

async function list(req, res) {
  const result = await productService.listProducts(req.query, { isAdmin: false });
  return success(res, 'Products fetched', result);
}

async function listAdmin(req, res) {
  const result = await productService.listProducts(req.query, { isAdmin: true });
  return success(res, 'Products fetched', result);
}

async function get(req, res) {
  const product = await productService.getProduct(req.params.idOrSlug, { isAdmin: false });
  return success(res, 'Product fetched', { product });
}

async function getAdmin(req, res) {
  const product = await productService.getProduct(req.params.idOrSlug, { isAdmin: true });
  return success(res, 'Product fetched', { product });
}

async function create(req, res) {
  const product = await productService.createProduct(req.body);
  return success(res, 'Product created', { product }, 201);
}

async function update(req, res) {
  const product = await productService.updateProduct(req.params.id, req.body);
  return success(res, 'Product updated', { product });
}

async function remove(req, res) {
  await productService.deleteProduct(req.params.id);
  return success(res, 'Product deleted');
}

async function createVariant(req, res) {
  const variant = await productService.createVariant(req.params.id, req.body);
  return success(res, 'Variant created', { variant }, 201);
}

async function updateVariant(req, res) {
  const variant = await productService.updateVariant(req.params.id, req.params.variantId, req.body);
  return success(res, 'Variant updated', { variant });
}

async function deleteVariant(req, res) {
  await productService.deleteVariant(req.params.id, req.params.variantId);
  return success(res, 'Variant deleted');
}

async function updateStock(req, res) {
  const variant = await productService.updateStock(req.params.variantId, req.body);
  return success(res, 'Stock updated', { variant });
}

async function addImage(req, res) {
  const image = await productService.addImage(req.params.id, req.body);
  return success(res, 'Image added', { image }, 201);
}

async function setPrimaryImage(req, res) {
  const image = await productService.setPrimaryImage(req.params.id, req.params.imageId);
  return success(res, 'Primary image updated', { image });
}

async function deleteImage(req, res) {
  await productService.deleteImage(req.params.id, req.params.imageId);
  return success(res, 'Image deleted');
}

module.exports = {
  list,
  listAdmin,
  get,
  getAdmin,
  create,
  update,
  remove,
  createVariant,
  updateVariant,
  deleteVariant,
  updateStock,
  addImage,
  setPrimaryImage,
  deleteImage,
};
