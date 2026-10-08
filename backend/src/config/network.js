const net = require('net');

// The local resolver returns an unreachable NAT64 IPv6 address next to a working
// IPv4 address. Node's Happy Eyeballs fallback gives up after ~250ms, before the
// IPv4 connection completes, which makes connections fail intermittently with
// ETIMEDOUT. Prefer the first resolved address instead. Set AUTO_SELECT_FAMILY=true
// to restore the default behaviour on networks where both families work.
if (
  process.env.AUTO_SELECT_FAMILY !== 'true' &&
  typeof net.setDefaultAutoSelectFamily === 'function'
) {
  net.setDefaultAutoSelectFamily(false);
}

module.exports = {};
