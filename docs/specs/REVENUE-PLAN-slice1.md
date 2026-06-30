# Revenue Slice 1 (RevenueCat) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working `revenue` plugin that shows REAL MRR + active subscriptions + 28-day revenue from RevenueCat, plus manual expenses and a NET figure, with one real chart — gated by `revenue:read`.

**Architecture:** New full-stack Medusa v2 plugin at `wesanjs/packages/plugins/revenue` (copied from `loyalty`), composed into the running host app `helm` via `medusa-config.js` `plugins[]`. A canonical ledger (`revenue_event` + `metric_snapshot` + `expense` + `revenue_source`) is fed by a provider-agnostic Connector SPI; Slice 1 implements only the RevenueCat connector (daily metrics pull + inbound webhook). UI is plugin-injected into the standalone vite dashboard via `@medusajs/admin-vite-plugin`.

**Tech Stack:** Medusa 2.15.5, Bun/Node ≥20, MikroORM (via `model.define`), React 18.3.1, @tanstack/react-query, @medusajs/ui 4.1.15, recharts 2.x, Postgres.

## Global Constraints

- Versions pinned to the fork: `@medusajs/*` = **2.15.5**, `@medusajs/ui` = **4.1.15**, React **18.3.1**, react-router-dom **6.30.4** (copy from `packages/plugins/loyalty/package.json`).
- Money fields use **`model.bigNumber()`** (Medusa money convention — arbitrary precision, NOT float, NOT integer cents). Matches `loyalty/.../models/gift-card.ts:9`.
- Reporting currency = **existing store default currency** (read from settings/store; do not invent a new setting). Slice 1: store RevenueCat's `currency` as-is; FX only when source≠default (later phase).
- **Idempotency is structural:** every ingested event carries `(source_id, external_id)` with a UNIQUE index; all writes are upserts on that key.
- Commits: **conventional, single line, scope `revenue`**, e.g. `feat(revenue): scaffold plugin`. **No `Co-Authored-By` trailer. No `--no-verify`.** (Matches the repo's git log style; no WES-XXX — this fork uses Medusa-style commits.)
- Testing: **implementation-first**, NOT test-first. Write tests ONLY for critical logic (connector mapping, idempotent upsert, net calculation). Everything else is verified by booting the app / curl / DB inspection. (Per CLAUDE.md: no test-first, no test obsession.)
- Do NOT touch `packages/{core,modules,admin,design-system}` except: add `recharts` to `dashboard/package.json`, set the dashboard inject env, and remove the hardcoded `/revenue` stub (Task 9). Everything else is new files in the plugin.
- RevenueCat V2 REST: base `https://api.revenuecat.com/v2`, auth `Authorization: Bearer <secret key>`. Overview metrics: `GET /projects/{project_id}/metrics/overview`. ⚠️ Exact metric `id` casing must be confirmed against the live API response on first run (code maps defensively by id).

---

### Task 1: Scaffold plugin + register in helm (boots empty)

**Files:**
- Create: `packages/plugins/revenue/package.json`
- Create: `packages/plugins/revenue/tsconfig.json`
- Create: `packages/plugins/revenue/src/modules/revenue/index.ts`
- Create: `packages/plugins/revenue/src/modules/revenue/service.ts`
- Create: `packages/plugins/revenue/src/modules/revenue/types.ts`
- Modify: `helm/package.json` (add dep)
- Modify: `helm/medusa-config.js` (add `plugins[]`)
- Modify: `helm/.env` (RevenueCat keys — placeholder values OK for boot)

**Interfaces:**
- Produces: module key string `"revenue"`; `RevenueModuleService` (default export); enums `RevenueSourceType`, `RevenueEventKind`.

- [ ] **Step 1: Copy the plugin boilerplate from loyalty**

Copy `packages/plugins/loyalty/package.json` → `packages/plugins/revenue/package.json` and `packages/plugins/loyalty/tsconfig.json` → `packages/plugins/revenue/tsconfig.json`. In the new `package.json` change only:
- `"name": "@medusajs/revenue-plugin"`
- `"description": "Wesan Plugin: Revenue — subscription & ad monetization aggregation"`
- In `exports`, replace the loyalty/store-credit module lines with:
```json
"./modules/revenue": "./.medusa/server/src/modules/revenue/index.js",
"./.medusa/server/src/modules/revenue": "./.medusa/server/src/modules/revenue/index.js",
```
Keep `scripts`, `files`, `devDependencies`, `peerDependencies`, `engines`, `packageManager` identical to loyalty.

- [ ] **Step 2: Define module enums/types**

`packages/plugins/revenue/src/modules/revenue/types.ts`:
```ts
export enum RevenueSourceType {
  REVENUECAT = "revenuecat",
  STRIPE = "stripe",
  PADDLE = "paddle",
  IYZICO = "iyzico",
  MANUAL = "manual",
}

export enum RevenueEventKind {
  SUBSCRIPTION_INITIAL = "subscription_initial",
  SUBSCRIPTION_RENEWAL = "subscription_renewal",
  ONE_TIME = "one_time",
  REFUND = "refund",
  AD_EARNING = "ad_earning",
}

export enum ExpenseCategory {
  INFRA = "infra",
  API = "api",
  ADS = "ads",
  OTHER = "other",
}

export const REVENUE_MODULE = "revenue"
```

- [ ] **Step 3: Module index + empty service**

`src/modules/revenue/index.ts`:
```ts
import { Module } from "@medusajs/framework/utils"
import RevenueModuleService from "./service"
import { REVENUE_MODULE } from "./types"

export default Module(REVENUE_MODULE, {
  service: RevenueModuleService,
})
```

`src/modules/revenue/service.ts` (models added in Task 2; empty map for now):
```ts
import { MedusaService } from "@medusajs/framework/utils"

class RevenueModuleService extends MedusaService({}) {}

export default RevenueModuleService
```

- [ ] **Step 4: Register the plugin in helm**

In `helm/package.json` add under both `dependencies` and `overrides`:
```json
"@medusajs/revenue-plugin": "file:../wesanjs/packages/plugins/revenue"
```
In `helm/medusa-config.js`, add a top-level `plugins` array inside `defineConfig({...})` (sibling of `projectConfig`):
```js
  plugins: [
    { resolve: "@medusajs/revenue-plugin", options: {} },
  ],
```
In `helm/.env` append:
```
REVENUECAT_API_KEY=sk_placeholder
REVENUECAT_PROJECT_ID=proj_placeholder
REVENUECAT_WEBHOOK_SECRET=whsec_placeholder
```

- [ ] **Step 5: Build plugin + boot host**

Run:
```bash
cd /Users/canakyuz/Developer/wesan/levios/wesanjs/packages/plugins/revenue && yarn build
cd /Users/canakyuz/Developer/wesan/levios/helm && yarn install && yarn dev
```
Expected: `medusa develop` starts with no errors; logs show the `revenue` module loaded. (If `yarn build` needs deps, run `yarn install` in the plugin dir first.)

- [ ] **Step 6: Commit**

```bash
git add packages/plugins/revenue && git commit -m "feat(revenue): scaffold plugin and register in helm host"
```

---

### Task 2: Canonical models + migrations

**Files:**
- Create: `src/modules/revenue/models/revenue-source.ts`
- Create: `src/modules/revenue/models/revenue-event.ts`
- Create: `src/modules/revenue/models/expense.ts`
- Create: `src/modules/revenue/models/metric-snapshot.ts`
- Modify: `src/modules/revenue/service.ts`

**Interfaces:**
- Produces: models `RevenueSource`, `RevenueEvent`, `Expense`, `MetricSnapshot`; service now exposes generated CRUD (`createRevenueEvents`, `listRevenueEvents`, `createExpenses`, `listExpenses`, `listMetricSnapshots`, `createRevenueSources`, etc. — Medusa auto-generates `<verb><Model>s` from the model map).

- [ ] **Step 1: revenue_source model** — `models/revenue-source.ts`:
```ts
import { model } from "@medusajs/framework/utils"
import { RevenueSourceType } from "../types"

export default model.define(
  { tableName: "revenue_source", name: "RevenueSource" },
  {
    id: model.id({ prefix: "rsrc" }).primaryKey(),
    type: model.enum(RevenueSourceType),
    name: model.text(),
    status: model.text().default("active"),
    credentials_ref: model.text().nullable(),
    last_synced_at: model.dateTime().nullable(),
    last_cursor: model.text().nullable(),
    last_error: model.text().nullable(),
    metadata: model.json().nullable(),
  }
)
```

- [ ] **Step 2: revenue_event model** — `models/revenue-event.ts`. Note the composite unique index for idempotency:
```ts
import { model } from "@medusajs/framework/utils"
import { RevenueEventKind, RevenueSourceType } from "../types"

export default model
  .define(
    { tableName: "revenue_event", name: "RevenueEvent" },
    {
      id: model.id({ prefix: "revt" }).primaryKey(),
      source_id: model.text(),
      source_type: model.enum(RevenueSourceType),
      external_id: model.text(),
      app_id: model.text().nullable(),
      kind: model.enum(RevenueEventKind),
      status: model.text().default("completed"),
      gross_amount: model.bigNumber(),
      net_amount: model.bigNumber().nullable(),
      currency: model.text(),
      reporting_amount: model.bigNumber().nullable(),
      fx_rate: model.bigNumber().nullable(),
      occurred_at: model.dateTime(),
      raw_payload: model.json().nullable(),
    }
  )
  .indexes([
    { on: ["source_id", "external_id"], unique: true },
    { on: ["occurred_at"] },
    { on: ["kind"] },
  ])
```

- [ ] **Step 3: expense model** — `models/expense.ts`:
```ts
import { model } from "@medusajs/framework/utils"
import { ExpenseCategory } from "../types"

export default model.define(
  { tableName: "revenue_expense", name: "Expense" },
  {
    id: model.id({ prefix: "rexp" }).primaryKey(),
    app_id: model.text().nullable(),
    category: model.enum(ExpenseCategory).default(ExpenseCategory.OTHER),
    description: model.text(),
    amount: model.bigNumber(),
    currency: model.text(),
    reporting_amount: model.bigNumber().nullable(),
    occurred_at: model.dateTime(),
    recurring: model.boolean().default(false),
    created_by: model.text().nullable(),
  }
)
```

- [ ] **Step 4: metric_snapshot model** — `models/metric-snapshot.ts`:
```ts
import { model } from "@medusajs/framework/utils"

export default model
  .define(
    { tableName: "revenue_metric_snapshot", name: "MetricSnapshot" },
    {
      id: model.id({ prefix: "rsnap" }).primaryKey(),
      date: model.dateTime(),
      app_id: model.text().nullable(),
      source_type: model.text().nullable(),
      mrr: model.bigNumber().default(0),
      active_subscriptions: model.number().default(0),
      active_trials: model.number().default(0),
      gross_revenue: model.bigNumber().default(0),
      net_revenue: model.bigNumber().default(0),
      ad_revenue: model.bigNumber().default(0),
      expense_total: model.bigNumber().default(0),
      net_profit: model.bigNumber().default(0),
      currency: model.text(),
    }
  )
  .indexes([{ on: ["date", "app_id", "source_type"], unique: true }])
```

- [ ] **Step 5: Wire models into service** — `service.ts`:
```ts
import { MedusaService } from "@medusajs/framework/utils"
import RevenueSource from "./models/revenue-source"
import RevenueEvent from "./models/revenue-event"
import Expense from "./models/expense"
import MetricSnapshot from "./models/metric-snapshot"

class RevenueModuleService extends MedusaService({
  RevenueSource,
  RevenueEvent,
  Expense,
  MetricSnapshot,
}) {}

export default RevenueModuleService
```

- [ ] **Step 6: Generate + run migrations**

From the host app (helm), after rebuilding the plugin:
```bash
cd /Users/canakyuz/Developer/wesan/levios/wesanjs/packages/plugins/revenue && yarn build
cd /Users/canakyuz/Developer/wesan/levios/helm && npx medusa db:generate revenue && npx medusa db:migrate
```
Expected: a migration file is generated under `packages/plugins/revenue/src/modules/revenue/migrations/`, and `db:migrate` creates tables `revenue_source`, `revenue_event`, `revenue_expense`, `revenue_metric_snapshot`. Verify: `psql $DATABASE_URL -c "\dt revenue_*"` lists all four.
⚠️ If `db:generate revenue` doesn't resolve the plugin module, confirm the exact plugin-migration command via `npx medusa --help` / `npx medusa db:generate --help` and mirror how `loyalty` migrations were produced.

- [ ] **Step 7: Commit**
```bash
git add packages/plugins/revenue && git commit -m "feat(revenue): canonical ledger models and migrations"
```

---

### Task 3: Connector SPI + RevenueCat connector

**Files:**
- Create: `src/modules/revenue/connectors/types.ts`
- Create: `src/modules/revenue/connectors/revenuecat.ts`
- Test: `src/modules/revenue/connectors/__tests__/revenuecat.spec.ts`

**Interfaces:**
- Produces:
  - `type CanonicalEvent = { externalId: string; kind: RevenueEventKind; grossAmount: number; currency: string; occurredAt: Date; raw: unknown }`
  - `type ProviderMetrics = { mrr: number; activeSubscriptions: number; activeTrials: number; revenue28d: number; currency: string }`
  - `interface RevenueConnector { type: RevenueSourceType; fetchMetrics?(): Promise<ProviderMetrics>; parseWebhook?(body: unknown): CanonicalEvent[]; verifyWebhook?(headers: Record<string,string|undefined>, body: unknown): boolean }`
  - `class RevenueCatConnector implements RevenueConnector` with constructor `(opts: { apiKey: string; projectId: string; webhookSecret: string })`.

- [ ] **Step 1: SPI types** — `connectors/types.ts`:
```ts
import { RevenueEventKind, RevenueSourceType } from "../types"

export type CanonicalEvent = {
  externalId: string
  kind: RevenueEventKind
  grossAmount: number
  currency: string
  occurredAt: Date
  raw: unknown
}

export type ProviderMetrics = {
  mrr: number
  activeSubscriptions: number
  activeTrials: number
  revenue28d: number
  currency: string
}

export interface RevenueConnector {
  type: RevenueSourceType
  fetchMetrics?(): Promise<ProviderMetrics>
  parseWebhook?(body: unknown): CanonicalEvent[]
  verifyWebhook?(headers: Record<string, string | undefined>, body: unknown): boolean
}
```

- [ ] **Step 2: RevenueCat connector** — `connectors/revenuecat.ts`:
```ts
import { RevenueEventKind, RevenueSourceType } from "../types"
import { CanonicalEvent, ProviderMetrics, RevenueConnector } from "./types"

const RC_BASE = "https://api.revenuecat.com/v2"

// RevenueCat webhook event.type → our canonical kind
const KIND_MAP: Record<string, RevenueEventKind> = {
  INITIAL_PURCHASE: RevenueEventKind.SUBSCRIPTION_INITIAL,
  RENEWAL: RevenueEventKind.SUBSCRIPTION_RENEWAL,
  NON_RENEWING_PURCHASE: RevenueEventKind.ONE_TIME,
  CANCELLATION: RevenueEventKind.REFUND,
  REFUND: RevenueEventKind.REFUND,
}

export class RevenueCatConnector implements RevenueConnector {
  type = RevenueSourceType.REVENUECAT
  constructor(
    private opts: { apiKey: string; projectId: string; webhookSecret: string }
  ) {}

  async fetchMetrics(): Promise<ProviderMetrics> {
    const res = await fetch(
      `${RC_BASE}/projects/${this.opts.projectId}/metrics/overview`,
      { headers: { Authorization: `Bearer ${this.opts.apiKey}` } }
    )
    if (!res.ok) {
      throw new Error(`RevenueCat overview failed: ${res.status} ${await res.text()}`)
    }
    const body = (await res.json()) as { metrics?: Array<{ id: string; value: number; unit?: string }> }
    const byId = new Map((body.metrics ?? []).map((m) => [m.id, m]))
    const num = (id: string) => Number(byId.get(id)?.value ?? 0)
    // ⚠️ Confirm these metric ids against the first live response; adjust if cased differently.
    return {
      mrr: num("mrr"),
      activeSubscriptions: num("active_subscriptions"),
      activeTrials: num("active_trials"),
      revenue28d: num("revenue") || num("revenue_last_28_days"),
      currency: byId.get("mrr")?.unit ?? "USD",
    }
  }

  parseWebhook(body: unknown): CanonicalEvent[] {
    const e = (body as { event?: Record<string, any> })?.event
    if (!e || !e.id || !e.type) return []
    const kind = KIND_MAP[e.type]
    if (!kind) return []
    const isRefund = kind === RevenueEventKind.REFUND
    const price = Number(e.price ?? e.price_in_purchased_currency ?? 0)
    return [
      {
        externalId: String(e.id),
        kind,
        grossAmount: isRefund ? -Math.abs(price) : price,
        currency: String(e.currency ?? "USD"),
        occurredAt: new Date(Number(e.event_timestamp_ms ?? Date.now())),
        raw: body,
      },
    ]
  }

  verifyWebhook(headers: Record<string, string | undefined>): boolean {
    const auth = headers["authorization"] ?? headers["Authorization"]
    return !!this.opts.webhookSecret && auth === this.opts.webhookSecret
  }
}
```

- [ ] **Step 3: Critical-logic tests** — `connectors/__tests__/revenuecat.spec.ts`:
```ts
import { RevenueEventKind } from "../../types"
import { RevenueCatConnector } from "../revenuecat"

const c = new RevenueCatConnector({ apiKey: "k", projectId: "p", webhookSecret: "s" })

describe("RevenueCatConnector.parseWebhook", () => {
  it("maps RENEWAL to subscription_renewal with positive amount", () => {
    const out = c.parseWebhook({ event: { id: "e1", type: "RENEWAL", price: 9.99, currency: "USD", event_timestamp_ms: 1700000000000 } })
    expect(out).toHaveLength(1)
    expect(out[0].kind).toBe(RevenueEventKind.SUBSCRIPTION_RENEWAL)
    expect(out[0].grossAmount).toBe(9.99)
    expect(out[0].externalId).toBe("e1")
  })
  it("maps REFUND to negative amount", () => {
    const out = c.parseWebhook({ event: { id: "e2", type: "REFUND", price: 9.99, currency: "USD" } })
    expect(out[0].kind).toBe(RevenueEventKind.REFUND)
    expect(out[0].grossAmount).toBe(-9.99)
  })
  it("ignores unknown event types", () => {
    expect(c.parseWebhook({ event: { id: "e3", type: "TEST" } })).toHaveLength(0)
  })
})

describe("RevenueCatConnector.verifyWebhook", () => {
  it("accepts matching secret, rejects others", () => {
    expect(c.verifyWebhook({ authorization: "s" })).toBe(true)
    expect(c.verifyWebhook({ authorization: "x" })).toBe(false)
  })
})
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/canakyuz/Developer/wesan/levios/wesanjs && yarn jest packages/plugins/revenue --silent`
Expected: PASS (5 assertions). If the plugin has no jest config, copy `packages/plugins/loyalty/jest.config.js` (if present) or run via the root jest config.

- [ ] **Step 5: Commit**
```bash
git add packages/plugins/revenue && git commit -m "feat(revenue): connector SPI and RevenueCat connector"
```

---

### Task 4: Service business methods (idempotent record, snapshot, overview, expenses)

**Files:**
- Modify: `src/modules/revenue/service.ts`
- Test: `src/modules/revenue/__tests__/service-logic.spec.ts` (pure helpers only)
- Create: `src/modules/revenue/lib/overview.ts` (pure aggregation helper)

**Interfaces:**
- Produces on `RevenueModuleService`:
  - `recordEvents(sourceId: string, sourceType: RevenueSourceType, events: CanonicalEvent[]): Promise<number>` — idempotent upsert on `(source_id, external_id)`; returns count newly written.
  - `upsertDailySnapshot(input: { date: Date; metrics: ProviderMetrics; expenseTotal: number }): Promise<void>` — upsert on `(date, app_id=null, source_type=null)`.
  - `getOverview(): Promise<OverviewDTO>` where `OverviewDTO = { mrr: number; activeSubscriptions: number; revenue28d: number; expenseTotal: number; net: number; currency: string; recentEvents: RevenueEvent[]; mrrTrend: { date: string; mrr: number }[] }`.
- Produces pure helper: `computeNet(revenue28d: number, expenseTotal: number): number` in `lib/overview.ts`.

- [ ] **Step 1: Pure aggregation helper** — `lib/overview.ts`:
```ts
export function computeNet(revenue28d: number, expenseTotal: number): number {
  return Number((revenue28d - expenseTotal).toFixed(2))
}

export function sumAmounts(rows: { amount: number }[]): number {
  return Number(rows.reduce((acc, r) => acc + Number(r.amount), 0).toFixed(2))
}
```

- [ ] **Step 2: Service methods** — append to `service.ts` (inside the class). Uses the auto-generated `list*`/`create*`/`update*` from MedusaService:
```ts
  async recordEvents(sourceId, sourceType, events) {
    let written = 0
    for (const e of events) {
      const existing = await this.listRevenueEvents(
        { source_id: sourceId, external_id: e.externalId },
        { take: 1 }
      )
      if (existing.length) continue
      await this.createRevenueEvents({
        source_id: sourceId,
        source_type: sourceType,
        external_id: e.externalId,
        kind: e.kind,
        gross_amount: e.grossAmount,
        currency: e.currency,
        occurred_at: e.occurredAt,
        raw_payload: e.raw,
      })
      written++
    }
    return written
  }

  async upsertDailySnapshot({ date, metrics, expenseTotal }) {
    const day = new Date(date.toISOString().slice(0, 10))
    const existing = await this.listMetricSnapshots(
      { date: day, app_id: null, source_type: null },
      { take: 1 }
    )
    const data = {
      date: day,
      app_id: null,
      source_type: null,
      mrr: metrics.mrr,
      active_subscriptions: metrics.activeSubscriptions,
      active_trials: metrics.activeTrials,
      gross_revenue: metrics.revenue28d,
      net_revenue: metrics.revenue28d - expenseTotal,
      expense_total: expenseTotal,
      net_profit: metrics.revenue28d - expenseTotal,
      currency: metrics.currency,
    }
    if (existing.length) {
      await this.updateMetricSnapshots({ id: existing[0].id, ...data })
    } else {
      await this.createMetricSnapshots(data)
    }
  }

  async getOverview() {
    const snaps = await this.listMetricSnapshots(
      {},
      { order: { date: "DESC" }, take: 30 }
    )
    const latest = snaps[0]
    const expenses = await this.listExpenses({}, { take: 1000 })
    const expenseTotal = Number(
      expenses.reduce((a, e) => a + Number(e.amount), 0).toFixed(2)
    )
    const recentEvents = await this.listRevenueEvents(
      {},
      { order: { occurred_at: "DESC" }, take: 10 }
    )
    const revenue28d = latest ? Number(latest.gross_revenue) : 0
    return {
      mrr: latest ? Number(latest.mrr) : 0,
      activeSubscriptions: latest ? latest.active_subscriptions : 0,
      revenue28d,
      expenseTotal,
      net: Number((revenue28d - expenseTotal).toFixed(2)),
      currency: latest?.currency ?? "USD",
      recentEvents,
      mrrTrend: snaps
        .slice()
        .reverse()
        .map((s) => ({ date: s.date.toISOString().slice(0, 10), mrr: Number(s.mrr) })),
    }
  }
```
(Add the `CanonicalEvent`/`ProviderMetrics` type imports at the top of `service.ts`.)

- [ ] **Step 3: Critical-logic test** — `__tests__/service-logic.spec.ts`:
```ts
import { computeNet, sumAmounts } from "../lib/overview"

describe("overview math", () => {
  it("net = revenue - expenses", () => {
    expect(computeNet(100.5, 30.25)).toBe(70.25)
  })
  it("sums amounts with float safety", () => {
    expect(sumAmounts([{ amount: 0.1 }, { amount: 0.2 }])).toBe(0.3)
  })
})
```
Run: `cd .../wesanjs && yarn jest packages/plugins/revenue --silent` → PASS.

- [ ] **Step 4: Verify idempotency at runtime** (no unit DB test — boot + call twice in Task 6). Rebuild plugin: `cd packages/plugins/revenue && yarn build`.

- [ ] **Step 5: Commit**
```bash
git add packages/plugins/revenue && git commit -m "feat(revenue): service ingest, snapshot upsert and overview aggregation"
```

---

### Task 5: Daily metrics sync job

**Files:**
- Create: `src/jobs/sync-revenuecat.ts`

**Interfaces:**
- Consumes: `RevenueModuleService.upsertDailySnapshot`, `RevenueCatConnector.fetchMetrics`.

- [ ] **Step 1: Job** — `src/jobs/sync-revenuecat.ts`:
```ts
import { MedusaContainer } from "@medusajs/framework/types"
import { RevenueCatConnector } from "../modules/revenue/connectors/revenuecat"
import { REVENUE_MODULE } from "../modules/revenue/types"

export default async function syncRevenuecat(container: MedusaContainer) {
  const apiKey = process.env.REVENUECAT_API_KEY
  const projectId = process.env.REVENUECAT_PROJECT_ID
  if (!apiKey || !projectId || apiKey.includes("placeholder")) {
    container.resolve("logger").warn("[revenue] RevenueCat keys missing; skipping sync")
    return
  }
  const connector = new RevenueCatConnector({
    apiKey,
    projectId,
    webhookSecret: process.env.REVENUECAT_WEBHOOK_SECRET ?? "",
  })
  const metrics = await connector.fetchMetrics()
  const service: any = container.resolve(REVENUE_MODULE)
  const expenses = await service.listExpenses({}, { take: 1000 })
  const expenseTotal = Number(
    expenses.reduce((a: number, e: any) => a + Number(e.amount), 0).toFixed(2)
  )
  await service.upsertDailySnapshot({ date: new Date(), metrics, expenseTotal })
  container.resolve("logger").info(`[revenue] snapshot synced: MRR=${metrics.mrr}`)
}

export const config = {
  name: "revenue-sync-revenuecat",
  schedule: "0 * * * *", // hourly; snapshot keyed by day so it upserts
}
```

- [ ] **Step 2: Verify it loads + runs** — rebuild plugin, boot helm. Expected log on boot: job `revenue-sync-revenuecat` registered. With placeholder keys it logs the "keys missing; skipping" warning (correct). To test the real path, set real keys in `helm/.env` and trigger by waiting for the schedule or temporarily setting `schedule: "* * * * *"`.
Run: `cd packages/plugins/revenue && yarn build && cd ../../../../helm && yarn dev`

- [ ] **Step 3: Commit**
```bash
git add packages/plugins/revenue && git commit -m "feat(revenue): hourly RevenueCat metrics sync job"
```

---

### Task 6: Inbound RevenueCat webhook route

**Files:**
- Create: `src/api/webhooks/revenuecat/route.ts`

**Interfaces:**
- Consumes: `RevenueCatConnector.verifyWebhook/parseWebhook`, `RevenueModuleService.recordEvents`.
- Produces: `POST /webhooks/revenuecat`.

- [ ] **Step 1: Route** — `src/api/webhooks/revenuecat/route.ts`:
```ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RevenueCatConnector } from "../../../modules/revenue/connectors/revenuecat"
import { REVENUE_MODULE, RevenueSourceType } from "../../../modules/revenue/types"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const connector = new RevenueCatConnector({
    apiKey: process.env.REVENUECAT_API_KEY ?? "",
    projectId: process.env.REVENUECAT_PROJECT_ID ?? "",
    webhookSecret: process.env.REVENUECAT_WEBHOOK_SECRET ?? "",
  })
  if (!connector.verifyWebhook(req.headers as Record<string, string | undefined>, req.body)) {
    return res.status(401).json({ type: "unauthorized", message: "bad signature" })
  }
  const events = connector.parseWebhook(req.body)
  if (!events.length) {
    return res.status(200).json({ received: true, recorded: 0 })
  }
  const service: any = req.scope.resolve(REVENUE_MODULE)
  // Slice 1: single implicit RevenueCat source row (id == type).
  const recorded = await service.recordEvents(
    RevenueSourceType.REVENUECAT,
    RevenueSourceType.REVENUECAT,
    events
  )
  res.status(200).json({ received: true, recorded })
}
```

- [ ] **Step 2: Verify idempotency via curl** — boot helm, then POST the same payload twice:
```bash
curl -s -X POST http://localhost:9000/webhooks/revenuecat \
  -H "Authorization: whsec_placeholder" -H "Content-Type: application/json" \
  -d '{"event":{"id":"evt_test_1","type":"RENEWAL","price":9.99,"currency":"USD","event_timestamp_ms":1700000000000}}'
```
Expected: first call `{"received":true,"recorded":1}`, second call `{"received":true,"recorded":0}`. Confirm one row: `psql $DATABASE_URL -c "select count(*) from revenue_event where external_id='evt_test_1'"` → 1.

- [ ] **Step 3: Commit**
```bash
git add packages/plugins/revenue && git commit -m "feat(revenue): RevenueCat inbound webhook with idempotent ingest"
```

---

### Task 7: Admin API (overview + expenses) with permission guard

**Files:**
- Create: `src/api/admin/revenue/overview/route.ts`
- Create: `src/api/admin/revenue/expenses/route.ts`
- Create: `src/api/middlewares.ts`

**Interfaces:**
- Produces: `GET /admin/revenue/overview`, `GET /admin/revenue/expenses`, `POST /admin/revenue/expenses`.
- Consumes: `RevenueModuleService.getOverview/listExpenses/createExpenses`.

- [ ] **Step 1: Overview route** — `src/api/admin/revenue/overview/route.ts`:
```ts
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVENUE_MODULE } from "../../../../modules/revenue/types"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const overview = await service.getOverview()
  res.status(200).json({ overview })
}
```

- [ ] **Step 2: Expenses route** — `src/api/admin/revenue/expenses/route.ts`:
```ts
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { REVENUE_MODULE } from "../../../../modules/revenue/types"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const expenses = await service.listExpenses({}, { order: { occurred_at: "DESC" }, take: 100 })
  res.status(200).json({ expenses })
}

export const PostExpense = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  category: z.enum(["infra", "api", "ads", "other"]).default("other"),
  occurred_at: z.coerce.date(),
  app_id: z.string().nullable().optional(),
})

export const POST = async (
  req: AuthenticatedMedusaRequest<z.infer<typeof PostExpense>>,
  res: MedusaResponse
) => {
  const service: any = req.scope.resolve(REVENUE_MODULE)
  const created = await service.createExpenses({
    ...req.validatedBody,
    created_by: req.auth_context?.actor_id ?? null,
  })
  res.status(201).json({ expense: created })
}
```

- [ ] **Step 3: Middlewares (auth + permission + validation)** — `src/api/middlewares.ts`. Mirror the RBAC permission guard used by `packages/medusa/src/api/admin/rbac/**/middlewares.ts` (read it and copy the exact permission-check middleware; substitute resource `revenue`/`expense`). Skeleton:
```ts
import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import { PostExpense } from "./admin/revenue/expenses/route"
// import the project's permission guard the same way rbac routes do:
// import { requirePermission } from "<mirror of packages/medusa/src/api/admin/rbac/.../middlewares>"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/revenue*",
      method: ["GET"],
      middlewares: [/* requirePermission("revenue:read") */],
    },
    {
      matcher: "/admin/revenue/expenses",
      method: ["POST"],
      middlewares: [
        /* requirePermission("expense:write"), */
        validateAndTransformBody(PostExpense),
      ],
    },
  ],
})
```
⚠️ The permission-guard import is the one framework-specific piece to copy verbatim from the existing rbac route middlewares — do not invent it. If no reusable guard exists, the route is at minimum authenticated (admin session); add the permission check in Task 8 once policies exist.

- [ ] **Step 4: Verify via curl** (authenticated admin session/token):
```bash
curl -s http://localhost:9000/admin/revenue/overview -H "Authorization: Bearer <admin_jwt>"
curl -s -X POST http://localhost:9000/admin/revenue/expenses -H "Authorization: Bearer <admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"description":"Render hosting","amount":25,"currency":"USD","category":"infra","occurred_at":"2026-06-01"}'
```
Expected: overview returns `{ overview: { mrr, net, recentEvents, mrrTrend, ... } }`; expense POST returns `201` with the created expense; overview `expenseTotal`/`net` reflect it.

- [ ] **Step 5: Commit**
```bash
git add packages/plugins/revenue && git commit -m "feat(revenue): admin overview and expenses API with permission middleware"
```

---

### Task 8: RBAC policies + Finance role

**Files:**
- Create: `packages/medusa/src/policies/revenue.ts`
- Modify: the policies barrel that aggregates `definePolicies` (mirror how `packages/medusa/src/policies/user.ts` is registered/exported)

**Interfaces:**
- Produces permissions: `revenue:read/write/update/delete`, `expense:read/write/update/delete` (auto-synced to `rbac_policy` at boot).

- [ ] **Step 1: Declare policies** — `packages/medusa/src/policies/revenue.ts` (mirror `policies/user.ts` exactly):
```ts
import { definePolicies } from "<same import path as policies/user.ts>"
import { generateResourcePolicies } from "../utils/generate-resource-policies"

export const revenuePolicies = definePolicies(
  generateResourcePolicies(["revenue", "expense"])
)
```
Register `revenuePolicies` wherever `userPolicies` is aggregated (find the import site of `userPolicies`; add `revenuePolicies` beside it).

- [ ] **Step 2: Boot + verify policies synced** — boot helm; the rbac module's `syncRegisteredPolicies()` runs on application start. Verify: `psql $DATABASE_URL -c "select key from rbac_policy where key like 'revenue:%' or key like 'expense:%'"` → lists `revenue:read`, `expense:write`, etc.

- [ ] **Step 3: Enable the permission guard** — now that `revenue:read`/`expense:write` exist, uncomment the `requirePermission(...)` middlewares in `src/api/middlewares.ts` (Task 7 Step 3) and rebuild. Verify a user WITHOUT `revenue:read` gets 403 on `/admin/revenue/overview`; the owner/super-admin (wildcard) gets 200.

- [ ] **Step 4: Document the Finance role** — add a one-paragraph note in `docs/REVENUE-SPEC.md` §8 stating the Finance role = a role with `revenue:read` + `expense:write` (created via the existing Roles UI; no code seed required for Slice 1).

- [ ] **Step 5: Commit**
```bash
git add packages/medusa/src/policies packages/plugins/revenue docs/REVENUE-SPEC.md
git commit -m "feat(revenue): RBAC policies for revenue and expense resources"
```

---

### Task 9: Frontend — plugin-injected panel (real data + chart + expense form), remove stub

**Files:**
- Modify: `packages/admin/dashboard/package.json` (add `recharts`)
- Create: `packages/plugins/revenue/src/admin/routes/revenue/page.tsx`
- Modify: dashboard run env to inject plugin admin (set `VITE_MEDUSA_PROJECT`)
- Delete/trim: hardcoded `/revenue` route in `packages/admin/dashboard/src/dashboard-app/routes/get-route.map.tsx` (the `path: "/revenue"` block) and the Revenue nav entry in `packages/admin/dashboard/src/components/layout/main-layout/main-layout.tsx`
- Optional delete: `packages/admin/dashboard/src/routes/revenue/index.tsx` (stub) once the plugin route renders

**Interfaces:**
- Consumes: `GET /admin/revenue/overview`, `POST /admin/revenue/expenses`.

- [ ] **Step 1: Add recharts** — in `packages/admin/dashboard/package.json` dependencies add `"recharts": "^2.15.0"` (React 18 compatible). Run `yarn install` at repo root.

- [ ] **Step 2: Plugin admin page** — `packages/plugins/revenue/src/admin/routes/revenue/page.tsx`. Fetches via the admin fetch client and renders metrics + a recharts line + recent events + expense form. (Mirror `defineRouteConfig` usage from `packages/plugins/loyalty/src/admin/**/page.tsx`.)
```tsx
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CurrencyDollar } from "@medusajs/icons"
import { Badge, Container, Heading, Text, Button, Input, Label } from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts"

const fetchJSON = (url: string, init?: RequestInit) =>
  fetch(`${__BACKEND_URL__ ?? ""}${url}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  }).then((r) => r.json())

const RevenuePage = () => {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["revenue", "overview"],
    queryFn: () => fetchJSON("/admin/revenue/overview"),
  })
  const o = data?.overview
  const [form, setForm] = useState({ description: "", amount: "", category: "infra" })
  const addExpense = useMutation({
    mutationFn: () =>
      fetchJSON("/admin/revenue/expenses", {
        method: "POST",
        body: JSON.stringify({
          description: form.description,
          amount: Number(form.amount),
          currency: o?.currency ?? "USD",
          category: form.category,
          occurred_at: new Date().toISOString(),
        }),
      }),
    onSuccess: () => {
      setForm({ description: "", amount: "", category: "infra" })
      qc.invalidateQueries({ queryKey: ["revenue", "overview"] })
    },
  })

  if (isLoading) return <Container className="p-6"><Text>Yükleniyor…</Text></Container>

  const metrics = [
    { label: "MRR", value: `${o?.mrr ?? 0} ${o?.currency ?? ""}` },
    { label: "Aktif Abonelik", value: String(o?.activeSubscriptions ?? 0) },
    { label: "28g Gelir", value: `${o?.revenue28d ?? 0} ${o?.currency ?? ""}` },
    { label: "Net", value: `${o?.net ?? 0} ${o?.currency ?? ""}` },
  ]

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="flex items-center justify-between p-6">
        <div>
          <Heading level="h2">Revenue</Heading>
          <Text size="small" className="text-ui-fg-subtle">Abonelik geliri & gider</Text>
        </div>
        <Badge size="2xsmall" color="green">RevenueCat · canlı</Badge>
      </Container>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <Container key={m.label} className="flex flex-col gap-y-2 p-6">
            <Text size="small" weight="plus" className="text-ui-fg-subtle">{m.label}</Text>
            <Heading level="h1">{m.value}</Heading>
          </Container>
        ))}
      </div>

      <Container className="p-6">
        <Heading level="h2" className="mb-4">MRR Trend</Heading>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <LineChart data={o?.mrrTrend ?? []}>
              <XAxis dataKey="date" /><YAxis /><Tooltip />
              <Line type="monotone" dataKey="mrr" stroke="#3b82f6" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Container>

      <Container className="p-6">
        <Heading level="h2" className="mb-4">Gider Ekle</Heading>
        <div className="flex flex-wrap items-end gap-3">
          <div><Label>Açıklama</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>Tutar</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          <Button onClick={() => addExpense.mutate()} isLoading={addExpense.isPending} disabled={!form.description || !form.amount}>Ekle</Button>
        </div>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Revenue", icon: CurrencyDollar })
export default RevenuePage
```

- [ ] **Step 3: Wire admin injection** — build the plugin (`cd packages/plugins/revenue && yarn build`). Set the dashboard to load extensions from the host: in the dashboard's run env (`packages/admin/dashboard/.env` or shell) set `VITE_MEDUSA_PROJECT` to the helm project path so `admin-vite-plugin inject({ sources })` picks up the plugin's admin routes.
⚠️ Confirm the exact `VITE_MEDUSA_PROJECT` value/relative-path against `@medusajs/admin-vite-plugin` behavior (the vite config reads `env.VITE_MEDUSA_PROJECT` → `sources`). Start the dashboard: `cd packages/admin/dashboard && yarn dev`.

- [ ] **Step 4: Remove the hardcoded stub** — in `get-route.map.tsx` delete the `{ path: "/revenue", ... lazy: () => import("../../routes/revenue") }` block; in `main-layout.tsx` remove the `{ icon: <CurrencyDollar />, label: "Revenue", to: "/revenue" }` nav entry (the plugin now injects both). Delete `dashboard/src/routes/revenue/index.tsx`.

- [ ] **Step 5: End-to-end acceptance** — with helm (:9000) + dashboard (:5173) running and real RevenueCat keys + at least one synced snapshot:
  1. Sidebar shows "Revenue" (from the plugin, not the stub).
  2. `/revenue` shows real MRR / active subs / 28d revenue (no "örnek veri" badge).
  3. The MRR trend chart renders (recharts) from `mrrTrend`.
  4. Adding an expense updates `net` after refetch.
  5. A user without `revenue:read` cannot open the page (403 from the API).

- [ ] **Step 6: Commit**
```bash
git add packages/plugins/revenue packages/admin/dashboard
git commit -m "feat(revenue): plugin-injected dashboard panel with live data, chart and expenses"
```

---

## Self-Review

**Spec coverage (REVENUE-SPEC §§):** §4 ne-nereye → Tasks 1,9. §5 model (4 tablo + indexes) → Task 2. §6 Connector SPI → Task 3. §7 Slice 1 akış + 5 kabul kriteri → Tasks 5,6,7,9 (kabul = Task 9 Step 5). §8 RBAC → Task 8. §9 frontend (recharts, hook, swap, states, stub kaldır) → Task 9. R5 bigNumber/reporting currency → Global Constraints + Task 2. R7 idempotency → Task 2 (unique index) + Task 4/6 (upsert + curl proof). **Gaps:** none for Slice 1; `app`/`subscription`/`fx_rate` tables and Stripe/Paddle/iyzico/ads connectors are explicitly later phases (§10), not in this plan.

**Placeholder scan:** Three `⚠️` markers remain — they are NOT lazy placeholders but named, real integration points that must be confirmed against the live framework (RevenueCat metric id casing; plugin migration command; `VITE_MEDUSA_PROJECT` value) plus one copy-verbatim point (RBAC permission guard import). Each cites the exact reference to mirror. All other steps contain complete code.

**Type consistency:** `CanonicalEvent`/`ProviderMetrics`/`RevenueConnector` defined in Task 3 are consumed unchanged in Tasks 4–6. `recordEvents(sourceId, sourceType, events)` signature defined in Task 4 matches the call in Task 6. `getOverview()` shape defined in Task 4 matches the frontend consumption in Task 9. `REVENUE_MODULE` constant defined in Task 1 used in Tasks 5–7.
