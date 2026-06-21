# Panel Mail — Detailed Spec (V1+)

- **Date:** 2026-06-21
- **Status:** Design (supersedes the high-level `2026-06-20-mail-v1-design.md` with verified backend + UI detail)
- **Plugin:** `packages/plugins/mail/` (Medusa 2.15.5)
- **Backend truth:** `docs/stalwart-envelopes.md` (all JMAP envelopes verified against live Stalwart 0.16.9)
- **UI reference:** shadcn "Mail" app (3-pane), adapted to the Medusa admin design system

---

## 1. Goal

Admin manages email **entirely from the Medusa admin** — never opening Stalwart's webadmin. Two surfaces:

1. **Mail Accounts (management/settings):** connect domain (`helm.local`), auto-/manually provision `ad.soyad@domain` mailboxes for staff, create shared functional mailboxes (`support@`), reveal-once passwords.
2. **Inbox (mail client):** a shadcn-style 3-pane reader to view + reply to mail for the logged-in user's own mailbox **and** the shared mailboxes they belong to.

**Hard requirement (unchanged):** looks like a native part of the panel, not a bolted-on CRM/CMS. → shadcn **layout/UX**, **`@medusajs/ui` styling**.

**Privacy (unchanged, server-enforced):** every staff user sees only their own inbox + shared mailboxes they have access to. No "read everyone" path. Enforced by authenticating JMAP **as the logged-in user** (their own Stalwart credential), never as admin.

---

## 2. Verified backend (what changed from the v1 guess)

| v1 plan assumed | VERIFIED reality |
|---|---|
| `Principal/set`, cap `urn:stalwart:jmap` | Account mgmt is **`x:Account/set` / `x:Domain`**, cap **`urn:stalwart:jmap`** (the `Principal/*` JMAP methods return `notRequest`) |
| App-password per user for the proxy | **App-passwords cannot be created by admin** → proxy authenticates as the user with their **main password** (set at provisioning, AES-256-GCM encrypted at rest) |
| Shared mailbox via group + ACL | Shared mailbox = **`@type:"Group"` account**; member ACL via `memberGroupIds` (exact value format still TBD) |
| `name` = full email | `name` = **localpart only**; `emailAddress` computed by server as `name@domain` |
| — | Password runs a **server zxcvbn strength check** — must generate strong passwords |
| — | Management `accountId` = `session.primaryAccounts["urn:stalwart:jmap"]`; domain id resolved via `x:Domain/query`+`get` by name |

`StalwartClient` (`src/modules/mail/lib/stalwart-client.ts`) already implements + verifies (unit 4/4 + live e2e): `createIndividual`, `createGroup`, `jmapAs`, `userMailAccountId`, management-context + domain-id resolution.

**Config (from env — see `old-levios/templates/fullstack/docker-compose.yml`):**
`baseUrl=http://localhost:8080`, `adminUser=admin@helm.local`, `adminSecret` from `STALWART_ADMIN_PASSWORD`, `domain=helm.local`, `encryptionKey` (32-byte hex). Stalwart runs in the **helm** docker project (network `helm_default`, alongside postgres/redis).

---

## 3. Architecture — one plugin, two UI surfaces, one proxy

```
packages/plugins/mail/
├── src/modules/mail/                  MODULE (data + Stalwart)
│   ├── models/  mail-account, shared-mailbox, shared-access     [done]
│   ├── lib/     stalwart-client, local-part, crypto, reveal-store [client done]
│   └── service.ts  provisionUserMailbox / suspend / createSharedMailbox / getUserJmapCredential
├── src/api/admin/mail/                PROXY (browser ⇄ Stalwart, never direct)
│   ├── jmap/route.ts                  POST — runs methodCalls AS the logged-in user
│   ├── accounts/route.ts              GET list, POST provision
│   ├── shared/route.ts                POST/DELETE shared mailboxes
│   └── reveal/[id]/route.ts           GET reveal-once password
├── src/admin/routes/mail/             ADMIN UI (the two surfaces)
│   ├── page.tsx                       "Mail" → Inbox (3-pane)
│   └── accounts/page.tsx              "Mail Accounts" → management
├── src/admin/components/mail/         shadcn-modeled, @medusajs/ui-styled
├── src/subscribers/                   user.created → provision, user.deleted → suspend
└── src/workflows/                     provision / deprovision (retry + compensation)
```

**Plugin vs module recap:** the *plugin* is the package (module + API + admin UI + subscribers + workflows); the *module* is its data+logic core (`src/modules/mail`). One plugin, registered once in `helm/medusa-config.js` `plugins:[...]`.

---

## 4. UI — Inbox (3-pane, shadcn UX · @medusajs/ui skin)

### 4.1 Layout (from the reference, adapted)
Horizontal 3-pane, resizable, collapsible nav, responsive:
```
┌────────────┬───────────────────────┬──────────────────────────┐
│ NAV 20%    │ MAIL LIST 32%         │ MAIL DISPLAY 48%         │
│ account-   │ Tabs(All/Unread)      │ toolbar (archive/junk/   │
│ switcher   │ + search              │   trash/reply/…)         │
│ Folders:   │ message rows:         │ from • subject • date    │
│  Inbox(n)  │  sender • unread dot  │ body (pre-wrap)          │
│  Sent      │  time • subject       │ ── reply box ──          │
│  Drafts(n) │  preview(2-line)      │  Textarea + Send         │
│  Junk(n)   │  labels(badges)       │                          │
│  Trash     │                       │                          │
│  Archive   │                       │                          │
└────────────┴───────────────────────┴──────────────────────────┘
```
- **Resizable + persisted:** `react-resizable-panels` (bundled in plugin); sizes saved to localStorage. Nav collapses to a 50px icon rail.
- **Responsive:** below a breakpoint, show only the list; nav → slide-over `Drawer`, display → `Drawer`. (Use `@medusajs/ui` Drawer; avoid pulling shadcn Sheet.)
- **State:** Zustand-style or React context holding **`selectedEmailId` (NOT the whole object)** + `activeMailbox` + `tab`. Fetch the email body by id from the proxy on selection (avoids stale snapshots — the reference's caveat).

### 4.2 Component map (reference → ours)
| shadcn ref | ours (`src/admin/components/mail/`) | notes |
|---|---|---|
| `mail.tsx` (orchestrator) | `mail-inbox.tsx` | panels + tab/collapse state + data fetching via TanStack Query |
| `account-switcher.tsx` | `mailbox-switcher.tsx` | **own mailbox + shared mailboxes** the user belongs to (the privacy boundary surface) |
| `nav.tsx` | `mail-nav.tsx` | folders from JMAP `Mailbox/get` (Inbox/Sent/Drafts/Junk/Trash/Archive) + unread counts |
| `mail-list.tsx` | `mail-list.tsx` | rows from `Email/query`+`Email/get`; unread dot, relative time, 2-line preview, label badges |
| `mail-display.tsx` | `mail-display.tsx` | body from `Email/get`; reply box → `EmailSubmission/set` |
| — | `compose.tsx` | new message / reply / forward |

### 4.3 Styling decision (key)
**`@medusajs/ui`-first, shadcn-layout.** Use Medusa's `Button/Input/Badge/Select/DropdownMenu/Tooltip/Switch/Textarea/Tabs/Avatar/Drawer/Table` so it matches the panel theme. Bundle ONLY the primitives Medusa lacks: `ResizablePanelGroup` (react-resizable-panels) and a `ScrollArea` (Radix or CSS). **Do NOT** drop the full shadcn theme in — it would clash with the admin and read as "bolted-on", violating the native requirement. (Connects to the broader levios-ui adoption plan — these ports can later move to `levios-ui`.)

---

## 5. UI — Mail Accounts (management / settings surface)

A table-centric page (native `@medusajs/ui` `Table` + focus modal, exactly like loyalty's list pages):

- **Header:** connected domain (`helm.local`) + status.
- **Accounts table:** address · owner (Medusa user) · type (staff / shared) · status (active/pending/suspended) · actions.
- **Create:** "New mailbox" modal — pick a staff user → preview `ad.soyad@helm.local` → provision. "New shared mailbox" — localpart (`support`) → creates a Group.
- **Reveal-once:** after provision, show the generated password once (copy), then it's gone (server stores only the hash; we store the AES-encrypted copy for the proxy).
- **No inbox content here** — management only. Reading happens in the Inbox surface (privacy: even here, admin sees the *list*, not others' messages).

---

## 6. Data mapping (JMAP ⇄ UI)

| UI concept | JMAP source (as the logged-in user) |
|---|---|
| Folders + counts | `Mailbox/get` → `{id, name, role(inbox/sent/...), totalEmails, unreadEmails}` |
| Mailbox switcher entries | the user's own account + mailboxes shared from Groups they're in |
| List row | `Email/query`(filter:{inMailbox}) → ids → `Email/get`(properties:[from,subject,preview,receivedAt,keywords]) → `read = keywords.$seen` |
| Message body | `Email/get`(properties:[from,to,subject,htmlBody/textBody,receivedAt,bodyValues]) |
| Send / reply | `EmailSubmission/set` + `Email/set`(draft) |
| Labels | JMAP keywords / mailbox membership (V1: optional) |

`Mail` UI type (replacing the reference's seed type), fetched not static:
```ts
type MailMessage = {
  id: string; from: { name?: string; email: string }; subject: string;
  preview: string; date: string; read: boolean; mailboxId: string; labels?: string[]
}
```

---

## 7. Backend API (proxy) — browser never touches Stalwart

- `POST /admin/mail/jmap` — body `{ methodCalls }`; proxy resolves the **logged-in Medusa user** (`req.auth_context.actor_id`), loads their decrypted Stalwart credential, calls `StalwartClient.jmapAs(userEmail, password, methodCalls)`. Client cannot choose identity or mailbox owner. *(This route is the entire privacy boundary.)*
- `GET /admin/mail/accounts` — provisioned accounts (no message content) + domain.
- `POST /admin/mail/accounts` — `{ user_id }` → provision workflow.
- `POST /admin/mail/shared` / `DELETE /admin/mail/shared/:id` — Group mailboxes.
- `GET /admin/mail/reveal/:accountId` — one-time password.
All errors: `application/problem+json` (Medusa default).

---

## 8. Provisioning flow (verified client)
```
staff user.created → subscriber → provisionMailboxWorkflow
  → service.provisionUserMailbox({userId, first, last})
    → localPart = buildLocalPart(first,last, existing)         [done, tested]
    → password = strong-generate                              (zxcvbn-safe)
    → StalwartClient.createIndividual({localPart, description, password})  [verified live]
    → persist MailAccount{user_id, address, stalwart_id, status:active,
                          app_secret_enc = encrypt(password)}  [crypto done]
    → reveal-store.put(accountId, password)                   (one-time)
  → Mailboxes table shows reveal-once
deprovision: user.deleted → suspend (mechanism TBD; soft, keep mail)
```

---

## 9. Placement (DECIDED)
- **Mail Accounts → Settings page** (clean plugin; dashboard `settingsRoutes` collects plugin settings routes).
- **Inbox → plugin route `/mail`** (`defineRouteConfig`), all UI contained in the plugin.
- **Topbar launcher icon** next to the notifications bell → the **single core-shell touch**:
  a ~5-line `IconButton` in `packages/admin/dashboard/src/components/layout/shell` that
  `navigate("/mail")`. There is **no plugin widget zone for the topbar** (verified: no
  header/notification injection zone), so this one shortcut lives in the fork's core shell;
  the feature itself stays in the plugin. (This fork already edits core layout, so it's consistent.)

---

## 10. Out of scope / deferred (explicit)
- **Migration + helm wiring + integration tests** → after the revenue SDD finishes (shared host).
- **Group membership ACL value format** (`memberGroupIds`) and **suspend mechanism** → resolve when building the shared-mailbox + lifecycle tasks (live Stalwart available).
- **Real internet deliverability** (SPF/DKIM/DMARC, MX, IP warmup) → separate project; V1 is internal/local.
- **Compose richness** (attachments, snooze, labels editor) → V1 = read + plain reply/send.
- **Customer (storefront) mailboxes / per-tenant domains** → future; V1 = staff + single domain.

---

## 11. Open decisions (need your call)
1. **Plugin name:** ✅ DECIDED → `@wesanjs/mail-plugin` (wesanjs brand, not @medusajs). Helm `file:` link + medusa-config will reference this name when wired.
2. **Placement:** ✅ DECIDED → Mail Accounts in Settings; Inbox plugin route `/mail`; small topbar launcher icon (single core-shell edit). See §9.
3. **Styling depth:** ✅ DECIDED → `@medusajs/ui`-first (native look); shadcn used only for the 3-pane layout primitives. No full shadcn theme.
4. **Auto-provision trigger:** ✅ DECIDED → every staff `user.created` auto-gets a mailbox; admin can also provision/re-provision manually from the Accounts page.

**All open decisions resolved — spec is FINAL.**
