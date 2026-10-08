const { z } = require('zod');
const { PRODUCT_STATUSES } = require('../constants/status');

const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

const productListQuery = paginationQuery.extend({
  search: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().min(1).optional(),
  brand: z.string().trim().min(1).max(80).optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'name']).default('newest'),
});

const createProductSchema = z.object({
  categoryId: z.uuid(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(5000),
  price: z.number().positive().max(100000000),
  discountPrice: z.number().min(0).max(100000000).nullable().optional(),
  sku: z.string().trim().min(3).max(60),
  brand: z.string().trim().min(1).max(80).nullable().optional(),
  slug: z.string().trim().min(2).max(180).optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
});

const updateProductSchema = createProductSchema.partial().refine(
  (body) => Object.keys(body).length > 0,
  { message: 'No fields to update' }
);

const variantSchema = z.object({
  size: z.string().trim().min(1).max(20),
  color: z.string().trim().min(1).max(40),
  sku: z.string().trim().min(3).max(60),
  price: z.number().min(0).max(100000000).nullable().optional(),
  stockQuantity: z.number().int().min(0).max(100000).optional(),
});

const updateVariantSchema = variantSchema.partial().refine(
  (body) => Object.keys(body).length > 0,
  { message: 'No fields to update' }
);

const stockSchema = z.object({
  quantity: z.number().int().min(0).max(100000),
  mode: z.enum(['set', 'increment']).default('set'),
});

const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers and dashes').optional(),
  description: z.string().trim().max(1000).nullable().optional(),
});

const updateCategorySchema = categorySchema.partial().refine(
  (body) => Object.keys(body).length > 0,
  { message: 'No fields to update' }
);

const imageSchema = z.object({
  imageUrl: z.url(),
  isPrimary: z.boolean().optional(),
});

module.exports = {
  productListQuery,
  createProductSchema,
  updateProductSchema,
  variantSchema,
  updateVariantSchema,
  stockSchema,
  categorySchema,
  updateCategorySchema,
  imageSchema,
};
