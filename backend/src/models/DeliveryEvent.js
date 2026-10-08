const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeliveryEvent = sequelize.define(
  'DeliveryEvent',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    deliveryId: { type: DataTypes.INTEGER, allowNull: false },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    previousStatus: { type: DataTypes.STRING(30), allowNull: true },
    newStatus: { type: DataTypes.STRING(30), allowNull: false },
    note: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'delivery_events',
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ['deliveryId'] }],
  }
);

module.exports = DeliveryEvent;
