import { Migration } from "@medusajs/framework/mikro-orm/migrations"

// A1 tenant izolasyonu (2/2): content tablolarında Postgres RLS.
// CMS Migration20260701110000 ile aynı desen — roller + current_tenant_id() paylaşımlı.
//
// Roller: levios_app (RLS zorunlu) · levios_platform (BYPASSRLS).
// Politika STRICT: tenant_id NULL satırlar levios_app'e görünmez.
// Idempotent; tablo/kolon yoksa sessizce atlar.
const TABLES = ["content_item", "social_snapshot"] as const

export class Migration20260702120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'levios_app') THEN
          CREATE ROLE levios_app LOGIN;
        END IF;
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'levios_platform') THEN
          CREATE ROLE levios_platform LOGIN BYPASSRLS;
        END IF;
      END $$;
    `)
    this.addSql(`GRANT USAGE ON SCHEMA public TO levios_app;`)
    this.addSql(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO levios_app;`
    )
    this.addSql(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO levios_app;`
    )

    this.addSql(`
      CREATE OR REPLACE FUNCTION current_tenant_id()
      RETURNS TEXT LANGUAGE sql STABLE
      AS $$ SELECT current_setting('app.current_tenant_id', true); $$;
    `)

    for (const table of TABLES) {
      const policy = `tenant_isolation_${table}`
      this.addSql(`
        DO $$ BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = '${table}'
              AND column_name = 'tenant_id'
          ) THEN
            EXECUTE 'ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY';
            EXECUTE 'DROP POLICY IF EXISTS "${policy}" ON "${table}"';
            EXECUTE 'CREATE POLICY "${policy}" ON "${table}" FOR ALL TO levios_app USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id())';
          END IF;
        END $$;
      `)
    }
  }

  override async down(): Promise<void> {
    for (const table of TABLES) {
      this.addSql(
        `DROP POLICY IF EXISTS "tenant_isolation_${table}" ON "${table}";`
      )
      this.addSql(
        `ALTER TABLE IF EXISTS "${table}" DISABLE ROW LEVEL SECURITY;`
      )
    }
  }
}
