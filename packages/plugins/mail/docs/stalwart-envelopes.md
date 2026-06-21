# Stalwart JMAP envelopes — VERIFIED (Task 0 spike, 2026-06-21)

Stalwart **0.16.9**. All envelopes below were run against a live local instance and
confirmed. This is the source of truth for `lib/stalwart-client.ts`.

## Transport
- Endpoint: `POST http://localhost:8080/jmap`  · Session: `GET /jmap/session`
- Auth: **HTTP Basic**. Errors: RFC7807 `application/problem+json`.
- Deployment: docker project `helm`, network `helm_default` (with postgres/redis).
  Admin (post-setup): `admin@helm.local` / `<setup-generated>`. Recovery (pinned env):
  `admin` / `Helm.Stalwart.2026` (local dev only).

## Management capability + account context
- Principal/account management is **NOT** `Principal/set` (that returns `notRequest`).
  It is the Stalwart-specific **`x:Account` / `x:Domain`** objects under capability
  **`urn:stalwart:jmap`**.
- `using`: `["urn:ietf:params:jmap:core","urn:stalwart:jmap"]`.
- Management `accountId` = `session.primaryAccounts["urn:stalwart:jmap"]` (e.g. `"b"`).

## Resolve domain id (by name)
```json
{"using":["urn:ietf:params:jmap:core","urn:stalwart:jmap"],
 "methodCalls":[
   ["x:Domain/query",{"accountId":"b"},"0"],
   ["x:Domain/get",{"accountId":"b","#ids":{"resultOf":"0","name":"x:Domain/query","path":"/ids"}},"1"]]}
```
`x:Domain/get` list item: `{ id, name:"helm.local", isEnabled, aliases, createdAt, certificateManagement:{"@type":"Manual"}, ... }`. Pick item whose `name` === domain → its `id`.

## Create individual mailbox (VERIFIED → created.id)
```json
{"using":["urn:ietf:params:jmap:core","urn:stalwart:jmap"],
 "methodCalls":[["x:Account/set",{"accountId":"b","create":{"new-0":{
   "@type":"User",
   "credentials":{"0":{"@type":"Password","secret":"<STRONG-PASSWORD>"}},
   "domainId":"<DOMAIN_ID>",
   "encryptionAtRest":{"@type":"Disabled"},
   "locale":"en_US",
   "name":"<LOCALPART>",
   "permissions":{"@type":"Inherit"},
   "roles":{"@type":"User"}
 }}},"0"]]}
```
- `name` = LOCALPART only (e.g. `ali.veli`); `emailAddress` computed `name@domain`.
- Password: server zxcvbn strength check — weak rejected (`invalidProperties`/`secret`). Generate strong.
- Response: `{"created":{"new-0":{"id":"c"}}}`.

## Create shared/functional mailbox = GROUP (VERIFIED → created.id)
```json
{"using":["urn:ietf:params:jmap:core","urn:stalwart:jmap"],
 "methodCalls":[["x:Account/set",{"accountId":"b","create":{"g0":{
   "@type":"Group","name":"support","domainId":"<DOMAIN_ID>","description":"Support"
 }}},"0"]]}
```
- Group has NO `roles` property (including it errors). Response `{"created":{"g0":{"id":"d"}}}`.

## x:Account/get (full structure)
```json
{"name":"ali.veli","domainId":"b","emailAddress":"ali.veli@helm.local","id":"c","@type":"User",
 "credentials":{"0":{"credentialId":"a","secret":"****","@type":"Password","expiresAt":null,"allowedIps":{}}},
 "memberGroupIds":{}, "roles":{"@type":"User"}, "permissions":{"@type":"Inherit"},
 "quotas":{}, "aliases":{}, "locale":"en_US", "encryptionAtRest":{"@type":"Disabled"}, "usedDiskQuota":0}
```

## Inbox / send (standard JMAP, auth AS the user)
- `using`: `["urn:ietf:params:jmap:core","urn:ietf:params:jmap:mail","urn:ietf:params:jmap:submission"]`.
- User's mail accountId = their `session.primaryAccounts["urn:ietf:params:jmap:mail"]`.
- Methods: `Mailbox/get`, `Email/query`, `Email/get`, `EmailSubmission/set`.

## CONSTRAINTS / still-TBD (later tasks, not blocking Task 3 core)
- **App-passwords CANNOT be created by admin** ("Secondary credentials cannot be set
  directly" — user-self-service only). => V1 proxy authenticates AS the user with the
  user's MAIN password (set at provisioning, stored aes-256-gcm encrypted). app-password
  is future hardening.
- **Group membership (shared ACL)**: account has `memberGroupIds` map; patch
  `update:{<accId>:{"memberGroupIds/<groupId>": <value>}}` — exact VALUE format TBD
  (string "support" and group name both rejected; resolve when building shared-mailbox feature).
- **Suspend**: x:Account has no `isEnabled`; disable mechanism TBD (defer).
