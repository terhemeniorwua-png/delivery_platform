const { Op } = require('sequelize');
const {
  Product,
  Category,
  ProductVariant,
  ProductImage,
  OrderItem,
} = require('../models');
const { notFound, conflict, badRequest } = require('../utils/errors');
const { slugify, isUuid } = require('../utils/helpers');

const LIST_INCLUDES = [
  { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
  {
    model: ProductImage,
    as: 'images',
    attributes: ['id', 'imageUrl', 'isPrimary'],
    order: [['isPrimary', 'DESC'], ['id', 'ASC']],
  },
  {
    model: ProductVariant,
    as: 'variants',
    attributes: ['id', 'size', 'color', 'sku', 'price', 'stockQuantity'],
    order: [['id', 'ASC']],
  },
];

function effectivePrice(product, variant) {
  if (variant && variant.price !== null && variant.price !== undefined) return Number(variant.price);
  if (product.discountPrice !== null && product.discountPrice !== undefined) {
    return Number(product.discountPrice);
  }
  return Number(product.price);
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

async function uniqueSlug(base) {
  let slug = slugify(base);
  let candidate = slug;
  let suffix = 1;
  while (await Product.findOne({ where: { slug: candidate } })) {
    candidate = `${slug}-${suffix++}`;
  }
  return candidate;
}

async function refreshProductStockStatus(productId) {
  const product = await Product.findByPk(productId);
  if (!product) return;
  const totals = await ProductVariant.sum('stockQuantity', { where: { productId } });
  const total = Number(totals || 0);
  if (total <= 0 && product.status === 'ACTIVE') {
    await product.update({ status: 'OUT_OF_STOCK' });
  } else if (total > 0 && product.status === 'OUT_OF_STOCK') {
    await product.update({ status: 'ACTIVE' });
  }
}

async function listProducts(query, { isAdmin = false } = {}) {
  const where = {};
  if (query.status && isAdmin) where.status = query.status;
  else if (!isAdmin) where.status = 'ACTIVE';

  if (query.brand) where.brand = { [Op.iLike]: `%${escapeLike(query.brand)}%` };

  if (query.search) {
    const term = `%${escapeLike(query.search)}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: term } },
      { brand: { [Op.iLike]: term } },
      { description: { [Op.iLike]: term } },
    ];
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {};
    if (query.minPrice !== undefined) where.price[Op.gte] = query.minPrice;
    if (query.maxPrice !== undefined) where.price[Op.lte] = query.maxPrice;
  }

  if (query.category !== undefined) {
    const category = await Category.findOne({
      where: isUuid(query.category) ? { id: query.category } : { slug: query.category },
    });
    if (!category) throw notFound('Category not found');
    where.categoryId = category.id;
  }

  const orderMap = {
    newest: [['createdAt', 'DESC']],
    price_asc: [['price', 'ASC']],
    price_desc: [['price', 'DESC']],
    name: [['name', 'ASC']],
  };

  const limit = query.limit;
  const offset = (query.page - 1) * limit;

  const { count, rows } = await Product.findAndCountAll({
    where,
    include: LIST_INCLUDES,
    limit,
    offset,
    order: orderMap[query.sort] || orderMap.newest,
    distinct: true,
    col: 'id',
  });

  return {
    products: rows,
    pagination: {
      page: query.page,
      limit,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / limit)),
    },
  };
}

async function getProduct(idOrSlug, { isAdmin = false } = {}) {
  const product = await Product.findOne({
    where: isUuid(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug },
    include: LIST_INCLUDES,
  });
  if (!product) throw notFound('Product not found');
  if (product.status !== 'ACTIVE' && !isAdmin) throw notFound('Product not found');

  const totalStock = product.variants.reduce((sum, variant) => sum + variant.stockQuantity, 0);
  return { ...product.toJSON(), totalStock };
}

async function createProduct(input) {
  const category = await Category.findByPk(input.categoryId);
  if (!category) throw notFound('Category not found');

  const slug = input.slug ? slugify(input.slug) : await uniqueSlug(input.name);
  const slugTaken = await Product.findOne({ where: { slug } });
  if (slugTaken) throw conflict('A product with this slug already exists');

  const skuTaken = await Product.findOne({ where: { sku: input.sku } });
  if (skuTaken) throw conflict('A product with this SKU already exists');

  return Product.create({
    categoryId: input.categoryId,
    name: input.name,
    slug,
    description: input.description,
    price: input.price,
    discountPrice: input.discountPrice ?? null,
    sku: input.sku,
    brand: input.brand ?? null,
    status: input.status || 'ACTIVE',
  });
}

async function updateProduct(id, input) {
  const product = await Product.findByPk(id);
  if (!product) throw notFound('Product not found');

  if (input.categoryId !== undefined) {
    const category = await Category.findByPk(input.categoryId);
    if (!category) throw notFound('Category not found');
  }

  if (input.slug && slugify(input.slug) !== product.slug) {
    const slugTaken = await Product.findOne({ where: { slug: slugify(input.slug) } });
    if (slugTaken) throw conflict('A product with this slug already exists');
  }

  if (input.sku && input.sku !== product.sku) {
    const skuTaken = await Product.findOne({ where: { sku: input.sku } });
    if (skuTaken) throw conflict('A product with this SKU already exists');
  }

  if (input.discountPrice !== undefined && input.discountPrice !== null && input.price !== undefined) {
    if (input.discountPrice > input.price) {
      throw badRequest('Discount price cannot be higher than the price');
    }
  }

  const payload = { ...input };
  if (payload.slug) payload.slug = slugify(payload.slug);
  await product.update(payload);
  return product;
}

async function deleteProduct(id) {
  const product = await Product.findByPk(id);
  if (!product) throw notFound('Product not found');

  const orderItems = await OrderItem.count({ where: { productId: product.id } });
  if (orderItems > 0) {
    throw conflict('This product has order history. Set its status to INACTIVE instead.');
  }

  await product.destroy();
  return true;
}

async function createVariant(productId, input) {
  const product = await Product.findByPk(productId);
  if (!product) throw notFound('Product not found');

  const skuTaken = await ProductVariant.findOne({ where: { sku: input.sku } });
  if (skuTaken) throw conflict('A variant with this SKU already exists');

  const comboTaken = await ProductVariant.findOne({
    where: { productId, size: input.size, color: input.color },
  });
  if (comboTaken) throw conflict('This size and colour combination already exists for the product');

  const variant = await ProductVariant.create({
    productId,
    size: input.size,
    color: input.color,
    sku: input.sku,
    price: input.price ?? null,
    stockQuantity: input.stockQuantity ?? 0,
  });
  await refreshProductStockStatus(productId);
  return variant;
}

async function updateVariant(productId, variantId, input) {
  const variant = await ProductVariant.findOne({ where: { id: variantId, productId } });
  if (!variant) throw notFound('Product variant not found');

  if (input.sku && input.sku !== variant.sku) {
    const skuTaken = await ProductVariant.findOne({ where: { sku: input.sku } });
    if (skuTaken) throw conflict('A variant with this SKU already exists');
  }

  if ((input.size && input.size !== variant.size) || (input.color && input.color !== variant.color)) {
    const comboTaken = await ProductVariant.findOne({
      where: {
        productId,
        size: input.size || variant.size,
        color: input.color || variant.color,
        id: { [Op.ne]: variant.id },
      },
    });
    if (comboTaken) throw conflict('This size and colour combination already exists for the product');
  }

  if (input.stockQuantity !== undefined && input.stockQuantity < 0) {
    throw badRequest('Stock quantity cannot be negative');
  }

  await variant.update(input);
  await refreshProductStockStatus(productId);
  return variant;
}

async function deleteVariant(productId, variantId) {
  const variant = await ProductVariant.findOne({ where: { id: variantId, productId } });
  if (!variant) throw notFound('Product variant not found');

  const referenced = await OrderItem.count({ where: { productVariantId: variant.id } });
  if (referenced > 0) {
    throw conflict('This variant has order history and cannot be deleted.');
  }

  await variant.destroy();
  await refreshProductStockStatus(productId);
  return true;
}

async function updateStock(variantId, { quantity, mode }) {
  const variant = await ProductVariant.findByPk(variantId);
  if (!variant) throw notFound('Product variant not found');

  const next = mode === 'increment' ? variant.stockQuantity + quantity : quantity;
  if (next < 0) throw badRequest('Stock quantity cannot be negative');

  await variant.update({ stockQuantity: next });
  await refreshProductStockStatus(variant.productId);
  return variant;
}

async function addImage(productId, { imageUrl, isPrimary }) {
  const product = await Product.findByPk(productId);
  if (!product) throw notFound('Product not found');

  const existingCount = await ProductImage.count({ where: { productId } });
  const shouldBePrimary = isPrimary || existingCount === 0;

  if (shouldBePrimary) {
    await ProductImage.update({ isPrimary: false }, { where: { productId } });
  }

  return ProductImage.create({ productId, imageUrl, isPrimary: shouldBePrimary });
}

async function setPrimaryImage(productId, imageId) {
  const image = await ProductImage.findOne({ where: { id: imageId, productId } });
  if (!image) throw notFound('Product image not found');
  await ProductImage.update({ isPrimary: false }, { where: { productId } });
  await image.update({ isPrimary: true });
  return image;
}

async function deleteImage(productId, imageId) {
  const image = await ProductImage.findOne({ where: { id: imageId, productId } });
  if (!image) throw notFound('Product image not found');
  const wasPrimary = image.isPrimary;
  await image.destroy();
  if (wasPrimary) {
    const next = await ProductImage.findOne({ where: { productId }, order: [['id', 'ASC']] });
    if (next) await next.update({ isPrimary: true });
  }
  return true;
}

module.exports = {
  effectivePrice,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  updateStock,
  addImage,
  setPrimaryImage,
  deleteImage,
  refreshProductStockStatus,
};
