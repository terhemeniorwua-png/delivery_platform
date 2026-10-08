'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      orderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      productId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      productVariantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'product_variants', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      productName: { type: Sequelize.STRING(160), allowNull: false },
      size: { type: Sequelize.STRING(20), allowNull: false },
      color: { type: Sequelize.STRING(40), allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      unitPrice: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      totalPrice: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('order_items', ['orderId'], { name: 'order_items_order_idx' });
    await queryInterface.addIndex('order_items', ['orderId', 'productVariantId'], {
      name: 'order_items_order_variant_idx',
      unique: true,
    });

    await queryInterface.sequelize.query(
      'ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_check" CHECK ("quantity" > 0);'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "order_items" ADD CONSTRAINT "order_items_unit_price_check" CHECK ("unitPrice" >= 0);'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "order_items" ADD CONSTRAINT "order_items_total_price_check" CHECK ("totalPrice" >= 0);'
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('order_items');
  },
};
