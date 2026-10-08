const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { RIDER_AVAILABILITY, VEHICLE_TYPES } = require('../constants/status');

const Rider = sequelize.define(
  'Rider',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, unique: true },
    vehicleType: {
      type: DataTypes.ENUM(VEHICLE_TYPES),
      allowNull: false,
      defaultValue: 'MOTORCYCLE',
    },
    vehicleNumber: { type: DataTypes.STRING(30), allowNull: false },
    availability: {
      type: DataTypes.ENUM(RIDER_AVAILABILITY),
      allowNull: false,
      defaultValue: 'OFFLINE',
    },
  },
  {
    tableName: 'riders',
    indexes: [
      { unique: true, fields: ['userId'] },
      { fields: ['availability'] },
    ],
  }
);

module.exports = Rider;
