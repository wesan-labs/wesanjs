export type AnalyticsVertical = "mobile_game" | "mobile_app" | "web"

export type FunnelStepDef = {
  key: string
  label: string
}

export const FUNNEL_STEPS: Record<AnalyticsVertical, FunnelStepDef[]> = {
  mobile_game: [
    { key: "funnel_step_install", label: "Install" },
    { key: "funnel_step_tutorial", label: "Tutorial" },
    { key: "funnel_step_level_1", label: "Level 1" },
  ],
  mobile_app: [
    { key: "funnel_step_open", label: "Açılış" },
    { key: "funnel_step_onboarding", label: "Onboarding" },
    { key: "funnel_step_subscribe", label: "Abonelik" },
  ],
  web: [
    { key: "funnel_step_landing", label: "Landing" },
    { key: "funnel_step_signup", label: "Kayıt" },
    { key: "funnel_step_checkout", label: "Checkout" },
  ],
}

export type FunnelStepResult = FunnelStepDef & {
  value: number
  rate_from_top: number
  rate_from_prev: number | null
}

export const buildFunnelFromSnapshots = (
  vertical: AnalyticsVertical,
  snapshots: Array<{ metric: string; value: number | string }>
): FunnelStepResult[] => {
  const defs = FUNNEL_STEPS[vertical] ?? FUNNEL_STEPS.mobile_app
  const byMetric = new Map<string, number>()
  for (const row of snapshots) {
    if (String(row.metric).startsWith("funnel_step_")) {
      byMetric.set(String(row.metric), Number(row.value) || 0)
    }
  }

  const top = byMetric.get(defs[0]?.key ?? "") ?? 0

  return defs.map((step, index) => {
    const value = byMetric.get(step.key) ?? 0
    const prev = index > 0 ? byMetric.get(defs[index - 1].key) ?? 0 : null
    return {
      ...step,
      value,
      rate_from_top: top > 0 ? value / top : 0,
      rate_from_prev:
        prev !== null && prev > 0 ? value / prev : index === 0 ? 1 : 0,
    }
  })
}
