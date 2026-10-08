const deliveryService = require('../services/delivery.service');
const { success } = require('../utils/response');

function scope(req) {
  return { role: req.user.role, userId: req.user.id };
}

async function list(req, res) {
  const result = await deliveryService.listDeliveries(req.query, scope(req));
  return success(res, 'Deliveries fetched', result);
}

async function get(req, res) {
  const delivery = await deliveryService.getDelivery(Number(req.params.id), req.user);
  return success(res, 'Delivery fetched', { delivery });
}

async function create(req, res) {
  const delivery = await deliveryService.createAndAssign(req.body, req.user);
  return success(res, 'Delivery created and rider assigned', { delivery }, 201);
}

async function reassign(req, res) {
  const delivery = await deliveryService.reassign(Number(req.params.id), req.body, req.user);
  return success(res, 'Delivery reassigned', { delivery });
}

async function updateStatus(req, res) {
  const delivery = await deliveryService.transition(
    Number(req.params.id),
    { status: req.body.status, note: req.body.note },
    req.user
  );
  return success(res, 'Delivery status updated', { delivery });
}

module.exports = { list, get, create, reassign, updateStatus };
