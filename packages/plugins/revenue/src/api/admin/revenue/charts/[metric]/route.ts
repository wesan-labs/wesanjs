import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RevenueCatConnector } from "../../../../../modules/revenue/connectors/revenuecat"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const connector = new RevenueCatConnector({
    apiKey: process.env.REVENUECAT_API_KEY ?? "",
    projectId: process.env.REVENUECAT_PROJECT_ID ?? "",
    webhookSecret: process.env.REVENUECAT_WEBHOOK_SECRET ?? "",
  })
  const metric = req.params.metric
  const segment = req.query.segment as string | undefined
  const result = await connector.fetchChart(metric, segment ? { segment } : undefined)
  res.status(200).json(result)
}
