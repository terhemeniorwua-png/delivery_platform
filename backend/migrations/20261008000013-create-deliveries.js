'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('deliveries', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      riderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'riders', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      pickupTime: { type: Sequelize.DATE, allowNull: true },
      pickedUpAt: { type: Sequelize.DATE, allowNull: true },
      outForDeliveryAt: { type: Sequelize.DATE, allowNull: true },
      deliveredAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('deliveries', ['orderId'], { name: 'deliveries_order_idx' });
    await queryInterface.addIndex('deliveries', ['riderId'], { name: 'deliveries_rider_idx' });
    await queryInterface.addIndex('deliveries', ['status'], { name: 'deliveries_status_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('deliveries');
  },
};
