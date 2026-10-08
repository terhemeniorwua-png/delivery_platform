const app = require('./app');
const sequelize = require('./config/database');

const PORT = Number(process.env.PORT) || 5100;

async function start() {
  await sequelize.authenticate();
  app.listen(PORT, () => {
    console.log(`[server] clothing delivery API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('[server] failed to start:', err.message);
  process.exit(1);
});
