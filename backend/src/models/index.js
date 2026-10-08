'use strict';

const sequelize = require('../config/database');
const User = require('./User');
const Address = require('./Address');
const Category = require('./Category');
const Product = require('./Product');
const ProductVariant = require('./ProductVariant');
const ProductImage = require('./ProductImage');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Payment = require('./Payment');
const Rider = require('./Rider');
const RiderApplication = require('./RiderApplication');
const Delivery = require('./Delivery');
const DeliveryEvent = require('./DeliveryEvent');
const PasswordReset = require('./PasswordReset');

// User
User.hasMany(Address, { foreignKey: 'userId', as: 'addresses', onDelete: 'CASCADE' });
Address.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Cart, { foreignKey: 'userId', as: 'cart', onDelete: 'CASCADE' });
Cart.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'customer' });

User.hasOne(Rider, { foreignKey: 'userId', as: 'riderProfile', onDelete: 'CASCADE' });
Rider.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(RiderApplication, { foreignKey: 'userId', as: 'riderApplications', onDelete: 'CASCADE' });
RiderApplication.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(PasswordReset, { foreignKey: 'userId', as: 'passwordResets', onDelete: 'CASCADE' });
PasswordReset.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Catalog
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Product.hasMany(ProductVariant, { foreignKey: 'productId', as: 'variants', onDelete: 'CASCADE' });
ProductVariant.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Product.hasMany(ProductImage, { foreignKey: 'productId', as: 'images', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Cart
Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items', onDelete: 'CASCADE' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId', as: 'cart' });

CartItem.belongsTo(ProductVariant, { foreignKey: 'productVariantId', as: 'variant' });
ProductVariant.hasMany(CartItem, { foreignKey: 'productVariantId', as: 'cartItems' });

// Orders
Order.belongsTo(Address, { foreignKey: 'addressId', as: 'address' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
OrderItem.belongsTo(ProductVariant, { foreignKey: 'productVariantId', as: 'variant' });

// Payments
Order.hasMany(Payment, { foreignKey: 'orderId', as: 'payments', onDelete: 'CASCADE' });
Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Deliveries
Order.hasMany(Delivery, { foreignKey: 'orderId', as: 'deliveries' });
Delivery.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Rider.hasMany(Delivery, { foreignKey: 'riderId', as: 'deliveries' });
Delivery.belongsTo(Rider, { foreignKey: 'riderId', as: 'rider' });

Delivery.hasMany(DeliveryEvent, { foreignKey: 'deliveryId', as: 'events', onDelete: 'CASCADE' });
DeliveryEvent.belongsTo(Delivery, { foreignKey: 'deliveryId', as: 'delivery' });
DeliveryEvent.belongsTo(User, { foreignKey: 'actorId', as: 'actor', onDelete: 'SET NULL' });

module.exports = {
  sequelize,
  User,
  Address,
  Category,
  Product,
  ProductVariant,
  ProductImage,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Payment,
  Rider,
  RiderApplication,
  Delivery,
  DeliveryEvent,
  PasswordReset,
};
