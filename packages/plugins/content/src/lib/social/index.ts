import { lateProvider } from "./late"
import { SocialProvider } from "./types"

export * from "./types"
export { SocialProviderError } from "./late"

/**
 * Provider-agnostic selector. SOCIAL_PROVIDER picks the backing aggregator;
 * one impl today (late/zernio). Swapping = add a file + a case, no route changes.
 */
export const getSocialProvider = (): SocialProvider => {
  const name = (process.env.SOCIAL_PROVIDER || "late").toLowerCase()
  switch (name) {
    case "late":
    case "zernio":
    default:
      return lateProvider
  }
}
