import type { MedusaContainer } from "@medusajs/framework/types";
/**
 * Ensure this tenant has a dedicated Zernio profile (Model A — one platform key,
 * many profiles). Idempotent: reuses stored profile id or creates via API.
 */
export declare function ensureZernioProfile(container: MedusaContainer, tenantId: string, apiKey: string): Promise<string | null>;
//# sourceMappingURL=provision.d.ts.map