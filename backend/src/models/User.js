const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { USER_ROLES, USER_STATUSES } = require('../constants/status');

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    firstName: { type: DataTypes.STRING(60), allowNull: false },
    lastName: { type: DataTypes.STRING(60), allowNull: false },
    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
      set(value) {
        this.setDataValue('email', String(value).trim().toLowerCase());
      },
    },
    phone: { type: DataTypes.STRING(30), allowNull: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    role: {
      type: DataTypes.ENUM(USER_ROLES),
      allowNull: false,
      defaultValue: 'CUSTOMER',
    },
    status: {
      type: DataTypes.ENUM(USER_STATUSES),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
  },
  {
    tableName: 'users',
    defaultScope: {
      attributes: { exclude: ['password'] },
    },
    scopes: {
      withPassword: { attributes: { include: ['password'] } },
    },
    indexes: [{ unique: true, fields: ['email'] }],
  }
);

User.prototype.comparePassword = async function comparePassword(candidate) {
  const bcrypt = require('bcrypt');
  return bcrypt.compare(candidate, this.getDataValue('password'));
};

User.prototype.toPublicJSON = function toPublicJSON() {
  return {
    id: this.id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phone: this.phone,
    role: this.role,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = User;
