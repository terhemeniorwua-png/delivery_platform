const { z } = require('zod');
const { VEHICLE_TYPES, RIDER_APPLICATION_STATUSES } = require('../constants/status');
const { phone, idParam } = require('./auth.validator');

const dateOfBirth = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return false;
    const now = Date.now();
    // Must be a valid past date and the applicant must be at least 18.
    return parsed.getTime() < now && now - parsed.getTime() >= 18 * 365.25 * 24 * 3600 * 1000;
  }, 'You must be at least 18 years old');

const createRiderApplicationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone,
  dateOfBirth,
  addressLine: z.string().trim().min(3).max(300),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  vehicleType: z.enum(VEHICLE_TYPES).default('MOTORCYCLE'),
  vehicleNumber: z.string().trim().min(2).max(30),
  licenseNumber: z.string().trim().min(3).max(60),
  emergencyContactName: z.string().trim().min(2).max(120),
  emergencyContactPhone: phone,
});

const applicationListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(RIDER_APPLICATION_STATUSES).optional(),
  search: z.string().trim().min(1).max(60).optional(),
});

const rejectSchema = z.object({
  reason: z.string().trim().min(1).max(300).optional(),
});

module.exports = {
  createRiderApplicationSchema,
  applicationListQuery,
  rejectSchema,
  idParam,
};