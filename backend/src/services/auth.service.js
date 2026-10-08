const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Cart, PasswordReset } = require('../models');
const { conflict, unauthorized, forbidden, badRequest, notFound } = require('../utils/errors');

const SALT_ROUNDS = 10;
const RESET_CODE_LENGTH = 6;
const RESET_CODE_TTL_MINUTES = 15;

function generateResetCode(length = RESET_CODE_LENGTH) {
  return crypto
    .randomInt(0, Math.pow(10, length))
    .toString()
    .padStart(length, '0');
}

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.APP_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}

async function register(input) {
  const email = String(input.email).toLowerCase();
  const existing = await User.scope('withPassword').findOne({ where: { email } });
  if (existing) throw conflict('An account with this email already exists');

  const hashed = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await User.create({
    firstName: input.firstName,
    lastName: input.lastName,
    email,
    phone: input.phone || null,
    password: hashed,
    role: 'CUSTOMER',
    status: 'ACTIVE',
  });

  await Cart.findOrCreate({ where: { userId: user.id } });

  return { user, token: signToken(user) };
}

async function login({ email, password }) {
  const user = await User.scope('withPassword').findOne({
    where: { email: String(email).toLowerCase() },
  });

  if (!user) throw unauthorized('Invalid email or password');
  const matches = await bcrypt.compare(password, user.password);
  if (!matches) throw unauthorized('Invalid email or password');
  if (user.status !== 'ACTIVE') {
    throw forbidden(user.status === 'SUSPENDED' ? 'Account is suspended' : 'Account is inactive');
  }

  return { user, token: signToken(user) };
}

async function getProfile(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw unauthorized('Account no longer exists');
  return user;
}

async function updateProfile(userId, input) {
  const user = await User.findByPk(userId);
  if (!user) throw unauthorized('Account no longer exists');
  // updateProfileSchema only whitelists firstName/lastName/phone; this guard
  // makes it impossible for a role/status to slip in if the schema ever grows.
  if ('role' in input || 'status' in input) {
    throw forbidden('Your role and account status cannot be changed here');
  }
  await user.update(input);
  return user;
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.scope('withPassword').findByPk(userId);
  if (!user) throw unauthorized('Account no longer exists');
  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) throw unauthorized('Current password is incorrect');
  await user.update({ password: await bcrypt.hash(newPassword, SALT_ROUNDS) });
  return user;
}

async function requestPasswordReset(email) {
  const normalized = String(email).trim().toLowerCase();
  const user = await User.findOne({ where: { email: normalized } });
  if (!user) throw notFound('No account found with this email');
  if (user.status !== 'ACTIVE') {
    throw badRequest(user.status === 'SUSPENDED' ? 'This account is suspended' : 'This account is inactive');
  }

  // Invalidate any outstanding codes so only the newest one is valid.
  await PasswordReset.update({ usedAt: new Date() }, { where: { userId: user.id, usedAt: null } });

  const code = generateResetCode();
  const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MINUTES * 60 * 1000);
  await PasswordReset.create({
    userId: user.id,
    code: await bcrypt.hash(code, SALT_ROUNDS),
    expiresAt,
  });

  // The plain code is returned here only because this demo has no mailer —
  // it appears in the UI's "alert" so the flow can be completed. In
  // production this would be emailed instead of returned.
  return { user, code, expiresAt };
}

async function resetPassword({ email, code, newPassword }) {
  const normalized = String(email).trim().toLowerCase();
  const user = await User.scope('withPassword').findOne({ where: { email: normalized } });
  if (!user) throw notFound('No account found with this email');

  const reset = await PasswordReset.findOne({
    where: { userId: user.id, usedAt: null },
    order: [['createdAt', 'DESC']],
  });
  if (!reset || reset.expiresAt.getTime() <= Date.now()) {
    throw badRequest('This reset code has expired. Request a new one.');
  }

  const matches = await bcrypt.compare(String(code), reset.code);
  if (!matches) throw badRequest('Incorrect verification code');

  await user.update({ password: await bcrypt.hash(newPassword, SALT_ROUNDS) });
  await PasswordReset.update({ usedAt: new Date() }, { where: { userId: user.id, usedAt: null } });
  return user;
}

module.exports = {
  signToken,
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
};
