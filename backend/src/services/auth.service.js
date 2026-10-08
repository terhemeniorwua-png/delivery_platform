const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Cart } = require('../models');
const { conflict, unauthorized, forbidden } = require('../utils/errors');

const SALT_ROUNDS = 10;

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

module.exports = {
  signToken,
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
};
