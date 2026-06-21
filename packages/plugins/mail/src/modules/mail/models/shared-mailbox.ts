import { model } from "@medusajs/framework/utils";

export default model
  .define(
    { tableName: "mail_shared_mailbox", name: "SharedMailbox" },
    {
      id: model.id({ prefix: "mail_shared" }).primaryKey(),
      local_part: model.text(),
      address: model.text(),
      stalwart_id: model.text().nullable(),
    }
  )
  .indexes([
    { name: "IDX_shared_local_part", on: ["local_part"], unique: true },
  ]);
