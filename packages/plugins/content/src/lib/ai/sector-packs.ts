import type { LibraryPrompt } from "./prompt-library"

/**
 * Sector packs — the library JSON was authored for a single vertical (furniture
 * e-commerce). These packs add Can's actual verticals (mobile game / mobile app
 * / SaaS web) as first-class image-prompt sets, in the SAME shape as the data
 * file so the engine can merge them transparently. Text prompts stay sector-
 * neutral ("universal"); only the visual prompts are vertical-specific.
 */

export interface Sector {
  id: string
  label: string
}

/** Selectable sectors (the primary filter axis). `universal` is implicit. */
export const SECTORS: Sector[] = [
  { id: "mobile-game", label: "Mobil Oyun" },
  { id: "mobile-app", label: "Mobil Uygulama" },
  { id: "saas-web", label: "SaaS Web" },
  { id: "furniture", label: "Mobilya / E-ticaret" },
]

/** Variable examples for the new sector vars (so previews/autofill stay coherent). */
export const SECTOR_VARIABLES: Record<
  string,
  { type: string; example: string; description?: string }
> = {
  GAME_NAME: { type: "string", example: "Idle Tycoon Empire" },
  GAME_GENRE: { type: "string", example: "idle tycoon", description: "oyun türü" },
  GAME_ART_STYLE: {
    type: "string",
    example: "stylized 3D low-poly, vibrant cartoon",
  },
  GAME_HERO: { type: "string", example: "cheerful cartoon tycoon boss" },
  GAME_MOOD: { type: "string", example: "fun, energetic" },
  GAME_HEADLINE: { type: "string", example: "Build your empire!" },
  GAME_FEATURE: { type: "string", example: "idle empire automation" },
  GAME_REWARD: { type: "string", example: "legendary business chest" },
  GAME_MILESTONE: { type: "string", example: "1,000,000 players" },
  GAME_RATING: { type: "string", example: "4.8★ rating" },
  APP_NAME: { type: "string", example: "FitFlow" },
  APP_CATEGORY: { type: "string", example: "fitness tracking" },
  APP_FEATURE: { type: "string", example: "AI workout planner" },
  APP_COLOR: { type: "string", example: "electric blue" },
  APP_HEADLINE: { type: "string", example: "Train smarter, not harder" },
  SAAS_NAME: { type: "string", example: "FlowDesk" },
  SAAS_CATEGORY: { type: "string", example: "team analytics platform" },
  SAAS_FEATURE: { type: "string", example: "real-time dashboards" },
  SAAS_COLOR: { type: "string", example: "indigo" },
  SAAS_HEADLINE: { type: "string", example: "Ship faster with one source of truth" },
}

const out = (shape: string) => ({ format: "list", shape })
const SRC = "levios sector-packs"

/** Helper to keep each entry terse. */
const mk = (
  p: Omit<LibraryPrompt, "platform" | "content_type" | "output" | "source"> & {
    sector: string
    platform?: string
    shape?: string
  }
): LibraryPrompt & { sector: string } => ({
  platform: p.platform ?? "cross-platform",
  content_type: "image-prompt",
  output: out(p.shape ?? "tek görsel-üretim prompt (en)"),
  source: SRC,
  ...p,
})

const GAME: Array<LibraryPrompt & { sector: string }> = [
  // ── ASO / mağaza vitrini ──────────────────────────────────────────────
  mk({
    id: "game-img-hero",
    sector: "mobile-game",
    funnel_stage: "awareness",
    tone: "bold",
    title: "Gameplay hero — App Store kapak",
    goal: "oyunu mağaza vitrininde çarpıcı bir key-art ile tanıtmak",
    system:
      "rol: mobil oyun pazarlama görsel yönetmeni; key-art oyunun ruhunu tek karede satar; çıktıyı her zaman İngilizce, tek satır görsel-üretim prompt'u olarak ver",
    template:
      'Write ONE english image-generation prompt for a mobile game App Store hero key art. Fill: "{{GAME_HERO}} in a vibrant {{GAME_GENRE}} game world for {{GAME_NAME}}, {{GAME_ART_STYLE}}, dynamic heroic composition, {{GAME_MOOD}} mood, bold rim lighting, layered parallax depth, glossy AAA polished render, mobile game marketing key art, --ar 4:5". One line.',
    variables: ["GAME_NAME", "GAME_GENRE", "GAME_ART_STYLE", "GAME_HERO", "GAME_MOOD"],
    tags: ["image-prompt", "mobile-game", "key-art", "app-store", "feed-4x5"],
  }),
  mk({
    id: "game-img-screenshot",
    sector: "mobile-game",
    mode: "transform",
    funnel_stage: "consideration",
    tone: "bold",
    title: "ASO ekran görseli (senin ekranın)",
    goal: "yüklediğin gerçek ekranı telefon çerçevesi + başlıkla App Store görseline çevirmek",
    system:
      "rol: ASO görsel yönetmeni; SAĞLANAN ekran görüntüsünü olduğu gibi koruyup etrafına satışçı bir çerçeve kurar; çıktıyı İngilizce tek satır görsel-DÜZENLEME talimatı olarak ver",
    template:
      'Write ONE english image-EDITING instruction that USES the provided app/game screenshot. Fill: "Keep the provided screenshot fully intact, sharp and legible; place it inside a clean modern smartphone mockup centered on a branded {{GAME_GENRE}} gradient background; add a bold headline above the phone reading \\"{{GAME_HEADLINE}}\\" with a short benefit line; professional App Store screenshot composition; do NOT redraw or alter the in-app UI; --ar 9:16". Return only the instruction.',
    variables: ["GAME_GENRE", "GAME_HEADLINE"],
    tags: ["image-prompt", "mobile-game", "screenshot", "aso", "transform", "story-9x16"],
  }),
  mk({
    id: "game-img-screenshot-set",
    sector: "mobile-game",
    mode: "transform",
    funnel_stage: "consideration",
    tone: "bold",
    title: "Özellik vurgusu (senin ekranın)",
    goal: "yüklediğin ekranı, özelliklere işaret eden çağrı etiketleriyle vurgulamak",
    system:
      "rol: ASO görsel yönetmeni; SAĞLANAN ekranı koruyup özelliklerine dikkat çeker; çıktıyı İngilizce tek satır görsel-DÜZENLEME talimatı olarak ver",
    template:
      'Write ONE english image-EDITING instruction that USES the provided screenshot. Fill: "Keep the provided screenshot intact in a sleek phone mockup; add 2-3 small clean callout labels with thin arrows pointing to key UI features; a branded {{GAME_GENRE}} gradient background; a short headline \\"{{GAME_HEADLINE}}\\"; do NOT redraw the in-app UI; --ar 9:16". Return only the instruction.',
    variables: ["GAME_GENRE", "GAME_HEADLINE"],
    tags: ["image-prompt", "mobile-game", "feature-callout", "aso", "transform", "story-9x16"],
  }),
  mk({
    id: "game-img-icon",
    sector: "mobile-game",
    funnel_stage: "consideration",
    tone: "bold",
    title: "Uygulama ikonu konsepti",
    goal: "küçük boyutta bile okunan, tıklanma çeken bir oyun ikonu üretmek",
    system:
      "rol: app icon tasarımcısı; ikon 1cm karede bile net olmalı; çıktıyı İngilizce tek satır görsel-üretim prompt'u olarak ver",
    template:
      'Write ONE english image-generation prompt for a mobile game app icon. Fill: "app icon for {{GAME_NAME}}, single bold focal subject ({{GAME_HERO}} face or signature object), {{GAME_ART_STYLE}}, rich saturated colors, soft inner glow, rounded-square composition, readable at tiny size, no text, --ar 1:1". One line.',
    variables: ["GAME_NAME", "GAME_ART_STYLE", "GAME_HERO"],
    tags: ["image-prompt", "mobile-game", "app-icon", "square-1x1"],
  }),
  mk({
    id: "game-img-feature",
    sector: "mobile-game",
    funnel_stage: "awareness",
    tone: "bold",
    title: "Feature graphic (Play 1024×500)",
    goal: "Google Play öne çıkan banner'ı için yatay tanıtım görseli",
    system:
      "rol: Play Store feature-graphic tasarımcısı; yatay banner oyunun vaadini bir bakışta verir; çıktıyı İngilizce tek satır görsel-üretim prompt'u olarak ver",
    template:
      'Write ONE english image-generation prompt for a Google Play feature graphic. Fill: "wide horizontal banner for {{GAME_NAME}}, {{GAME_HERO}} and {{GAME_GENRE}} world on the right, {{GAME_ART_STYLE}}, clear empty space on the left for the title, {{GAME_MOOD}} energy, cinematic lighting, --ar 16:9". One line.',
    variables: ["GAME_NAME", "GAME_GENRE", "GAME_ART_STYLE", "GAME_HERO", "GAME_MOOD"],
    tags: ["image-prompt", "mobile-game", "feature-graphic", "play-store", "wide-16x9"],
  }),
  // ── UA / sosyal reklam kreatifleri ────────────────────────────────────
  mk({
    id: "game-img-story-ad",
    sector: "mobile-game",
    mode: "transform",
    platform: "instagram",
    funnel_stage: "conversion",
    tone: "bold",
    title: "Story/Reels reklam (senin ekranın)",
    goal: "yüklediğin ekranı, büyük hook metinli dikey bir UA reklamına çevirmek",
    system:
      "rol: performans pazarlama kreatif yönetmeni; SAĞLANAN ekranı koruyup üstüne hook kurar; çıktıyı İngilizce tek satır görsel-DÜZENLEME talimatı olarak ver",
    template:
      'Write ONE english image-EDITING instruction that USES the provided screenshot. Fill: "Place the provided {{GAME_GENRE}} screenshot as the hero of a vertical 9:16 ad (in a phone or as a clean panel), keep it intact; add a huge bold hook headline reading \\"{{GAME_HEADLINE}}\\" and a clear PLAY NOW button; thumb-stopping high contrast; do NOT redraw the in-app UI; --ar 9:16". Return only the instruction.',
    variables: ["GAME_GENRE", "GAME_HEADLINE"],
    tags: ["image-prompt", "mobile-game", "ua-ad", "transform", "story-9x16"],
  }),
  mk({
    id: "game-img-tiktok-cover",
    sector: "mobile-game",
    mode: "transform",
    platform: "tiktok",
    funnel_stage: "awareness",
    tone: "playful",
    title: "TikTok/Reels kapak (senin ekranın)",
    goal: "yüklediğin ekranı, merak hook'lu dikey video kapağına çevirmek",
    system:
      "rol: kısa video kreatif yönetmeni; SAĞLANAN ekranı koruyup merak hook'u ekler; çıktıyı İngilizce tek satır görsel-DÜZENLEME talimatı olarak ver",
    template:
      'Write ONE english image-EDITING instruction that USES the provided screenshot. Fill: "Use the provided {{GAME_GENRE}} screenshot as the cover background/subject, keep it intact; overlay a curiosity-gap hook caption reading \\"{{GAME_HEADLINE}}\\" in big readable text; vertical, energetic; do NOT redraw the in-app UI; --ar 9:16". Return only the instruction.',
    variables: ["GAME_GENRE", "GAME_HEADLINE"],
    tags: ["image-prompt", "mobile-game", "tiktok", "cover", "transform", "story-9x16"],
  }),
  mk({
    id: "game-img-carousel",
    sector: "mobile-game",
    mode: "transform",
    platform: "instagram",
    funnel_stage: "consideration",
    tone: "bold",
    title: "Karusel paneli (senin ekranın)",
    goal: "yüklediğin ekranı, tek net 'oyna' sebebiyle bir karusel karesine yerleştirmek",
    system:
      "rol: sosyal içerik tasarımcısı; SAĞLANAN ekranı koruyup tek fikirle çerçeveler; çıktıyı İngilizce tek satır görsel-DÜZENLEME talimatı olarak ver",
    template:
      'Write ONE english image-EDITING instruction that USES the provided screenshot. Fill: "Place the provided {{GAME_GENRE}} screenshot in a clean square carousel panel, keep it intact; add one bold reason-to-play statement and a consistent swipe-series frame; do NOT redraw the in-app UI; --ar 1:1". Return only the instruction.',
    variables: ["GAME_GENRE"],
    tags: ["image-prompt", "mobile-game", "carousel", "transform", "square-1x1"],
  }),
  mk({
    id: "game-img-beforeafter",
    sector: "mobile-game",
    funnel_stage: "consideration",
    tone: "playful",
    title: "Önce/Sonra (level-up)",
    goal: "ilerleme hissini önce/sonra bölünmüş kareyle satmak",
    system:
      "rol: UA kreatif yönetmeni; önce/sonra ilerleme dopaminini gösterir; çıktıyı İngilizce tek satır görsel-üretim prompt'u olarak ver",
    template:
      'Write ONE english image-generation prompt for a split before/after creative. Fill: "a before/after split image of progression in {{GAME_NAME}} ({{GAME_GENRE}}): small humble start versus a huge upgraded empire, bold \\"LVL 1 -> LVL MAX\\" style labels, {{GAME_ART_STYLE}}, satisfying glow-up, --ar 4:5". One line.',
    variables: ["GAME_NAME", "GAME_GENRE", "GAME_ART_STYLE"],
    tags: ["image-prompt", "mobile-game", "before-after", "ua-ad", "feed-4x5"],
  }),
  mk({
    id: "game-img-ugc",
    sector: "mobile-game",
    mode: "transform",
    platform: "tiktok",
    funnel_stage: "consideration",
    tone: "warm",
    title: "UGC — elde telefon (senin ekranın)",
    goal: "yüklediğin ekranı, elde tutulan bir telefona yerleştirip sahici UGC karesi yapmak",
    system:
      "rol: UGC kreatif yönetmeni; SAĞLANAN ekranı gerçek bir telefona yerleştirir; çıktıyı İngilizce tek satır görsel-DÜZENLEME talimatı olarak ver",
    template:
      'Write ONE english image-EDITING instruction that USES the provided screenshot. Fill: "Composite the provided screenshot onto the display of a smartphone held in a person\'s hand, cozy real-life setting, natural light, candid relatable photorealistic shot, shallow depth of field, keep the on-screen content intact and legible; --ar 4:5". Return only the instruction.',
    variables: [],
    tags: ["image-prompt", "mobile-game", "ugc", "transform", "feed-4x5"],
  }),
  // ── Karakter / dünya ──────────────────────────────────────────────────
  mk({
    id: "game-img-character",
    sector: "mobile-game",
    funnel_stage: "awareness",
    tone: "playful",
    title: "Karakter key art portresi",
    goal: "oyunun kahraman karakterini ikonik bir portreyle öne çıkarmak",
    system:
      "rol: oyun karakter sanatçısı; karakter oyunun yüzüdür; çıktıyı İngilizce tek satır görsel-üretim prompt'u olarak ver",
    template:
      'Write ONE english image-generation prompt for a game character key art. Fill: "{{GAME_HERO}} for {{GAME_NAME}}, {{GAME_ART_STYLE}}, three-quarter heroic pose, expressive face, {{GAME_MOOD}} personality, clean studio backdrop with subtle glow, high detail, --ar 1:1". One line.',
    variables: ["GAME_NAME", "GAME_ART_STYLE", "GAME_HERO", "GAME_MOOD"],
    tags: ["image-prompt", "mobile-game", "character", "key-art", "square-1x1"],
  }),
  mk({
    id: "game-img-roster",
    sector: "mobile-game",
    funnel_stage: "awareness",
    tone: "playful",
    title: "Karakter / varlık dizilimi",
    goal: "koleksiyon hissi veren karakter veya iş/varlık dizilimi",
    system:
      "rol: oyun sanat yönetmeni; dizilim 'topla/yükselt' arzusu yaratır; çıktıyı İngilizce tek satır görsel-üretim prompt'u olarak ver",
    template:
      'Write ONE english image-generation prompt for a character/asset lineup. Fill: "a collectible lineup for {{GAME_NAME}}, several {{GAME_GENRE}} characters or businesses side by side, {{GAME_ART_STYLE}}, consistent scale and lighting, vibrant roster feel, --ar 16:9". One line.',
    variables: ["GAME_NAME", "GAME_GENRE", "GAME_ART_STYLE"],
    tags: ["image-prompt", "mobile-game", "roster", "wide-16x9"],
  }),
  mk({
    id: "game-img-world",
    sector: "mobile-game",
    funnel_stage: "awareness",
    tone: "bold",
    title: "Dünya / harita splash",
    goal: "oyun dünyasını sinematik bir kuş bakışıyla tanıtan splash",
    system:
      "rol: çevre konsept sanatçısı; dünya görseli keşif arzusu uyandırır; çıktıyı İngilizce tek satır görsel-üretim prompt'u olarak ver",
    template:
      'Write ONE english image-generation prompt for a world splash. Fill: "a sweeping establishing splash of the {{GAME_NAME}} {{GAME_GENRE}} world/map from above, {{GAME_ART_STYLE}}, rich detail, atmospheric depth, {{GAME_MOOD}} mood, cinematic, --ar 16:9". One line.',
    variables: ["GAME_NAME", "GAME_GENRE", "GAME_ART_STYLE", "GAME_MOOD"],
    tags: ["image-prompt", "mobile-game", "world", "splash", "wide-16x9"],
  }),
  // ── Idle / tycoon'a özel + duyuru ─────────────────────────────────────
  mk({
    id: "game-img-empire",
    sector: "mobile-game",
    funnel_stage: "consideration",
    tone: "bold",
    title: "Idle/Tycoon — imparatorluk & para",
    goal: "idle/tycoon büyüme dopaminini para ve yükselen grafiklerle göstermek",
    system:
      "rol: idle/tycoon pazarlama yönetmeni; 'sayı büyüyor' hazzı tür hayranını çeker; çıktıyı İngilizce tek satır görsel-üretim prompt'u olarak ver",
    template:
      'Write ONE english image-generation prompt for an idle/tycoon growth visual. Fill: "a thriving business empire for {{GAME_NAME}}, stacks of glowing gold coins and rising profit charts, big satisfying numbers, {{GAME_ART_STYLE}}, wealthy golden mood, earn-while-you-sleep idle energy, --ar 4:5". One line.',
    variables: ["GAME_NAME", "GAME_ART_STYLE"],
    tags: ["image-prompt", "mobile-game", "idle", "tycoon", "feed-4x5"],
  }),
  mk({
    id: "game-img-reward",
    sector: "mobile-game",
    funnel_stage: "conversion",
    tone: "playful",
    title: "Ödül / sandık reveal",
    goal: "loot/ödül anını ışık ve parçacıklarla heyecanlı göstermek",
    system:
      "rol: oyun ekonomi görsel yönetmeni; ödül anı geri-dönme dürtüsü yaratır; çıktıyı İngilizce tek satır görsel-üretim prompt'u olarak ver",
    template:
      'Write ONE english image-generation prompt for a reward reveal. Fill: "a glowing {{GAME_REWARD}} bursting open with light rays, coins and particles for {{GAME_NAME}}, {{GAME_ART_STYLE}}, exciting loot moment, dramatic glow, --ar 1:1". One line.',
    variables: ["GAME_NAME", "GAME_REWARD", "GAME_ART_STYLE"],
    tags: ["image-prompt", "mobile-game", "reward", "loot", "square-1x1"],
  }),
  mk({
    id: "game-img-milestone",
    sector: "mobile-game",
    funnel_stage: "awareness",
    tone: "bold",
    title: "Kilometre taşı / duyuru",
    goal: "indirme/oyuncu kilometre taşını sosyal kanıtla kutlayan duyuru",
    system:
      "rol: topluluk/duyuru tasarımcısı; kilometre taşı sosyal kanıtla güven verir; çıktıyı İngilizce tek satır görsel-üretim prompt'u olarak ver",
    template:
      'Write ONE english image-generation prompt for a celebration announcement. Fill: "a festive celebration banner for {{GAME_NAME}}, bold text space for \\"{{GAME_MILESTONE}}\\", confetti and {{GAME_GENRE}} elements, a {{GAME_RATING}} badge, {{GAME_ART_STYLE}}, premium celebratory mood, --ar 16:9". One line.',
    variables: ["GAME_NAME", "GAME_GENRE", "GAME_ART_STYLE", "GAME_MILESTONE", "GAME_RATING"],
    tags: ["image-prompt", "mobile-game", "milestone", "announcement", "wide-16x9"],
  }),
]

const APP: Array<LibraryPrompt & { sector: string }> = [
  mk({
    id: "app-img-screenshot",
    sector: "mobile-app",
    mode: "transform",
    funnel_stage: "consideration",
    tone: "professional",
    title: "App Store ekranı (senin ekranın)",
    goal: "yüklediğin uygulama ekranını telefon çerçevesi + başlıkla mağaza görseline çevirmek",
    system:
      "rol: ASO görsel yönetmeni; SAĞLANAN uygulama ekranını koruyup satışçı çerçeve kurar; çıktıyı İngilizce tek satır görsel-DÜZENLEME talimatı olarak ver",
    template:
      'Write ONE english image-EDITING instruction that USES the provided app screenshot. Fill: "Keep the provided app screenshot intact, sharp and legible; place it inside a clean modern iPhone mockup on a soft {{APP_COLOR}} gradient background; add a headline above reading \\"{{APP_HEADLINE}}\\"; modern minimal App Store layout; do NOT redraw the in-app UI; --ar 9:16". Return only the instruction.',
    variables: ["APP_COLOR", "APP_HEADLINE"],
    tags: ["image-prompt", "mobile-app", "screenshot", "aso", "transform", "story-9x16"],
  }),
  mk({
    id: "app-img-lifestyle",
    sector: "mobile-app",
    mode: "transform",
    funnel_stage: "awareness",
    tone: "warm",
    title: "Lifestyle (senin ekranın)",
    goal: "yüklediğin ekranı, gerçek hayatta elde tutulan bir telefona yerleştirmek",
    system:
      "rol: lifestyle reklam fotoğrafçısı; SAĞLANAN ekranı gerçek bir telefona yerleştirir; çıktıyı İngilizce tek satır görsel-DÜZENLEME talimatı olarak ver",
    template:
      'Write ONE english image-EDITING instruction that USES the provided screenshot. Fill: "Composite the provided app screenshot onto the screen of a smartphone held by a person in a {{APP_CATEGORY}} everyday context, natural daylight, candid relatable photorealistic shot, shallow depth of field, keep the on-screen content intact and legible; --ar 4:5". Return only the instruction.',
    variables: ["APP_CATEGORY"],
    tags: ["image-prompt", "mobile-app", "lifestyle", "transform", "feed-4x5"],
  }),
  mk({
    id: "app-img-feature",
    sector: "mobile-app",
    mode: "transform",
    funnel_stage: "consideration",
    tone: "professional",
    title: "Özellik vitrini (senin ekranın)",
    goal: "yüklediğin ekranı tek bir özelliğe odaklı vitrine yerleştirmek",
    system:
      "rol: ürün pazarlama görsel yönetmeni; SAĞLANAN ekranı koruyup tek özelliği vurgular; çıktıyı İngilizce tek satır görsel-DÜZENLEME talimatı olarak ver",
    template:
      'Write ONE english image-EDITING instruction that USES the provided screenshot. Fill: "Place the provided app screenshot in a floating phone on a minimal {{APP_COLOR}} gradient, add a subtle clean callout highlighting {{APP_FEATURE}}, soft shadows, clean product marketing composition, keep the UI intact; --ar 1:1". Return only the instruction.',
    variables: ["APP_FEATURE", "APP_COLOR"],
    tags: ["image-prompt", "mobile-app", "feature", "transform", "square-1x1"],
  }),
  mk({
    id: "app-img-icon",
    sector: "mobile-app",
    funnel_stage: "consideration",
    tone: "minimalist",
    title: "Uygulama ikonu konsepti",
    goal: "kategorisinde tanınır, sade ve modern bir uygulama ikonu",
    system:
      "rol: app icon tasarımcısı; sade ikon güven verir; çıktıyı İngilizce tek satır görsel-üretim prompt'u olarak ver",
    template:
      'Write ONE english image-generation prompt for a mobile app icon. Fill: "app icon for {{APP_NAME}} {{APP_CATEGORY}}, one simple memorable symbol, {{APP_COLOR}} gradient, soft depth, rounded-square, flat-modern, readable at tiny size, no text, --ar 1:1". One line.',
    variables: ["APP_NAME", "APP_CATEGORY", "APP_COLOR"],
    tags: ["image-prompt", "mobile-app", "app-icon", "square-1x1"],
  }),
  mk({
    id: "app-img-hero",
    sector: "mobile-app",
    mode: "transform",
    funnel_stage: "awareness",
    tone: "bold",
    title: "Lansman hero (senin ekranın)",
    goal: "yüklediğin ekranı, başlıklı bir lansman hero banner'ına yerleştirmek",
    system:
      "rol: lansman kampanya yönetmeni; SAĞLANAN ekranı açılı telefon maketlerinde gösterir; çıktıyı İngilizce tek satır görsel-DÜZENLEME talimatı olarak ver",
    template:
      'Write ONE english image-EDITING instruction that USES the provided screenshot. Fill: "Show the provided app screenshot inside angled floating phone mockups on a {{APP_COLOR}} brand gradient, bold space for the headline \\"{{APP_HEADLINE}}\\", energetic premium launch banner, soft glow, keep the screen intact; --ar 4:5". Return only the instruction.',
    variables: ["APP_COLOR", "APP_HEADLINE"],
    tags: ["image-prompt", "mobile-app", "launch", "hero", "transform", "feed-4x5"],
  }),
]

const SAAS: Array<LibraryPrompt & { sector: string }> = [
  mk({
    id: "saas-img-dashboard",
    sector: "saas-web",
    mode: "transform",
    funnel_stage: "consideration",
    tone: "professional",
    title: "Dashboard hero (senin ekranın)",
    goal: "yüklediğin dashboard ekranını premium bir hero görseline çevirmek",
    system:
      "rol: B2B SaaS görsel yönetmeni; SAĞLANAN dashboard'ı koruyup premium sahne kurar; çıktıyı İngilizce tek satır görsel-DÜZENLEME talimatı olarak ver",
    template:
      'Write ONE english image-EDITING instruction that USES the provided dashboard screenshot. Fill: "Place the provided {{SAAS_CATEGORY}} dashboard screenshot floating on a soft {{SAAS_COLOR}} gradient with subtle glassmorphic depth and shadow, premium product marketing hero render, keep the UI sharp and intact; --ar 16:9". Return only the instruction.',
    variables: ["SAAS_CATEGORY", "SAAS_COLOR"],
    tags: ["image-prompt", "saas-web", "dashboard", "hero", "transform", "wide-16x9"],
  }),
  mk({
    id: "saas-img-feature",
    sector: "saas-web",
    funnel_stage: "consideration",
    tone: "minimalist",
    title: "Özellik bölümü görseli",
    goal: "bir özelliği soyut, temiz bir ürün görseliyle anlatmak",
    system:
      "rol: ürün pazarlama tasarımcısı; soyut görsel özelliği akılda tutturur; çıktıyı İngilizce tek satır görsel-üretim prompt'u olarak ver",
    template:
      'Write ONE english image-generation prompt for a SaaS feature visual. Fill: "a clean abstract illustration of {{SAAS_FEATURE}} for {{SAAS_NAME}}, minimal geometric shapes, {{SAAS_COLOR}} palette, soft gradients, generous negative space, modern tech aesthetic, --ar 1:1". One line.',
    variables: ["SAAS_NAME", "SAAS_FEATURE", "SAAS_COLOR"],
    tags: ["image-prompt", "saas-web", "feature", "square-1x1"],
  }),
  mk({
    id: "saas-img-og",
    sector: "saas-web",
    mode: "transform",
    platform: "linkedin",
    funnel_stage: "awareness",
    tone: "professional",
    title: "OG / sosyal kart (senin ekranın)",
    goal: "yüklediğin UI'ı 1200×630 sosyal paylaşım kartına yerleştirmek",
    system:
      "rol: sosyal görsel tasarımcısı; SAĞLANAN UI'ı kartın sağına koyup başlık ekler; çıktıyı İngilizce tek satır görsel-DÜZENLEME talimatı olarak ver",
    template:
      'Write ONE english image-EDITING instruction that USES the provided UI screenshot. Fill: "Build a 1200x630 social share card: a bold left text area for the headline \\"{{SAAS_HEADLINE}}\\", the provided product UI screenshot as a clean angled peek on the right, {{SAAS_COLOR}} brand gradient, modern B2B style, keep the UI intact; --ar 16:9". Return only the instruction.',
    variables: ["SAAS_HEADLINE", "SAAS_COLOR"],
    tags: ["image-prompt", "saas-web", "og-card", "social", "transform", "wide-16x9"],
  }),
  mk({
    id: "saas-img-hero",
    sector: "saas-web",
    mode: "transform",
    funnel_stage: "awareness",
    tone: "bold",
    title: "Web hero (senin ekranın)",
    goal: "yüklediğin UI'ı, başlık alanlı bir landing hero'suna yerleştirmek",
    system:
      "rol: landing page görsel yönetmeni; SAĞLANAN UI'ı hero'ya yerleştirir; çıktıyı İngilizce tek satır görsel-DÜZENLEME talimatı olarak ver",
    template:
      'Write ONE english image-EDITING instruction that USES the provided UI screenshot. Fill: "Place the provided product UI screenshot floating in a web hero on an abstract {{SAAS_COLOR}} gradient mesh, generous empty space for the headline \\"{{SAAS_HEADLINE}}\\", premium modern startup aesthetic, keep the UI sharp and intact; --ar 16:9". Return only the instruction.',
    variables: ["SAAS_COLOR", "SAAS_HEADLINE"],
    tags: ["image-prompt", "saas-web", "hero", "landing", "transform", "wide-16x9"],
  }),
  mk({
    id: "saas-img-testimonial",
    sector: "saas-web",
    platform: "linkedin",
    funnel_stage: "conversion",
    tone: "professional",
    title: "Sosyal kanıt / testimonial kartı",
    goal: "müşteri yorumunu güven veren bir kart görseliyle paylaşmak",
    system:
      "rol: sosyal kanıt tasarımcısı; testimonial güveni görselle pekiştirir; çıktıyı İngilizce tek satır görsel-üretim prompt'u olarak ver",
    template:
      'Write ONE english image-generation prompt for a testimonial card. Fill: "a clean testimonial card for {{SAAS_NAME}}, soft {{SAAS_COLOR}} background, large quotation mark, space for a customer quote and avatar, subtle 5-star row, trustworthy modern B2B layout, --ar 1:1". One line.',
    variables: ["SAAS_NAME", "SAAS_COLOR"],
    tags: ["image-prompt", "saas-web", "testimonial", "social-proof", "square-1x1"],
  }),
]

/**
 * Video prompts — we don't generate video yet, but these produce a ready-to-use
 * AI video-generation prompt (for Veo / Runway / Kling) plus short shot notes,
 * which the user pastes into their video tool. Text output, content_type
 * "video-prompt", shown in the Metin tab.
 */
const mkVid = (
  p: Omit<LibraryPrompt, "platform" | "content_type" | "output" | "source"> & {
    sector: string
    platform?: string
  }
): LibraryPrompt & { sector: string } => ({
  platform: p.platform ?? "cross-platform",
  content_type: "video-prompt",
  output: { format: "text", shape: "video-üretim prompt'u + çekim notları (en)" },
  source: SRC,
  ...p,
})

const VIDEO: Array<LibraryPrompt & { sector: string }> = [
  mkVid({
    id: "game-vid-teaser",
    sector: "mobile-game",
    funnel_stage: "awareness",
    tone: "bold",
    title: "Gameplay teaser (video prompt)",
    goal: "6-8 sn'lik çarpıcı bir gameplay teaser için hazır AI video prompt'u üretmek",
    system:
      "rol: AI video prompt mühendisi (Veo/Runway/Kling); çıktıyı YAPIŞTIRILABİLİR tek İngilizce video-üretim prompt'u + 3 kısa çekim notu olarak ver",
    template:
      "Write a ready-to-use english AI video prompt for a 6-8s mobile game teaser of {{GAME_NAME}} ({{GAME_GENRE}}, {{GAME_ART_STYLE}}). Describe camera motion, pacing, {{GAME_MOOD}} energy, and a punchy build to a logo end-card. Then add 3 short shot notes.",
    variables: ["GAME_NAME", "GAME_GENRE", "GAME_ART_STYLE", "GAME_MOOD"],
    tags: ["video-prompt", "mobile-game", "teaser"],
  }),
  mkVid({
    id: "game-vid-preview",
    sector: "mobile-game",
    funnel_stage: "consideration",
    tone: "bold",
    title: "App Store preview (video prompt)",
    goal: "15-30 sn'lik ASO mağaza önizleme videosu için yapılandırılmış prompt",
    system:
      "rol: ASO video yönetmeni; çıktıyı tek İngilizce video-üretim prompt'u + 15-30 sn için sahne sahne yapı olarak ver",
    template:
      "Write a ready-to-use english AI video prompt for a 15-30s App Store preview of {{GAME_NAME}} ({{GAME_GENRE}}, {{GAME_ART_STYLE}}). Open with the core hook, show 2-3 key features, end with a clear CTA. Provide a scene-by-scene structure with timings.",
    variables: ["GAME_NAME", "GAME_GENRE", "GAME_ART_STYLE"],
    tags: ["video-prompt", "mobile-game", "app-store-preview", "aso"],
  }),
  mkVid({
    id: "game-vid-tiktok",
    sector: "mobile-game",
    platform: "tiktok",
    funnel_stage: "awareness",
    tone: "playful",
    title: "TikTok hook (video prompt)",
    goal: "ilk 2 sn'de izleticek dikey TikTok hook videosu için prompt",
    system:
      "rol: kısa video kreatif yönetmeni; çıktıyı tek İngilizce dikey video-üretim prompt'u + hook fikri olarak ver",
    template:
      'Write a ready-to-use english AI video prompt for a vertical 9:16 TikTok hook for {{GAME_NAME}} ({{GAME_GENRE}}, {{GAME_ART_STYLE}}). The first 2 seconds must stop the scroll; include a curiosity hook line like \\"{{GAME_HEADLINE}}\\" and fast satisfying pacing.',
    variables: ["GAME_NAME", "GAME_GENRE", "GAME_ART_STYLE", "GAME_HEADLINE"],
    tags: ["video-prompt", "mobile-game", "tiktok", "hook"],
  }),
  mkVid({
    id: "game-vid-animate",
    sector: "mobile-game",
    funnel_stage: "awareness",
    tone: "bold",
    title: "Key art'ı canlandır (image→video)",
    goal: "bir durağan görseli (key art/ekran) hareketlendiren image-to-video prompt",
    system:
      "rol: image-to-video yönetmeni; çıktıyı sağlanan görseli canlandıran tek İngilizce video prompt'u olarak ver",
    template:
      "Write a ready-to-use english IMAGE-TO-VIDEO prompt that animates a provided still of {{GAME_NAME}} ({{GAME_GENRE}}, {{GAME_ART_STYLE}}): add subtle parallax, drifting particles, soft light sweep and a gentle zoom over 4-6s; keep the artwork intact.",
    variables: ["GAME_NAME", "GAME_GENRE", "GAME_ART_STYLE"],
    tags: ["video-prompt", "mobile-game", "image-to-video", "animate"],
  }),
  mkVid({
    id: "game-vid-timelapse",
    sector: "mobile-game",
    funnel_stage: "consideration",
    tone: "bold",
    title: "Idle imparatorluk timelapse (video prompt)",
    goal: "idle/tycoon büyümeyi gösteren tatmin edici timelapse video prompt'u",
    system:
      "rol: idle/tycoon video yönetmeni; çıktıyı tek İngilizce video-üretim prompt'u olarak ver",
    template:
      "Write a ready-to-use english AI video prompt for a satisfying idle/tycoon growth timelapse of {{GAME_NAME}}: a small start rapidly expanding into a thriving empire, rising numbers and gold, {{GAME_ART_STYLE}}, dopamine 'number-go-up' pacing over 6-8s.",
    variables: ["GAME_NAME", "GAME_ART_STYLE"],
    tags: ["video-prompt", "mobile-game", "idle", "timelapse"],
  }),
  mkVid({
    id: "app-vid-demo",
    sector: "mobile-app",
    funnel_stage: "consideration",
    tone: "professional",
    title: "Uygulama tanıtım (video prompt)",
    goal: "15-30 sn'lik özellik turu / tanıtım videosu için prompt",
    system:
      "rol: ürün video yönetmeni; çıktıyı tek İngilizce video-üretim prompt'u + sahne yapısı olarak ver",
    template:
      "Write a ready-to-use english AI video prompt for a 15-30s {{APP_NAME}} ({{APP_CATEGORY}}) demo: hook with the core benefit, show {{APP_FEATURE}}, clean {{APP_COLOR}} brand look, end with a CTA. Provide a scene-by-scene structure.",
    variables: ["APP_NAME", "APP_CATEGORY", "APP_FEATURE", "APP_COLOR"],
    tags: ["video-prompt", "mobile-app", "demo"],
  }),
  mkVid({
    id: "app-vid-tiktok",
    sector: "mobile-app",
    platform: "tiktok",
    funnel_stage: "awareness",
    tone: "playful",
    title: "TikTok hook (video prompt)",
    goal: "uygulama için dikey TikTok hook videosu prompt'u",
    system:
      "rol: kısa video kreatif yönetmeni; çıktıyı tek İngilizce dikey video-üretim prompt'u olarak ver",
    template:
      'Write a ready-to-use english AI video prompt for a vertical 9:16 TikTok hook for {{APP_NAME}} ({{APP_CATEGORY}}): first 2 seconds stop the scroll, relatable problem→solution beat, hook line \\"{{APP_HEADLINE}}\\".',
    variables: ["APP_NAME", "APP_CATEGORY", "APP_HEADLINE"],
    tags: ["video-prompt", "mobile-app", "tiktok", "hook"],
  }),
  mkVid({
    id: "saas-vid-demo",
    sector: "saas-web",
    funnel_stage: "consideration",
    tone: "professional",
    title: "Ürün demo (video prompt)",
    goal: "SaaS ürün demo / explainer videosu için prompt",
    system:
      "rol: B2B ürün video yönetmeni; çıktıyı tek İngilizce video-üretim prompt'u + sahne yapısı olarak ver",
    template:
      "Write a ready-to-use english AI video prompt for a 20-40s {{SAAS_NAME}} ({{SAAS_CATEGORY}}) product demo: problem hook, show {{SAAS_FEATURE}} in the dashboard, premium {{SAAS_COLOR}} brand look, end with a CTA. Provide a scene-by-scene structure with timings.",
    variables: ["SAAS_NAME", "SAAS_CATEGORY", "SAAS_FEATURE", "SAAS_COLOR"],
    tags: ["video-prompt", "saas-web", "demo", "explainer"],
  }),
  mkVid({
    id: "saas-vid-hook",
    sector: "saas-web",
    platform: "linkedin",
    funnel_stage: "awareness",
    tone: "professional",
    title: "LinkedIn hook (video prompt)",
    goal: "B2B feed için kısa, fayda-odaklı hook videosu prompt'u",
    system:
      "rol: B2B sosyal video yönetmeni; çıktıyı tek İngilizce video-üretim prompt'u olarak ver",
    template:
      'Write a ready-to-use english AI video prompt for a short B2B LinkedIn hook for {{SAAS_NAME}} ({{SAAS_CATEGORY}}): a crisp benefit hook \\"{{SAAS_HEADLINE}}\\", clean professional motion, {{SAAS_COLOR}} brand accent, 8-12s.',
    variables: ["SAAS_NAME", "SAAS_CATEGORY", "SAAS_HEADLINE", "SAAS_COLOR"],
    tags: ["video-prompt", "saas-web", "linkedin", "hook"],
  }),
]

/** All sector-specific prompts merged by the engine into the library. */
export const SECTOR_PROMPTS: Array<LibraryPrompt & { sector: string }> = [
  ...GAME,
  ...APP,
  ...SAAS,
  ...VIDEO,
]
