import { randomBytes } from "crypto";

// High-entropy random password. Stalwart runs a zxcvbn strength check on account
// creation and rejects weak passwords; 24 random bytes (~32 base64url chars) scores
// at the maximum strength.
export function generateStrongPassword(): string {
  return randomBytes(24).toString("base64url");
}
