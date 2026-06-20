import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RevenueCatConnector } from "../../../modules/revenue/connectors/revenuecat"
import { REVENUE_MODULE, RevenueSourceType } from "../../../modules/revenue/types"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const connector = new RevenueCatConnector({
    apiKey: process.env.REVENUECAT_API_KEY ?? "",
    projectId: process.env.REVENUECAT_PROJECT_ID ?? "",
    webhookSecret: process.env.REVENUECAT_WEBHOOK_SECRET ?? "",
  })
  if (!connector.verifyWebhook(req.headers as Record<string, string | undefined>)) {
    return res.status(401).json({ type: "unauthorized", message: "bad signature" })
  }
  const events = connector.parseWebhook(req.body)
  if (!events.length) {
    return res.status(200).json({ received: true, recorded: 0 })
  }
  const service: any = req.scope.resolve(REVENUE_MODULE)
  // Slice 1: single implicit RevenueCat source row (id == type).
  const recorded = await service.recordEvents(
    RevenueSourceType.REVENUECAT,
    RevenueSourceType.REVENUECAT,
    events
  )
  res.status(200).json({ received: true, recorded })
}
