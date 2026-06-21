import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260621111609 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "revenue_metric_snapshot" add column if not exists "new_customers" integer not null default 0;`);
    this.addSql(`alter table if exists "revenue_metric_snapshot" add column if not exists "active_users" integer not null default 0;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "revenue_metric_snapshot" drop column if exists "new_customers";`);
    this.addSql(`alter table if exists "revenue_metric_snapshot" drop column if exists "active_users";`);
  }

}
