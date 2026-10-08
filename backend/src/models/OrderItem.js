const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const money = (field) => ({
  type: DataTypes.DECIMAL(12, 2),
  allowNull: false,
  get() {
    const value = this.getDataValue(field);
    return value === null || value === undefined ? null : Number(value);
  },
});

const OrderItem = sequelize.define(
  'OrderItem',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId: { type: DataTypes.UUID, allowNull: false },
    productId: { type: DataTypes.UUID, allowNull: false },
    productVariantId: { type: DataTypes.UUID, allowNull: false },
    productName: { type: DataTypes.STRING(160), allowNull: false },
    size: { type: DataTypes.STRING(20), allowNull: false },
    color: { type: DataTypes.STRING(40), allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    unitPrice: { ...money('unitPrice') },
    totalPrice: { ...money('totalPrice') },
  },
  {
    tableName: 'order_items',
    indexes: [
      { fields: ['orderId'] },
      { unique: true, fields: ['orderId', 'productVariantId'] },
    ],
  }
);

module.exports = OrderItem;
