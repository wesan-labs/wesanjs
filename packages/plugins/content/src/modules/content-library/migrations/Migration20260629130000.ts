import { Migration } from "@medusajs/framework/mikro-orm/migrations"

// Multi-tenant rollout (ADR-0001) — additive + reversible. Adds tenant_id and
// backfills existing rows to the default tenant. No NOT NULL / RLS yet → zero
// behavior change until enforcement phase.
export class Migration20260629130000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "content_item" add column if not exists "tenant_id" text null;`)
    this.addSql(`update "content_item" set "tenant_id" = 'tenant_default' where "tenant_id" is null;`)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_content_item_tenant" ON "content_item" ("tenant_id") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "content_item" drop column if exists "tenant_id";`)
  }
}
