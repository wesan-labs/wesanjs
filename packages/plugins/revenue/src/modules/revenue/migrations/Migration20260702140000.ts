import { Migration } from "@medusajs/framework/mikro-orm/migrations"

// Multi-tenant rollout (ADR-0001) — additive + reversible.
const TABLES = [
  "revenue_app",
  "revenue_source",
  "revenue_event",
  "revenue_metric_snapshot",
  "revenue_expense",
] as const

export class Migration20260702140000 extends Migration {
  override async up(): Promise<void> {
    for (const table of TABLES) {
      this.addSql(
        `ALTER TABLE IF EXISTS "${table}" ADD COLUMN IF NOT EXISTS "tenant_id" text NULL;`
      )
      this.addSql(
        `UPDATE "${table}" SET "tenant_id" = 'tenant_default' WHERE "tenant_id" IS NULL;`
      )
      this.addSql(
        `CREATE INDEX IF NOT EXISTS "IDX_${table}_tenant_id" ON "${table}" ("tenant_id") WHERE deleted_at IS NULL;`
      )
    }
  }

  override async down(): Promise<void> {
    for (const table of TABLES) {
      this.addSql(`DROP INDEX IF EXISTS "IDX_${table}_tenant_id";`)
      this.addSql(
        `ALTER TABLE IF EXISTS "${table}" DROP COLUMN IF EXISTS "tenant_id";`
      )
    }
  }
}
