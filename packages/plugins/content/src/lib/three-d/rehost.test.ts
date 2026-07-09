import { describe, expect, test } from "bun:test"
import { isSafeRemoteUrl } from "./rehost"

describe("isSafeRemoteUrl (SSRF koruması)", () => {
  test("public https kabul", () => {
    expect(isSafeRemoteUrl("https://delivery.us2.bfl.ai/durable/x/sample.png?sig=1")).toBe(true)
    expect(isSafeRemoteUrl("https://d2h7xmz5gqybh9.cloudfront.net/output/a.mp4")).toBe(true)
    expect(isSafeRemoteUrl("https://ark-x.tos-ap-southeast-1.volces.com/v.mp4")).toBe(true)
  })
  test("http / bozuk URL red", () => {
    expect(isSafeRemoteUrl("http://example.com/a.png")).toBe(false)
    expect(isSafeRemoteUrl("file:///etc/passwd")).toBe(false)
    expect(isSafeRemoteUrl("not-a-url")).toBe(false)
  })
  test("iç ağ / metadata / localhost red", () => {
    expect(isSafeRemoteUrl("https://localhost/x")).toBe(false)
    expect(isSafeRemoteUrl("https://127.0.0.1/x")).toBe(false)
    expect(isSafeRemoteUrl("https://10.0.0.5/x")).toBe(false)
    expect(isSafeRemoteUrl("https://172.20.1.1/x")).toBe(false)
    expect(isSafeRemoteUrl("https://192.168.1.10/x")).toBe(false)
    expect(isSafeRemoteUrl("https://169.254.169.254/latest/meta-data")).toBe(false)
    expect(isSafeRemoteUrl("https://svc.internal/x")).toBe(false)
    expect(isSafeRemoteUrl("https://[::1]/x")).toBe(false)
  })
})
