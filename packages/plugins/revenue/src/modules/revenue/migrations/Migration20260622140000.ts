import { Migration } from "@medusajs/framework/mikro-orm/migrations"

// revenue_source: +secret_enc (UI'dan girilen secret'ın AES şifreli hali).
export class Migration20260622140000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "revenue_source" add column if not exists "secret_enc" text null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "revenue_source" drop column if exists "secret_enc";`
    )
  }
}
