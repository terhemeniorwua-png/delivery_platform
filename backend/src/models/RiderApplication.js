const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { RIDER_APPLICATION_STATUSES, VEHICLE_TYPES } = require('../constants/status');

/**
 * Customer rider application (Phase 8).
 *
 * A CUSTOMER submits an application → status stays PENDING and users.role
 * stays CUSTOMER. Only the admin approval workflow (riderApplication
 * service, inside a transaction) flips the user to RIDER and creates the
 * riders row. Rejected applicants keep role CUSTOMER and may reapply.
 *
 * Document uploads are intentionally not modelled: the backend has no
 * file-upload/storage architecture yet.
 */
const RiderApplication = sequelize.define(
  'RiderApplication',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    status: {
      type: DataTypes.ENUM(RIDER_APPLICATION_STATUSES),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    fullName: { type: DataTypes.STRING(120), allowNull: false },
    phone: { type: DataTypes.STRING(30), allowNull: false },
    dateOfBirth: { type: DataTypes.DATEONLY, allowNull: false },
    addressLine: { type: DataTypes.STRING(300), allowNull: false },
    city: { type: DataTypes.STRING(80), allowNull: false },
    state: { type: DataTypes.STRING(80), allowNull: false },
    vehicleType: {
      type: DataTypes.ENUM(VEHICLE_TYPES),
      allowNull: false,
      defaultValue: 'MOTORCYCLE',
    },
    vehicleNumber: { type: DataTypes.STRING(30), allowNull: false },
    licenseNumber: { type: DataTypes.STRING(60), allowNull: false },
    emergencyContactName: { type: DataTypes.STRING(120), allowNull: false },
    emergencyContactPhone: { type: DataTypes.STRING(30), allowNull: false },
    rejectionReason: { type: DataTypes.STRING(300), allowNull: true },
    reviewedBy: { type: DataTypes.UUID, allowNull: true },
    reviewedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'rider_applications',
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['userId', 'status'] },
    ],
  }
);

module.exports = RiderApplication;
