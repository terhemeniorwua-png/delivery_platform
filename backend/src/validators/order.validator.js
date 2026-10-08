const { z } = require('zod');
const { ORDER_STATUSES } = require('../constants/status');

const createOrderSchema = z.object({
  addressId: z.uuid(),
  note: z.string().trim().max(300).optional(),
});

const orderListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(ORDER_STATUSES).optional(),
  userId: z.uuid().optional(),
  search: z.string().trim().min(1).max(60).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(300).optional(),
});

const cancelSchema = z
  .object({
    reason: z.string().trim().max(300).optional(),
  })
  .optional();

module.exports = { createOrderSchema, orderListQuery, updateStatusSchema, cancelSchema };
