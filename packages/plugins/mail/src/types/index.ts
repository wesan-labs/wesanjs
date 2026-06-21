export const MailModule = "mail";

export type MailModuleOptions = {
  domain: string; // e.g. "helm.local"
  stalwart: {
    baseUrl: string;     // http://localhost:8080 (StalwartClient appends /jmap)
    adminUser: string;   // admin@helm.local — from env
    adminSecret: string; // from env (STALWART_ADMIN_PASSWORD)
  };
  encryptionKey: string; // 32-byte hex, for app_secret_enc
};
