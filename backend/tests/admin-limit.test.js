/* Admin-limit business rule tests (spec §11, §4, §5, §6, §12). */
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const BASE = 'http://localhost:5100/api';
const ADMIN_MSG = 'Maximum number of administrators reached. The platform can have a maximum of 5 administrators.';
const LAST_MSG = 'At least one administrator must remain';

let pass = 0;
let fail = 0;
function check(name, cond, extra) {
  if (cond) {
    pass += 1;
    console.log(`  ok   ${name}`);
  } else {
    fail += 1;
    console.log(`  FAIL ${name}${extra !== undefined ? ' -- ' + JSON.stringify(extra) : ''}`);
  }
}

async function req(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch (_) { /* no body */ }
  return { status: res.status, body: json };
}

const rand = () => Math.random().toString(36).slice(2, 10);

async function register(extra = {}) {
  const r = await req('POST', '/auth/register', {
    body: {
      firstName: 'Test',
      lastName: 'User',
      email: `t.${rand()}@admin-limit.test`,
      password: 'Password123!',
      ...extra,
    },
  });
  return r;
}

async function main() {
  // ── §11 Test 4: public registration cannot grant privileges ───────────────
  console.log('Test 4: public registration');
  const evilAdmin = await register({ role: 'ADMIN' });
  check('register with role=ADMIN accepted or rejected safely', evilAdmin.status === 201 || evilAdmin.status === 400, evilAdmin.body);
  if (evilAdmin.status === 201) {
    check('account created as CUSTOMER', evilAdmin.body.data.user.role === 'CUSTOMER', evilAdmin.body.data.user);
  }
  const evilRider = await register({ role: 'RIDER' });
  check('register with role=RIDER creates CUSTOMER', evilRider.status === 201 && evilRider.body.data.user.role === 'CUSTOMER', evilRider.body);
  const evilToken = evilAdmin.body?.data?.token || evilRider.body.data.token;
  const evilId = evilAdmin.body?.data?.user?.id || evilRider.body.data.user.id;

  const esc = await req('PATCH', '/auth/me', { token: evilToken, body: { role: 'ADMIN' } });
  check('PATCH /auth/me with role rejected or ignored', esc.status >= 400 || esc.status === 200, esc.body);
  const me = await req('GET', '/auth/me', { token: evilToken });
  check('self role escalation blocked', me.body.data.user.role === 'CUSTOMER', me.body);

  // ── login as seeded admin ─────────────────────────────────────────────────
  const adminLogin = await req('POST', '/auth/login', {
    body: { email: 'admin@clothing-delivery.test', password: 'Password123!' },
  });
  check('seeded admin login', adminLogin.status === 200, adminLogin.body);
  const T = adminLogin.body.data.token;

  const stats = async () => (await req('GET', '/admin/administrators', { token: T })).body.data;
  let s = await stats();
  check('initial admin count = 1', s.count === 1 && s.limit === 5, s);

  // ── §11 Tests 1-3: create admins up to the limit ─────────────────────────
  console.log('Tests 1-3: create up to 5 admins, reject #6');
  const created = [];
  for (let i = 2; i <= 5; i += 1) {
    const email = `admin.new${i}.${rand()}@admin-limit.test`;
    const r = await req('POST', '/admin/administrators', {
      token: T,
      body: { firstName: 'New', lastName: `Admin${i}`, email, password: 'Password123!' },
    });
    check(`admin #${i} created (201)`, r.status === 201, r.body);
    created.push(email);
    s = await stats();
    check(`admin count = ${i}`, s.count === i, s);
  }

  const sixth = await req('POST', '/admin/administrators', {
    token: T,
    body: { firstName: 'Sixth', lastName: 'Admin', email: `admin.sixth${rand()}@admin-limit.test`, password: 'Password123!' },
  });
  check('admin #6 rejected with 409', sixth.status === 409, sixth.body);
  check('exact 409 message', sixth.body?.message === ADMIN_MSG, sixth.body);
  s = await stats();
  check('count remains 5 after rejection', s.count === 5 && s.atLimit === true && s.remaining === 0, s);

  // §6: dashboard payload
  check('dashboard payload exposes 5 / 5', s.count === 5 && s.limit === 5 && Array.isArray(s.users), s);

  // ── §5: race — 3 concurrent creates when 4 admins ────────────────────────
  console.log('Race: concurrent creation at 4 admins');
  // demote one created admin to make room
  const users = (await req('GET', '/admin/users?role=ADMIN&limit=50', { token: T })).body.data.users;
  const demoteTarget = users.find((u) => u.email.startsWith('admin.new5.'));
  const dem = await req('PATCH', `/admin/users/${demoteTarget.id}/role`, { token: T, body: { role: 'CUSTOMER' } });
  check('demote admin #5 to CUSTOMER', dem.status === 200, dem.body);
  s = await stats();
  check('capacity freed: count = 4', s.count === 4, s);

  const [ra, rb, rc] = await Promise.all([
    req('POST', '/admin/administrators', { token: T, body: { firstName: 'Race', lastName: 'Ace', email: `race.a${rand()}@admin-limit.test`, password: 'Password123!' } }),
    req('POST', '/admin/administrators', { token: T, body: { firstName: 'Race', lastName: 'Bee', email: `race.b${rand()}@admin-limit.test`, password: 'Password123!' } }),
    req('POST', '/admin/administrators', { token: T, body: { firstName: 'Race', lastName: 'Cee', email: `race.c${rand()}@admin-limit.test`, password: 'Password123!' } }),
  ]);
  const outcomes = [ra.status, rb.status, rc.status];
  const successes = outcomes.filter((x) => x === 201).length;
  const conflicts = outcomes.filter((x) => x === 409).length;
  check('exactly one concurrent create wins', successes === 1, outcomes);
  check('other two get 409', conflicts === 2, outcomes);
  s = await stats();
  check('count = 5 after race', s.count === 5, s);

  // ── §7: promotion at limit rejected ──────────────────────────────────────
  console.log('Test 5: promote customer while at limit');
  const customers = (await req('GET', '/admin/users?role=CUSTOMER&limit=50', { token: T })).body.data.users;
  const promo = customers.find((u) => u.email.startsWith('ada.customer'));
  const rejected = await req('PATCH', `/admin/users/${promo.id}/role`, { token: T, body: { role: 'ADMIN' } });
  check('customer -> ADMIN rejected with 409 at limit', rejected.status === 409, rejected.body);
  check('exact 409 message on promotion', rejected.body?.message === ADMIN_MSG, rejected.body);
  s = await stats();
  check('count stays 5', s.count === 5, s);

  // ── §8: Test 6 — free a slot, create again ───────────────────────────────
  console.log('Test 6: demote then create again');
  const currentAdmins = (await req('GET', '/admin/administrators', { token: T })).body.data.users;
  const victim = currentAdmins.find((u) => u.email !== 'admin@clothing-delivery.test');
  const d2 = await req('PATCH', `/admin/users/${victim.id}/role`, { token: T, body: { role: 'CUSTOMER' } });
  check('administrator demoted', d2.status === 200, d2.body);
  s = await stats();
  check('count = 4 after removal', s.count === 4, s);
  const again = await req('POST', '/admin/administrators', {
    token: T,
    body: { firstName: 'Re', lastName: 'Created', email: `admin.again${rand()}@admin-limit.test`, password: 'Password123!' },
  });
  check('new admin allowed at 4 -> 5', again.status === 201, again.body);
  s = await stats();
  check('count back to 5', s.count === 5, s);

  // ── §9/§3: database-level bypass attempt while AT the limit ──────────────
  console.log('Database trigger bypass attempt (count = 5)');
  const { sequelize } = require('../src/models');
  await sequelize.query(
    "INSERT INTO users (id, \"firstName\", \"lastName\", email, password, role, status, \"createdAt\", \"updatedAt\") " +
    `VALUES (gen_random_uuid(), 'Bypass', 'Attempt', 'bypass.${rand()}@admin-limit.test', 'x', 'ADMIN', 'ACTIVE', NOW(), NOW())`
  ).then(
    () => check('direct SQL 6th admin INSERT blocked by trigger', false, 'insert succeeded!'),
    (err) => check('direct SQL 6th admin INSERT blocked by trigger', /Maximum number of administrators reached/.test(err.message), err.message.slice(0, 160))
  );

  // ── §8: never remove the last administrator ──────────────────────────────
  console.log('Last-admin guard');
  for (;;) {
    const list = (await req('GET', '/admin/administrators', { token: T })).body.data.users;
    if (list.length <= 1) break;
    const target = list.find((u) => u.email !== 'admin@clothing-delivery.test') || list[0];
    const r = await req('PATCH', `/admin/users/${target.id}/role`, { token: T, body: { role: 'CUSTOMER' } });
    if (r.status !== 200) { check('unexpected demote failure', false, r.body); break; }
  }
  s = await stats();
  check('one administrator remains', s.count === 1, s);
  const lastAdmin = s.users[0];
  const lastTry = await req('PATCH', `/admin/users/${lastAdmin.id}/role`, { token: T, body: { role: 'CUSTOMER' } });
  check('last admin demotion rejected with 409', lastTry.status === 409, lastTry.body);
  check('exact last-admin message', lastTry.body?.message === LAST_MSG, lastTry.body);
  s = await stats();
  check('count still 1', s.count === 1, s);

  // ── §12: permission + hygiene checks ─────────────────────────────────────
  console.log('Permissions and hygiene');
  const forbidden = await req('POST', '/admin/administrators', { token: evilToken, body: { firstName: 'X', lastName: 'Y', email: `x.${rand()}@admin-limit.test`, password: 'Password123!' } });
  check('non-admin cannot create administrators (403)', forbidden.status === 403, forbidden.body);
  const roleForbidden = await req('PATCH', `/admin/users/${evilId}/role`, { token: evilToken, body: { role: 'ADMIN' } });
  check('non-admin cannot change roles (403)', roleForbidden.status === 403, roleForbidden.body);
  const noStats = await req('GET', '/admin/administrators', { token: evilToken });
  check('non-admin cannot read admin stats (403)', noStats.status === 403, noStats.body);

  const listResp = await req('GET', '/admin/users?limit=100', { token: T });
  const serialized = JSON.stringify(listResp.body);
  check('no password hashes in user list', !serialized.includes('password'), null);

  const toRider = await req('PATCH', `/admin/users/${evilId}/role`, { token: T, body: { role: 'RIDER' } });
  check('CUSTOMER -> RIDER blocked (use rider management)', toRider.status === 400, toRider.body);

  // ── §9: direct database-level count ──────────────────────────────────────
  console.log('Database check');
  const [[{ count: dbCount }]] = await sequelize.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'ADMIN'");
  check('SQL admin count is 1 (<= 5)', dbCount === 1, dbCount);

  await sequelize.close();

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('CRASHED:', err);
  process.exit(1);
});
