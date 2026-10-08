const { z } = require('zod');
const { RIDER_AVAILABILITY, VEHICLE_TYPES } = require('../constants/status');
const { email, password, phone } = require('./auth.validator');

const createRiderSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email,
  phone: phone.optional(),
  password,
  vehicleType: z.enum(VEHICLE_TYPES).default('MOTORCYCLE'),
  vehicleNumber: z.string().trim().min(2).max(30),
});

const updateRiderSchema = z
  .object({
    vehicleType: z.enum(VEHICLE_TYPES).optional(),
    vehicleNumber: z.string().trim().min(2).max(30).optional(),
    availability: z.enum(RIDER_AVAILABILITY).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'No fields to update' });

const availabilitySchema = z.object({
  availability: z.enum(['AVAILABLE', 'OFFLINE']),
});

module.exports = { createRiderSchema, updateRiderSchema, availabilitySchema };
