const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cart = sequelize.define(
  'Cart',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, unique: true },
  },
  {
    tableName: 'carts',
    indexes: [{ unique: true, fields: ['userId'] }],
  }
);

module.exports = Cart;
