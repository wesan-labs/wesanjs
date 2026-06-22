import { Migration } from "@medusajs/framework/mikro-orm/migrations"

// revenue_source → generic integration: +provider, +category, +config.
export class Migration20260622150000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "revenue_source" add column if not exists "provider" text null;`
    )
    this.addSql(
      `alter table if exists "revenue_source" add column if not exists "category" text null;`
    )
    this.addSql(
      `alter table if exists "revenue_source" add column if not exists "config" jsonb null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "revenue_source" drop column if exists "provider";`
    )
    this.addSql(
      `alter table if exists "revenue_source" drop column if exists "category";`
    )
    this.addSql(
      `alter table if exists "revenue_source" drop column if exists "config";`
    )
  }
}
