'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      categoryId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'categories', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      name: { type: Sequelize.STRING(160), allowNull: false },
      slug: { type: Sequelize.STRING(180), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      price: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      discountPrice: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      sku: { type: Sequelize.STRING(60), allowNull: false },
      brand: { type: Sequelize.STRING(80), allowNull: true },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('products', ['slug'], { name: 'products_slug_idx', unique: true });
    await queryInterface.addIndex('products', ['sku'], { name: 'products_sku_idx', unique: true });
    await queryInterface.addIndex('products', ['categoryId'], { name: 'products_category_idx' });
    await queryInterface.addIndex('products', ['status'], { name: 'products_status_idx' });

    await queryInterface.sequelize.query(
      'ALTER TABLE "products" ADD CONSTRAINT "products_price_check" CHECK ("price" >= 0);'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "products" ADD CONSTRAINT "products_discount_price_check" CHECK ("discountPrice" IS NULL OR "discountPrice" >= 0);'
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products');
  },
};
