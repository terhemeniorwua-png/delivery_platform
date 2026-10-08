const { Op } = require('sequelize');
const sequelize = require('../config/database');
const {
  Order,
  OrderItem,
  Cart,
  CartItem,
  Address,
  Product,
  ProductVariant,
  Payment,
  Delivery,
  DeliveryEvent,
  Rider,
  User,
} = require('../models');
const { notFound, conflict, badRequest } = require('../utils/errors');
const { generateOrderNumber } = require('../utils/helpers');
const { effectivePrice, refreshProductStockStatus } = require('./product.service');
const { getOrCreateCart } = require('./cart.service');
const { releaseRiderIfIdle } = require('./rider.service');
const {
  transitionByOrderStatus,
  activeDeliveryForOrder,
  createAndAssign,
} = require('./delivery.service');
const {
  ORDER_TRANSITIONS,
  CUSTOMER_CANCELABLE_STATUSES,
} = require('../constants/status');

const ACTIVE_DELIVERY_STATUSES = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'];

const ORDER_INCLUDES = [
  { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
  {
    model: Address,
    as: 'address',
    attributes: ['id', 'label', 'recipientName', 'phone', 'addressLine', 'city', 'state', 'country'],
  },
  { model: OrderItem, as: 'items' },
  {
    model: Payment,
    as: 'payments',
    attributes: ['id', 'amount', 'method', 'status', 'transactionReference', 'paidAt', 'createdAt'],
  },
  {
    model: Delivery,
    as: 'deliveries',
    include: [
      {
        model: Rider,
        as: 'rider',
        attributes: ['id', 'vehicleType', 'vehicleNumber', 'availability'],
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'phone'] }],
      },
    ],
  },
];

function deliveryFee() {
  const parsed = Number(process.env.DELIVERY_FEE);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1500;
}

async function createOrder(userId, { addressId }) {
  const productIdsToRefresh = [];

  const order = await sequelize.transaction(async (t) => {
    const cart = await getOrCreateCart(userId);
    const cartItems = await CartItem.findAll({
      where: { cartId: cart.id },
      order: [['id', 'ASC']],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (cartItems.length === 0) throw badRequest('Your cart is empty');

    const address = await Address.findOne({ where: { id: addressId, userId }, transaction: t });
    if (!address) throw notFound('Delivery address not found');

    // Lock variants in a stable order so concurrent checkouts cannot deadlock.
    const variantIds = [...new Set(cartItems.map((item) => item.productVariantId))].sort(
      (a, b) => a - b
    );
    const variants = await ProductVariant.findAll({
      where: { id: variantIds },
      include: [{ model: Product, as: 'product' }],
      order: [['id', 'ASC']],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    const variantById = new Map(variants.map((variant) => [variant.id, variant]));

    let subtotal = 0;
    const lines = [];

    for (const item of cartItems) {
      const variant = variantById.get(item.productVariantId);
      if (!variant) throw badRequest('An item in your cart is no longer available');
      const product = variant.product;
      if (!product || product.status !== 'ACTIVE') {
        throw badRequest(`${product ? product.name : 'An item'} is no longer available`);
      }
      if (variant.stockQuantity < item.quantity) {
        throw badRequest(
          `Insufficient stock for ${product.name} (${variant.size}/${variant.color}): only ${variant.stockQuantity} left`
        );
      }

      const unitPrice = effectivePrice(product, variant);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      productIdsToRefresh.push(product.id);
      lines.push({
        orderId: null,
        productId: product.id,
        productVariantId: variant.id,
        productName: product.name,
        size: variant.size,
        color: variant.color,
        quantity: item.quantity,
        unitPrice,
        totalPrice: lineTotal,
      });
    }

    const fee = deliveryFee();
    const created = await Order.create(
      {
        userId,
        addressId,
        orderNumber: generateOrderNumber(),
        subtotal,
        deliveryFee: fee,
        discount: 0,
        totalAmount: subtotal + fee,
        status: 'PENDING',
      },
      { transaction: t }
    );

    for (const line of lines) {
      line.orderId = created.id;
      await OrderItem.create(line, { transaction: t });
      await ProductVariant.increment('stockQuantity', {
        by: -line.quantity,
        where: { id: line.productVariantId },
        transaction: t,
      });
    }

    await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });
    return created;
  });

  for (const productId of new Set(productIdsToRefresh)) {
    await refreshProductStockStatus(productId);
  }

  return getOrder(order.id, { role: 'ADMIN', userId });
}

async function listOrders(query, scope) {
  const where = {};

  if (scope.role === 'CUSTOMER') {
    where.userId = scope.userId;
  } else if (query.userId) {
    where.userId = query.userId;
  }
  if (query.status) where.status = query.status;
  if (query.search) {
    where.orderNumber = { [Op.iLike]: `%${query.search.replace(/[\\%_]/g, (c) => `\\${c}`)}%` };
  }

  const { count, rows } = await Order.findAndCountAll({
    where,
    include: ORDER_INCLUDES,
    limit: query.limit,
    offset: (query.page - 1) * query.limit,
    order: [['createdAt', 'DESC']],
    distinct: true,
    col: 'id',
  });

  return {
    orders: rows,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / query.limit)),
    },
  };
}

async function getOrder(orderId, scope) {
  const order = await Order.findByPk(orderId, { include: ORDER_INCLUDES });
  if (!order) throw notFound('Order not found');
  if (scope.role !== 'ADMIN' && order.userId !== scope.userId) {
    throw notFound('Order not found');
  }
  return order;
}

async function loadOwnedOrder(orderId, userId) {
  const order = await Order.findOne({ where: { id: orderId, userId } });
  if (!order) throw notFound('Order not found');
  return order;
}

async function cancelOrder(orderId, actor) {
  const productIdsToRefresh = [];

  const cancelled = await sequelize.transaction(async (t) => {
    const order = await Order.findOne({
      where: { id: orderId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!order) throw notFound('Order not found');

    const isCustomer = actor.role === 'CUSTOMER';
    if (isCustomer && order.userId !== actor.id) throw notFound('Order not found');
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      throw conflict('This order can no longer be cancelled');
    }
    if (isCustomer && !CUSTOMER_CANCELABLE_STATUSES.includes(order.status)) {
      throw conflict('Only pending or confirmed orders can be cancelled');
    }

    const items = await OrderItem.findAll({ where: { orderId: order.id }, transaction: t });
    for (const item of items) {
      await ProductVariant.increment('stockQuantity', {
        by: item.quantity,
        where: { id: item.productVariantId },
        transaction: t,
      });
      if (item.productId) productIdsToRefresh.push(item.productId);
    }

    const delivery = await Delivery.findOne({
      where: { orderId: order.id, status: { [Op.in]: ACTIVE_DELIVERY_STATUSES } },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (delivery) {
      const previousStatus = delivery.status;
      await delivery.update({ status: 'CANCELLED' }, { transaction: t });
      await DeliveryEvent.create(
        {
          deliveryId: delivery.id,
          actorId: actor.id,
          previousStatus,
          newStatus: 'CANCELLED',
          note: 'Delivery cancelled because the order was cancelled',
        },
        { transaction: t }
      );
      await releaseRiderIfIdle(delivery.riderId, t);
    }

    const payments = await Payment.findAll({ where: { orderId: order.id }, transaction: t });
    for (const payment of payments) {
      if (payment.status === 'SUCCESSFUL') {
        await payment.update({ status: 'REFUNDED' }, { transaction: t });
      } else if (payment.status === 'PENDING') {
        await payment.update({ status: 'FAILED' }, { transaction: t });
      }
    }

    await order.update({ status: 'CANCELLED' }, { transaction: t });
    return order;
  });

  for (const productId of new Set(productIdsToRefresh)) {
    await refreshProductStockStatus(productId);
  }

  return getOrder(cancelled.id, { role: 'ADMIN', userId: actor.id });
}

async function updateOrderStatus(orderId, newStatus, actor, note) {
  if (newStatus === 'CANCELLED') {
    return cancelOrder(orderId, actor);
  }

  if (newStatus === 'OUT_FOR_DELIVERY' || newStatus === 'DELIVERED') {
    const order = await Order.findByPk(orderId);
    if (!order) throw notFound('Order not found');
    await transitionByOrderStatus(order, newStatus, actor, note);
    return getOrder(order.id, { role: 'ADMIN', userId: actor.id });
  }

  const updated = await sequelize.transaction(async (t) => {
    const order = await Order.findOne({
      where: { id: orderId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!order) throw notFound('Order not found');

    const allowed = ORDER_TRANSITIONS[order.status] || [];
    if (!allowed.includes(newStatus)) {
      throw conflict(`An order cannot move from ${order.status} to ${newStatus}`);
    }

    if (newStatus === 'CONFIRMED') {
      const payment = await Payment.findOne({
        where: { orderId: order.id, status: { [Op.in]: ['PENDING', 'SUCCESSFUL'] } },
        order: [['id', 'DESC']],
        transaction: t,
      });
      const confirmable =
        payment &&
        (payment.status === 'SUCCESSFUL' || (payment.method === 'CASH' && payment.status === 'PENDING'));
      if (!confirmable) {
        throw conflict('A payment must be recorded before the order can be confirmed');
      }
    }

    await order.update({ status: newStatus }, { transaction: t });
    return order;
  });

  return getOrder(updated.id, { role: 'ADMIN', userId: actor.id });
}

async function assignDelivery(orderId, input, actor) {
  return createAndAssign({ orderId, ...input }, actor);
}

module.exports = {
  createOrder,
  listOrders,
  getOrder,
  loadOwnedOrder,
  cancelOrder,
  updateOrderStatus,
  assignDelivery,
  ORDER_INCLUDES,
};
