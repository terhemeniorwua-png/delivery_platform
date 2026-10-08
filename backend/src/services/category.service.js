const { Category, Product } = require('../models');
const { notFound, conflict } = require('../utils/errors');
const { slugify } = require('../utils/helpers');

async function listCategories() {
  const categories = await Category.findAll({
    order: [
      ['name', 'ASC'],
    ],
    attributes: ['id', 'name', 'slug', 'description', 'createdAt', 'updatedAt'],
  });

  const counts = await Product.count({
    where: { status: 'ACTIVE' },
    group: ['categoryId'],
  });
  const countByCategory = {};
  for (const row of counts) countByCategory[row.categoryId] = Number(row.count);

  return categories.map((category) => ({
    ...category.toJSON(),
    productCount: countByCategory[category.id] || 0,
  }));
}

async function getCategory(idOrSlug) {
  const where = Number.isInteger(Number(idOrSlug)) ? { id: Number(idOrSlug) } : { slug: idOrSlug };
  const category = await Category.findOne({ where });
  if (!category) throw notFound('Category not found');
  return category;
}

async function createCategory(input) {
  const slug = input.slug || slugify(input.name);
  const existing = await Category.findOne({ where: { slug } });
  if (existing) throw conflict('A category with this slug already exists');

  const nameExists = await Category.findOne({ where: { name: input.name } });
  if (nameExists) throw conflict('A category with this name already exists');

  return Category.create({
    name: input.name,
    slug,
    description: input.description || null,
  });
}

async function updateCategory(id, input) {
  const category = await Category.findByPk(id);
  if (!category) throw notFound('Category not found');

  if (input.slug && input.slug !== category.slug) {
    const slugExists = await Category.findOne({ where: { slug: input.slug } });
    if (slugExists) throw conflict('A category with this slug already exists');
  }
  if (input.name && input.name !== category.name) {
    const nameExists = await Category.findOne({ where: { name: input.name } });
    if (nameExists) throw conflict('A category with this name already exists');
  }

  await category.update({
    name: input.name || category.name,
    slug: input.slug || category.slug,
    description: input.description === undefined ? category.description : input.description,
  });
  return category;
}

async function deleteCategory(id) {
  const category = await Category.findByPk(id);
  if (!category) throw notFound('Category not found');

  const productCount = await Product.count({ where: { categoryId: category.id } });
  if (productCount > 0) {
    throw conflict(`Category still has ${productCount} product(s). Move or delete them first.`);
  }
  await category.destroy();
  return true;
}

module.exports = { listCategories, getCategory, createCategory, updateCategory, deleteCategory };
