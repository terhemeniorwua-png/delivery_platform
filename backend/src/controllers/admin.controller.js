const { Op } = require('sequelize');
const { User, Order } = require('../models');
const { notFound, conflict } = require('../utils/errors');
const { success } = require('../utils/response');

async function listUsers(query) {
  const where = {};
  if (query.status) where.status = query.status;
  if (query.role) where.role = query.role;
  if (query.search) {
    const term = `%${query.search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    where[Op.or] = [
      { email: { [Op.iLike]: term } },
      { firstName: { [Op.iLike]: term } },
      { lastName: { [Op.iLike]: term } },
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    limit: query.limit,
    offset: (query.page - 1) * query.limit,
    order: [['createdAt', 'DESC']],
  });

  return {
    users: rows,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / query.limit)),
    },
  };
}

async function updateUserStatus(userId, status) {
  const user = await User.findByPk(userId);
  if (!user) throw notFound('User not found');

  if (status !== 'ACTIVE' && user.role === 'ADMIN') {
    throw conflict('An administrator account cannot be deactivated');
  }
  if (status !== 'ACTIVE') {
    const activeOrders = await Order.count({
      where: { userId: user.id, status: { [Op.in]: ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'] } },
    });
    if (activeOrders > 0) {
      throw conflict('User has active orders and cannot be deactivated');
    }
  }

  await user.update({ status });
  return user;
}

async function list(req, res) {
  const result = await listUsers(req.query);
  return success(res, 'Users fetched', result);
}

async function updateStatus(req, res) {
  const user = await updateUserStatus(Number(req.params.id), req.body.status);
  return success(res, 'User status updated', { user });
}

module.exports = { list, updateStatus };
