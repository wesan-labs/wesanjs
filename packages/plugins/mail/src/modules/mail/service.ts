import { MedusaError, MedusaService } from "@medusajs/framework/utils";
import type { DAL } from "@medusajs/framework/types";
import { MailAccount, SharedMailbox, MailSharedAccess } from "./models";
import StalwartClient from "./lib/stalwart-client";
import { buildLocalPart } from "./lib/local-part";
import { encryptSecret, decryptSecret } from "./lib/crypto";
import { generateStrongPassword } from "./lib/password";
import { putRevealOnce } from "./lib/reveal-store";
import type { MailModuleOptions } from "../../types";

type InjectedDependencies = {
  baseRepository: DAL.RepositoryService;
};

class MailModuleService extends MedusaService({
  MailAccount,
  SharedMailbox,
  MailSharedAccess,
}) {
  protected options_: MailModuleOptions;
  protected client_: StalwartClient;

  constructor(deps: InjectedDependencies, options: MailModuleOptions) {
    super(...arguments);
    this.options_ = options;
    this.client_ = new StalwartClient({
      baseUrl: options.stalwart.baseUrl,
      adminUser: options.stalwart.adminUser,
      adminSecret: options.stalwart.adminSecret,
      domain: options.domain,
    });
  }

  // Exposed for the JMAP proxy route (forwards methodCalls AS the logged-in user).
  get client(): StalwartClient {
    return this.client_;
  }

  // Idempotent: one mailbox per staff user. Generates ad.soyad@domain, provisions on
  // Stalwart, persists the mapping, and stashes the password for a one-time reveal.
  async provisionUserMailbox(input: {
    userId: string;
    firstName: string;
    lastName: string;
  }) {
    const existing = await this.listMailAccounts({ user_id: input.userId });
    if (existing.length) {
      return existing[0];
    }

    const all = await this.listMailAccounts({});
    const taken = new Set<string>(all.map((a) => a.local_part));
    const localPart = buildLocalPart(input.firstName, input.lastName, taken);
    const password = generateStrongPassword();
    const description = `${input.firstName} ${input.lastName}`.trim();

    const { accountId, email } = await this.client_.createIndividual({
      localPart,
      description,
      password,
    });

    const [account] = await this.createMailAccounts([
      {
        user_id: input.userId,
        local_part: localPart,
        address: email,
        stalwart_id: accountId,
        app_secret_enc: encryptSecret(password, this.options_.encryptionKey),
        status: "active",
      },
    ]);

    putRevealOnce(account.id, password);
    return account;
  }

  async suspendUserMailbox(userId: string): Promise<void> {
    const [account] = await this.listMailAccounts({ user_id: userId });
    if (!account) {
      return;
    }
    // NOTE: the Stalwart-side disable mechanism is still TBD (x:Account has no
    // `isEnabled`). For now we mark the account suspended locally so the proxy stops
    // handing out its credential; mail is preserved (no hard delete).
    await this.updateMailAccounts({ id: account.id, status: "suspended" });
  }

  async createSharedMailbox(localPart: string, description = "") {
    const { groupId, email } = await this.client_.createGroup({
      localPart,
      description,
    });
    const [shared] = await this.createSharedMailboxes([
      { local_part: localPart, address: email, stalwart_id: groupId },
    ]);
    return shared;
  }

  // The user's OWN Stalwart credential for the JMAP proxy. Never the admin credential —
  // this is what enforces the privacy boundary (each user sees only their own + shared).
  async getUserJmapCredential(
    userId: string
  ): Promise<{ email: string; password: string }> {
    const [account] = await this.listMailAccounts({ user_id: userId });
    if (!account?.app_secret_enc) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `No mailbox provisioned for user ${userId}`
      );
    }
    if (account.status === "suspended") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Mailbox is suspended for user ${userId}`
      );
    }
    return {
      email: account.address,
      password: decryptSecret(account.app_secret_enc, this.options_.encryptionKey),
    };
  }
}

export default MailModuleService;
