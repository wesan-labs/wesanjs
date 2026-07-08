import { Migration } from "@medusajs/framework/mikro-orm/migrations";

/** Ürün-bazlı kütüphane klasörleme anahtarı — additive, nullable. */
export class Migration20260709100000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_3d_asset" add column if not exists "product_ref" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_3d_asset" drop column if exists "product_ref";`);
  }

}
