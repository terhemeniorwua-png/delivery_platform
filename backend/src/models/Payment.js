const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { PAYMENT_METHODS, PAYMENT_STATUSES } = require('../constants/status');

const Payment = sequelize.define(
  'Payment',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId: { type: DataTypes.UUID, allowNull: false },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('amount');
        return value === null || value === undefined ? null : Number(value);
      },
    },
    method: { type: DataTypes.ENUM(PAYMENT_METHODS), allowNull: false },
    status: {
      type: DataTypes.ENUM(PAYMENT_STATUSES),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    transactionReference: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    paidAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'payments',
    indexes: [
      { unique: true, fields: ['transactionReference'] },
      { fields: ['orderId'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = Payment;
