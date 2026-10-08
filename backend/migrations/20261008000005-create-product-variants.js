'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_variants', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      productId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      size: { type: Sequelize.STRING(20), allowNull: false },
      color: { type: Sequelize.STRING(40), allowNull: false },
      sku: { type: Sequelize.STRING(60), allowNull: false },
      price: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      stockQuantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('product_variants', ['sku'], { name: 'variants_sku_idx', unique: true });
    await queryInterface.addIndex('product_variants', ['productId'], { name: 'variants_product_idx' });
    await queryInterface.addIndex('product_variants', ['productId', 'size', 'color'], {
      name: 'variants_product_size_color_idx',
      unique: true,
    });

    await queryInterface.sequelize.query(
      'ALTER TABLE "product_variants" ADD CONSTRAINT "variants_stock_check" CHECK ("stockQuantity" >= 0);'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "product_variants" ADD CONSTRAINT "variants_price_check" CHECK ("price" IS NULL OR "price" >= 0);'
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_variants');
  },
};
