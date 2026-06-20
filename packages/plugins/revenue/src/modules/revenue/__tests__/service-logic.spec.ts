import { computeNet, sumAmounts } from "../lib/overview"

describe("overview math", () => {
  it("net = revenue - expenses", () => {
    expect(computeNet(100.5, 30.25)).toBe(70.25)
  })
  it("sums amounts with float safety", () => {
    expect(sumAmounts([{ amount: 0.1 }, { amount: 0.2 }])).toBe(0.3)
  })
})
