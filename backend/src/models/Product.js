const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { PRODUCT_STATUSES } = require('../constants/status');

const Product = sequelize.define(
  'Product',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    categoryId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: false },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('price');
        return value === null || value === undefined ? null : Number(value);
      },
    },
    discountPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('discountPrice');
        return value === null || value === undefined ? null : Number(value);
      },
    },
    sku: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    brand: { type: DataTypes.STRING(80), allowNull: true },
    status: {
      type: DataTypes.ENUM(PRODUCT_STATUSES),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
  },
  {
    tableName: 'products',
    indexes: [
      { unique: true, fields: ['slug'] },
      { unique: true, fields: ['sku'] },
      { fields: ['categoryId'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = Product;
