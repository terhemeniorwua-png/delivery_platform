const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Payment, Order } = require('../models');
const { notFound, conflict } = require('../utils/errors');
const { generateTransactionReference } = require('../utils/helpers');
const { PAYMENT_TRANSITIONS } = require('../constants/status');

const PAYABLE_ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
];

const ORDER_INCLUDE = {
  model: Order,
  as: 'order',
  attributes: ['id', 'orderNumber', 'status', 'totalAmount', 'userId'],
};

async function createPayment({ userId, orderId, method, transactionReference }) {
  return sequelize.transaction(async (t) => {
    const order = await Order.findOne({
      where: { id: orderId },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!order) throw notFound('Order not found');
    if (userId && order.userId !== userId) throw notFound('Order not found');
    if (!PAYABLE_ORDER_STATUSES.includes(order.status)) {
      throw conflict(`Payment cannot be recorded for an order that is ${order.status}`);
    }

    const existing = await Payment.findOne({
      where: { orderId: order.id, status: { [Op.in]: ['PENDING', 'SUCCESSFUL'] } },
      transaction: t,
    });
    if (existing) {
      throw conflict(
        existing.status === 'SUCCESSFUL'
          ? 'This order has already been paid for'
          : 'A payment for this order is already awaiting confirmation'
      );
    }

    // The amount always mirrors the order total so payments and orders cannot drift.
    const amount = Number(order.totalAmount);
    const isInstantApproval = method === 'CARD' || method === 'TRANSFER';

    const payment = await Payment.create(
      {
        orderId: order.id,
        amount,
        method,
        status: isInstantApproval ? 'SUCCESSFUL' : 'PENDING',
        transactionReference: transactionReference || generateTransactionReference(),
        paidAt: isInstantApproval ? new Date() : null,
      },
      { transaction: t }
    );

    if (isInstantApproval && order.status === 'PENDING') {
      await order.update({ status: 'CONFIRMED' }, { transaction: t });
    }

    return { payment, order };
  });
}

async function transitionPayment(paymentId, status) {
  return sequelize.transaction(async (t) => {
    const payment = await Payment.findOne({
      where: { id: paymentId },
      include: [ORDER_INCLUDE],
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!payment) throw notFound('Payment not found');

    const allowed = PAYMENT_TRANSITIONS[payment.status] || [];
    if (!allowed.includes(status)) {
      throw conflict(`A payment cannot move from ${payment.status} to ${status}`);
    }

    const patch = { status };
    if (status === 'SUCCESSFUL') patch.paidAt = new Date();
    await payment.update(patch, { transaction: t });

    if (status === 'SUCCESSFUL' && payment.order && payment.order.status === 'PENDING') {
      await payment.order.update({ status: 'CONFIRMED' }, { transaction: t });
    }

    return payment;
  });
}

async function listPayments(query, scope) {
  const where = {};
  if (query.status) where.status = query.status;
  if (query.orderId) where.orderId = query.orderId;

  const include = [{ ...ORDER_INCLUDE }];
  if (scope.role !== 'ADMIN') {
    include[0].where = { userId: scope.userId };
    include[0].required = true;
  }

  const { count, rows } = await Payment.findAndCountAll({
    where,
    include,
    limit: query.limit,
    offset: (query.page - 1) * query.limit,
    order: [['createdAt', 'DESC']],
    distinct: true,
    col: 'id',
  });

  return {
    payments: rows,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / query.limit)),
    },
  };
}

async function getPayment(paymentId, user) {
  const payment = await Payment.findByPk(paymentId, { include: [ORDER_INCLUDE] });
  if (!payment) throw notFound('Payment not found');
  if (user.role !== 'ADMIN' && payment.order.userId !== user.id) {
    throw notFound('Payment not found');
  }
  return payment;
}

module.exports = { createPayment, transitionPayment, listPayments, getPayment };
