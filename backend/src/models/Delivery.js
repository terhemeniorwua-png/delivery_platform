const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { DELIVERY_STATUSES } = require('../constants/status');

const Delivery = sequelize.define(
  'Delivery',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId: { type: DataTypes.UUID, allowNull: false },
    riderId: { type: DataTypes.UUID, allowNull: false },
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
