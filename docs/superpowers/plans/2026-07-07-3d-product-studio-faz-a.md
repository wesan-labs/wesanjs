# 3D Ürün Stüdyosu — Faz A (3D Çekirdek) Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (önerilen) veya superpowers:executing-plans ile bu planı görev-görev uygula. Adımlar checkbox (`- [ ]`).

**Goal:** Kullanıcının ürün fotoğrafını → **GLB 3D modele** (Tripo API) çevir, sakla, tarayıcıda **360° döndür**, istediği açıyı **"ekran görüntüsü" ile yakala** (PNG) ve **72-kare turntable** export et.

**Architecture:** Backend (Medusa content plugin) bir sağlayıcı-agnostik 3D motoru (`lib/three-d`, Tripo client) + `Product3DAsset` modülü (model+migration+service+workflow+route) tutar. Frontend (admin dashboard) `<model-viewer>` ile GLB'yi render eder, canlı açı yakalar, turntable üretir. Master varlık = GLB; turntable + açı-render'lar ondan bedava türer.

**Tech Stack:** TypeScript strict · Medusa v2 content plugin (modül = content-library aynası) · **Tripo image-to-3D API** (Meshy swap'lanabilir, tek arayüz) · `@google/model-viewer` (viewer + `toBlob` capture + mağaza embed) · React 18 + Vite dashboard · bun test (saf mantık).

## Global Constraints

- **Sağlayıcı:** Tripo (env `TRIPO_API_KEY`). Kod sağlayıcı-agnostik (`ThreeDProvider` arayüzü) — Meshy sonra eklenir. 2000 bedava kredi → Faz A bedava doğrulanır.
- **Modül deseni:** `content-library` birebir aynası (model → `medusa db:generate` migration → service → workflow → route). Yeni model = migration ŞART.
- **Multi-tenant:** `Product3DAsset.tenant_id` + `tenantScopeFilter` (mevcut `src/api/lib/tenant-guard`), CLAUDE.md §5.
- **Viewer:** `<model-viewer>` web component; capture = `.toBlob()`; turntable = `cameraOrbit` döngüsü + `.toBlob()` her açı.
- **Saf mantık `bun test`** (`lib/three-d/turntable.ts`, request-build, status-map); canlı API = key-gated; viewer render = Can gözle doğrular (Playwright yok).
- **Stil:** noktalı virgülsüz, çift tırnak, 2-boşluk. Dosya kebab-case, tip PascalCase, DB snake_case.
- **Test dosyaları** `tsconfig` exclude'da (`**/*.test.ts`).
- **Commit:** `feat(content): mesaj` tek satır, imzasız.
- **Async üretim:** Tripo ~10-100 sn. POST → task oluştur + `processing` sakla; GET /:id → provider'ı poll et, biterse `ready` + meshUrl güncelle. Frontend `ready` olana dek GET'i poll eder. (Job/subscriber altyapısı YOK — MVP.)

---

## Dosya Yapısı (Faz A)

**Backend — `packages/plugins/content/src/`**
```
lib/three-d/
  types.ts                       # Product3DAsset, ThreeDProvider arayüzü          [T1]
  turntable.ts                   # orbitAngles(count,step) — açı matematiği (saf)   [T2]
  providers/tripo.ts             # Tripo client: request-build + create + poll      [T3]
modules/product-3d/
  models/product-3d-asset.ts     # model.define                                     [T4]
  service.ts  index.ts           # MedusaService + Module                           [T4]
  migrations/*                   # medusa db:generate ile üretilir                  [T4]
workflows/product-3d/
  create-3d-asset.ts             # createStep + createWorkflow (sağlayıcı çağrısı)  [T5]
api/admin/content/3d/
  route.ts                       # POST create + GET list                          [T5]
  [id]/route.ts                  # GET status (poll + güncelle)                     [T5]
```

**Frontend — `packages/admin/dashboard/src/`**
```
routes/content/
  three-d-demo.tsx               # yükle → üret → poll → viewer akışı (demo route)  [T6]
  components/model-viewer-canvas.tsx  # <model-viewer> + screenshot + turntable    [T7,T8]
hooks/api/content.tsx            # use3DAssets, useCreate3DAsset, use3DAsset (ekle) [T6]
```

**Faz A çıkış kriteri:** foto yükle → GLB üret (Tripo) → `<model-viewer>`'da döndür → açı yakala (PNG iner) → 72-kare turntable export. `bun test src/lib/three-d` yeşil; viewer Can gözle onaylı.

---

## Task 1: 3D tipleri + sağlayıcı arayüzü

**Files:**
- Create: `packages/plugins/content/src/lib/three-d/types.ts`

**Interfaces:**
- Produces: `Product3DAssetDTO`, `ThreeDProvider`, `GenerateInput`, `GenerateResult`, `TaskStatus`.

- [ ] **Step 1: Tipleri yaz**

```ts
// lib/three-d/types.ts
/** 3D üretim durum makinesi. */
export type TaskStatus = "processing" | "ready" | "failed"

/** Sağlayıcıya giden girdi — kullanıcı görselleri (data/http URL) + opsiyonlar. */
export interface GenerateInput {
  images: string[]
  // ileride: texture kalitesi, pbr, vb.
}

/** Sağlayıcı görev sonucu — poll edilir. */
export interface GenerateResult {
  providerTaskId: string
  status: TaskStatus
  meshUrl?: string // hazırsa GLB URL
  error?: string
}

/** Sağlayıcı-agnostik 3D motoru. Tripo/Meshy bunu uygular. */
export interface ThreeDProvider {
  readonly name: string
  create(input: GenerateInput): Promise<GenerateResult>
  poll(providerTaskId: string): Promise<GenerateResult>
}

/** Kalıcı 3D varlık (DB DTO aynası). */
export interface Product3DAssetDTO {
  id: string
  tenant_id: string | null
  brand_id: string | null
  source: "physical" | "digital-mockup"
  inputs: string[]
  mesh_url: string | null
  thumbnail_url: string | null
  provider: string
  provider_task_id: string | null
  status: TaskStatus
  error: string | null
}
```

- [ ] **Step 2: Derlenme kontrolü**

Run: `cd packages/plugins/content && npx tsc --noEmit --strict --skipLibCheck --module esnext --moduleResolution bundler --target ES2021 src/lib/three-d/types.ts`
Expected: exit 0

- [ ] **Step 3: Commit**

```bash
git add packages/plugins/content/src/lib/three-d/types.ts
git commit -m "feat(content): 3D varlık tipleri + sağlayıcı-agnostik ThreeDProvider arayüzü"
```

## Task 2: Turntable açı matematiği (saf, TDD)

**Files:**
- Create: `packages/plugins/content/src/lib/three-d/turntable.ts`
- Test: `packages/plugins/content/src/lib/three-d/turntable.test.ts`

**Interfaces:**
- Produces: `orbitAngles(count?: number, stepDeg?: number): { index: number; azimuthDeg: number }[]` — 0'dan başlayıp `count` açı, `stepDeg` aralık. Varsayılan 72 × 5° = 360°.

- [ ] **Step 1: Failing test**

```ts
// turntable.test.ts
import { describe, expect, test } from "bun:test"
import { orbitAngles } from "./turntable"

describe("orbitAngles", () => {
  test("varsayılan 72 kare, 5° aralık, 0→355", () => {
    const a = orbitAngles()
    expect(a.length).toBe(72)
    expect(a[0]).toEqual({ index: 0, azimuthDeg: 0 })
    expect(a[1].azimuthDeg).toBe(5)
    expect(a[71].azimuthDeg).toBe(355)
  })
  test("determinizm + özelleştirme (8 kare, 45°)", () => {
    const a = orbitAngles(8, 45)
    expect(a.map((x) => x.azimuthDeg)).toEqual([0, 45, 90, 135, 180, 225, 270, 315])
  })
})
```

- [ ] **Step 2: FAIL gör**

Run: `cd packages/plugins/content && bun test src/lib/three-d/turntable.test.ts`
Expected: FAIL ("Cannot find module './turntable'")

- [ ] **Step 3: turntable.ts yaz**

```ts
// turntable.ts
/** 360° yörünge açıları — index + azimuth (derece). Saf, deterministik. O(count). */
export const orbitAngles = (count = 72, stepDeg = 5): { index: number; azimuthDeg: number }[] =>
  Array.from({ length: count }, (_, index) => ({ index, azimuthDeg: index * stepDeg }))
```

- [ ] **Step 4: PASS**

Run: `cd packages/plugins/content && bun test src/lib/three-d/turntable.test.ts`
Expected: PASS (2 test)

- [ ] **Step 5: Commit**

```bash
git add packages/plugins/content/src/lib/three-d/turntable.ts packages/plugins/content/src/lib/three-d/turntable.test.ts
git commit -m "feat(content): turntable açı matematiği (72×5° orbit, deterministik)"
```

## Task 3: Tripo sağlayıcı client

**Files:**
- Create: `packages/plugins/content/src/lib/three-d/providers/tripo.ts`
- Test: `packages/plugins/content/src/lib/three-d/providers/tripo.test.ts`

**Interfaces:**
- Consumes: `ThreeDProvider`, `GenerateInput`, `GenerateResult`, `TaskStatus` (T1)
- Produces: `createTripoProvider(apiKey: string): ThreeDProvider`; `mapTripoStatus(s: string): TaskStatus` (saf, test edilir).

> **Not:** Canlı fetch = `TRIPO_API_KEY` gerekir (key-gated). Kredisiz test edilebilen = status eşleme + request gövdesi kurulumu. Adım-kodu Tripo API sözleşmesi DOĞRULANDIKTAN sonra kesinleşir (Step 0).

- [ ] **Step 0: Tripo API sözleşmesini doğrula**

`https://platform.tripo3d.ai` dokümanından teyit et: image upload (`POST /v2/openapi/upload` → `file_token`), task (`POST /v2/openapi/task` `{ type: "image_to_model", file: { type, file_token } }` → `task_id`), poll (`GET /v2/openapi/task/{task_id}` → `{ status, output: { model } }`), auth `Authorization: Bearer <key>`. Sapma varsa Step 3/4 kodunu güncelle.

- [ ] **Step 1: Failing test (saf: status eşleme)**

```ts
// tripo.test.ts
import { describe, expect, test } from "bun:test"
import { mapTripoStatus } from "./tripo"

describe("mapTripoStatus", () => {
  test("queued/running → processing", () => {
    expect(mapTripoStatus("queued")).toBe("processing")
    expect(mapTripoStatus("running")).toBe("processing")
  })
  test("success → ready; failed/unknown → failed", () => {
    expect(mapTripoStatus("success")).toBe("ready")
    expect(mapTripoStatus("failed")).toBe("failed")
    expect(mapTripoStatus("banned")).toBe("failed")
  })
})
```

- [ ] **Step 2: FAIL gör** → `bun test src/lib/three-d/providers/tripo.test.ts`

- [ ] **Step 3: tripo.ts yaz** (status eşleme + create/poll; Step 0'daki sözleşmeye göre)

```ts
// tripo.ts
import type { GenerateInput, GenerateResult, TaskStatus, ThreeDProvider } from "../types"

const BASE = "https://api.tripo3d.ai/v2/openapi"

/** Tripo görev durumu → iç TaskStatus (saf). */
export const mapTripoStatus = (s: string): TaskStatus =>
  s === "success" ? "ready" : s === "queued" || s === "running" ? "processing" : "failed"

const headers = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
})

/** Tripo image-to-3D sağlayıcısı. Canlı fetch — key-gated. */
export const createTripoProvider = (apiKey: string): ThreeDProvider => ({
  name: "tripo",
  async create(input: GenerateInput): Promise<GenerateResult> {
    // NOT: image upload → file_token akışı Step 0'da doğrulanır; burada ilk görsel kullanılır.
    const res = await fetch(`${BASE}/task`, {
      method: "POST",
      headers: headers(apiKey),
      body: JSON.stringify({ type: "image_to_model", file: { type: "jpg", url: input.images[0] } }),
    })
    const json: any = await res.json()
    const taskId = json?.data?.task_id
    if (!res.ok || !taskId) {
      return { providerTaskId: "", status: "failed", error: json?.message ?? `HTTP ${res.status}` }
    }
    return { providerTaskId: taskId, status: "processing" }
  },
  async poll(providerTaskId: string): Promise<GenerateResult> {
    const res = await fetch(`${BASE}/task/${providerTaskId}`, { headers: headers(apiKey) })
    const json: any = await res.json()
    const status = mapTripoStatus(json?.data?.status ?? "failed")
    return {
      providerTaskId,
      status,
      meshUrl: status === "ready" ? json?.data?.output?.model : undefined,
      error: status === "failed" ? (json?.data?.status ?? json?.message) : undefined,
    }
  },
})
```

- [ ] **Step 4: PASS** → `bun test src/lib/three-d/providers/tripo.test.ts` (2 test)

- [ ] **Step 5: Canlı duman testi (key-gated, Can/CI)** — `TRIPO_API_KEY` ile bir ürün fotoğrafı → `create` → `poll` döngüsü → GLB URL döner. (Kredisizse atlanır, işaretli.)

- [ ] **Step 6: Commit**

```bash
git add packages/plugins/content/src/lib/three-d/providers/tripo.ts packages/plugins/content/src/lib/three-d/providers/tripo.test.ts
git commit -m "feat(content): Tripo image-to-3D sağlayıcı client (create/poll + status eşleme)"
```

## Task 4: Product3DAsset modülü (model + migration + service)

**Files:**
- Create: `modules/product-3d/models/product-3d-asset.ts`, `service.ts`, `index.ts`
- Generate: `modules/product-3d/migrations/*` (via `medusa db:generate`)

**Interfaces:**
- Produces: `PRODUCT_3D_MODULE` sabiti + `Product3DAssetModuleService` (`createProduct3DAssets`, `listProduct3DAssets`, `retrieveProduct3DAsset`, `updateProduct3DAssets` — `MedusaService`'ten otomatik).

**Görev (content-library modülü birebir aynası):**
- **T4.1** `models/product-3d-asset.ts`:
```ts
import { model } from "@medusajs/framework/utils"

const Product3DAsset = model.define("product_3d_asset", {
  id: model.id().primaryKey(),
  tenant_id: model.text().nullable(),
  brand_id: model.text().nullable(),
  source: model.text(), // "physical" | "digital-mockup"
  inputs: model.json(), // string[] — girdi görselleri
  mesh_url: model.text().nullable(),
  thumbnail_url: model.text().nullable(),
  provider: model.text(),
  provider_task_id: model.text().nullable(),
  status: model.text(), // "processing" | "ready" | "failed"
  error: model.text().nullable(),
})

export default Product3DAsset
```
- **T4.2** `service.ts` (`MedusaService({ Product3DAsset })`) + `index.ts` (`Module("product3d", { service })`, sabit `PRODUCT_3D_MODULE = "product3d"`). content-library `service.ts`/`index.ts` birebir kalıp.
- **T4.3** Modülü host uygulamanın modül kaydına ekle (content-library nasıl kayıtlıysa aynısı) — plugin export / `medusa-config`.
- **T4.4** Migration üret: **REQUIRED SUB-SKILL** `medusa-dev:db-generate` (veya `npx medusa db:generate product3d`) → migration dosyası. `medusa db:migrate` ile uygula.

**Çıkış:** modül yükleniyor, `product_3d_asset` tablosu oluştu (migrate). Plugin build ✅.

**Commit:** `feat(content): Product3DAsset modülü (model + service + migration)`

## Task 5: create-3d-asset workflow + route'lar

**Files:**
- Create: `workflows/product-3d/create-3d-asset.ts`
- Create: `api/admin/content/3d/route.ts` (POST + GET list), `api/admin/content/3d/[id]/route.ts` (GET status)

**Interfaces:**
- Consumes: `createTripoProvider` (T3), `PRODUCT_3D_MODULE` (T4), `tenantScopeFilter`.
- Produces: `createProduct3DAssetWorkflow`; `POST /admin/content/3d` (`{ images, source? }` → asset `processing`), `GET /admin/content/3d/:id` (poll → güncelle → asset), `GET /admin/content/3d` (list).

**Görev (adım-kodu T3 Tripo sözleşmesi + T4 servis imzasına dayanır):**
- **T5.1** workflow/step: `createTripoProvider(process.env.TRIPO_API_KEY).create(images)` → `provider_task_id` + `status:"processing"` ile asset yarat (tenant_id enjekte). content-library `create-content-item` workflow kalıbı.
- **T5.2** `POST /admin/content/3d`: body doğrula (`images` şart) → workflow çalıştır → 201 asset. `MedusaError.INVALID_DATA` boş image'da.
- **T5.3** `GET /admin/content/3d/:id`: asset getir; `processing` ise `provider.poll(provider_task_id)` → `ready`/`failed`+`mesh_url` güncelle → döndür. (Poll-on-read; job yok.)
- **T5.4** `GET /admin/content/3d`: `tenantScopeFilter` + `listAndCount`, newest-first (packs/items route kalıbı).
- **T5.5** Doğrula: plugin build ✅; `:9000` route'ları 401 (kayıtlı). Canlı üretim = TRIPO_API_KEY (Can).

**Commit:** `feat(content): 3D varlık workflow + POST/GET route'ları (poll-on-read)`

## Task 6: Admin — yükle → üret → poll akışı

**Files:**
- Create: `routes/content/three-d-demo.tsx` + route map kaydı (`/content/3d-demo`)
- Modify: `hooks/api/content.tsx` — `use3DAssets`, `useCreate3DAsset`, `use3DAsset(id)` (mevcut usePacks/useEditImage kalıbı)

**Interfaces:**
- Consumes: `FileUpload` (mevcut `components/common/file-upload`), `Product3DAssetDTO` (frontend ayna tip).
- Produces: yükle → `useCreate3DAsset` → dönen id'yi `use3DAsset(id)` ile `refetchInterval` ile poll → `ready` olunca viewer'a geç.

**Görev:**
- **T6.1** hook'lar: `useCreate3DAsset` (POST /3d mutation), `use3DAsset(id)` (GET /3d/:id, `refetchInterval: status==="processing" ? 3000 : false`), `use3DAssets` (list).
- **T6.2** demo route: FileUpload → base64/URL → create → "işleniyor…" (poll) → `ready` → `<ModelViewerCanvas meshUrl>` (T7).
- **T6.3** route map'e `/content/3d-demo` ekle (mevcut demo route'lar gibi).

**Çıkış:** foto yükle → "işleniyor" → GLB gelince viewer açılır (Can gözle).

**Commit:** `feat(content): 3D üretim akışı UI (yükle→üret→poll) + hook'lar`

## Task 7: Admin — model-viewer + ekran görüntüsü yakalama

**Files:**
- Create: `routes/content/components/model-viewer-canvas.tsx`
- Modify: `packages/admin/dashboard/package.json` — `@google/model-viewer` bağımlılığı
- Modify: bir `d.ts` — `<model-viewer>` JSX intrinsic tipi

**Interfaces:**
- Produces: `<ModelViewerCanvas meshUrl onCapture={(dataUrl)=>...} />` — GLB'yi döndürülebilir render eder; "ekran görüntüsü" butonu current açıyı PNG yakalar.

**Görev:**
- **T7.1** `@google/model-viewer` ekle; `import "@google/model-viewer"` (custom element register). JSX tipi:
```ts
// model-viewer.d.ts
declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": any
  }
}
```
- **T7.2** bileşen: `<model-viewer src={meshUrl} camera-controls auto-rotate ar />` bir ref ile; "Ekran görüntüsü" butonu → `await ref.current.toBlob({ mimeType: "image/png" })` → `URL.createObjectURL` → `onCapture(dataUrl)` (kaydet/indir).
- **T7.3** Doğrula: Can gözle — GLB dönüyor mu, capture doğru açıyı PNG veriyor mu.

**Commit:** `feat(content): model-viewer 3D görüntüleyici + canlı açı ekran görüntüsü (toBlob)`

## Task 8: Admin — 72-kare turntable export

**Files:**
- Modify: `routes/content/components/model-viewer-canvas.tsx` (turntable fonksiyonu ekle)

**Interfaces:**
- Consumes: `orbitAngles` mantığı (frontend ayna: 72×5°), `<model-viewer>` `cameraOrbit` + `toBlob`.
- Produces: `exportTurntable(): Promise<string[]>` — 72 PNG data URL.

**Görev:**
- **T8.1** "Turntable (72 kare)" butonu: her açı için `mv.cameraOrbit = "<deg>deg 75deg auto"` set → bir frame bekle → `mv.toBlob()` → topla. `orbitAngles(72,5)` sırası.
- **T8.2** 72 kareyi indir (zip veya ardışık) veya library'ye kaydet. (İlk sürüm: array + önizleme şeridi; kayıt sonra.)
- **T8.3** Doğrula: Can gözle — 72 kare tam tur dönüyor, tutarlı.

**Commit:** `feat(content): GLB'den 72-kare turntable export (dönen ürün)`

**Faz A çıkış kriteri (tekrar):** `bun test src/lib/three-d` yeşil (turntable + tripo status) · plugin build ✅ · `/content/3d-demo`: foto → GLB → döndür → açı yakala (PNG) → turntable (Can gözle onaylı) · gerçek üretim = TRIPO_API_KEY.

---

## Self-Review

- **Spec coverage (Faz A):** capture UI→T6 · foto→GLB (Tripo)→T3,T5 · asset store→T4 · 360° viewer→T7 · screenshot capture→T7 · turntable→T2,T8. Kapsandı.
- **Placeholder:** T1/T2 tam kod+test; T3 status-map tam, canlı fetch Step 0 sözleşme-doğrulamasına bağlı (dürüst); T4-T8 görev+arayüz seviyesinde gerçek kod iskeletiyle (model/route/model-viewer) — canlı-API/render davranışına bağlı adımlar işaretli. Uydurma yok.
- **Tip tutarlılığı:** `Product3DAssetDTO`/`ThreeDProvider`/`GenerateResult`/`TaskStatus`/`orbitAngles`/`mapTripoStatus` görevler arası tutarlı.
- **Multi-tenant:** tenant_id model+route'ta (T4/T5).
- **Kredi/görsel kapıları:** canlı Tripo + viewer render işaretli; kredisiz-önce (T1/T2/T3-status).

---

*Oluşturuldu: 2026-07-07 · Spec: 2026-07-07-3d-product-studio-design.md v2 · Faz A execute-ready (T1/T2 tam TDD, T3 sözleşme-doğrulamalı, T4-T8 görev+iskelet) · sağlayıcı: Tripo (Meshy swap)*
