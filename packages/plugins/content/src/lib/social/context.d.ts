import type { MedusaContainer } from "@medusajs/framework/types";
export type SocialRuntimeContext = {
    apiKey: string;
    profileId: string;
};
export declare const platformZernioApiKey: () => string | null;
/** Platform key (Model A) or tenant BYOK secret from content_connection. */
export declare const resolveApiKeyForTenant: (container: MedusaContainer, tenantId: string) => Promise<string | null>;
/**
 * Tenant-scoped Zernio profile (Model A). Lazy-provisions on first social call.
 * Without tenant_id (legacy dev), uses the platform default profile.
 */
export declare const resolveSocialContext: (container: MedusaContainer, tenantId?: string | null) => Promise<SocialRuntimeContext | null>;
//# sourceMappingURL=context.d.ts.map