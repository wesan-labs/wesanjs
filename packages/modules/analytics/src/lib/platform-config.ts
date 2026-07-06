/**
 * Tek platform config kaynağı.
 * Varsayılan: builtin — tenant/env yok, veri bizim DB'de.
 * Prod: medusa-config'te `modules["@medusajs/analytics"].options.platform` (ops, bir kez).
 */

export type PlatformAnalyticsMode = "builtin" | "hosted"

export type HostedStackConfig = {
  posthog?: {
    host: string
    projectKey: string
    projectId: string
    personalApiKey: string
  }
  glitchtip?: {
    apiUrl: string
    authToken: string
    orgSlug: string
    dsn: string
  }
}

export type PlatformAnalyticsConfig = {
  mode: PlatformAnalyticsMode
  hosted?: HostedStackConfig
}

export type PlatformAnalyticsInput = {
  mode?: PlatformAnalyticsMode
  hosted?: HostedStackConfig
}

let resolved: PlatformAnalyticsConfig = { mode: "builtin" }

export const setPlatformAnalyticsConfig = (input?: PlatformAnalyticsInput) => {
  if (!input?.mode && !input?.hosted) {
    resolved = { mode: "builtin" }
    return
  }

  const mode = input.mode ?? (input.hosted ? "hosted" : "builtin")
  resolved = {
    mode,
    ...(mode === "hosted" && input.hosted ? { hosted: input.hosted } : {}),
  }
}

export const getPlatformAnalyticsConfig = (): PlatformAnalyticsConfig =>
  resolved

export const isBuiltinMode = () =>
  getPlatformAnalyticsConfig().mode === "builtin"

export const isHostedMode = () => getPlatformAnalyticsConfig().mode === "hosted"

export const getHostedPosthog = () =>
  getPlatformAnalyticsConfig().hosted?.posthog

export const getHostedGlitchtip = () =>
  getPlatformAnalyticsConfig().hosted?.glitchtip
