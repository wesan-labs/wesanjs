// One-time, in-memory reveal store for freshly generated mailbox passwords.
// The password is shown ONCE in the Accounts UI after provisioning, then discarded.
// Stalwart stores only the hash; we keep the AES-encrypted copy (for the proxy) in the DB.

const store = new Map<string, { pw: string; exp: number }>();
const TTL_MS = 10 * 60_000;

export function putRevealOnce(accountId: string, pw: string): void {
  store.set(accountId, { pw, exp: Date.now() + TTL_MS });
}

export function takeRevealOnce(accountId: string): string | null {
  const entry = store.get(accountId);
  store.delete(accountId);
  if (!entry || entry.exp < Date.now()) {
    return null;
  }
  return entry.pw;
}
