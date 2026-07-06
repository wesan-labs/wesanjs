"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
/** Per-tenant integration row — social profile id, optional BYOK secrets. */
const ContentConnection = utils_1.model.define("content_connection", {
    id: utils_1.model.id({ prefix: "cconn" }).primaryKey(),
    tenant_id: utils_1.model.text(),
    provider: utils_1.model.text(),
    category: utils_1.model.text().default("social"),
    config: utils_1.model.json().nullable(),
    secret_enc: utils_1.model.text().nullable(),
});
exports.default = ContentConnection;
//# sourceMappingURL=content-connection.js.map