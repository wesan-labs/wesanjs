import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260706160000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE IF EXISTS "revenue_app" ADD COLUMN IF NOT EXISTS "vertical" text NOT NULL DEFAULT 'mobile_app';`
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "revenue_app" ADD COLUMN IF NOT EXISTS "runtime" text NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `ALTER TABLE IF EXISTS "revenue_app" DROP COLUMN IF EXISTS "runtime";`
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "revenue_app" DROP COLUMN IF EXISTS "vertical";`
    )
  }
}
