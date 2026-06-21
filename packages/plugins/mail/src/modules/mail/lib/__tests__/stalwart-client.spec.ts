import StalwartClient from "../stalwart-client";

const cfg = {
  baseUrl: "http://x",
  adminUser: "admin@helm.local",
  adminSecret: "pw",
  domain: "helm.local",
};

// Mock fetch: routes /jmap/session and /jmap (by first method name) to canned responses.
function mockFetch(responders: Record<string, any>) {
  const calls: any[] = [];
  const fn = async (url: string, init?: any) => {
    const body = init?.body ? JSON.parse(init.body) : null;
    calls.push({ url, body, headers: init?.headers });
    const key = url.endsWith("/session")
      ? "session"
      : body?.methodCalls?.[0]?.[0] ?? "unknown";
    return { ok: true, status: 200, json: async () => responders[key] };
  };
  return { fn, calls };
}

const domainResolve = {
  methodResponses: [
    ["x:Domain/query", { ids: ["b"] }, "0"],
    ["x:Domain/get", { list: [{ id: "b", name: "helm.local" }] }, "1"],
  ],
};

describe("StalwartClient", () => {
  it("createIndividual sends the verified x:Account/set envelope and returns id + email", async () => {
    const { fn, calls } = mockFetch({
      session: { primaryAccounts: { "urn:stalwart:jmap": "b" } },
      "x:Domain/query": domainResolve,
      "x:Account/set": {
        methodResponses: [["x:Account/set", { created: { "new-0": { id: "c" } } }, "0"]],
      },
    });
    const c = new StalwartClient(cfg, fn as any);
    const res = await c.createIndividual({
      localPart: "ali.veli",
      description: "Ali Veli",
      password: "Str0ng-Pass-River-92",
    });

    expect(res).toEqual({ accountId: "c", email: "ali.veli@helm.local" });

    const set = calls.find((x) => x.body?.methodCalls?.[0]?.[0] === "x:Account/set");
    expect(set.body.using).toEqual([
      "urn:ietf:params:jmap:core",
      "urn:stalwart:jmap",
    ]);
    const create = set.body.methodCalls[0][1].create["new-0"];
    expect(create).toMatchObject({
      "@type": "User",
      name: "ali.veli",
      domainId: "b",
      credentials: { "0": { "@type": "Password", secret: "Str0ng-Pass-River-92" } },
      roles: { "@type": "User" },
      permissions: { "@type": "Inherit" },
      encryptionAtRest: { "@type": "Disabled" },
    });
  });

  it("createGroup sends @type Group with no roles property", async () => {
    const { fn, calls } = mockFetch({
      session: { primaryAccounts: { "urn:stalwart:jmap": "b" } },
      "x:Domain/query": domainResolve,
      "x:Account/set": {
        methodResponses: [["x:Account/set", { created: { g0: { id: "d" } } }, "0"]],
      },
    });
    const c = new StalwartClient(cfg, fn as any);
    const res = await c.createGroup({ localPart: "support", description: "Support" });

    expect(res).toEqual({ groupId: "d", email: "support@helm.local" });
    const set = calls.find((x) => x.body?.methodCalls?.[0]?.[0] === "x:Account/set");
    const create = set.body.methodCalls[0][1].create["g0"];
    expect(create).toMatchObject({
      "@type": "Group",
      name: "support",
      domainId: "b",
      description: "Support",
    });
    expect(create.roles).toBeUndefined();
  });

  it("surfaces notCreated errors from Stalwart", async () => {
    const { fn } = mockFetch({
      session: { primaryAccounts: { "urn:stalwart:jmap": "b" } },
      "x:Domain/query": domainResolve,
      "x:Account/set": {
        methodResponses: [["x:Account/set", {
          notCreated: { "new-0": { type: "invalidProperties", description: "Password is too weak" } },
        }, "0"]],
      },
    });
    const c = new StalwartClient(cfg, fn as any);
    await expect(
      c.createIndividual({ localPart: "ali.veli", description: "Ali", password: "weak" })
    ).rejects.toThrow(/too weak/);
  });

  it("jmapAs authenticates as the user with mail capabilities", async () => {
    const { fn, calls } = mockFetch({
      "Mailbox/get": { methodResponses: [["Mailbox/get", { list: [] }, "0"]] },
    });
    const c = new StalwartClient(cfg, fn as any);
    await c.jmapAs("ali.veli@helm.local", "userpass", [["Mailbox/get", { accountId: "c" }, "0"]]);

    const call = calls[0];
    expect(call.body.using).toContain("urn:ietf:params:jmap:mail");
    const expected = "Basic " + Buffer.from("ali.veli@helm.local:userpass").toString("base64");
    expect(call.headers.Authorization).toBe(expected);
  });
});
