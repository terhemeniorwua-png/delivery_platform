const { z } = require('zod');
const { USER_ROLES, USER_STATUSES } = require('../constants/status');
const { name, email, phone, password } = require('./auth.validator');

const userListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(USER_STATUSES).optional(),
  role: z.enum(USER_ROLES).optional(),
  search: z.string().trim().min(1).max(60).optional(),
});

// Administrator accounts are only ever created here — never through public
// registration, which is hardcoded to CUSTOMER.
const createAdministratorSchema = z.object({
  firstName: name,
  lastName: name,
  email,
  phone: phone.optional(),
  password,
});

const userRoleSchema = z.object({
  role: z.enum(USER_ROLES),
});

module.exports = { userListQuery, createAdministratorSchema, userRoleSchema };
