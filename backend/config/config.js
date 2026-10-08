require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const { buildSslConfig } = require('../src/config/ssl');

const base = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  dialectOptions: { ssl: buildSslConfig() },
  logging: false,
  define: {
    snake_case: false,
    underscored: false,
    timestamps: true,
  },
};

module.exports = {
  development: { ...base },
  test: { ...base },
  production: { ...base },
};
