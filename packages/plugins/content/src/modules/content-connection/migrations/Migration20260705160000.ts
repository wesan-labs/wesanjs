import { Migration } from "@medusajs/framework/mikro-orm/migrations"

const TABLES = ["content_connection"] as const

export class Migration20260705160000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "content_connection" (
        "id" text not null,
        "tenant_id" text not null,
        "provider" text not null,
        "category" text not null default 'social',
        "config" jsonb null,
        "secret_enc" text null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "content_connection_pkey" primary key ("id")
      );
    `)
    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_content_connection_tenant_provider"
      ON "content_connection" ("tenant_id", "provider")
      WHERE deleted_at IS NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_content_connection_tenant_id"
      ON "content_connection" ("tenant_id")
      WHERE deleted_at IS NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_content_connection_deleted_at"
      ON "content_connection" ("deleted_at") WHERE deleted_at IS NULL;
    `)

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

    for (const table of TABLES) {
      const policy = `tenant_isolation_${table}`
      this.addSql(`
        DO $$ BEGIN
          IF EXISTS (SELECT FROM pg_tables WHERE tablename = '${table}') THEN
            EXECUTE 'ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY';
            EXECUTE 'ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY';
            IF NOT EXISTS (
              SELECT FROM pg_policies WHERE tablename = '${table}' AND policyname = '${policy}'
            ) THEN
              EXECUTE 'CREATE POLICY "${policy}" ON "${table}" FOR ALL TO levios_app USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id())';
            END IF;
          END IF;
        END $$;
      `)
    }
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "content_connection" cascade;`)
  }
}
