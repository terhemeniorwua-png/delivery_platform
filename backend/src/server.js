const app = require('./app');
const sequelize = require('./config/database');
const { RiderApplication } = require('./models');

const PORT = Number(process.env.PORT) || 5100;

async function start() {
  await sequelize.authenticate();

  // Phase 8: this repo has no migrations directory, so the new
  // rider_applications table is created via a targeted model sync (a no-op
  // when the table already exists). Existing tables are never touched.
  await RiderApplication.sync();

  app.listen(PORT, () => {
    console.log(`[server] clothing delivery API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('[server] failed to start:', err.message);
  process.exit(1);
});
