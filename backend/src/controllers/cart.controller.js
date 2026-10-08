const cartService = require('../services/cart.service');
const { success } = require('../utils/response');

async function get(req, res) {
  const cart = await cartService.getCart(req.user.id);
  return success(res, 'Cart fetched', { cart });
}

async function addItem(req, res) {
  const cart = await cartService.addItem(req.user.id, req.body);
  return success(res, 'Item added to cart', { cart }, 201);
}

async function updateItem(req, res) {
  const cart = await cartService.updateItem(req.user.id, req.params.id, req.body.quantity);
  return success(res, 'Cart updated', { cart });
}

async function removeItem(req, res) {
  const cart = await cartService.removeItem(req.user.id, req.params.id);
  return success(res, 'Item removed from cart', { cart });
}

async function clear(req, res) {
  const cart = await cartService.clearCart(req.user.id);
  return success(res, 'Cart cleared', { cart });
}

module.exports = { get, addItem, updateItem, removeItem, clear };
