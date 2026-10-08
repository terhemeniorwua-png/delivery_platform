const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { unauthorized, forbidden } = require('../utils/errors');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      throw unauthorized('Missing access token');
    }

    const token = header.slice(7).trim();
    let payload;
    try {
      payload = jwt.verify(token, process.env.APP_SECRET);
    } catch (err) {
      throw unauthorized('Invalid or expired access token');
    }

    const user = await User.findByPk(payload.sub);
    if (!user) throw unauthorized('Account no longer exists');
    if (user.status !== 'ACTIVE') throw forbidden('Account is not active');

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { authenticate };
