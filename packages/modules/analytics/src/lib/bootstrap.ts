import crypto from "crypto"
import {
  getPlatformAnalyticsConfig,
  isBuiltinMode,
} from "./platform-config"

export const hashBootstrapToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex")

export const generateBootstrapToken = () =>
  crypto.randomBytes(24).toString("base64url")

export const tokenHint = (token: string) => token.slice(-6)

export type RuntimeAnalyticsConfig = {
  /** Levios relay — SDK buraya event atar (varsayılan) */
  relay?: {
    ingest_url: string
    config_url: string
  }
  /** Sadece hosted modda, ops tarafından provision edilir */
  posthog?: {
    host: string
    project_key: string
  }
  glitchtip?: {
    dsn: string
  }
}

export const platformRuntimeConfig = (): RuntimeAnalyticsConfig => {
  const cfg = getPlatformAnalyticsConfig()

  if (isBuiltinMode()) {
    return {
      relay: {
        ingest_url: "/analytics/v1/events",
        config_url: "/analytics/v1/config",
      },
    }
  }

  const ph = cfg.hosted?.posthog
  const gt = cfg.hosted?.glitchtip

  return {
    relay: {
      ingest_url: "/analytics/v1/events",
      config_url: "/analytics/v1/config",
    },
    ...(ph
      ? { posthog: { host: ph.host, project_key: ph.projectKey } }
      : {}),
    ...(gt ? { glitchtip: { dsn: gt.dsn } } : {}),
  }
}
