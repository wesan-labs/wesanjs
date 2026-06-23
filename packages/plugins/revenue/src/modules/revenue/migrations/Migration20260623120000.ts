import { Migration } from "@medusajs/framework/mikro-orm/migrations"

// revenue_metric_snapshot: +ad_impressions (eCPM = gelir/gösterim*1000 hesaplanır).
export class Migration20260623120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "revenue_metric_snapshot" add column if not exists "ad_impressions" integer not null default 0;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "revenue_metric_snapshot" drop column if exists "ad_impressions";`
    )
  }
}
