const riderService = require('../services/rider.service');
const { success } = require('../utils/response');

async function list(req, res) {
  const riders = await riderService.listRiders();
  return success(res, 'Riders fetched', { riders });
}

async function get(req, res) {
  const rider = await riderService.getRiderDetail(req.params.id);
  return success(res, 'Rider fetched', { rider });
}

async function create(req, res) {
  const rider = await riderService.createRider(req.body);
  return success(res, 'Rider account created', { rider: await riderService.getRiderById(rider.id) }, 201);
}

async function update(req, res) {
  const rider = await riderService.updateRider(req.params.id, req.body);
  return success(res, 'Rider updated', { rider });
}

async function me(req, res) {
  const rider = await riderService.getRiderByUserId(req.user.id);
  return success(res, 'Rider profile fetched', { rider });
}

async function updateAvailability(req, res) {
  const rider = await riderService.getRiderByUserId(req.user.id);
  await riderService.updateAvailability(rider, req.body.availability);
  return success(res, 'Availability updated', { rider });
}

async function dashboard(req, res) {
  const data = await riderService.riderDashboard(req.user.id);
  return success(res, 'Rider dashboard fetched', data);
}

module.exports = { list, get, create, update, me, updateAvailability, dashboard };
