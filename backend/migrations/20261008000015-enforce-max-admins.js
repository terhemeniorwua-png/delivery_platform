'use strict';

/**
 * Database-level protection for the "maximum 5 administrators" business rule.
 *
 * The trigger serializes every grant of role = ADMIN (and every revocation)
 * on a transaction-scoped advisory lock, counts the administrators inside
 * that critical section, and raises an exception when the limit would be
 * exceeded. Because the lock is held until the transaction commits or rolls
 * back, two concurrent requests can never both observe "4 admins" and both
 * insert a fifth + sixth — the final state in the table can never contain
 * more than 5 ADMIN users, no matter what the application layer does.
 *
 * The messages match ADMIN_LIMIT_MESSAGE / LAST_ADMIN_MESSAGE in
 * src/constants/status.js so the error middleware can translate the raw
 * database error into a 409 response.
 */
const ADVISORY_LOCK_KEY = 'users.max_admin_count';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION enforce_max_admins()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      DECLARE
        admin_count integer;
      BEGIN
        -- Serialize every transaction that grants or revokes an administrator.
        PERFORM pg_advisory_xact_lock(hashtext('${ADVISORY_LOCK_KEY}')::bigint);

        IF NEW.role = 'ADMIN' AND (TG_OP = 'INSERT' OR OLD.role <> 'ADMIN') THEN
          SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'ADMIN';

          IF admin_count >= 5 THEN
            RAISE EXCEPTION
              'Maximum number of administrators reached. The platform can have a maximum of 5 administrators.';
          END IF;
        END IF;

        IF TG_OP = 'UPDATE' AND OLD.role = 'ADMIN' AND NEW.role <> 'ADMIN' THEN
          -- COUNT still includes this row (it has not been updated yet).
          SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'ADMIN';

          IF admin_count <= 1 THEN
            RAISE EXCEPTION 'At least one administrator must remain';
          END IF;
        END IF;

        RETURN NEW;
      END;
      $$;
    `);

    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS enforce_max_admins ON users;
      CREATE TRIGGER enforce_max_admins
        BEFORE INSERT OR UPDATE ON users
        FOR EACH ROW
        WHEN (NEW.role = 'ADMIN' OR OLD.role = 'ADMIN')
        EXECUTE FUNCTION enforce_max_admins();
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS enforce_max_admins ON users;');
    await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS enforce_max_admins();');
  },
};
