const fs = require('fs');
const path = require('path');

function resolveCaPath() {
  const raw = process.env.DB_SSL_CA_PATH;
  if (!raw) return null;
  if (path.isAbsolute(raw)) return raw;
  const backendRoot = path.resolve(__dirname, '..', '..');
  return path.resolve(backendRoot, raw);
}

// Reads the CA certificate contents from an environment variable (used on Render).
// Handles values pasted with literal "\n" sequences or wrapped in quotes.
function loadCaFromEnv() {
  const raw = process.env.DB_SSL_CA || process.env.DB_CA_CERT;
  if (!raw) return undefined;
  const pem = raw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  return pem || undefined;
}

function buildSslConfig() {
  let ca = loadCaFromEnv();

  if (!ca) {
    const caPath = resolveCaPath();
    if (caPath && fs.existsSync(caPath)) {
      ca = fs.readFileSync(caPath, 'utf8');
    }
  }

  if (!ca) {
    console.warn(
      '[db] No CA certificate found (set DB_CA_CERT / DB_SSL_CA or DB_SSL_CA_PATH). ' +
        'TLS verification will likely fail against Aiven.'
    );
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