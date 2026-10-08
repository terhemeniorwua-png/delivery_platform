const { z } = require('zod');

const idParam = z.object({ id: z.uuid() });

const email = z
  .string()
  .trim()
  .min(5)
  .max(160)
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Must be a valid email address');

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72)
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

const phone = z
  .string()
  .trim()
  .min(7)
  .max(20)
  .regex(/^\+?[0-9][0-9\s-]{6,19}$/, 'Must be a valid phone number');

const name = z.string().trim().min(2).max(60);

const registerSchema = z.object({
  firstName: name,
  lastName: name,
  email,
  phone: phone.optional(),
  password,
});

const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

const updateProfileSchema = z
  .object({
    firstName: name.optional(),
    lastName: name.optional(),
    phone: phone.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'No fields to update' });

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});

const forgotPasswordSchema = z.object({
  email,
});

const resetPasswordSchema = z.object({
  email,
  code: z.string().trim().regex(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
  newPassword: password,
});

const verifyCodeSchema = z.object({
  email,
  code: z.string().trim().regex(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
});

const addressSchema = z.object({
  label: z.string().trim().min(1).max(40).optional(),
  recipientName: z.string().trim().min(2).max(120),
  phone,
  addressLine: z.string().trim().min(3).max(300),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  country: z.string().trim().min(1).max(80).optional(),
  postalCode: z.string().trim().max(20).optional().nullable(),
  isDefault: z.boolean().optional(),
});

const addressUpdateSchema = addressSchema.partial().refine(
  (body) => Object.keys(body).length > 0,
  { message: 'No fields to update' }
);

const userStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
});

module.exports = {
  idParam,
  email,
  password,
  phone,
  name,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  verifyCodeSchema,
  resetPasswordSchema,
  addressSchema,
  addressUpdateSchema,
  userStatusSchema,
};
