const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Address = sequelize.define(
  'Address',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'Home' },
    recipientName: { type: DataTypes.STRING(120), allowNull: false },
    phone: { type: DataTypes.STRING(30), allowNull: false },
    addressLine: { type: DataTypes.TEXT, allowNull: false },
    city: { type: DataTypes.STRING(80), allowNull: false },
    state: { type: DataTypes.STRING(80), allowNull: false },
    country: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'Nigeria' },
    postalCode: { type: DataTypes.STRING(20), allowNull: true },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: 'addresses',
    indexes: [{ fields: ['userId'] }],
  }
);

module.exports = Address;
