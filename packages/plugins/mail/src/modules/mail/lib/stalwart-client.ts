// Verified against Stalwart 0.16.9. See ../../../docs/stalwart-envelopes.md for the
// captured request/response shapes this client encodes.

const CORE = "urn:ietf:params:jmap:core";
const MGMT = "urn:stalwart:jmap";
const MAIL = "urn:ietf:params:jmap:mail";
const SUBMISSION = "urn:ietf:params:jmap:submission";

export type StalwartConfig = {
  baseUrl: string; // e.g. http://localhost:8080
  adminUser: string; // e.g. admin@helm.local
  adminSecret: string;
  domain: string; // e.g. helm.local
};

type FetchFn = typeof fetch;

type MgmtContext = { accountId: string; domainId: string };

class StalwartClient {
  private ctx_: MgmtContext | null = null;

  constructor(private cfg: StalwartConfig, private fetchFn: FetchFn = fetch) {}

  private basic(user: string, secret: string): string {
    return "Basic " + Buffer.from(`${user}:${secret}`).toString("base64");
  }

  private adminHeader(): string {
    return this.basic(this.cfg.adminUser, this.cfg.adminSecret);
  }

  private async session(authHeader: string): Promise<any> {
    const res = await this.fetchFn(`${this.cfg.baseUrl}/jmap/session`, {
      headers: { Authorization: authHeader },
    });
    if (!res.ok) {
      throw new Error(`Stalwart session request failed: ${res.status}`);
    }
    return res.json();
  }

  private async jmap(authHeader: string, using: string[], methodCalls: unknown[]): Promise<any> {
    const res = await this.fetchFn(`${this.cfg.baseUrl}/jmap`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({ using, methodCalls }),
    });
    if (!res.ok) {
      throw new Error(`Stalwart JMAP request failed: ${res.status}`);
    }
    return res.json();
  }

  // Resolve + cache the management accountId and the configured domain's id.
  private async mgmtContext(): Promise<MgmtContext> {
    if (this.ctx_) {
      return this.ctx_;
    }
    const session = await this.session(this.adminHeader());
    const accountId = session.primaryAccounts?.[MGMT];
    if (!accountId) {
      throw new Error("Stalwart: no management account in session (urn:stalwart:jmap)");
    }
    const out = await this.jmap(this.adminHeader(), [CORE, MGMT], [
      ["x:Domain/query", { accountId }, "0"],
      ["x:Domain/get", { accountId, "#ids": { resultOf: "0", name: "x:Domain/query", path: "/ids" } }, "1"],
    ]);
    const domains: any[] = out.methodResponses?.[1]?.[1]?.list ?? [];
    const domain = domains.find((d) => d.name === this.cfg.domain);
    if (!domain) {
      throw new Error(`Stalwart: domain ${this.cfg.domain} not found`);
    }
    this.ctx_ = { accountId, domainId: domain.id };
    return this.ctx_;
  }

  // Create an individual user mailbox. Password must be strong (server runs zxcvbn).
  async createIndividual(input: {
    localPart: string;
    description: string;
    password: string;
  }): Promise<{ accountId: string; email: string }> {
    const { accountId, domainId } = await this.mgmtContext();
    const out = await this.jmap(this.adminHeader(), [CORE, MGMT], [
      ["x:Account/set", { accountId, create: { "new-0": {
        "@type": "User",
        credentials: { "0": { "@type": "Password", secret: input.password } },
        domainId,
        encryptionAtRest: { "@type": "Disabled" },
        locale: "en_US",
        name: input.localPart,
        permissions: { "@type": "Inherit" },
        roles: { "@type": "User" },
      } } }, "0"],
    ]);
    const result = out.methodResponses?.[0]?.[1];
    const created = result?.created?.["new-0"];
    if (!created?.id) {
      const err = result?.notCreated?.["new-0"];
      throw new Error(`Stalwart createIndividual failed: ${err?.description ?? JSON.stringify(result)}`);
    }
    return { accountId: created.id, email: `${input.localPart}@${this.cfg.domain}` };
  }

  // Create a shared/functional mailbox (a Group principal).
  async createGroup(input: {
    localPart: string;
    description: string;
  }): Promise<{ groupId: string; email: string }> {
    const { accountId, domainId } = await this.mgmtContext();
    const out = await this.jmap(this.adminHeader(), [CORE, MGMT], [
      ["x:Account/set", { accountId, create: { "g0": {
        "@type": "Group",
        name: input.localPart,
        domainId,
        description: input.description,
      } } }, "0"],
    ]);
    const result = out.methodResponses?.[0]?.[1];
    const created = result?.created?.["g0"];
    if (!created?.id) {
      const err = result?.notCreated?.["g0"];
      throw new Error(`Stalwart createGroup failed: ${err?.description ?? JSON.stringify(result)}`);
    }
    return { groupId: created.id, email: `${input.localPart}@${this.cfg.domain}` };
  }

  // Run mail/submission methods AS a given user — the inbox proxy path. The user's
  // own credentials scope JMAP to their own + shared mailboxes (server-enforced).
  async jmapAs(userEmail: string, password: string, methodCalls: unknown[]): Promise<any> {
    return this.jmap(this.basic(userEmail, password), [CORE, MAIL, SUBMISSION], methodCalls);
  }

  // The user's own mail accountId (for building Mailbox/get, Email/query, ...).
  async userMailAccountId(userEmail: string, password: string): Promise<string> {
    const session = await this.session(this.basic(userEmail, password));
    const id = session.primaryAccounts?.[MAIL];
    if (!id) {
      throw new Error("Stalwart: no mail account for user");
    }
    return id;
  }
}

export default StalwartClient;
