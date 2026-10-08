const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { User, Rider, Delivery } = require('../models');
const { notFound, conflict, badRequest } = require('../utils/errors');

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

  const counts = await Delivery.count({
    where: { status: { [Op.in]: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] } },
    group: ['riderId'],
  });
  const activeByRider = {};
  for (const row of counts) activeByRider[row.riderId] = Number(row.count);

  return riders.map((rider) => ({
    ...rider.toJSON(),
    activeDeliveries: activeByRider[rider.id] || 0,
  }));
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

module.exports = {
  createRider,
  listRiders,
  getRiderByUserId,
  getRiderById,
  updateRider,
  updateAvailability,
  markRiderBusy,
  releaseRiderIfIdle,
};
