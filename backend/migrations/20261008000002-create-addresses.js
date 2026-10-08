'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('addresses', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      label: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'Home' },
      recipientName: { type: Sequelize.STRING(120), allowNull: false },
      phone: { type: Sequelize.STRING(30), allowNull: false },
      addressLine: { type: Sequelize.TEXT, allowNull: false },
      city: { type: Sequelize.STRING(80), allowNull: false },
      state: { type: Sequelize.STRING(80), allowNull: false },
      country: { type: Sequelize.STRING(80), allowNull: false, defaultValue: 'Nigeria' },
      postalCode: { type: Sequelize.STRING(20), allowNull: true },
      isDefault: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('addresses', ['userId'], { name: 'addresses_user_idx' });
    await queryInterface.addIndex('addresses', ['userId'], {
      name: 'addresses_single_default_idx',
      unique: true,
      where: { isDefault: true },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('addresses');
  },
};
