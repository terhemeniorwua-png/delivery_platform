const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const {
  User,
  Cart,
  Rider,
  RiderApplication,
  Order,
  Payment,
  Delivery,
  Product,
  sequelize,
} = require('../models');
const { conflict, badRequest, notFound } = require('../utils/errors');
const { MAX_ADMINS, ADMIN_LIMIT_MESSAGE, LAST_ADMIN_MESSAGE } = require('../constants/status');

const SALT_ROUNDS = 10;
const ACTIVE_DELIVERY_STATUSES = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'];

// Same key the enforce_max_admins() database trigger locks on, so application
// checks and the trigger share one critical section.
const ADMIN_LOCK = 'users.max_admin_count';

async function lockAdminTable(transaction) {
  await sequelize.query(
    "SELECT pg_advisory_xact_lock(hashtext(:key)::bigint)",
    { replacements: { key: ADMIN_LOCK }, transaction }
  );
}

async function countAdministrators(transaction) {
  const [[{ count }]] = await sequelize.query(
    "SELECT COUNT(*)::int AS count FROM users WHERE role = 'ADMIN'",
    { transaction }
  );
  return count;
}

async function administratorStats() {
  const count = await countAdministrators();
  return {
    count,
    limit: MAX_ADMINS,
    remaining: Math.max(0, MAX_ADMINS - count),
    atLimit: count >= MAX_ADMINS,
  };
}

// Strictly bounded admin creation: inside one transaction we take the shared
// advisory lock, re-count, then insert. Concurrent creators are serialized on
// the lock (and the database trigger backstops the rule), so ADMIN COUNT can
// never exceed MAX_ADMINS.
async function createAdministrator(input) {
  const email = String(input.email).toLowerCase();

  return sequelize.transaction(async (transaction) => {
    await lockAdminTable(transaction);

    const existing = await User.scope('withPassword').findOne({
      where: { email },
      transaction,
    });
    if (existing) throw conflict('An account with this email already exists');

    const count = await countAdministrators(transaction);
    if (count >= MAX_ADMINS) throw conflict(ADMIN_LIMIT_MESSAGE);

    const hashed = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await User.create(
      {
        firstName: input.firstName,
        lastName: input.lastName,
        email,
        phone: input.phone || null,
        password: hashed,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      { transaction }
    );

    await Cart.findOrCreate({ where: { userId: user.id }, transaction });
    return user;
  });
}

// Role changes are only performed through this authorized backend workflow.
// Promotions to ADMIN obey the maximum-administrators rule; demotions can
// never remove the last administrator.
async function changeUserRole(userId, role) {
  const user = await User.findByPk(userId);
  if (!user) throw notFound('User not found');
  if (user.role === role) return user;

  const promotingToAdmin = role === 'ADMIN';
  const demotingFromAdmin = user.role === 'ADMIN' && role !== 'ADMIN';

  if (!promotingToAdmin && !demotingFromAdmin) {
    throw badRequest(
      role === 'RIDER'
        ? 'Rider accounts are created through rider management, not by changing roles'
        : 'Roles can only be changed to ADMIN or from ADMIN to CUSTOMER'
    );
  }

  return sequelize.transaction(async (transaction) => {
    await lockAdminTable(transaction);

    const target = await User.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });

    if (promotingToAdmin) {
      const count = await countAdministrators(transaction);
      if (count >= MAX_ADMINS) throw conflict(ADMIN_LIMIT_MESSAGE);
    }

    if (demotingFromAdmin) {
      const count = await countAdministrators(transaction);
      if (count <= 1) throw conflict(LAST_ADMIN_MESSAGE);
    }

    await target.update({ role }, { transaction });

    if (promotingToAdmin && target.previous('role') === 'RIDER') {
      // The account is an administrator now; keep the rider profile intact for
      // delivery history but take the rider out of circulation.
      await Rider.update(
        { availability: 'OFFLINE' },
        { where: { userId: target.id }, transaction }
      );
    }

    return target;
  });
}

// Phase 11 — single aggregate query set so the dashboard never pulls thousands
// of rows into the app just to show a handful of numbers.
async function getDashboard() {
  const [
    totalCustomers,
    totalRiders,
    totalAdmins,
    pendingApplications,
    totalProducts,
    totalOrders,
    pendingOrders,
    activeDeliveries,
    completedDeliveries,
    revenue,
  ] = await Promise.all([
    User.count({ where: { role: 'CUSTOMER' } }),
    User.count({ where: { role: 'RIDER' } }),
    User.count({ where: { role: 'ADMIN' } }),
    RiderApplication.count({ where: { status: 'PENDING' } }),
    Product.count(),
    Order.count(),
    Order.count({ where: { status: 'PENDING' } }),
    Delivery.count({ where: { status: { [Op.in]: ACTIVE_DELIVERY_STATUSES } } }),
    Delivery.count({ where: { status: 'DELIVERED' } }),
    Payment.sum('amount', { where: { status: 'SUCCESSFUL' } }),
  ]);

  const [recentOrders, recentApplications, activeDeliveryRows] = await Promise.all([
    Order.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName'] },
        { model: Payment, as: 'payments', attributes: ['id', 'status', 'method', 'amount'] },
      ],
    }),
    RiderApplication.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        },
      ],
    }),
    Delivery.findAll({
      where: { status: { [Op.in]: ACTIVE_DELIVERY_STATUSES } },
      limit: 5,
      order: [['updatedAt', 'DESC']],
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNumber'],
          include: [{ model: User, as: 'customer', attributes: ['id', 'firstName', 'lastName'] }],
        },
        {
          model: Rider,
          as: 'rider',
          attributes: ['id', 'vehicleType', 'vehicleNumber'],
          include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }],
        },
      ],
    }),
  ]);

  return {
    stats: {
      totalCustomers,
      totalRiders,
      totalAdmins,
      pendingApplications,
      totalProducts,
      totalOrders,
      pendingOrders,
      activeDeliveries,
      completedDeliveries,
      totalRevenue: Number(revenue) || 0,
    },
    administrators: {
      count: totalAdmins,
      limit: MAX_ADMINS,
      remaining: Math.max(0, MAX_ADMINS - totalAdmins),
      atLimit: totalAdmins >= MAX_ADMINS,
    },
    recentOrders,
    recentApplications,
    activeDeliveries: activeDeliveryRows,
  };
}

module.exports = {
  countAdministrators,
  administratorStats,
  createAdministrator,
  changeUserRole,
  getDashboard,
};
