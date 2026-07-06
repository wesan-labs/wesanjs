declare const ContentConnectionModuleService_base: import("@medusajs/framework/utils").MedusaServiceReturnType<import("@medusajs/framework/utils").ModelConfigurationsToConfigTemplate<{
    readonly ContentConnection: import("@medusajs/framework/utils").DmlEntity<import("@medusajs/framework/utils").DMLEntitySchemaBuilder<{
        id: import("@medusajs/framework/utils").PrimaryKeyModifier<string, import("@medusajs/framework/utils").IdProperty>;
        tenant_id: import("@medusajs/framework/utils").TextProperty;
        provider: import("@medusajs/framework/utils").TextProperty;
        category: import("@medusajs/framework/utils").TextProperty;
        config: import("@medusajs/framework/utils").NullableModifier<Record<string, unknown>, import("@medusajs/framework/utils").JSONProperty>;
        secret_enc: import("@medusajs/framework/utils").NullableModifier<string, import("@medusajs/framework/utils").TextProperty>;
    }>, "content_connection">;
}>>;
declare class ContentConnectionModuleService extends ContentConnectionModuleService_base {
}
export default ContentConnectionModuleService;
//# sourceMappingURL=service.d.ts.map