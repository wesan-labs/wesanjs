"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSocialContext = exports.resolveApiKeyForTenant = exports.platformZernioApiKey = void 0;
const crypto_1 = require("../crypto");
const content_connection_1 = require("../../modules/content-connection");
const provision_1 = require("./provision");
const platformZernioApiKey = () => {
    const v = process.env.ZERNIO_API_KEY || process.env.LATE_API_KEY || "";
    if (!v || v.includes("placeholder")) {
        return null;
    }
    return v;
};
exports.platformZernioApiKey = platformZernioApiKey;
/** Platform key (Model A) or tenant BYOK secret from content_connection. */
const resolveApiKeyForTenant = async (container, tenantId) => {
    const platform = (0, exports.platformZernioApiKey)();
    const connService = container.resolve(content_connection_1.CONTENT_CONNECTION_MODULE);
    const [row] = await connService.listContentConnections({
        tenant_id: tenantId,
        provider: "zernio",
    });
    if (row?.secret_enc) {
        try {
            const parsed = JSON.parse((0, crypto_1.decryptSecret)(row.secret_enc) || "{}");
            if (parsed.api_key?.trim()) {
                return parsed.api_key.trim();
            }
        }
        catch {
            /* fall through to platform */
        }
    }
    return platform;
};
exports.resolveApiKeyForTenant = resolveApiKeyForTenant;
/**
 * Tenant-scoped Zernio profile (Model A). Lazy-provisions on first social call.
 * Without tenant_id (legacy dev), uses the platform default profile.
 */
const resolveSocialContext = async (container, tenantId) => {
    const apiKey = tenantId
        ? await (0, exports.resolveApiKeyForTenant)(container, tenantId)
        : (0, exports.platformZernioApiKey)();
    if (!apiKey) {
        return null;
    }
    if (!tenantId) {
        const profileId = await fetchDefaultProfileId(apiKey);
        return profileId ? { apiKey, profileId } : null;
    }
    const profileId = await (0, provision_1.ensureZernioProfile)(container, tenantId, apiKey);
    return profileId ? { apiKey, profileId } : null;
};
exports.resolveSocialContext = resolveSocialContext;
async function fetchDefaultProfileId(apiKey) {
    const base = process.env.SOCIAL_API_BASE || "https://zernio.com/api/v1";
    const res = await fetch(`${base}/profiles`, {
        headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
        return null;
    }
    const data = (await res.json());
    const list = data.profiles || [];
    const p = list.find((x) => x.isDefault) || list[0];
    return p?._id ?? null;
}
//# sourceMappingURL=context.js.map