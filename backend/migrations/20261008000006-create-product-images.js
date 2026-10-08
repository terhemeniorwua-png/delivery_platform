'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_images', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      imageUrl: { type: Sequelize.TEXT, allowNull: false },
      isPrimary: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('product_images', ['productId'], { name: 'images_product_idx' });
    await queryInterface.addIndex('product_images', ['productId'], {
      name: 'images_single_primary_idx',
      unique: true,
      where: { isPrimary: true },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_images');
  },
};
