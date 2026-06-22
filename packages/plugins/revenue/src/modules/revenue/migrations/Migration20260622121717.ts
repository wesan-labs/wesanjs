import { Migration } from "@medusajs/framework/mikro-orm/migrations"

// App-centric rework — ADDITIVE (mevcut tablolarda veri korunur).
// Medusa codegen "create table if not exists" üretti → mevcut tablolara kolon
// EKLEMEZ; elle ALTER ADD COLUMN ile additive yapıldı.
export class Migration20260622121717 extends Migration {
  override async up(): Promise<void> {
    // Yeni: app (ürün) defteri
    this.addSql(
      `create table if not exists "revenue_app" ("id" text not null, "name" text not null, "status" text not null default 'active', "icon_url" text null, "external_ids" jsonb null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "revenue_app_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_revenue_app_deleted_at" ON "revenue_app" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    // revenue_source: +app_id, +external_id
    this.addSql(
      `alter table if exists "revenue_source" add column if not exists "app_id" text null;`
    )
    this.addSql(
      `alter table if exists "revenue_source" add column if not exists "external_id" text null;`
    )

    // revenue_event: +platform
    this.addSql(
      `alter table if exists "revenue_event" add column if not exists "platform" text null;`
    )

    // revenue_metric_snapshot: +platform + unique (date,app_id,platform,source_type)
    this.addSql(
      `alter table if exists "revenue_metric_snapshot" add column if not exists "platform" text not null default 'all';`
    )
    this.addSql(
      `drop index if exists "IDX_revenue_metric_snapshot_date_app_id_source_type_unique";`
    )
    this.addSql(
      `drop index if exists "revenue_metric_snapshot_date_app_id_source_type_unique";`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_revenue_metric_snapshot_date_app_id_platform_source_type_unique" ON "revenue_metric_snapshot" ("date", "app_id", "platform", "source_type") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "revenue_app" cascade;`)
    this.addSql(
      `alter table if exists "revenue_source" drop column if exists "app_id";`
    )
    this.addSql(
      `alter table if exists "revenue_source" drop column if exists "external_id";`
    )
    this.addSql(
      `alter table if exists "revenue_event" drop column if exists "platform";`
    )
    this.addSql(
      `drop index if exists "IDX_revenue_metric_snapshot_date_app_id_platform_source_type_unique";`
    )
    this.addSql(
      `alter table if exists "revenue_metric_snapshot" drop column if exists "platform";`
    )
  }
}
