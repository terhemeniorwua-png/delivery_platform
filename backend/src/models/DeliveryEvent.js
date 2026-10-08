const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeliveryEvent = sequelize.define(
  'DeliveryEvent',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    deliveryId: { type: DataTypes.UUID, allowNull: false },
    actorId: { type: DataTypes.UUID, allowNull: true },
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
