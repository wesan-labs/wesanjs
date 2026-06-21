import { model } from "@medusajs/framework/utils";

export default model
  .define(
    { tableName: "mail_account", name: "MailAccount" },
    {
      id: model.id({ prefix: "mail_acc" }).primaryKey(),
      user_id: model.text(), // Medusa admin User id
      local_part: model.text(),
      address: model.text(),
      stalwart_id: model.text().nullable(),
      app_secret_enc: model.text().nullable(), // encrypted app-password for JMAP proxy
      status: model.enum(["active", "pending", "suspended"]).default("pending"),
    }
  )
  .indexes([
    { name: "IDX_mail_account_user_id", on: ["user_id"], unique: true },
    { name: "IDX_mail_account_local_part", on: ["local_part"], unique: true },
  ]);
