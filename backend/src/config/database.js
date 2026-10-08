const path = require('path');

const dotenvPath = path.resolve(__dirname, '..', '..', '.env');
require('dotenv').config({ path: dotenvPath });

require('./network');

const { Sequelize } = require('sequelize');
const { buildSslConfig, sanitizeDatabaseUrl } = require('./ssl');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured. Set it in the backend .env file.');
}

const sequelize = new Sequelize(sanitizeDatabaseUrl(databaseUrl), {
  dialect: 'postgres',
  dialectOptions: { ssl: buildSslConfig() },
  logging: process.env.NODE_ENV === 'development' ? (msg) => console.log(msg) : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = sequelize;
