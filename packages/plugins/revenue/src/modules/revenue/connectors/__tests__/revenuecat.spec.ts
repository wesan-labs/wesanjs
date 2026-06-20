import { RevenueEventKind } from "../../types"
import { RevenueCatConnector } from "../revenuecat"

const c = new RevenueCatConnector({ apiKey: "k", projectId: "p", webhookSecret: "s" })

describe("RevenueCatConnector.parseWebhook", () => {
  it("maps RENEWAL to subscription_renewal with positive amount", () => {
    const out = c.parseWebhook({ event: { id: "e1", type: "RENEWAL", price: 9.99, currency: "USD", event_timestamp_ms: 1700000000000 } })
    expect(out).toHaveLength(1)
    expect(out[0].kind).toBe(RevenueEventKind.SUBSCRIPTION_RENEWAL)
    expect(out[0].grossAmount).toBe(9.99)
    expect(out[0].externalId).toBe("e1")
  })
  it("maps REFUND to negative amount", () => {
    const out = c.parseWebhook({ event: { id: "e2", type: "REFUND", price: 9.99, currency: "USD" } })
    expect(out[0].kind).toBe(RevenueEventKind.REFUND)
    expect(out[0].grossAmount).toBe(-9.99)
  })
  it("ignores unknown event types", () => {
    expect(c.parseWebhook({ event: { id: "e3", type: "TEST" } })).toHaveLength(0)
  })
})

describe("RevenueCatConnector.verifyWebhook", () => {
  it("accepts matching secret, rejects others", () => {
    expect(c.verifyWebhook({ authorization: "s" })).toBe(true)
    expect(c.verifyWebhook({ authorization: "x" })).toBe(false)
  })
})
