import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260707140000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "product_3d_asset" ("id" text not null, "tenant_id" text null, "brand_id" text null, "source" text not null, "inputs" jsonb not null, "mesh_url" text null, "thumbnail_url" text null, "provider" text not null, "provider_task_id" text null, "status" text not null, "error" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_3d_asset_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_3d_asset_deleted_at" ON "product_3d_asset" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_3d_asset" cascade;`);
  }

}
