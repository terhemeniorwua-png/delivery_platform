'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      orderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      method: {
        type: Sequelize.ENUM('CASH', 'CARD', 'TRANSFER'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      transactionReference: { type: Sequelize.STRING(80), allowNull: false, unique: true },
      paidAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('payments', ['orderId'], { name: 'payments_order_idx' });
    await queryInterface.addIndex('payments', ['status'], { name: 'payments_status_idx' });
    await queryInterface.addIndex('payments', ['transactionReference'], {
      name: 'payments_reference_idx',
      unique: true,
    });

    await queryInterface.sequelize.query(
      'ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_check" CHECK ("amount" >= 0);'
    );
    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX "payments_one_active_per_order" ON "payments" ("orderId") WHERE "status" IN (\'PENDING\', \'SUCCESSFUL\');'
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payments');
  },
};
