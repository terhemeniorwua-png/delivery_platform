const { Op } = require('sequelize');
const sequelize = require('../config/database');
const {
  Delivery,
  DeliveryEvent,
  Order,
  OrderItem,
  Rider,
  User,
  Address,
  Payment,
} = require('../models');
const { notFound, conflict, forbidden, badRequest } = require('../utils/errors');
const { DELIVERY_TRANSITIONS, ORDER_TRANSITIONS } = require('../constants/status');
const { releaseRiderIfIdle, markRiderBusy, getRiderByUserId } = require('./rider.service');

const ACTIVE_DELIVERY_STATUSES = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'];

const BASE_INCLUDES = [
  {
    model: Order,
    as: 'order',
    attributes: ['id', 'orderNumber', 'status', 'totalAmount', 'userId', 'addressId'],
    include: [
      {
        model: Address,
        as: 'address',
        attributes: ['id', 'label', 'recipientName', 'phone', 'addressLine', 'city', 'state', 'country'],
      },
      {
        model: OrderItem,
        as: 'items',
        attributes: ['id', 'productName', 'size', 'color', 'quantity', 'unitPrice', 'totalPrice'],
      },
    ],
  },
  {
    model: Rider,
    as: 'rider',
    attributes: ['id', 'vehicleType', 'vehicleNumber', 'availability'],
    include: [
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'phone'] },
    ],
  },
];

async function recordEvent(deliveryId, actorId, previousStatus, newStatus, note, transaction) {
  return DeliveryEvent.create(
    {
      deliveryId,
      actorId: actorId || null,
      previousStatus: previousStatus || null,
      newStatus,
      note: note || null,
    },
    { transaction }
  );
}

async function activeDeliveryForOrder(orderId, transaction) {
  return Delivery.findOne({
    where: { orderId, status: { [Op.in]: ACTIVE_DELIVERY_STATUSES } },
    transaction,
  });
}

async function loadRiderForAssignment(riderId, transaction) {
  const rider = await Rider.findOne({
    where: { id: riderId },
    include: [{ model: User, as: 'user', required: true }],
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
    transaction,
  });
  if (!rider) throw notFound('Rider not found');
  if (!rider.user || rider.user.status !== 'ACTIVE') throw badRequest('Rider account is not active');
  if (rider.availability !== 'AVAILABLE') throw conflict('Rider is not available');
  return rider;
}

async function createAndAssign({ orderId, riderId, pickupTime }, actor) {
  return sequelize.transaction(async (t) => {
    const order = await Order.findOne({
      where: { id: orderId },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!order) throw notFound('Order not found');
    if (order.status !== 'READY_FOR_PICKUP') {
      throw conflict('A rider can only be assigned when the order is READY_FOR_PICKUP');
    }

    const existing = await activeDeliveryForOrder(order.id, t);
    if (existing) throw conflict('This order already has an active delivery');

    const rider = await loadRiderForAssignment(riderId, t);

    const delivery = await Delivery.create(
      {
        orderId: order.id,
        riderId: rider.id,
        status: 'ASSIGNED',
        pickupTime: pickupTime || null,
      },
      { transaction: t }
    );
    await recordEvent(delivery.id, actor.id, null, 'ASSIGNED', 'Rider assigned to order', t);
    await markRiderBusy(rider.id, t);
    return delivery;
  });
}

async function reassign(deliveryId, { riderId, pickupTime }, actor) {
  return sequelize.transaction(async (t) => {
    const delivery = await Delivery.findOne({
      where: { id: deliveryId },
      include: [{ model: Order, as: 'order', required: true }],
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!delivery) throw notFound('Delivery not found');
    if (!['PENDING', 'ASSIGNED'].includes(delivery.status)) {
      throw conflict('Only pending or assigned deliveries can be reassigned');
    }
    if (delivery.riderId === riderId) throw conflict('That rider is already assigned to this delivery');

    const rider = await loadRiderForAssignment(riderId, t);
    const previousRiderId = delivery.riderId;

    await delivery.update(
      {
        riderId: rider.id,
        pickupTime: pickupTime === undefined ? delivery.pickupTime : pickupTime,
      },
      { transaction: t }
    );
    await recordEvent(
      delivery.id,
      actor.id,
      delivery.status,
      'ASSIGNED',
      `Reassigned to rider ${rider.user ? rider.user.firstName : rider.id}`,
      t
    );

    await releaseRiderIfIdle(previousRiderId, t);
    await markRiderBusy(rider.id, t);
    return delivery;
  });
}

async function syncOrderStatus(orderId, deliveryStatus, actor, t) {
  const order = await Order.findOne({
    where: { id: orderId },
    lock: t.LOCK.UPDATE,
    transaction: t,
  });
  if (!order) return null;

  const transitions = ORDER_TRANSITIONS[order.status] || [];

  if ((deliveryStatus === 'PICKED_UP' || deliveryStatus === 'IN_TRANSIT') && transitions.includes('OUT_FOR_DELIVERY')) {
    await order.update({ status: 'OUT_FOR_DELIVERY' }, { transaction: t });
    return order;
  }
  if (deliveryStatus === 'DELIVERED' && transitions.includes('DELIVERED')) {
    await order.update({ status: 'DELIVERED' }, { transaction: t });
    return order;
  }
  if (deliveryStatus === 'CANCELLED' && order.status === 'OUT_FOR_DELIVERY') {
    // The purchase is still valid, only the fulfilment attempt stopped.
    await order.update({ status: 'READY_FOR_PICKUP' }, { transaction: t });
    return order;
  }
  return order;
}

async function assertDeliveryAccess(delivery, user) {
  if (user.role === 'ADMIN') return;
  if (user.role === 'RIDER') {
    const profile = await getRiderByUserId(user.id);
    if (profile.id !== delivery.riderId) {
      throw forbidden('You can only access deliveries assigned to you');
    }
    return;
  }
  if (!delivery.order || delivery.order.userId !== user.id) {
    throw notFound('Delivery not found');
  }
}

async function transition(deliveryId, { status, note }, actor) {
  return sequelize.transaction(async (t) => {
    const delivery = await Delivery.findOne({
      where: { id: deliveryId },
      include: [{ model: Order, as: 'order', required: true }],
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!delivery) throw notFound('Delivery not found');
    await assertDeliveryAccess(delivery, actor);

    const allowed = DELIVERY_TRANSITIONS[delivery.status] || [];
    if (!allowed.includes(status)) {
      throw conflict(`A delivery cannot move from ${delivery.status} to ${status}`);
    }

    if (actor.role === 'RIDER' && status === 'CANCELLED') {
      throw forbidden('Contact support to cancel an assigned delivery');
    }

    const now = new Date();
    const previousStatus = delivery.status;
    const patch = { status };
    if (status === 'PICKED_UP') patch.pickedUpAt = now;
    if (status === 'IN_TRANSIT') patch.outForDeliveryAt = now;
    if (status === 'DELIVERED') patch.deliveredAt = now;

    await delivery.update(patch, { transaction: t });
    await recordEvent(delivery.id, actor.id, previousStatus, status, note, t);
    await syncOrderStatus(delivery.orderId, status, actor, t);

    if (status === 'DELIVERED' || status === 'CANCELLED') {
      await releaseRiderIfIdle(delivery.riderId, t);
    }

    if (status === 'DELIVERED') {
      const cashPayment = await Payment.findOne({
        where: { orderId: delivery.orderId, method: 'CASH', status: 'PENDING' },
        transaction: t,
      });
      if (cashPayment) {
        await cashPayment.update({ status: 'SUCCESSFUL', paidAt: now }, { transaction: t });
      }
    }

    return delivery;
  });
}

async function transitionByOrderStatus(order, targetStatus, actor, note) {
  const delivery = await activeDeliveryForOrder(order.id);
  if (!delivery) {
    throw conflict('No active delivery is assigned to this order');
  }

  if (targetStatus === 'OUT_FOR_DELIVERY') {
    if (!['ASSIGNED', 'PICKED_UP'].includes(delivery.status)) {
      throw conflict(`Delivery must be assigned or picked up first (currently ${delivery.status})`);
    }
    return transition(delivery.id, { status: 'IN_TRANSIT', note: note || 'Order marked out for delivery' }, actor);
  }

  if (targetStatus === 'DELIVERED') {
    if (!['PICKED_UP', 'IN_TRANSIT'].includes(delivery.status)) {
      throw conflict(`Delivery must be picked up first (currently ${delivery.status})`);
    }
    return transition(delivery.id, { status: 'DELIVERED', note: note || 'Order marked delivered' }, actor);
  }

  throw conflict(`Order status ${targetStatus} must be updated through the delivery workflow`);
}

async function listDeliveries(query, scope) {
  const where = {};
  if (query.status) where.status = query.status;

  const filterIncludes = [
    { model: Order, as: 'order', attributes: ['id'], required: true },
  ];

  if (scope.role === 'RIDER') {
    const profile = await getRiderByUserId(scope.userId);
    where.riderId = profile.id;
  } else if (scope.role === 'CUSTOMER') {
    where['$order.userId$'] = scope.userId;
  }

  const { count, rows } = await Delivery.findAndCountAll({
    where,
    include: filterIncludes,
    limit: query.limit,
    offset: (query.page - 1) * query.limit,
    order: [['createdAt', 'DESC']],
    distinct: true,
    col: 'id',
  });

  const ids = rows.map((row) => row.id);
  const deliveries = ids.length
    ? await Delivery.findAll({
        where: { id: ids },
        include: BASE_INCLUDES,
        order: [['createdAt', 'DESC']],
      })
    : [];

  return {
    deliveries,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / query.limit)),
    },
  };
}

async function getDelivery(deliveryId, user) {
  const delivery = await Delivery.findByPk(deliveryId, {
    include: [
      ...BASE_INCLUDES,
      {
        model: DeliveryEvent,
        as: 'events',
        include: [{ model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName', 'role'] }],
      },
    ],
  });
  if (!delivery) throw notFound('Delivery not found');
  await assertDeliveryAccess(delivery, user);
  const payload = delivery.toJSON();
  payload.events = (payload.events || []).sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
  return payload;
}

async function riderProfileFromScope(scope) {
  if (scope.role !== 'RIDER') return null;
  return getRiderByUserId(scope.userId);
}

module.exports = {
  createAndAssign,
  reassign,
  transition,
  transitionByOrderStatus,
  listDeliveries,
  getDelivery,
  activeDeliveryForOrder,
  riderProfileFromScope,
  ACTIVE_DELIVERY_STATUSES,
};
