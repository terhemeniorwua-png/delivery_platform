const { z } = require('zod');
const { PAYMENT_METHODS, PAYMENT_STATUSES } = require('../constants/status');

const createPaymentSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  method: z.enum(PAYMENT_METHODS),
  transactionReference: z.string().trim().min(6).max(80).optional(),
});

const paymentStatusSchema = z.object({
  status: z.enum(PAYMENT_STATUSES),
});

const paymentListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(PAYMENT_STATUSES).optional(),
  orderId: z.coerce.number().int().positive().optional(),
});

module.exports = { createPaymentSchema, paymentStatusSchema, paymentListQuery };
