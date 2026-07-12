import { geminiGenerate, geminiImage, type MediaImage } from "./gemini-client"

/**
 * Outcome-akışı "tek geçiş taslağı" (§3.1 ③): ürün fotoğraflarından satışa-hazır
 * taslak — temiz mağaza görseli + açıklama + sosyal caption. Reusable (route,
 * workflow, başka modül çağırabilir). Her parça bağımsız yeniden-üretilebilir.
 */
export interface StudioDraft {
  heroImage: string // data-URL — temiz stüdyo görseli
  description: string // mağaza açıklaması
  caption: string // sosyal caption
}

const HERO_PROMPT =
  "Clean professional e-commerce product photo of this exact product: seamless neutral studio background, soft even lighting, remove any clutter or distractions, keep the product identical (shape, color, material). No text, no watermark."

/** Yalnız temiz hero görseli üret. Reusable parça. */
export const produceHero = (images: MediaImage[]): Promise<string> =>
  geminiImage({ prompt: HERO_PROMPT, images: images.slice(0, 3) })

/** Yalnız metin (açıklama+caption). Reusable parça. */
export const produceCopy = async (
  images: MediaImage[],
  productName?: string
): Promise<{ description: string; caption: string }> => {
  const raw = await geminiGenerate({
    system: "Sen bir e-ticaret içerik uzmanısın. Ürün görsellerine bakıp SADECE Türkçe, satışa yönelik çıktı ver.",
    text:
      `Bu ürün için${productName ? ` (ürün adı: ${productName})` : ""}: ` +
      `(1) kısa bir mağaza AÇIKLAMASI — 2-3 cümle, faydaya vurgu. ` +
      `(2) bir sosyal medya CAPTION'ı — 1-2 cümle + 3-5 hashtag. ` +
      `Yanıtı JSON ver: {"description":"...","caption":"..."}`,
    images: images.slice(0, 3),
    json: true,
  })
  try {
    const p = JSON.parse(raw)
    return { description: String(p?.description ?? ""), caption: String(p?.caption ?? "") }
  } catch {
    return { description: raw.slice(0, 400), caption: "" }
  }
}

/** Tam taslak — hero + metin PARALEL (hız). Reusable orkestrasyon. */
export const produceDraft = async (images: MediaImage[], productName?: string): Promise<StudioDraft> => {
  if (!images.length) throw new Error("en az bir ürün fotoğrafı gerekli")
  const [heroImage, copy] = await Promise.all([produceHero(images), produceCopy(images, productName)])
  return { heroImage, ...copy }
}
