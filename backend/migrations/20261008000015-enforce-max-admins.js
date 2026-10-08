'use strict';

/**
 * Database-level protection for the "maximum 5 administrators" business rule.
 *
 * The trigger runs on every insert/update of `users`, but only enters the
 * critical section when a row is actually being *granted* role = ADMIN or
 * *revoked* from ADMIN — so ordinary writes (registration, profile updates,
 * status changes) never touch the lock.
 *
 * Inside the critical section it takes a transaction-scoped advisory lock
 * (the same key the application's admin.service.js takes), counts the
 * administrators, and raises an exception when the rule would be broken:
 *   - granting ADMIN when 5 already exist  -> reject
 *   - revoking the last ADMIN              -> reject
 *
 * Because the lock is held until the transaction commits or rolls back, two
 * concurrent requests can never both observe "4 admins" and both insert a
 * fifth + sixth — the table can never contain more than 5 ADMIN users, no
 * matter what the application layer does.
 *
 * The messages match ADMIN_LIMIT_MESSAGE / LAST_ADMIN_MESSAGE in
 * src/constants/status.js so the error middleware can translate the raw
 * database error into a 409 response.
 */
const ADVISORY_LOCK_KEY = 'users.max_admin_count';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS enforce_max_admins ON users;
      DROP FUNCTION IF EXISTS enforce_max_admins();
    `);

    await queryInterface.sequelize.query(`
      CREATE FUNCTION enforce_max_admins()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      DECLARE
        granting  boolean;
        revoking  boolean;
        admin_count integer;
      BEGIN
        IF TG_OP = 'INSERT' THEN
          granting := (NEW.role = 'ADMIN');
          revoking := false;
        ELSE
          granting := (NEW.role = 'ADMIN' AND OLD.role <> 'ADMIN');
          revoking := (OLD.role = 'ADMIN' AND NEW.role <> 'ADMIN');
        END IF;

        -- Non-role-change writes bypass the lock entirely.
        IF NOT (granting OR revoking) THEN
          RETURN NEW;
        END IF;

        -- Serialize every transaction that grants or revokes an administrator.
        PERFORM pg_advisory_xact_lock(hashtext('${ADVISORY_LOCK_KEY}')::bigint);

        IF granting THEN
          SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'ADMIN';
          IF admin_count >= 5 THEN
            RAISE EXCEPTION
              'Maximum number of administrators reached. The platform can have a maximum of 5 administrators.';
          END IF;
        END IF;

        IF revoking THEN
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
      CREATE TRIGGER enforce_max_admins
        BEFORE INSERT OR UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION enforce_max_admins();
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS enforce_max_admins ON users;');
    await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS enforce_max_admins();');
  },
};
