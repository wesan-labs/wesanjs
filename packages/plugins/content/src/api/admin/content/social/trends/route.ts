import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { SOCIAL_SNAPSHOT_MODULE } from "../../../../../modules/social-snapshot"
import { tenantScopeFilter } from "../../../../lib/tenant-guard"

/**
 * GET /admin/content/social/trends?accountId=…&days=30
 * Daily metric snapshots for one account (oldest → newest) so the UI can draw
 * time-series + compute trend vs the previous snapshot. Empty until the snapshot
 * job has run on ≥1 day.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const accountId = (req.query.accountId as string) || ""
  if (!accountId) {
    res.status(400).json({ error: "accountId gerekli." })
    return
  }
  const days = Math.min(180, Math.max(2, Number(req.query.days) || 30))
  const service = req.scope.resolve(SOCIAL_SNAPSHOT_MODULE) as any

  const snapshots = await service.listSocialSnapshots(
    tenantScopeFilter(req, { account_id: accountId }),
    { order: { date: "ASC" }, take: days }
  )

  // Convenience: trend = latest vs earliest available snapshot, per metric.
  let trend: Record<string, number> | null = null
  if (snapshots.length >= 2) {
    const first = snapshots[0].metrics || {}
    const last = snapshots[snapshots.length - 1].metrics || {}
    trend = {}
    for (const k of Object.keys(last)) {
      const a = Number(first[k]) || 0
      const b = Number(last[k]) || 0
      trend[k] = a ? Number((((b - a) / a) * 100).toFixed(1)) : 0
    }
  }

  res.json({ snapshots, trend })
}
