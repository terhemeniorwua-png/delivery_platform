const { z } = require('zod');

const addItemSchema = z.object({
  productVariantId: z.coerce.number().int().positive(),
  quantity: z.number().int().min(1).max(100).default(1),
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(1).max(100),
});

module.exports = { addItemSchema, updateItemSchema };
