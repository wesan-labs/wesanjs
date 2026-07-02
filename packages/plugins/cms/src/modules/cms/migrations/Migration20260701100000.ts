import { Migration } from "@medusajs/framework/mikro-orm/migrations"

// A1 tenant izolasyonu: cms tablolarına tenant_id (nullable — legacy kayıtlar null
// kalır, RLS strict-eşitlikle sadece sahibine gösterir). Idempotent.
export class Migration20260701100000 extends Migration {
  override async up(): Promise<void> {
    for (const table of ["cms_site", "cms_collection", "cms_entry"]) {
      this.addSql(
        `ALTER TABLE IF EXISTS "${table}" ADD COLUMN IF NOT EXISTS "tenant_id" text NULL;`
      )
      this.addSql(
        `CREATE INDEX IF NOT EXISTS "IDX_${table}_tenant_id" ON "${table}" ("tenant_id") WHERE deleted_at IS NULL;`
      )
    }
  }

  override async down(): Promise<void> {
    for (const table of ["cms_site", "cms_collection", "cms_entry"]) {
      this.addSql(`DROP INDEX IF EXISTS "IDX_${table}_tenant_id";`)
      this.addSql(
        `ALTER TABLE IF EXISTS "${table}" DROP COLUMN IF EXISTS "tenant_id";`
      )
    }
  }
}
