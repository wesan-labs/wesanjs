"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptSecret = encryptSecret;
exports.decryptSecret = decryptSecret;
const crypto_1 = __importDefault(require("crypto"));
const keyFrom = () => {
    const seed = process.env.REVENUE_SECRET_KEY ||
        process.env.JWT_SECRET ||
        process.env.COOKIE_SECRET ||
        "revenue-dev-key";
    return crypto_1.default.scryptSync(seed, "revenue-secret-salt", 32);
};
function encryptSecret(plain) {
    const iv = crypto_1.default.randomBytes(12);
    const cipher = crypto_1.default.createCipheriv("aes-256-gcm", keyFrom(), iv);
    const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}
function decryptSecret(blob) {
    if (!blob) {
        return null;
    }
    try {
        const [ivb, tagb, encb] = blob.split(":");
        const decipher = crypto_1.default.createDecipheriv("aes-256-gcm", keyFrom(), Buffer.from(ivb, "base64"));
        decipher.setAuthTag(Buffer.from(tagb, "base64"));
        return Buffer.concat([
            decipher.update(Buffer.from(encb, "base64")),
            decipher.final(),
        ]).toString("utf8");
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=crypto.js.map