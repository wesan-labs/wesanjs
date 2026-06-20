export const MailModule = "mail";

export type MailModuleOptions = {
  domain: string; // e.g. "helm.local"
  stalwart: {
    jmapUrl: string;     // http://localhost:8080/jmap
    adminUser: string;   // from env
    adminSecret: string; // from env
  };
  encryptionKey: string; // 32-byte hex, for app_secret_enc
};
