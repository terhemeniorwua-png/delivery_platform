const router = require('express').Router();
const sequelize = require('../config/database');
const { success } = require('../utils/response');

router.get('/health', async (req, res) => {
  await sequelize.authenticate();
  success(res, 'Service is healthy', {
    status: 'ok',
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', require('./auth.routes'));
router.use('/addresses', require('./address.routes'));
router.use('/categories', require('./category.routes'));
router.use('/products', require('./product.routes'));
router.use('/cart', require('./cart.routes'));
router.use('/orders', require('./order.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/riders', require('./rider.routes'));
router.use('/rider-applications', require('./riderApplication.routes'));
router.use('/deliveries', require('./delivery.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
