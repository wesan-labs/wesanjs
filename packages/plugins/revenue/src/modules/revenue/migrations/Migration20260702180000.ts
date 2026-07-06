import { Migration } from "@medusajs/framework/mikro-orm/migrations"

// Expense invoice metadata for finance workflow (vendor, number, receipt URL).
export class Migration20260702180000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "revenue_expense" add column if not exists "vendor" text null;`
    )
    this.addSql(
      `alter table if exists "revenue_expense" add column if not exists "invoice_number" text null;`
    )
    this.addSql(
      `alter table if exists "revenue_expense" add column if not exists "invoice_url" text null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "revenue_expense" drop column if exists "vendor";`
    )
    this.addSql(
      `alter table if exists "revenue_expense" drop column if exists "invoice_number";`
    )
    this.addSql(
      `alter table if exists "revenue_expense" drop column if exists "invoice_url";`
    )
  }
}
