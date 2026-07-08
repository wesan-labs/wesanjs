import { Migration } from "@medusajs/framework/mikro-orm/migrations";

/** Kütüphanede ürün-bazlı gruplama — additive, nullable. */
export class Migration20260709100001 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "content_item" add column if not exists "product_ref" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "content_item" drop column if exists "product_ref";`);
  }

}
