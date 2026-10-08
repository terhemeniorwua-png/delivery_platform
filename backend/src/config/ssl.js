const fs = require('fs');
const path = require('path');

function resolveCaPath() {
  const raw = process.env.DB_SSL_CA_PATH;
  if (!raw) return null;
  if (path.isAbsolute(raw)) return raw;
  const backendRoot = path.resolve(__dirname, '..', '..');
  return path.resolve(backendRoot, raw);
}

function buildSslConfig() {
  const caPath = resolveCaPath();
  let ca;
  if (caPath && fs.existsSync(caPath)) {
    ca = fs.readFileSync(caPath, 'utf8');
  }
  return ca
    ? { require: true, rejectUnauthorized: true, ca }
    : { require: true, rejectUnauthorized: true };
}

const SSL_QUERY_PARAMS = [
  'sslmode',
  'ssl',
  'sslrootcert',
  'sslcert',
  'sslkey',
  'sslnegotiation',
  'uselibpqcompat',
];

// Sequelize re-parses the connection string and overwrites dialectOptions.ssl with
// the parsed result, which would drop the Aiven CA certificate. Strip the ssl related
// parameters and always provide the ssl configuration explicitly instead.
function sanitizeDatabaseUrl(url) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    for (const key of SSL_QUERY_PARAMS) parsed.searchParams.delete(key);
    return parsed.toString();
  } catch (err) {
    return url;
  }
}

module.exports = { buildSslConfig, resolveCaPath, sanitizeDatabaseUrl };
