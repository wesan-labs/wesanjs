# Template Content Studio — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (önerilen) veya superpowers:executing-plans ile bu planı görev-görev uygula. Adımlar checkbox (`- [ ]`) ile izlenir.

**Goal:** Canva-tarzı marka-template'lerini (foto önce) kuran, AI ile markaya dolduran, react-konva editöründe düzenlenebilen, planlanıp paylaşılan bir içerik stüdyosu inşa etmek.

**Architecture:** Backend (Medusa content plugin) template veri modeli + marka-fill (deterministik token + LLM kopya + v2 compose görsel-slot) tutar; frontend (React 18 dashboard) react-konva@18 üstünde sahne render + editör + galeri sağlar. v2 compile-and-cache motoru (`lib/packs`) görsel-slot beyni olarak yeniden kullanılır. Motor: KUR (react-konva DIY, sıfır lisans).

**Tech Stack:** TypeScript strict · Medusa v2 content plugin · bun test (saf mantık) · React 18 + Vite (dashboard) · @medusajs/ui · **react-konva@18 + konva@9** (root resolutions'da pinli) · TanStack Query · v2 `lib/packs` compose motoru.

## Global Constraints

- **react-konva 18.2.10 + konva 9.3.6** — root `package.json` resolutions'da pinli (React 18 uyumu). Yükseltme YOK.
- **Stil:** noktalı virgülsüz, çift tırnak, 2-boşluk (Medusa Prettier). Dosya adı kebab-case, tip/bileşen PascalCase, DB snake_case.
- **JSON import** (readFileSync değil) — `medusa plugin:build` bundle'ı için (bkz. prompt-library.ts:60).
- **Saf mantık `bun test` ile test edilir** (`bun test src/lib/...`); react-konva görsel render Can tarafından gözle doğrulanır (memory: görsel yargı Can'da, Playwright yok).
- **Test dosyaları** `tsconfig.json` exclude'da (`**/*.test.ts`) — `medusa plugin:build`'i kırmasın.
- **Kredi-gated** (Gemini görsel üretimi) adımlar işaretli; kredisiz doğrulanabilenler önce.
- **Determinizm:** aynı template + aynı marka → byte-identical resolved sahne (görsel-slot AI hariç).
- **Commit:** `type(scope): mesaj` tek satır, imzasız (repo konvansiyonu, `feat(content):`).

---

## Dosya Yapısı (tüm fazlar)

**Backend — `packages/plugins/content/src/`**
```
lib/templates/
  types.ts              # Template, Slot, SceneNode, SceneJSON tipleri            [Faz 1]
  schema.ts             # Zod şema — Template/Scene doğrulama                     [Faz 1]
  resolve.ts            # resolveScene(template, fillData) → çözülmüş SceneJSON    [Faz 1]
  fill.ts               # buildFillData(template, brand, media) → FillData        [Faz 2]
  copy.ts               # LLM kopya üretimi (text slot'ları)                      [Faz 2]
  loader.ts             # template JSON yükle, markaya göre öner                  [Faz 4]
  data/*.template.json  # kürlenmiş template'ler                                  [Faz 4]
api/admin/content/
  templates/route.ts        # GET list + recommend (brandId ile)                 [Faz 4]
  templates/fill/route.ts   # POST fill → resolved scene + fillData               [Faz 2]
```

**Frontend — `packages/admin/dashboard/src/`**
```
routes/content/components/
  scene-renderer.tsx    # SceneJSON → react-konva Stage (read-only render)        [Faz 1]
  template-editor.tsx   # sahne + slot düzenleme + PNG export                     [Faz 3]
  template-gallery.tsx  # önerili template ızgarası                               [Faz 4]
hooks/api/content.tsx   # useTemplates, useFillTemplate (mevcut dosyaya ekle)     [Faz 2/4]
routes/content/index.tsx# yolculuk şeridi + template akışı entegrasyon            [Faz 5]
```

**Faz → çıktı**
1. Template veri modeli + react-konva sahne render (read-only)
2. Marka-fill (token + kopya + compose görsel-slot) + fill API
3. Editör (slot düzenle + export)
4. Kürlenmiş kütüphane + galeri + öneri
5. UI redesign yolculuğu (Adım ⓪-⑤ bağlı akış)
6. Video template (Revideo, sonra)

---

# FAZ 1 — Template veri modeli + sahne render (EXECUTE-READY)

**Hedef:** Bir template'i (JSON sahne + tipli slot) tanımla, doğrula, fill-data ile çöz, ve react-konva ile ekrana bas. Kredisiz. Saf mantık `bun test`; render Can gözle doğrular.

### Task 1: Template & Scene tipleri

**Files:**
- Create: `packages/plugins/content/src/lib/templates/types.ts`

**Interfaces:**
- Produces: `Template`, `Slot`, `SceneNode`, `SceneJSON`, `FillData` tipleri (aşağıdaki imzalar).

- [ ] **Step 1: Tipleri yaz**

```ts
// packages/plugins/content/src/lib/templates/types.ts
/** Template = tipli slot'lu react-konva sahnesi (mimari v3 §2). */

export type SlotBind =
  | { kind: "text"; role: "headline" | "body" | "cta" | "custom"; maxLen?: number }
  | { kind: "color"; role: "primary" | "secondary" | "accent" }
  | { kind: "font"; role: "primary" | "secondary" }
  | { kind: "logo" }
  | { kind: "image"; source: "user-media" | "ai-generate" }

export interface Slot {
  id: string
  bind: SlotBind
}

/** react-konva node — sahne ağacı. `slotId` verilirse fill ile doldurulur. */
export interface SceneNode {
  type: "Rect" | "Text" | "Image" | "Group"
  id: string
  slotId?: string
  attrs: Record<string, unknown> // x,y,width,height,fill,text,fontFamily,src...
  children?: SceneNode[]
}

export interface SceneJSON {
  width: number
  height: number
  background?: string
  nodes: SceneNode[]
}

export interface Template {
  id: string
  kind: "image" // Faz 6'da "video"
  format: string // "ig-post-1x1" | "ig-story-9x16" | "og-16x9"...
  label: string
  domainTags?: string[]
  scene: SceneJSON
  slots: Slot[]
  thumbnail?: string
}

/** Slot id → uygulanacak değer (fill.ts üretir). */
export interface FillData {
  [slotId: string]:
    | { kind: "text"; value: string }
    | { kind: "color"; value: string }
    | { kind: "font"; value: string }
    | { kind: "image"; value: string } // data URL veya http URL
}

/** resolve hatası — çözülemeyen slot / geçersiz sahne. */
export class TemplateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TemplateError"
  }
}
```

- [ ] **Step 2: Derlenme kontrolü**

Run: `cd packages/plugins/content && npx tsc --noEmit --strict --skipLibCheck --module esnext --moduleResolution bundler --target ES2021 src/lib/templates/types.ts`
Expected: hata yok (exit 0)

- [ ] **Step 3: Commit**

```bash
git add packages/plugins/content/src/lib/templates/types.ts
git commit -m "feat(content): template & scene tipleri (JSON sahne + tipli slot)"
```

### Task 2: Zod şema doğrulama

**Files:**
- Create: `packages/plugins/content/src/lib/templates/schema.ts`
- Test: `packages/plugins/content/src/lib/templates/schema.test.ts`

**Interfaces:**
- Consumes: `Template`, `SceneJSON` (Task 1)
- Produces: `TemplateSchema` (zod), `validateTemplate(input: unknown): Template`

- [ ] **Step 1: Failing test yaz**

```ts
// schema.test.ts
import { describe, expect, test } from "bun:test"
import { validateTemplate } from "./schema"

const valid = {
  id: "t1", kind: "image", format: "ig-post-1x1", label: "Basit",
  scene: { width: 1080, height: 1080, nodes: [
    { type: "Text", id: "n1", slotId: "s-head", attrs: { x: 40, y: 40, text: "" } },
  ] },
  slots: [{ id: "s-head", bind: { kind: "text", role: "headline" } }],
}

describe("validateTemplate", () => {
  test("geçerli template geçer", () => {
    expect(validateTemplate(valid).id).toBe("t1")
  })
  test("eksik scene reddedilir", () => {
    expect(() => validateTemplate({ ...valid, scene: undefined })).toThrow()
  })
  test("bilinmeyen slot bind reddedilir", () => {
    const bad = { ...valid, slots: [{ id: "s", bind: { kind: "nope" } }] }
    expect(() => validateTemplate(bad)).toThrow()
  })
})
```

- [ ] **Step 2: Test'i çalıştır, FAIL gör**

Run: `cd packages/plugins/content && bun test src/lib/templates/schema.test.ts`
Expected: FAIL ("Cannot find module './schema'")

- [ ] **Step 3: schema.ts yaz**

```ts
// schema.ts
import { z } from "zod"
import type { Template } from "./types"

const slotBind = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), role: z.enum(["headline", "body", "cta", "custom"]), maxLen: z.number().optional() }),
  z.object({ kind: z.literal("color"), role: z.enum(["primary", "secondary", "accent"]) }),
  z.object({ kind: z.literal("font"), role: z.enum(["primary", "secondary"]) }),
  z.object({ kind: z.literal("logo") }),
  z.object({ kind: z.literal("image"), source: z.enum(["user-media", "ai-generate"]) }),
])

const sceneNode: z.ZodType = z.lazy(() =>
  z.object({
    type: z.enum(["Rect", "Text", "Image", "Group"]),
    id: z.string(),
    slotId: z.string().optional(),
    attrs: z.record(z.unknown()),
    children: z.array(sceneNode).optional(),
  })
)

export const TemplateSchema = z.object({
  id: z.string(),
  kind: z.literal("image"),
  format: z.string(),
  label: z.string(),
  domainTags: z.array(z.string()).optional(),
  scene: z.object({
    width: z.number(),
    height: z.number(),
    background: z.string().optional(),
    nodes: z.array(sceneNode),
  }),
  slots: z.array(z.object({ id: z.string(), bind: slotBind })),
  thumbnail: z.string().optional(),
})

export const validateTemplate = (input: unknown): Template =>
  TemplateSchema.parse(input) as Template
```

- [ ] **Step 4: Test PASS**

Run: `cd packages/plugins/content && bun test src/lib/templates/schema.test.ts`
Expected: PASS (3 test)

- [ ] **Step 5: Commit**

```bash
git add packages/plugins/content/src/lib/templates/schema.ts packages/plugins/content/src/lib/templates/schema.test.ts
git commit -m "feat(content): template Zod şema doğrulama"
```

### Task 3: resolveScene — fill-data'yı sahneye uygula

**Files:**
- Create: `packages/plugins/content/src/lib/templates/resolve.ts`
- Test: `packages/plugins/content/src/lib/templates/resolve.test.ts`

**Interfaces:**
- Consumes: `Template`, `SceneJSON`, `FillData`, `TemplateError` (Task 1)
- Produces: `resolveScene(template: Template, fill: FillData): SceneJSON` — slot'lu node'ların attrs'ını fill değeriyle günceller (text→text attr, color→fill attr, font→fontFamily, image→src). Slot fill'de yoksa TemplateError.

- [ ] **Step 1: Failing test yaz**

```ts
// resolve.test.ts
import { describe, expect, test } from "bun:test"
import { resolveScene } from "./resolve"
import type { Template, FillData } from "./types"

const tpl: Template = {
  id: "t", kind: "image", format: "ig-post-1x1", label: "x",
  scene: { width: 1080, height: 1080, background: "#fff", nodes: [
    { type: "Text", id: "n1", slotId: "head", attrs: { x: 40, y: 40, text: "", fill: "#000", fontFamily: "Arial" } },
    { type: "Rect", id: "n2", slotId: "bg", attrs: { x: 0, y: 0, width: 1080, height: 200, fill: "#eee" } },
    { type: "Text", id: "n3", attrs: { x: 40, y: 900, text: "sabit" } },
  ] },
  slots: [
    { id: "head", bind: { kind: "text", role: "headline" } },
    { id: "bg", bind: { kind: "color", role: "primary" } },
  ],
}

const fill: FillData = {
  head: { kind: "text", value: "Merhaba" },
  bg: { kind: "color", value: "#3b2a20" },
}

describe("resolveScene", () => {
  test("text slot → text attr; color slot → fill attr; sabit node dokunulmaz", () => {
    const s = resolveScene(tpl, fill)
    expect((s.nodes[0].attrs as any).text).toBe("Merhaba")
    expect((s.nodes[1].attrs as any).fill).toBe("#3b2a20")
    expect((s.nodes[2].attrs as any).text).toBe("sabit")
  })
  test("determinizm: 2 çağrı byte-identical", () => {
    expect(JSON.stringify(resolveScene(tpl, fill))).toBe(JSON.stringify(resolveScene(tpl, fill)))
  })
  test("eksik slot fill → TemplateError", () => {
    expect(() => resolveScene(tpl, { head: { kind: "text", value: "x" } })).toThrow()
  })
})
```

- [ ] **Step 2: FAIL gör**

Run: `cd packages/plugins/content && bun test src/lib/templates/resolve.test.ts`
Expected: FAIL ("Cannot find module './resolve'")

- [ ] **Step 3: resolve.ts yaz**

```ts
// resolve.ts
import { TemplateError, type FillData, type SceneJSON, type SceneNode, type Slot, type Template } from "./types"

// slot bind türü → hangi attr'a yazılır
const attrFor: Record<string, string> = {
  text: "text", color: "fill", font: "fontFamily", image: "src", logo: "src",
}

const applyNode = (node: SceneNode, fill: FillData, slotIndex: Map<string, Slot>): SceneNode => {
  let attrs = node.attrs
  if (node.slotId) {
    const slot = slotIndex.get(node.slotId)
    if (!slot) throw new TemplateError(`Node ${node.id} bilinmeyen slot ${node.slotId}`)
    const v = fill[node.slotId]
    if (!v) throw new TemplateError(`Slot ${node.slotId} için fill yok`)
    const attr = attrFor[v.kind]
    attrs = { ...attrs, [attr]: v.value }
  }
  return {
    ...node,
    attrs,
    children: node.children?.map((c) => applyNode(c, fill, slotIndex)),
  }
}

/** Template + fill → çözülmüş sahne. Deterministik (saf). O(node sayısı). */
export const resolveScene = (template: Template, fill: FillData): SceneJSON => {
  const slotIndex = new Map(template.slots.map((s) => [s.id, s]))
  return {
    ...template.scene,
    nodes: template.scene.nodes.map((n) => applyNode(n, fill, slotIndex)),
  }
}
```

- [ ] **Step 4: Test PASS**

Run: `cd packages/plugins/content && bun test src/lib/templates`
Expected: PASS (tüm template testleri)

- [ ] **Step 5: Commit**

```bash
git add packages/plugins/content/src/lib/templates/resolve.ts packages/plugins/content/src/lib/templates/resolve.test.ts
git commit -m "feat(content): resolveScene — fill-data'yı tipli slot'lara uygula (deterministik)"
```

### Task 4: react-konva SceneRenderer (frontend, görsel)

**Files:**
- Create: `packages/admin/dashboard/src/routes/content/components/scene-renderer.tsx`

**Interfaces:**
- Consumes: `SceneJSON`, `SceneNode` (backend tiplerinin frontend aynası — dashboard'da yerel tip)
- Produces: `<SceneRenderer scene={SceneJSON} />` — react-konva `Stage`/`Layer` ile sahneyi render eder.

> Not: react-konva render'ı `bun test` ile test edilmez (canvas/DOM). Doğrulama: Can gözle (bir sahne JSON'u verilip Storybook-benzeri geçici sayfada ya da studio'da render'ı görülür). Adım kodu tam; test yerine görsel-doğrulama.

- [ ] **Step 1: SceneRenderer yaz**

```tsx
// scene-renderer.tsx
import { useEffect, useRef, useState } from "react"
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group } from "react-konva"

interface SceneNode {
  type: "Rect" | "Text" | "Image" | "Group"
  id: string
  attrs: Record<string, any>
  children?: SceneNode[]
}
export interface SceneJSON { width: number; height: number; background?: string; nodes: SceneNode[] }

const useImg = (src?: string) => {
  const [img, setImg] = useState<HTMLImageElement>()
  useEffect(() => {
    if (!src) return
    const i = new window.Image()
    i.crossOrigin = "anonymous"
    i.src = src
    i.onload = () => setImg(i)
  }, [src])
  return img
}

const NodeView = ({ node }: { node: SceneNode }) => {
  const img = useImg(node.type === "Image" ? node.attrs.src : undefined)
  if (node.type === "Rect") return <Rect {...node.attrs} />
  if (node.type === "Text") return <Text {...node.attrs} />
  if (node.type === "Image") return img ? <KonvaImage image={img} {...node.attrs} /> : null
  if (node.type === "Group")
    return <Group {...node.attrs}>{node.children?.map((c) => <NodeView key={c.id} node={c} />)}</Group>
  return null
}

/** SceneJSON → react-konva Stage. `scale` ile konteynere sığdır. */
export const SceneRenderer = ({ scene, scale = 1 }: { scene: SceneJSON; scale?: number }) => (
  <Stage width={scene.width * scale} height={scene.height * scale} scaleX={scale} scaleY={scale}>
    <Layer>
      {scene.background && <Rect x={0} y={0} width={scene.width} height={scene.height} fill={scene.background} />}
      {scene.nodes.map((n) => <NodeView key={n.id} node={n} />)}
    </Layer>
  </Stage>
)
```

- [ ] **Step 2: Typecheck**

Run: `cd packages/admin/dashboard && yarn typecheck 2>&1 | grep scene-renderer || echo "temiz"`
Expected: "temiz" (bu dosyada hata yok)

- [ ] **Step 3: Görsel doğrulama (Can)**

Studio'da (veya geçici bir route'ta) örnek bir `resolveScene` çıktısını `<SceneRenderer>`'a ver, Can render'ı gözle onaylasın (metin/renk/dikdörtgen doğru mu).

- [ ] **Step 4: Commit**

```bash
git add packages/admin/dashboard/src/routes/content/components/scene-renderer.tsx
git commit -m "feat(content): react-konva SceneRenderer — SceneJSON → Stage"
```

**Faz 1 çıkış kriteri:** `bun test src/lib/templates` yeşil (types/schema/resolve) + `<SceneRenderer>` bir resolved sahneyi ekrana basıyor (Can gözle onaylı).

---

# FAZ 2 — Marka-fill (token + kopya + compose görsel-slot)

**Hedef:** `buildFillData(template, brand, media)` → her slot için değer üret: color/font/logo **deterministik** (marka token), text **LLM** (marka sesi), image(ai-generate) **v2 compose motoru** → Gemini, image(user-media) kullanıcı görseli. + `POST /templates/fill` API.

**Files:** Create `lib/templates/fill.ts`, `lib/templates/copy.ts`, `api/admin/content/templates/fill/route.ts`, testler.

**Interfaces:**
- Consumes: `Template`, `FillData` (Faz 1); `BrandIdentity`, `composeWithBrand`/`compose` (`lib/packs/loader`, v2); `editImage` (`lib/ai/content-generator`).
- Produces: `buildFillData(template, brand, opts: { media?: string }): Promise<FillData>`; `generateCopy(slot, brand): Promise<string>` (copy.ts).

**Görev listesi (adım-kodu bu faza gelince kesinleşir — Faz 1'in resolve/tip çıktısına ve v2 compose imzasına dayanır):**
- **T2.1** `fill.ts`: color/font/logo slot'larını `brand.visual`/logo'dan deterministik doldur → `bun test` (kredisiz). *[önce]*
- **T2.2** `copy.ts`: text slot'ları için LLM kopya (marka `voice`/`vocabulary`; `generateText` mevcut) → kredisiz test: prompt kompozisyonu deterministik; LLM çağrısı mock. *[kredi-gated: gerçek kopya]*
- **T2.3** image(ai-generate) slot'u: v2 `composeWithBrand` ile instruction üret → not: gerçek görsel `editImage`/Gemini **kredi-gated**; kredisiz kısım = instruction determinizmi (v2 testleriyle zaten kanıtlı).
- **T2.4** `POST /admin/content/templates/fill` route: `{ templateId|template, brand, media? }` → `buildFillData` → `resolveScene` → `{ scene, fillData }`. Curl ile doğrula (kredisiz: token+copy-mock; kredili: görsel).
- **T2.5** `useFillTemplate` hook (dashboard) — mevcut `content.tsx` pattern'i.

**Çıkış kriteri:** `bun test src/lib/templates` (fill token+copy-kompozisyon) yeşil; `POST /fill` bir template'i markaya doldurup resolved sahne döndürüyor (görsel-slot kredi gelince).

---

# FAZ 3 — Editör (slot düzenle + export)

**Hedef:** Doldurulmuş sahne react-konva editöründe açılır; kullanıcı metin/renk/font/logo/görsel'i değiştirir, sürükle/boyutlandır yapar, PNG export eder → yeni versiyon.

**Files:** Create `routes/content/components/template-editor.tsx`; `scene-renderer.tsx`'i seçilebilir/düzenlenebilir hale genişlet.

**Interfaces:**
- Consumes: `SceneRenderer`/`SceneJSON` (Faz 1); resolved scene (Faz 2).
- Produces: `<TemplateEditor scene onSave={(dataUrl)=>...} />` — düzenlenmiş sahneyi `stage.toDataURL()` ile export.

**Görev listesi (adım-kodu Faz 1 SceneRenderer'ın gerçek yapısına dayanır):**
- **T3.1** Seçim/transform: react-konva `Transformer` ile node seç, taşı/boyutlandır → görsel (Can doğrular).
- **T3.2** Text düzenleme: seçili text node → inline input → attrs.text güncelle.
- **T3.3** Renk/font kontrolleri: seçili node için renk-picker + font-select (marka paletinden).
- **T3.4** Görsel değiştir: image slot → yeni yükle veya AI-yeniden-üret (compose).
- **T3.5** Export: `stage.toDataURL({ pixelRatio: 2 })` → `onSave(dataUrl)` → `addVersion` (mevcut studio versiyon sistemi).
- **T3.6** Studio entegrasyonu: "Düzenle" bu editörü açar (Filerobot yerine; Filerobot kalkar/ikincil).

**Çıkış kriteri:** doldurulmuş bir template editörde açılır, kullanıcı bir metni+rengi değiştirir, export eder, yeni versiyon oluşur (Can gözle).

---

# FAZ 4 — Kürlenmiş kütüphane + galeri + öneri

**Hedef:** Küçük kürlenmiş template seti (format × birkaç stil); markaya göre önerili galeri UI.

**Files:** Create `lib/templates/data/*.template.json` (3-5 format × birkaç), `lib/templates/loader.ts`, `api/admin/content/templates/route.ts`, `routes/content/components/template-gallery.tsx`; `useTemplates` hook.

**Interfaces:**
- Consumes: `Template`/`validateTemplate` (Faz 1); `BrandIdentity` (v2).
- Produces: `listTemplates(filter?)`, `recommendTemplates(brand): Template[]` (loader.ts); `GET /admin/content/templates?brandId=` → `{ templates }`; `<TemplateGallery onPick={(t)=>...} />`.

**Görev listesi:**
- **T4.1** 3-5 gerçek `*.template.json` yaz (ig-post 1:1, story 9:16, og 16:9 — her biri slot'lu). `bun test`: hepsi `validateTemplate`'ten geçer + resolve token-fill ile token kalmaz.
- **T4.2** `loader.ts`: JSON import (bundle), `recommendTemplates(brand)` = `domainTags`/format'a göre skorla+sırala (deterministik, `bun test`).
- **T4.3** `GET /templates` route + `useTemplates` hook.
- **T4.4** `<TemplateGallery>`: önerili template ızgarası (thumbnail + format sekmeleri); seçince Faz 2 fill'e gider.

**Çıkış kriteri:** galeri markaya-önerili template'leri gösterir; birini seçince fill→editör akışı çalışır.

---

# FAZ 5 — UI redesign yolculuğu

**Hedef:** Studio'yu tek bağlı iplik haline getir (mimari v3 §6): Marka⓪ → Template① → AI-doldur② → Editör③ → Metin④ → Planla/Paylaş⑤; üstte hep-görünür yolculuk şeridi. "Akış-gizli + dağınık" ağrılarını çözer.

**Files:** Modify `routes/content/index.tsx` (Header/stepper → yolculuk şeridi; görsel adımı → template galerisi + editör); mevcut PackPicker → template galerisine devreder.

**Görev listesi (adım-kodu Faz 1-4'ün gerçek bileşenlerine — TemplateGallery/TemplateEditor/SceneRenderer — dayanır, o yüzden o fazlar bitince kesinleşir):**
- **T5.1** Yolculuk şeridi bileşeni: hep-görünür, neredeyim + tüm adımlar (Marka/Template/Doldur/Düzenle/Metin/Paylaş), bağlı "sonraki".
- **T5.2** Görsel adımını template-first yap: galeri → seç → AI-doldur önizleme → editör. PackPicker'ı galeriye devret (v2 "Markandan üret" = AI-doldur adımının bir modu).
- **T5.3** Marka Adım ⓪: nudge → AI-destekli prompt kurulumu (v2 #0012 hybrid — capture MVP).
- **T5.4** Boş-durum + progressive disclosure: no-scroll iki-kolon (ürün niyeti §9b), aynı anda 50 kontrol yok.

**Çıkış kriteri:** kullanıcı marka→template→doldur→düzenle→paylaş yolculuğunu kesintisiz, her adımda "neredeyim/sonraki" görünür şekilde tamamlar (Can gözle onay).

---

# FAZ 6 — Video template (SONRA)

**Hedef:** Video template'leri (props-güdümlü). **Ön-koşul:** foto akışı (Faz 1-5) kanıtlandıktan sonra; ve **Revideo vs Remotion kararı** o zaman verilir (mimari v3 §3 — Revideo MIT ama bakım riski; Remotion Automators ücretli).

**Görev listesi (yalnız iskelet — motor kararı + foto fazları bitmeden adım-kodu yazılmaz, yoksa placeholder olur):**
- **T6.1** Motor kararı: Revideo (MIT, self-host) vs Remotion (Automators) — güncel maliyet/bakımla yeniden değerlendir.
- **T6.2** Video template tipi: `Template.kind="video"` + props-şeması (foto Slot modelinin video karşılığı).
- **T6.3** Marka-props fill: brand → video props (logo/renk/kopya/medya).
- **T6.4** Player önizleme (React embed) + render (self-host/serverless).
- **T6.5** Editör (isteğe bağlı): timeline/prop tweak.

**Çıkış kriteri:** bir video template'i markaya doldurulup önizlenir + render edilir.

---

## Self-Review

- **Spec coverage:** v3 §2 (veri modeli)→Faz1 · §2 fill→Faz2 · editör(§6 Adım③)→Faz3 · galeri/öneri(§5,§6①)→Faz4 · UI yolculuk(§6)→Faz5 · video(§3,§9 Faz6)→Faz6. Marka kurulum(§4)→Faz5 T5.3. Kapsandı.
- **Placeholder:** Faz 1 adım-kodu tam (types/schema/resolve/renderer gerçek kod). Faz 2-6 "görev listesi + arayüz" — adım-kodu bilinçli ertelendi (önceki fazın GERÇEK çıktısına dayanır; şimdi yazmak placeholder/tahmin olurdu, plan kuralına aykırı). Bu bir eksik değil, doğruluk kararı.
- **Tip tutarlılığı:** `resolveScene(template, fill)`, `SceneJSON`, `FillData`, `buildFillData` isimleri fazlar arası tutarlı.
- **Ölçek:** her faz kendi çalışan+test-edilebilir dilimi; foto-önce, kredisiz-önce.

---

## Uygulama Durumu (2026-07-07 · yürütme)

| Faz | Durum | Kanıt |
|-----|-------|-------|
| **Faz 1** template modeli + render | ✅ **bitti** | `lib/templates/{types,schema,resolve}.ts` · 6 `bun test` · `SceneRenderer` · `/content/scene-demo` |
| **Faz 2** marka-fill | 🟡 **kredisiz yarı bitti** | `fill.ts` `buildFillData` (color/copy deterministik) · `POST /templates/fill` (:9000 401 canlı) · 4 test. **Kalan (kredi-gated):** LLM kopya (`copy.ts`), AI görsel-slot (compose→Gemini) |
| **Faz 3** editör | ✅ **çekirdek bitti** | `template-editor.tsx` (seç/taşı/boyutlandır + metin/renk/font + senkron PNG export) · `/content/editor-demo`. **Kalan:** görsel-değiştir (upload/AI), studio entegrasyonu (T3.6 = Faz 5) |
| **Faz 4** kütüphane + galeri | ✅ **bitti** | 3 `*.template.json` (1:1/9:16/16:9) · `loader.ts` recommend (7 test) · `GET /templates` (401 canlı) · `TemplateGallery` · `/content/gallery-demo` |
| **Uçtan-uca** | ✅ **kredisiz dilim çalışıyor** | `/content/flow-demo`: galeri→seç→doldur→editör→export. `useFillTemplate` |
| **Faz 5** UI yolculuğu | ⛔ başlanmadı | studio'ya gömme (Marka⓪→…→Paylaş⑤) — Faz 2 kredi-gated kısmına da bağlı |
| **Faz 6** video | ⛔ başlanmadı | foto kanıtlandıktan sonra + Revideo/Remotion kararı |

**Doğrulama sınırı:** tüm saf mantık `bun test` yeşil; render/editör/galeri = Can gözle (`/content/*-demo` route'ları). Gerçek LLM kopya + Gemini görsel = kredi.

---

*Oluşturuldu: 2026-07-07 · Spec: content-studio-template-model.md (v3) · Faz 1 execute-ready; Faz 2-6 görev-seviyesi (adım-kodu execution'da kesinleşir) · Yürütme: Faz 1/3/4 + Faz 2 kredisiz yarı bitti (11 commit)*
