'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('delivery_events', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      deliveryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'deliveries', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      actorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      previousStatus: { type: Sequelize.STRING(30), allowNull: true },
      newStatus: { type: Sequelize.STRING(30), allowNull: false },
      note: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('delivery_events', ['deliveryId'], { name: 'delivery_events_delivery_idx' });
    await queryInterface.addIndex('delivery_events', ['actorId'], { name: 'delivery_events_actor_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('delivery_events');
  },
};
