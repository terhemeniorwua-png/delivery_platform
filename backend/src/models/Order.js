const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { ORDER_STATUSES } = require('../constants/status');

const money = (field) => ({
  type: DataTypes.DECIMAL(12, 2),
  allowNull: false,
  defaultValue: 0,
  get() {
    const value = this.getDataValue(field);
    return value === null || value === undefined ? null : Number(value);
  },
});

const Order = sequelize.define(
  'Order',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    addressId: { type: DataTypes.INTEGER, allowNull: false },
    orderNumber: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    subtotal: { ...money('subtotal') },
    deliveryFee: { ...money('deliveryFee') },
    discount: { ...money('discount') },
    totalAmount: { ...money('totalAmount') },
    status: {
      type: DataTypes.ENUM(ORDER_STATUSES),
      allowNull: false,
      defaultValue: 'PENDING',
    },
  },
  {
    tableName: 'orders',
    indexes: [
      { unique: true, fields: ['orderNumber'] },
      { fields: ['userId'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = Order;
