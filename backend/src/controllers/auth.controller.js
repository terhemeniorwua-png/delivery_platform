const authService = require('../services/auth.service');
const { success } = require('../utils/response');

async function register(req, res) {
  const { user, token } = await authService.register(req.body);
  return success(res, 'Account created successfully', { user: user.toPublicJSON(), token }, 201);
}

async function login(req, res) {
  const { user, token } = await authService.login(req.body);
  return success(res, 'Signed in successfully', { user: user.toPublicJSON(), token });
}

async function me(req, res) {
  const user = await authService.getProfile(req.user.id);
  return success(res, 'Profile fetched', { user: user.toPublicJSON() });
}

async function updateMe(req, res) {
  const user = await authService.updateProfile(req.user.id, req.body);
  return success(res, 'Profile updated', { user: user.toPublicJSON() });
}

async function changePassword(req, res) {
  await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  return success(res, 'Password updated');
}

module.exports = { register, login, me, updateMe, changePassword };
