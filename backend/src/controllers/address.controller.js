const addressService = require('../services/address.service');
const { success } = require('../utils/response');

async function list(req, res) {
  const addresses = await addressService.listAddresses(req.user.id);
  return success(res, 'Addresses fetched', { addresses });
}

async function create(req, res) {
  const address = await addressService.createAddress(req.user.id, req.body);
  return success(res, 'Address created', { address }, 201);
}

async function update(req, res) {
  const address = await addressService.updateAddress(req.user.id, req.params.id, req.body);
  return success(res, 'Address updated', { address });
}

async function remove(req, res) {
  await addressService.deleteAddress(req.user.id, req.params.id);
  return success(res, 'Address deleted');
}

async function setDefault(req, res) {
  const address = await addressService.setDefaultAddress(req.user.id, req.params.id);
  return success(res, 'Default address updated', { address });
}

module.exports = { list, create, update, remove, setDefault };
