import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260629120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "tenant" ("id" text not null, "slug" text not null, "name" text not null, "status" text not null default 'active', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "tenant_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_tenant_slug_unique" ON "tenant" ("slug") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_tenant_deleted_at" ON "tenant" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `create table if not exists "tenant_membership" ("id" text not null, "tenant_id" text not null, "user_id" text not null, "role" text not null default 'admin', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "tenant_membership_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_tenant_membership_unique" ON "tenant_membership" ("tenant_id", "user_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_tenant_membership_deleted_at" ON "tenant_membership" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_tenant_membership_user" ON "tenant_membership" ("user_id") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "tenant_membership" cascade;`)
    this.addSql(`drop table if exists "tenant" cascade;`)
  }
}
