const app = require('./app');
const sequelize = require('./config/database');
const { PasswordReset, RiderApplication } = require('./models');

const PORT = Number(process.env.PORT) || 5100;

async function start() {
  await sequelize.authenticate();

  // Phase 8/13: this repo has no migrations directory, so new tables
  // (rider_applications, password_resets) are created via targeted model
  // syncs (no-ops when the table already exists). Existing tables are
  // never touched.
  await RiderApplication.sync();
  await PasswordReset.sync();

  app.listen(PORT, () => {
    console.log(`[server] clothing delivery API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('[server] failed to start:', err.message);
  process.exit(1);
});
