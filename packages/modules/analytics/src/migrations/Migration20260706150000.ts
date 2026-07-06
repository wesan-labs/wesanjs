import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260706150000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "analytics_metric_snapshot" (
        "id" text not null,
        "tenant_id" text null,
        "product_id" text not null,
        "date" timestamptz not null,
        "source" text not null,
        "metric" text not null,
        "value" numeric not null default 0,
        "dimensions" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "analytics_metric_snapshot_pkey" primary key ("id")
      );
    `)
    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_analytics_metric_snapshot_unique"
      ON "analytics_metric_snapshot" ("tenant_id", "product_id", "date", "source", "metric")
      WHERE deleted_at IS NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_analytics_metric_snapshot_tenant_product"
      ON "analytics_metric_snapshot" ("tenant_id", "product_id")
      WHERE deleted_at IS NULL;
    `)

    this.addSql(`
      create table if not exists "analytics_bootstrap_token" (
        "id" text not null,
        "tenant_id" text null,
        "product_id" text not null,
        "token_hash" text not null,
        "token_hint" text null,
        "rotated_at" timestamptz null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "analytics_bootstrap_token_pkey" primary key ("id")
      );
    `)
    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_analytics_bootstrap_token_product"
      ON "analytics_bootstrap_token" ("tenant_id", "product_id")
      WHERE deleted_at IS NULL;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "analytics_bootstrap_token" cascade;`)
    this.addSql(`drop table if exists "analytics_metric_snapshot" cascade;`)
  }
}
