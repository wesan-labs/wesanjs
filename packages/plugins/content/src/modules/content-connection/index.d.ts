import ContentConnectionModuleService from "./service";
export declare const CONTENT_CONNECTION_MODULE = "contentConnection";
declare const _default: import("@medusajs/types").ModuleExports<typeof ContentConnectionModuleService> & {
    linkable: {
        readonly contentConnection: {
            id: {
                serviceName: "contentConnection";
                field: "contentConnection";
                linkable: "content_connection_id";
                primaryKey: "id";
            };
            toJSON: () => {
                serviceName: "contentConnection";
                field: "contentConnection";
                linkable: "content_connection_id";
                primaryKey: "id";
            };
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map