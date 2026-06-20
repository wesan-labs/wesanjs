import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260620215237 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "revenue_event" drop constraint if exists "revenue_event_source_id_external_id_unique";`);
    this.addSql(`alter table if exists "revenue_metric_snapshot" drop constraint if exists "revenue_metric_snapshot_date_app_id_source_type_unique";`);
    this.addSql(`create table if not exists "revenue_expense" ("id" text not null, "app_id" text null, "category" text check ("category" in ('infra', 'api', 'ads', 'other')) not null default 'other', "description" text not null, "amount" numeric not null, "currency" text not null, "reporting_amount" numeric null, "occurred_at" timestamptz not null, "recurring" boolean not null default false, "created_by" text null, "raw_amount" jsonb not null, "raw_reporting_amount" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "revenue_expense_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_revenue_expense_deleted_at" ON "revenue_expense" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "revenue_metric_snapshot" ("id" text not null, "date" timestamptz not null, "app_id" text null, "source_type" text null, "mrr" numeric not null default 0, "active_subscriptions" integer not null default 0, "active_trials" integer not null default 0, "gross_revenue" numeric not null default 0, "net_revenue" numeric not null default 0, "ad_revenue" numeric not null default 0, "expense_total" numeric not null default 0, "net_profit" numeric not null default 0, "currency" text not null, "raw_mrr" jsonb not null default '{"value":"0","precision":20}', "raw_gross_revenue" jsonb not null default '{"value":"0","precision":20}', "raw_net_revenue" jsonb not null default '{"value":"0","precision":20}', "raw_ad_revenue" jsonb not null default '{"value":"0","precision":20}', "raw_expense_total" jsonb not null default '{"value":"0","precision":20}', "raw_net_profit" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "revenue_metric_snapshot_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_revenue_metric_snapshot_deleted_at" ON "revenue_metric_snapshot" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_revenue_metric_snapshot_date_app_id_source_type_unique" ON "revenue_metric_snapshot" ("date", "app_id", "source_type") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "revenue_event" ("id" text not null, "source_id" text not null, "source_type" text check ("source_type" in ('revenuecat', 'stripe', 'paddle', 'iyzico', 'manual')) not null, "external_id" text not null, "app_id" text null, "kind" text check ("kind" in ('subscription_initial', 'subscription_renewal', 'one_time', 'refund', 'ad_earning')) not null, "status" text not null default 'completed', "gross_amount" numeric not null, "net_amount" numeric null, "currency" text not null, "reporting_amount" numeric null, "fx_rate" numeric null, "occurred_at" timestamptz not null, "raw_payload" jsonb null, "raw_gross_amount" jsonb not null, "raw_net_amount" jsonb null, "raw_reporting_amount" jsonb null, "raw_fx_rate" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "revenue_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_revenue_event_deleted_at" ON "revenue_event" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_revenue_event_source_id_external_id_unique" ON "revenue_event" ("source_id", "external_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_revenue_event_occurred_at" ON "revenue_event" ("occurred_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_revenue_event_kind" ON "revenue_event" ("kind") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "revenue_source" ("id" text not null, "type" text check ("type" in ('revenuecat', 'stripe', 'paddle', 'iyzico', 'manual')) not null, "name" text not null, "status" text not null default 'active', "credentials_ref" text null, "last_synced_at" timestamptz null, "last_cursor" text null, "last_error" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "revenue_source_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_revenue_source_deleted_at" ON "revenue_source" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "revenue_expense" cascade;`);

    this.addSql(`drop table if exists "revenue_metric_snapshot" cascade;`);

    this.addSql(`drop table if exists "revenue_event" cascade;`);

    this.addSql(`drop table if exists "revenue_source" cascade;`);
  }

}
