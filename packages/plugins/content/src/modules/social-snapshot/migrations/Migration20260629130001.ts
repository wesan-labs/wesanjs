import { Migration } from "@medusajs/framework/mikro-orm/migrations"

// Multi-tenant rollout (ADR-0001) — additive + reversible. tenant_id leads the
// composite index (RLS perf gotcha: tenant_id must be the leading column).
export class Migration20260629130001 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "social_snapshot" add column if not exists "tenant_id" text null;`)
    this.addSql(`update "social_snapshot" set "tenant_id" = 'tenant_default' where "tenant_id" is null;`)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_social_snapshot_tenant_account_date" ON "social_snapshot" ("tenant_id", "account_id", "date");`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "social_snapshot" drop column if exists "tenant_id";`)
  }
}
