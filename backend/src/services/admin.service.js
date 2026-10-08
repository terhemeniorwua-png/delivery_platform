const bcrypt = require('bcrypt');
const { User, Cart, Rider, sequelize } = require('../models');
const { conflict, badRequest, notFound } = require('../utils/errors');
const { MAX_ADMINS, ADMIN_LIMIT_MESSAGE, LAST_ADMIN_MESSAGE } = require('../constants/status');

const SALT_ROUNDS = 10;

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

module.exports = {
  countAdministrators,
  administratorStats,
  createAdministrator,
  changeUserRole,
};
