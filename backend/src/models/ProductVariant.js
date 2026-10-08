const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductVariant = sequelize.define(
  'ProductVariant',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    productId: { type: DataTypes.UUID, allowNull: false },
    size: { type: DataTypes.STRING(20), allowNull: false },
    color: { type: DataTypes.STRING(40), allowNull: false },
    sku: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('price');
        return value === null || value === undefined ? null : Number(value);
      },
    },
    stockQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'product_variants',
    indexes: [
      { unique: true, fields: ['sku'] },
      { unique: true, fields: ['productId', 'size', 'color'] },
      { fields: ['productId'] },
    ],
  }
);

module.exports = ProductVariant;
