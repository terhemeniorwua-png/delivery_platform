const orderService = require('../services/order.service');
const { success } = require('../utils/response');

function scope(req) {
  return { role: req.user.role, userId: req.user.id };
}

async function create(req, res) {
  const order = await orderService.createOrder(req.user.id, req.body);
  return success(res, 'Order placed successfully', { order }, 201);
}

async function list(req, res) {
  const result = await orderService.listOrders(req.query, scope(req));
  return success(res, 'Orders fetched', result);
}

async function get(req, res) {
  const order = await orderService.getOrder(req.params.id, scope(req));
  return success(res, 'Order fetched', { order });
}

async function cancel(req, res) {
  const order = await orderService.cancelOrder(req.params.id, req.user);
  return success(res, 'Order cancelled', { order });
}

async function updateStatus(req, res) {
  const order = await orderService.updateOrderStatus(
    req.params.id,
    req.body.status,
    req.user,
    req.body.note
  );
  return success(res, 'Order status updated', { order });
}

async function assignDelivery(req, res) {
  const delivery = await orderService.assignDelivery(req.params.id, req.body, req.user);
  return success(res, 'Rider assigned to order', { delivery }, 201);
}

module.exports = { create, list, get, cancel, updateStatus, assignDelivery };
