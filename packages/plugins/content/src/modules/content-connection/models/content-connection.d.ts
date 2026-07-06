/** Per-tenant integration row — social profile id, optional BYOK secrets. */
declare const ContentConnection: import("@medusajs/framework/utils").DmlEntity<import("@medusajs/framework/utils").DMLEntitySchemaBuilder<{
    id: import("@medusajs/framework/utils").PrimaryKeyModifier<string, import("@medusajs/framework/utils").IdProperty>;
    tenant_id: import("@medusajs/framework/utils").TextProperty;
    provider: import("@medusajs/framework/utils").TextProperty;
    category: import("@medusajs/framework/utils").TextProperty;
    config: import("@medusajs/framework/utils").NullableModifier<Record<string, unknown>, import("@medusajs/framework/utils").JSONProperty>;
    secret_enc: import("@medusajs/framework/utils").NullableModifier<string, import("@medusajs/framework/utils").TextProperty>;
}>, "content_connection">;
export default ContentConnection;
//# sourceMappingURL=content-connection.d.ts.map