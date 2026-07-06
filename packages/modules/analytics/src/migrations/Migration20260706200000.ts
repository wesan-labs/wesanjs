import { Migration } from "@medusajs/framework/mikro-orm/migrations"

// Medusa bigNumber() expects companion raw_<field> jsonb column.
export class Migration20260706200000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "analytics_metric_snapshot"
      ADD COLUMN IF NOT EXISTS "raw_value" jsonb NOT NULL
      DEFAULT '{"value":"0","precision":20}';
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "analytics_metric_snapshot"
      DROP COLUMN IF EXISTS "raw_value";
    `)
  }
}
