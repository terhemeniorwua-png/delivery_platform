const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { User, Rider, Delivery, Order } = require('../models');
const { notFound, conflict, badRequest } = require('../utils/errors');

const ACTIVE_RIDER_DELIVERY_STATUSES = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'];

// One grouped query for every rider's delivery tally — used by the admin rider
// list/detail so statistics never require loading every delivery row.
async function deliveryStatsByRider(ids) {
  const map = {};
  for (const id of ids) {
    map[id] = { active: 0, delivered: 0, cancelled: 0, total: 0 };
  }
  if (ids.length === 0) return map;

  const rows = await Delivery.findAll({
    where: { riderId: { [Op.in]: ids } },
    attributes: ['riderId', 'status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['riderId', 'status'],
    raw: true,
  });

  for (const row of rows) {
    const entry = map[row.riderId];
    if (!entry) continue;
    const count = Number(row.count);
    entry.total += count;
    if (ACTIVE_RIDER_DELIVERY_STATUSES.includes(row.status)) entry.active += count;
    else if (row.status === 'DELIVERED') entry.delivered += count;
    else if (row.status === 'CANCELLED') entry.cancelled += count;
  }
  return map;
}

async function createRider(input) {
  const email = String(input.email).toLowerCase();
  return sequelize.transaction(async (t) => {
    const existing = await User.scope('withPassword').findOne({ where: { email }, transaction: t });
    if (existing) throw conflict('An account with this email already exists');

    const user = await User.create(
      {
        firstName: input.firstName,
        lastName: input.lastName,
        email,
        phone: input.phone || null,
        password: await bcrypt.hash(input.password, 10),
        role: 'RIDER',
        status: 'ACTIVE',
      },
      { transaction: t }
    );

    const rider = await Rider.create(
      {
        userId: user.id,
        vehicleType: input.vehicleType || 'MOTORCYCLE',
        vehicleNumber: input.vehicleNumber,
        availability: 'OFFLINE',
      },
      { transaction: t }
    );

    return rider;
  });
}

async function listRiders() {
  const riders = await Rider.findAll({
    include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'status'] }],
    order: [['id', 'ASC']],
  });

  const stats = await deliveryStatsByRider(riders.map((rider) => rider.id));

  return riders.map((rider) => {
    const counts = stats[rider.id] || { active: 0, delivered: 0, cancelled: 0, total: 0 };
    return {
      ...rider.toJSON(),
      activeDeliveries: counts.active,
      completedDeliveries: counts.delivered,
      cancelledDeliveries: counts.cancelled,
      totalDeliveries: counts.total,
    };
  });
}

async function getRiderByUserId(userId) {
  const rider = await Rider.findOne({
    where: { userId },
    include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'status', 'role'] }],
  });
  if (!rider) throw notFound('Rider profile not found');
  return rider;
}

async function getRiderById(riderId) {
  const rider = await Rider.findByPk(riderId, {
    include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'status', 'role'] }],
  });
  if (!rider) throw notFound('Rider not found');
  return rider;
}

async function updateRider(riderId, input) {
  const rider = await getRiderById(riderId);
  if (input.availability === 'BUSY') {
    throw badRequest('Availability is set to BUSY automatically when a delivery is assigned');
  }
  if (input.availability === 'OFFLINE' && rider.availability !== 'OFFLINE') {
    const active = await Delivery.count({
      where: { riderId: rider.id, status: { [Op.in]: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] } },
    });
    if (active > 0) throw conflict('Rider still has active deliveries');
  }
  await rider.update(input);
  return rider;
}

async function updateAvailability(rider, availability) {
  if (availability === 'OFFLINE') {
    const active = await Delivery.count({
      where: { riderId: rider.id, status: { [Op.in]: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] } },
    });
    if (active > 0) throw conflict('You still have active deliveries');
  }
  await rider.update({ availability });
  return rider;
}

async function markRiderBusy(riderId, transaction) {
  await Rider.update({ availability: 'BUSY' }, { where: { id: riderId }, transaction });
}

async function releaseRiderIfIdle(riderId, transaction) {
  const active = await Delivery.count({
    where: { riderId, status: { [Op.in]: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] } },
    transaction,
  });
  if (active === 0) {
    await Rider.update({ availability: 'AVAILABLE' }, { where: { id: riderId }, transaction });
  }
}

// Phase 12 — admin rider detail with delivery statistics.
async function getRiderDetail(riderId) {
  const rider = await getRiderById(riderId);
  const stats = await deliveryStatsByRider([rider.id]);
  return {
    ...rider.toJSON(),
    deliveryStats: stats[rider.id] || { active: 0, delivered: 0, cancelled: 0, total: 0 },
  };
}

// Phase 9 — rider self-service dashboard aggregate (own profile + stats + the
// single active delivery, if any). Scoped to the authenticated rider only.
async function riderDashboard(userId) {
  const rider = await getRiderByUserId(userId);
  const stats = await deliveryStatsByRider([rider.id]);
  const activeDelivery = await Delivery.findOne({
    where: {
      riderId: rider.id,
      status: { [Op.in]: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] },
    },
    order: [['createdAt', 'DESC']],
    include: [{ model: Order, as: 'order', attributes: ['id', 'orderNumber', 'status', 'totalAmount'] }],
  });

  return {
    rider: rider.toJSON(),
    stats: stats[rider.id] || { active: 0, delivered: 0, cancelled: 0, total: 0 },
    activeDelivery,
  };
}

module.exports = {
  createRider,
  listRiders,
  getRiderByUserId,
  getRiderById,
  getRiderDetail,
  riderDashboard,
  updateRider,
  updateAvailability,
  markRiderBusy,
  releaseRiderIfIdle,
};
