import {
  createLocationFulfillmentSetWorkflow,
  createRegionsWorkflow,
  createServiceZonesWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { getDefaultSalesChannelId, getStoreCurrency } from "../lib/medusa"
import { Seeder } from "../lib/seeder"

// Commerce ön koşulları — hepsi parça-bazlı idempotent (reset sonrası eksiği tamamlar):
//   region · stok lokasyonu (→ sales channel) · kargo zinciri (fulfillment için ŞART)
// Kargo zinciri = shipping profile + fulfillment set + service zone + shipping option(manual_manual).
// Fulfillment workflow provider'ı siparişteki shipping_option'dan okur; ürün profili = option profili olmalı.
export const commerceFoundationSeeder: Seeder = {
  id: "commerce-foundation",
  label: "Commerce — altyapı (region + depo + kargo)",
  hasBackend: true,
  async run({ container, log }) {
    const regionModule: any = container.resolve(Modules.REGION)
    const stockModule: any = container.resolve(Modules.STOCK_LOCATION)
    const fulfillmentModule: any = container.resolve(Modules.FULFILLMENT)

    // 1) Region
    const regions = await regionModule.listRegions({}, { take: 1 })
    if (!regions.length) {
      const currency = await getStoreCurrency(container)
      const { result } = await createRegionsWorkflow(container).run({
        input: {
          regions: [
            { name: "Türkiye", currency_code: currency, countries: ["tr"], payment_providers: ["pp_system_default"] },
          ],
        },
      })
      log(`region: +${result.length} (currency=${currency})`)
    } else {
      log(`region zaten var`)
    }

    // 2) Stok lokasyonu + default sales channel linki
    let location = (await stockModule.listStockLocations({}, { take: 1 }))[0]
    if (!location) {
      const { result: created } = await createStockLocationsWorkflow(container).run({
        input: {
          locations: [
            { name: "Ana Depo", address: { address_1: "Merkez Mah.", country_code: "tr", city: "İstanbul" } },
          ],
        },
      })
      location = created[0]
      const salesChannelId = await getDefaultSalesChannelId(container)
      if (salesChannelId) {
        await linkSalesChannelsToStockLocationWorkflow(container).run({
          input: { id: location.id, add: [salesChannelId] },
        })
      }
      log(`stok lokasyonu: +1 (kanal linki: ${salesChannelId ? "✓" : "—"})`)
    } else {
      log(`stok lokasyonu zaten var`)
    }

    // 3) Kargo zinciri — coarse idempotent: shipping option varsa zincir kurulu say.
    const existingOptions = await fulfillmentModule.listShippingOptions({}, { take: 1 })
    if (existingOptions.length) {
      log(`kargo zinciri zaten var`)
      return
    }

    const currency = await getStoreCurrency(container)

    // 3a) Shipping profile (ürün ile option AYNI profili paylaşmalı)
    let profile = (await fulfillmentModule.listShippingProfiles({}, { take: 1 }))[0]
    if (!profile) {
      const { result } = await createShippingProfilesWorkflow(container).run({
        input: { data: [{ name: "Standart", type: "default" }] },
      })
      profile = result[0]
    }

    // 3b) Lokasyon için fulfillment set (link-relation güvenilmez → modülden listele; varsa kullan)
    let fset = (await fulfillmentModule.listFulfillmentSets({}, { take: 1 }))[0]
    if (!fset) {
      await createLocationFulfillmentSetWorkflow(container).run({
        input: {
          location_id: location.id,
          fulfillment_set_data: { name: "Kargo", type: "shipping" },
        },
      })
      fset = (await fulfillmentModule.listFulfillmentSets({}, { take: 1 }))[0]
    }

    // 3c) Service zone (Türkiye) (varsa kullan)
    let zone = (await fulfillmentModule.listServiceZones({}, { take: 1 }))[0]
    if (!zone) {
      const { result: zones } = await createServiceZonesWorkflow(container).run({
        input: {
          data: [
            {
              name: "Türkiye",
              fulfillment_set_id: fset.id,
              geo_zones: [{ type: "country", country_code: "tr" }],
            },
          ],
        },
      })
      zone = zones[0]
    }
    const zoneId = zone.id

    // 3c.5) manual_manual provider'ını lokasyona bağla — option için ŞART.
    // (Bağlı değilse "Providers (manual_manual) are not enabled for the service location".)
    try {
      const remoteLink: any = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)
      await remoteLink.create([
        {
          [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
          [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
        },
      ])
    } catch {
      // zaten bağlıysa yut (idempotent)
    }

    // 3d) Shipping option — provider manual_manual (DB'de kayıtlı tek provider)
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "Standart Kargo",
          service_zone_id: zoneId,
          shipping_profile_id: profile.id,
          provider_id: "manual_manual",
          type: { label: "Standart", description: "3-5 iş günü", code: "standard" },
          price_type: "flat",
          prices: [{ amount: 29, currency_code: currency }],
        },
      ],
    })
    log(`kargo zinciri: profil + set + zone + option (manual_manual)`)
  },
}
