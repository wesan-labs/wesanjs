import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260625031250 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "content_item" ("id" text not null, "kind" text not null, "title" text null, "value" text not null, "language" text null, "platform" text null, "prompt_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "content_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_content_item_deleted_at" ON "content_item" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "content_item" cascade;`);
  }

}
