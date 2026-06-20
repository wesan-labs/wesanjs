# Stalwart JMAP envelopes — captured truth (Task 0 spike)

Stalwart version: **0.16.9** (community edition), image `stalwartlabs/stalwart:latest`.
Endpoint base: `http://localhost:8080`. JMAP: `POST /jmap`. Session: `GET /jmap/session`
(`/.well-known/jmap` 307-redirects to `/jmap/session`). Auth: **HTTP Basic**.
Errors: RFC7807 `application/problem+json` (`{type,status,title,detail}`).

## CONFIRMED

### Capabilities (from /jmap/session, admin)
Principal management uses the **standard** JMAP capability
`urn:ietf:params:jmap:principals` (NOT a Stalwart-specific URN — the plan's
`urn:stalwart:jmap` guess was WRONG; use the standard one). Mail/submission:
`urn:ietf:params:jmap:mail`, `urn:ietf:params:jmap:submission`.
Admin account id pattern: `d333333`, `{ name:"admin", isPersonal:true }`.

### Principal/get (works even in bootstrap mode)
Request:
```json
{"using":["urn:ietf:params:jmap:core","urn:ietf:params:jmap:principals"],
 "methodCalls":[["Principal/get",{"accountId":"d333333","ids":null},"0"]]}
```
Response: `{"methodResponses":[["Principal/get",{"accountId":"d333333","state":"n","list":[],"notFound":[]},"0"]],"sessionState":"..."}`

## BLOCKED until initial setup completes
- In **bootstrap mode** `GET /api/account` permissions = `["sysBootstrapGet","sysBootstrapUpdate"]` only.
- `Principal/set` create (domain/individual) → `urn:ietf:params:jmap:error:notRequest` 400
  (no writable directory store before setup). Must complete the setup wizard first.

## TODO after wizard (capture exact envelopes)
1. `Principal/set` create `{type:"domain", name:"helm.local"}` — confirm exact field names.
2. `Principal/set` create `{type:"individual", name, description, emails, secrets}` — confirm `secrets` accepts plaintext.
3. App-password: confirm object name + capability (search session for an AppPassword capability post-setup).
4. Group/shared: `Principal/set` create `{type:"group", name, emails}` + membership field (`memberOf` on individual vs `members` on group).
5. Mail: `Mailbox/get`, `Email/query`, `Email/get`, `EmailSubmission/set` as an individual (Basic w/ app-password).
   Confirm a user's `Mailbox/get` includes group/shared mailboxes they belong to.

> Reliable capture method: perform the action in the WebAdmin (http://localhost:8080/admin)
> and read the exact JMAP request from browser devtools → Network → /jmap.
