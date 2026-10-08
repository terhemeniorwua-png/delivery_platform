'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('riders', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      vehicleType: {
        type: Sequelize.ENUM('BICYCLE', 'MOTORCYCLE', 'CAR', 'VAN'),
        allowNull: false,
        defaultValue: 'MOTORCYCLE',
      },
      vehicleNumber: { type: Sequelize.STRING(30), allowNull: false },
      availability: {
        type: Sequelize.ENUM('AVAILABLE', 'BUSY', 'OFFLINE'),
        allowNull: false,
        defaultValue: 'OFFLINE',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('riders', ['userId'], { name: 'riders_user_idx', unique: true });
    await queryInterface.addIndex('riders', ['availability'], { name: 'riders_availability_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('riders');
  },
};
