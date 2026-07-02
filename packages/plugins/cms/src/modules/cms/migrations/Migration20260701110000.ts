import { Migration } from "@medusajs/framework/mikro-orm/migrations"

// A1 tenant izolasyonu (2/2): cms tablolarında Postgres RLS.
// old-levios'un kanıtlanmış deseninin (commit cad08cf80) migration formu —
// helm'e el-script'i olarak değil, plugin'in kendi migration'ı olarak yaşar
// (wesanjs=platform, helm=yalnız tüketici ilkesi).
//
// Roller: levios_app (RLS zorunlu, tenant trafiği) · levios_platform (BYPASSRLS).
// Politika STRICT: tenant_id NULL satırlar levios_app'e görünmez.
// Idempotent; tablo/kolon yoksa sessizce atlar (fresh-DB sırası güvenli).
const TABLES = ["cms_site", "cms_collection", "cms_entry"] as const

export class Migration20260701110000 extends Migration {
  override async up(): Promise<void> {
    // 1) Roller (global, idempotent)
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

    // 2) Yardımcı fonksiyon (STABLE = transaction başına cache)
    this.addSql(`
      CREATE OR REPLACE FUNCTION current_tenant_id()
      RETURNS TEXT LANGUAGE sql STABLE
      AS $$ SELECT current_setting('app.current_tenant_id', true); $$;
    `)

    // 3) Tablo başına RLS + policy (varlık kontrollü, idempotent)
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
    // Roller + current_tenant_id() global/paylaşımlı — bilinçli olarak bırakılır.
  }
}
