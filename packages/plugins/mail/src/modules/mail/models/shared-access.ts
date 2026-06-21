import { model } from "@medusajs/framework/utils";

export default model
  .define(
    { tableName: "mail_shared_access", name: "MailSharedAccess" },
    {
      id: model.id({ prefix: "mail_acl" }).primaryKey(),
      shared_id: model.text(),
      user_id: model.text(),
    }
  )
  .indexes([
    { name: "IDX_shared_access_pair", on: ["shared_id", "user_id"], unique: true },
  ]);
