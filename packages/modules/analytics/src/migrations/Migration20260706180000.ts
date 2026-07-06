import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260706180000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "analytics_event" (
        "id" text not null,
        "tenant_id" text null,
        "product_id" text not null,
        "event" text not null,
        "distinct_id" text not null,
        "occurred_at" timestamptz not null,
        "properties" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "analytics_event_pkey" primary key ("id")
      );
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_analytics_event_tenant_product_time"
      ON "analytics_event" ("tenant_id", "product_id", "occurred_at")
      WHERE deleted_at IS NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_analytics_event_product_event_time"
      ON "analytics_event" ("product_id", "event", "occurred_at")
      WHERE deleted_at IS NULL;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "analytics_event" cascade;`)
  }
}
