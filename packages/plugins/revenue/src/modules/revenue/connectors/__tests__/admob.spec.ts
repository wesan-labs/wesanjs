import { admobPlatform, microsToAmount, parseAdmobReport } from "../admob"

describe("admob helpers", () => {
  it("microsToAmount: micros → tutar", () => {
    expect(microsToAmount(6_500_000)).toBe(6.5)
    expect(microsToAmount("198000000")).toBe(198)
    expect(microsToAmount(0)).toBe(0)
  })

  it("admobPlatform: IOS/ANDROID normalize", () => {
    expect(admobPlatform("IOS")).toBe("ios")
    expect(admobPlatform("ANDROID")).toBe("android")
  })

  it("parseAdmobReport: header currency + app/platform/earnings", () => {
    const body = [
      { header: { localizationSettings: { currencyCode: "TRY" } } },
      {
        row: {
          dimensionValues: {
            DATE: { value: "20260601" },
            APP: { value: "ca-app-1", displayLabel: "Empire Inc." },
            PLATFORM: { value: "IOS" },
          },
          metricValues: {
            ESTIMATED_EARNINGS: { microsValue: "181000000" },
          },
        },
      },
      { footer: {} },
    ]
    const rows = parseAdmobReport(body)
    expect(rows).toHaveLength(1)
    expect(rows[0].appName).toBe("Empire Inc.")
    expect(rows[0].platform).toBe("ios")
    expect(rows[0].amount).toBe(181)
    expect(rows[0].currency).toBe("TRY")
  })
})
