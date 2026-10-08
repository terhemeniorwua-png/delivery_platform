'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      addressId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'addresses', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      orderNumber: { type: Sequelize.STRING(30), allowNull: false, unique: true },
      subtotal: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      deliveryFee: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      discount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      totalAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      status: {
        type: Sequelize.ENUM(
          'PENDING',
          'CONFIRMED',
          'PROCESSING',
          'READY_FOR_PICKUP',
          'OUT_FOR_DELIVERY',
          'DELIVERED',
          'CANCELLED'
        ),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('orders', ['orderNumber'], { name: 'orders_number_idx', unique: true });
    await queryInterface.addIndex('orders', ['userId'], { name: 'orders_user_idx' });
    await queryInterface.addIndex('orders', ['status'], { name: 'orders_status_idx' });

    await queryInterface.sequelize.query(
      'ALTER TABLE "orders" ADD CONSTRAINT "orders_subtotal_check" CHECK ("subtotal" >= 0);'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_fee_check" CHECK ("deliveryFee" >= 0);'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "orders" ADD CONSTRAINT "orders_discount_check" CHECK ("discount" >= 0);'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "orders" ADD CONSTRAINT "orders_total_check" CHECK ("totalAmount" >= 0);'
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('orders');
  },
};
