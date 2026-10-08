const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { User, Rider, RiderApplication } = require('../models');
const { conflict, notFound } = require('../utils/errors');

const APPLICATION_WITH_USER = [
  {
    model: User,
    as: 'user',
    attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'role'],
  },
];

/**
 * Customer → rider application workflow (Phase 8).
 *
 * Creating an application NEVER changes the applicant's role — it only
 * records facts and sets status = PENDING. The CUSTOMER → RIDER transition
 * happens exclusively inside approveApplication(), in one transaction that
 * also creates the riders row (availability OFFLINE) and stamps the review.
 * If any step fails, everything rolls back.
 */
async function createApplication(userId, input) {
  return sequelize.transaction(async (t) => {
    const user = await User.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!user) throw notFound('Account not found');

    if (user.role !== 'CUSTOMER') {
      throw conflict('Only customer accounts can apply to become a rider');
    }

    // One live application per customer (a rejection clears the slot so the
    // customer may reapply). The user-row lock above serialises concurrent
    // duplicate submissions.
    const existing = await RiderApplication.findOne({
      where: { userId, status: { [Op.not]: 'REJECTED' } },
      order: [['createdAt', 'DESC']],
      transaction: t,
    });
    if (existing) {
      throw conflict(
        existing.status === 'PENDING'
          ? 'You already have a rider application under review'
          : 'Your rider application was already approved'
      );
    }

    return RiderApplication.create(
      { userId, ...input, status: 'PENDING' },
      { transaction: t }
    );
  });
}

async function myApplication(userId) {
  return RiderApplication.findOne({
    where: { userId },
    order: [['createdAt', 'DESC']],
    include: APPLICATION_WITH_USER,
  });
}

async function listApplications(query) {
  const where = {};
  if (query.status) where.status = query.status;

  const { count, rows } = await RiderApplication.findAndCountAll({
    where,
    include: APPLICATION_WITH_USER,
    order: [['createdAt', 'DESC']],
    limit: query.limit,
    offset: (query.page - 1) * query.limit,
    distinct: true,
    col: 'id',
  });

  return {
    applications: rows,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / query.limit)),
    },
  };
}

async function approveApplication(applicationId, admin) {
  return sequelize.transaction(async (t) => {
    const application = await RiderApplication.findOne({
      where: { id: applicationId, userId: { [Op.not]: null } },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!application) throw notFound('Rider application not found');
    if (application.status !== 'PENDING') {
      throw conflict('Only pending applications can be approved');
    }

    const user = await User.findByPk(application.userId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!user) throw notFound('Applicant account not found');
    if (user.role !== 'CUSTOMER') {
      throw conflict('Only customer accounts can be approved as riders');
    }

    await application.update(
      { status: 'APPROVED', reviewedBy: admin.id, reviewedAt: new Date() },
      { transaction: t }
    );

    user.role = 'RIDER';
    await user.save({ transaction: t });

    await Rider.create(
      {
        userId: user.id,
        vehicleType: application.vehicleType,
        vehicleNumber: application.vehicleNumber,
        availability: 'OFFLINE',
      },
      { transaction: t }
    );

    return application;
  });
}

async function rejectApplication(applicationId, admin, reason) {
  return sequelize.transaction(async (t) => {
    const application = await RiderApplication.findOne({
      where: { id: applicationId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!application) throw notFound('Rider application not found');
    if (application.status !== 'PENDING') {
      throw conflict('Only pending applications can be rejected');
    }

    await application.update(
      {
        status: 'REJECTED',
        rejectionReason: reason || null,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
      { transaction: t }
    );

    return application;
  });
}

module.exports = {
  createApplication,
  myApplication,
  listApplications,
  approveApplication,
  rejectApplication,
};