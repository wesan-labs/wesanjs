import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Per-tenant RBAC (#0007): module role assignment scoped to org membership.
 */
export class Migration20260702160000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "tenant_membership" add column if not exists "rbac_role_id" text null;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_tenant_membership_rbac_role" ON "tenant_membership" ("rbac_role_id") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_tenant_membership_rbac_role";`)
    this.addSql(
      `alter table "tenant_membership" drop column if exists "rbac_role_id";`
    )
  }
}
