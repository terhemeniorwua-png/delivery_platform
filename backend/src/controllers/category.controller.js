const categoryService = require('../services/category.service');
const { success } = require('../utils/response');

async function list(req, res) {
  const categories = await categoryService.listCategories();
  return success(res, 'Categories fetched', { categories });
}

async function get(req, res) {
  const category = await categoryService.getCategory(req.params.idOrSlug);
  return success(res, 'Category fetched', { category });
}

async function create(req, res) {
  const category = await categoryService.createCategory(req.body);
  return success(res, 'Category created', { category }, 201);
}

async function update(req, res) {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  return success(res, 'Category updated', { category });
}

async function remove(req, res) {
  await categoryService.deleteCategory(req.params.id);
  return success(res, 'Category deleted');
}

module.exports = { list, get, create, update, remove };
