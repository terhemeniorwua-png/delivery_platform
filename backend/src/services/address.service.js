const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Address, Order } = require('../models');
const { notFound, conflict } = require('../utils/errors');

async function listAddresses(userId) {
  return Address.findAll({
    where: { userId },
    order: [
      ['isDefault', 'DESC'],
      ['createdAt', 'ASC'],
    ],
  });
}

async function getAddress(userId, id) {
  const address = await Address.findOne({ where: { id, userId } });
  if (!address) throw notFound('Address not found');
  return address;
}

async function createAddress(userId, input) {
  return sequelize.transaction(async (t) => {
    const count = await Address.count({ where: { userId }, transaction: t });
    const makeDefault = input.isDefault === true || count === 0;
    if (makeDefault) {
      await Address.update({ isDefault: false }, { where: { userId }, transaction: t });
    }
    return Address.create(
      {
        userId,
        label: input.label || 'Home',
        recipientName: input.recipientName,
        phone: input.phone,
        addressLine: input.addressLine,
        city: input.city,
        state: input.state,
        country: input.country || 'Nigeria',
        postalCode: input.postalCode ?? null,
        isDefault: makeDefault,
      },
      { transaction: t }
    );
  });
}

async function updateAddress(userId, id, input) {
  const address = await getAddress(userId, id);

  return sequelize.transaction(async (t) => {
    const patch = { ...input };

    if (input.isDefault === true) {
      await Address.update(
        { isDefault: false },
        { where: { userId, id: { [Op.ne]: address.id } }, transaction: t }
      );
    } else if (input.isDefault === false) {
      // The last remaining address must stay the default; otherwise promote the oldest one.
      delete patch.isDefault;
      if (address.isDefault) {
        const replacement = await Address.findOne({
          where: { userId, id: { [Op.ne]: address.id } },
          order: [['createdAt', 'ASC']],
          transaction: t,
        });
        if (replacement) {
          await replacement.update({ isDefault: true }, { transaction: t });
          patch.isDefault = false;
        }
      }
    }

    await address.update(patch, { transaction: t });
    return address;
  });
}

async function setDefaultAddress(userId, id) {
  const address = await getAddress(userId, id);
  return sequelize.transaction(async (t) => {
    await Address.update({ isDefault: false }, { where: { userId }, transaction: t });
    await address.update({ isDefault: true }, { transaction: t });
    return address;
  });
}

async function deleteAddress(userId, id) {
  const address = await getAddress(userId, id);

  const orders = await Order.count({ where: { addressId: address.id } });
  if (orders > 0) {
    throw conflict('This address is linked to an order and cannot be deleted');
  }

  return sequelize.transaction(async (t) => {
    await address.destroy({ transaction: t });
    if (address.isDefault) {
      const replacement = await Address.findOne({
        where: { userId },
        order: [['createdAt', 'ASC']],
        transaction: t,
      });
      if (replacement) await replacement.update({ isDefault: true }, { transaction: t });
    }
    return true;
  });
}

module.exports = {
  listAddresses,
  getAddress,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
};
