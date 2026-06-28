import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260628120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "social_snapshot" ("id" text not null, "account_id" text not null, "platform" text not null, "date" text not null, "metrics" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "social_snapshot_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_social_snapshot_deleted_at" ON "social_snapshot" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_social_snapshot_account_date" ON "social_snapshot" ("account_id", "date");`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "social_snapshot" cascade;`)
  }
}
