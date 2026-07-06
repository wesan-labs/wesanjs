"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
const content_connection_1 = __importDefault(require("./models/content-connection"));
class ContentConnectionModuleService extends (0, utils_1.MedusaService)({
    ContentConnection: content_connection_1.default,
}) {
}
exports.default = ContentConnectionModuleService;
//# sourceMappingURL=service.js.map