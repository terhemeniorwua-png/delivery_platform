const { z } = require('zod');
const { DELIVERY_STATUSES } = require('../constants/status');

const createDeliverySchema = z.object({
  orderId: z.uuid(),
  riderId: z.uuid(),
  pickupTime: z.coerce.date().optional().nullable(),
});

const assignSchema = z.object({
  riderId: z.uuid(),
  pickupTime: z.coerce.date().optional().nullable(),
});

const statusUpdateSchema = z.object({
  status: z.enum(DELIVERY_STATUSES),
  note: z.string().trim().max(300).optional(),
});

const deliveryListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(DELIVERY_STATUSES).optional(),
});

module.exports = { createDeliverySchema, assignSchema, statusUpdateSchema, deliveryListQuery };
