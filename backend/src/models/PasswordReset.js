const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PasswordReset = sequelize.define(
  'PasswordReset',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    // bcrypt hash of the 6-digit code — the plain code is only ever
    // delivered to the UI in this demo (no mailer); production should
    // email it instead of returning it from the API.
    code: { type: DataTypes.STRING(255), allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    usedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'password_resets',
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ['userId'] }],
  }
);

module.exports = PasswordReset;