const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { DELIVERY_STATUSES } = require('../constants/status');

const Delivery = sequelize.define(
  'Delivery',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    riderId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(DELIVERY_STATUSES),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    pickupTime: { type: DataTypes.DATE, allowNull: true },
    pickedUpAt: { type: DataTypes.DATE, allowNull: true },
    outForDeliveryAt: { type: DataTypes.DATE, allowNull: true },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'deliveries',
    indexes: [
      { fields: ['orderId'] },
      { fields: ['riderId'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = Delivery;
