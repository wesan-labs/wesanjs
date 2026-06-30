import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../modules/cms/types"
import type CmsModuleService from "../../../modules/cms/service"

// GET /cms/:siteSlug — headless DELIVERY (public, auth yok).
// Yayınlanmış içerik döner; geçerli ?preview=<site.preview_secret> ile taslak da dahil.
// ?locale=en ile dile süzülür. Site bu ucu tüketip kendi şablonuyla render eder.
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { siteSlug } = req.params
  const preview = req.query.preview as string | undefined
  const locale = req.query.locale as string | undefined
  const service: CmsModuleService = req.scope.resolve(CMS_MODULE)

  const [site] = await service.listCmsSites({ slug: siteSlug })
  if (!site || !site.enabled) {
    res.status(404).json({ error: "site bulunamadı" })
    return
  }

  const draftOk =
    !!preview && !!site.preview_secret && preview === site.preview_secret

  const collections = await service.listCmsCollections({ site_id: site.id })
  const entries = await service.listCmsEntries({ site_id: site.id })

  // Time: O(c + e), Space: O(e). Taslak sadece geçerli secret ile sızar.
  const visible = entries.filter(
    (e) =>
      (draftOk || e.status === "published") && (!locale || e.locale === locale)
  )

  const out = collections.map((c) => ({
    slug: c.slug,
    kind: c.kind,
    entries: visible
      .filter((e) => e.collection_id === c.id)
      .map((e) => ({
        slug: e.slug,
        locale: e.locale,
        status: e.status,
        data: e.data,
      })),
  }))

  // Taslak önizlemesi cache'lenmesin; yayın delivery'si kısa cache.
  res.setHeader(
    "Cache-Control",
    draftOk ? "no-store" : "public, max-age=30, s-maxage=60"
  )
  res.json({
    site: { slug: site.slug, name: site.name, base_url: site.base_url },
    draft: draftOk,
    locale: locale ?? null,
    collections: out,
  })
}
