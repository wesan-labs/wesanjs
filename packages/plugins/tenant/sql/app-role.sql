-- Non-superuser application role for RLS enforcement (TEST/PROD runtime only).
-- Dev runtime keeps `postgres` (superuser) → RLS dormant by design (ADR-0001).
-- Run ONCE per environment as a superuser, then point the app's DATABASE_URL at
-- medusa_app_user. Migrations keep running as the owner/superuser (postgres).
--
-- medusa_app_user is intentionally NOT superuser and NOT the table owner, so
-- RLS policies (with FORCE ROW LEVEL SECURITY) actually apply to it. This is the
-- ONLY way RLS isolates — a superuser/owner bypasses it.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'medusa_app_user') THEN
    CREATE ROLE medusa_app_user LOGIN PASSWORD 'CHANGE_ME_PER_ENV';
  END IF;
END $$;

-- Replace <DB> with the environment database name (e.g. helm).
-- GRANT CONNECT ON DATABASE "<DB>" TO medusa_app_user;
GRANT USAGE, CREATE ON SCHEMA public TO medusa_app_user;

-- Existing + FUTURE tables/sequences → no per-table friction after this.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO medusa_app_user;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO medusa_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO medusa_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO medusa_app_user;
