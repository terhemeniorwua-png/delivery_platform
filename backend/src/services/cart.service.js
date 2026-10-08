const {
  Cart,
  CartItem,
  ProductVariant,
  Product,
  ProductImage,
} = require('../models');
const { notFound, badRequest } = require('../utils/errors');
const { effectivePrice } = require('./product.service');

const VARIANT_INCLUDE = [
  {
    model: ProductVariant,
    as: 'variant',
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'slug', 'brand', 'status', 'price', 'discountPrice'],
        include: [
          {
            model: ProductImage,
            as: 'images',
            attributes: ['id', 'imageUrl', 'isPrimary'],
            order: [['isPrimary', 'DESC'], ['id', 'ASC']],
          },
        ],
      },
    ],
  },
];

async function getOrCreateCart(userId) {
  const [cart] = await Cart.findOrCreate({ where: { userId } });
  return cart;
}

function serializeItem(item) {
  const variant = item.variant;
  const product = variant ? variant.product : null;
  const unitPrice = product ? effectivePrice(product, variant) : 0;
  return {
    id: item.id,
    quantity: item.quantity,
    unitPrice,
    lineTotal: unitPrice * item.quantity,
    availableStock: variant ? variant.stockQuantity : 0,
    variant: variant
      ? {
          id: variant.id,
          size: variant.size,
          color: variant.color,
          sku: variant.sku,
          price: variant.price,
          stockQuantity: variant.stockQuantity,
        }
      : null,
    product: product
      ? {
          id: product.id,
          name: product.name,
          slug: product.slug,
          brand: product.brand,
          status: product.status,
          image: product.images && product.images[0] ? product.images[0].imageUrl : null,
        }
      : null,
  };
}

async function getCart(userId) {
  const cart = await getOrCreateCart(userId);
  const items = await CartItem.findAll({
    where: { cartId: cart.id },
    include: VARIANT_INCLUDE,
    order: [['id', 'ASC']],
  });

  const serialized = items.map(serializeItem);
  const subtotal = serialized.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    id: cart.id,
    items: serialized,
    itemCount: serialized.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
  };
}

async function addItem(userId, { productVariantId, quantity }) {
  const variant = await ProductVariant.findOne({
    where: { id: productVariantId },
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'slug', 'status'],
      },
    ],
  });
  if (!variant) throw notFound('Product variant not found');
  if (!variant.product || variant.product.status !== 'ACTIVE') {
    throw badRequest('This product is not available for purchase');
  }

  const cart = await getOrCreateCart(userId);
  const existing = await CartItem.findOne({
    where: { cartId: cart.id, productVariantId: variant.id },
  });

  const desiredQuantity = (existing ? existing.quantity : 0) + quantity;
  if (desiredQuantity > variant.stockQuantity) {
    throw badRequest(
      variant.stockQuantity === 0
        ? 'This size and colour is out of stock'
        : `Only ${variant.stockQuantity} unit(s) left in stock`
    );
  }

  if (existing) {
    await existing.update({ quantity: desiredQuantity });
  } else {
    await CartItem.create({
      cartId: cart.id,
      productVariantId: variant.id,
      quantity,
    });
  }

  return getCart(userId);
}

async function updateItem(userId, itemId, quantity) {
  const cart = await getOrCreateCart(userId);
  const item = await CartItem.findOne({
    where: { id: itemId, cartId: cart.id },
    include: VARIANT_INCLUDE,
  });
  if (!item) throw notFound('Cart item not found');

  const variant = item.variant;
  if (quantity > variant.stockQuantity) {
    throw badRequest(
      variant.stockQuantity === 0
        ? 'This size and colour is out of stock'
        : `Only ${variant.stockQuantity} unit(s) left in stock`
    );
  }

  await item.update({ quantity });
  return getCart(userId);
}

async function removeItem(userId, itemId) {
  const cart = await getOrCreateCart(userId);
  const item = await CartItem.findOne({ where: { id: itemId, cartId: cart.id } });
  if (!item) throw notFound('Cart item not found');
  await item.destroy();
  return getCart(userId);
}

async function clearCart(userId) {
  const cart = await getOrCreateCart(userId);
  await CartItem.destroy({ where: { cartId: cart.id } });
  return getCart(userId);
}

module.exports = { getOrCreateCart, getCart, addItem, updateItem, removeItem, clearCart };
