import { Migration } from "@medusajs/framework/mikro-orm/migrations";

/**
 * Pipeline (Flux2→Seedance→SeeDVR) alanları — additive, hepsi nullable.
 * Eski Tripo kolonları (mesh_url, provider_task_id) korunur (backward-compat).
 */
export class Migration20260708120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_3d_asset" add column if not exists "pipeline_step" text null;`);
    this.addSql(`alter table if exists "product_3d_asset" add column if not exists "step_job_id" text null;`);
    this.addSql(`alter table if exists "product_3d_asset" add column if not exists "step_poll_url" text null;`);
    this.addSql(`alter table if exists "product_3d_asset" add column if not exists "hero_url" text null;`);
    this.addSql(`alter table if exists "product_3d_asset" add column if not exists "video_url" text null;`);
    this.addSql(`alter table if exists "product_3d_asset" add column if not exists "turntable_urls" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_3d_asset" drop column if exists "pipeline_step";`);
    this.addSql(`alter table if exists "product_3d_asset" drop column if exists "step_job_id";`);
    this.addSql(`alter table if exists "product_3d_asset" drop column if exists "step_poll_url";`);
    this.addSql(`alter table if exists "product_3d_asset" drop column if exists "hero_url";`);
    this.addSql(`alter table if exists "product_3d_asset" drop column if exists "video_url";`);
    this.addSql(`alter table if exists "product_3d_asset" drop column if exists "turntable_urls";`);
  }

}
