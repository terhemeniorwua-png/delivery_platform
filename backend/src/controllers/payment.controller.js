const paymentService = require('../services/payment.service');
const { success } = require('../utils/response');

function scope(req) {
  return { role: req.user.role, userId: req.user.id };
}

async function create(req, res) {
  const userId = req.user.role === 'ADMIN' ? null : req.user.id;
  const { payment, order } = await paymentService.createPayment({ userId, ...req.body });
  return success(
    res,
    payment.status === 'SUCCESSFUL' ? 'Payment confirmed' : 'Payment recorded, awaiting confirmation',
    { payment, order },
    201
  );
}

async function list(req, res) {
  const result = await paymentService.listPayments(req.query, scope(req));
  return success(res, 'Payments fetched', result);
}

async function get(req, res) {
  const payment = await paymentService.getPayment(req.params.id, req.user);
  return success(res, 'Payment fetched', { payment });
}

async function updateStatus(req, res) {
  const payment = await paymentService.transitionPayment(req.params.id, req.body.status);
  return success(res, 'Payment status updated', { payment });
}

module.exports = { create, list, get, updateStatus };
