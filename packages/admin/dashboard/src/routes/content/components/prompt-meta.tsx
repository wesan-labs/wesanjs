import {
  ArrowPath,
  Bolt,
  Calendar,
  ChatBubble,
  ChatBubbleLeftRight,
  Clock,
  CurrencyDollar,
  DocumentText,
  Envelope,
  GlobeEurope,
  GridLayout,
  House,
  ImageSparkle,
  Images,
  MediaPlay,
  Phone,
  Puzzle,
  RocketLaunch,
  Swatch,
  User,
  Users,
  WandSparkle,
  Window,
} from "@medusajs/icons"

type Glyph = React.ComponentType<{ className?: string }>

/** Sector → professional icon (the primary axis for visual prompts). */
export const SECTOR_ICONS: Record<string, Glyph> = {
  "mobile-game": Puzzle,
  "mobile-app": Phone,
  "saas-web": Window,
  furniture: House,
}

export const sectorIcon = (id: string): Glyph => SECTOR_ICONS[id] ?? GridLayout

/**
 * Curated GENERATION settings — the differentiator vs a raw AI generator: the
 * user *selects* system-level controls instead of typing them. Each preset
 * carries a rich English `descriptor` that gets injected into the visual prompt.
 */
export interface Preset {
  label: string
  descriptor: string
}

/** Output format / aspect ratio (drives composition + --ar). */
export const ASPECTS: Array<{ id: string } & Preset> = [
  { id: "4:5", label: "4:5 Feed", descriptor: "vertical feed composition, 4:5 aspect ratio" },
  { id: "9:16", label: "9:16 Story", descriptor: "tall vertical story/reels composition, 9:16 aspect ratio" },
  { id: "1:1", label: "1:1 Kare", descriptor: "square composition, 1:1 aspect ratio" },
  { id: "16:9", label: "16:9 Yatay", descriptor: "wide horizontal composition, 16:9 aspect ratio" },
]

export const aspectDescriptor = (id: string): string =>
  ASPECTS.find((a) => a.id === id)?.descriptor ?? ""

/**
 * A proportional rectangle glyph for an aspect ratio (4:5 portrait, 9:16 tall,
 * 1:1 square, 16:9 wide) — drawn from the ratio so it always matches.
 */
export const AspectGlyph = ({
  ratio,
  className = "",
}: {
  ratio: string
  className?: string
}) => {
  const [w, h] = ratio.split(":").map(Number)
  const max = 12
  const rw = w >= h ? max : (max * w) / h
  const rh = h >= w ? max : (max * h) / w
  const x = (16 - rw) / 2
  const y = (16 - rh) / 2
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <rect x={x} y={y} width={rw} height={rh} rx="1.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

/**
 * Concept presets are SECTOR-AWARE (Can: "konseptler alana göre değişmeli").
 * Physical products → regional/cultural aesthetics; games → art direction;
 * apps/SaaS → UI/brand aesthetics. Each carries a rich English descriptor.
 */
export interface ConceptOption {
  id: string
  label: string
  descriptor: string
}

const PHYSICAL: ConceptOption[] = [
  { id: "auto", label: "Otomatik", descriptor: "" },
  { id: "iskandinav", label: "İskandinav", descriptor: "Scandinavian aesthetic: light oak woods, muted soft palette, airy minimalism, cozy hygge warmth, natural light" },
  { id: "turk", label: "Türk / Anadolu", descriptor: "Turkish Anatolian aesthetic: warm earthy tones, handcrafted textures, traditional motifs reinterpreted modern" },
  { id: "japon", label: "Japon / Wabi-sabi", descriptor: "Japanese minimalist wabi-sabi aesthetic: clean negative space, natural materials, calm restraint" },
  { id: "italyan", label: "İtalyan", descriptor: "Italian design aesthetic: elegant, refined, warm Mediterranean sophistication, premium craftsmanship" },
  { id: "ispanyol", label: "İspanyol / Akdeniz", descriptor: "Spanish Mediterranean aesthetic: sun-warmed terracotta, vibrant rustic-chic, lively warmth" },
  { id: "modern", label: "Modern Minimal", descriptor: "modern minimalist aesthetic: clean lines, neutral palette, contemporary studio look" },
  { id: "luks", label: "Lüks / Premium", descriptor: "luxury premium aesthetic: refined materials, dramatic lighting, high-end editorial finish" },
]

const GAME: ConceptOption[] = [
  { id: "auto", label: "Otomatik", descriptor: "" },
  { id: "lowpoly", label: "Low-poly 3D", descriptor: "stylized low-poly 3D art, clean faceted shapes, vibrant saturated colors" },
  { id: "pixel", label: "Pixel Art", descriptor: "retro pixel-art, crisp pixels, limited nostalgic palette" },
  { id: "cartoon", label: "Çizgi / Toon", descriptor: "bold cartoon toon-shaded style, thick outlines, playful exaggeration" },
  { id: "realistic", label: "Gerçekçi 3D", descriptor: "high-fidelity realistic 3D render, detailed materials, cinematic lighting" },
  { id: "anime", label: "Anime", descriptor: "anime/manga-inspired art, expressive characters, dynamic cel shading" },
  { id: "handdrawn", label: "Elle Çizim", descriptor: "hand-drawn illustrative style, painterly textures, storybook feel" },
  { id: "voxel", label: "Voxel", descriptor: "voxel art, blocky 3D cubes, charming miniature world" },
  { id: "neon", label: "Neon / Cyber", descriptor: "neon cyberpunk style, glowing accents, dark moody atmosphere" },
]

const APP: ConceptOption[] = [
  { id: "auto", label: "Otomatik", descriptor: "" },
  { id: "minimal", label: "Minimal", descriptor: "clean minimal UI aesthetic, generous whitespace, restrained palette" },
  { id: "glass", label: "Cam / Gradient", descriptor: "glassmorphism with frosted translucent panels, soft gradients, depth blur" },
  { id: "vibrant", label: "Canlı", descriptor: "bold vibrant aesthetic, saturated colors, high energy" },
  { id: "playful", label: "Eğlenceli", descriptor: "playful friendly aesthetic, rounded shapes, cheerful accents" },
  { id: "corporate", label: "Kurumsal", descriptor: "clean corporate aesthetic, trustworthy, professional restraint" },
  { id: "dark", label: "Koyu Mod", descriptor: "sleek dark-mode aesthetic, deep backgrounds, glowing accents" },
  { id: "pastel", label: "Pastel", descriptor: "soft pastel aesthetic, gentle muted tones, calm and modern" },
]

const SAAS: ConceptOption[] = [
  { id: "auto", label: "Otomatik", descriptor: "" },
  { id: "minimal", label: "Minimal Kurumsal", descriptor: "minimal corporate aesthetic, clean grid, plenty of whitespace" },
  { id: "glass", label: "Cam / Gradient", descriptor: "modern glassmorphism, gradient mesh, frosted cards" },
  { id: "bold", label: "Cesur Startup", descriptor: "bold startup aesthetic, confident type, vivid accent color" },
  { id: "darktech", label: "Koyu / Tech", descriptor: "dark tech aesthetic, deep navy/black, neon data accents" },
  { id: "editorial", label: "Editöryel", descriptor: "editorial aesthetic, refined typography, magazine-clean layout" },
]

export const CONCEPT_SETS: Record<string, ConceptOption[]> = {
  "mobile-game": GAME,
  "mobile-app": APP,
  "saas-web": SAAS,
  furniture: PHYSICAL,
}

/** The concept options for a sector (digital→style, physical→cultural). */
export const conceptsForSector = (sector: string): ConceptOption[] =>
  CONCEPT_SETS[sector] ?? PHYSICAL

export const conceptDescriptor = (sector: string, id: string): string =>
  conceptsForSector(sector).find((c) => c.id === id)?.descriptor ?? ""

export interface TypeMeta {
  Icon: Glyph
  /** plain-Turkish label — no funnel/awareness jargon */
  label: string
}

/**
 * content_type → a professional icon + a plain-Turkish label, so a card tells
 * the user *what it makes* at a glance (Can's "ne üzerine olduğu belli olsun").
 */
export const CONTENT_TYPE_META: Record<string, TypeMeta> = {
  "image-prompt": { Icon: ImageSparkle, label: "Görsel" },
  "video-prompt": { Icon: MediaPlay, label: "Video prompt" },
  caption: { Icon: ChatBubble, label: "Caption" },
  carousel: { Icon: Images, label: "Karusel" },
  "video-script": { Icon: MediaPlay, label: "Video senaryo" },
  story: { Icon: Clock, label: "Story" },
  bio: { Icon: User, label: "Profil bio" },
  "content-plan": { Icon: Calendar, label: "İçerik planı" },
  hook: { Icon: Bolt, label: "Hook" },
  "ad-copy": { Icon: CurrencyDollar, label: "Reklam metni" },
  thread: { Icon: ChatBubbleLeftRight, label: "Thread" },
  campaign: { Icon: RocketLaunch, label: "Kampanya" },
  email: { Icon: Envelope, label: "E-posta" },
  sms: { Icon: ChatBubble, label: "SMS" },
  repurpose: { Icon: ArrowPath, label: "Yeniden kullan" },
  community: { Icon: Users, label: "Topluluk" },
}

export const typeMeta = (t: string): TypeMeta =>
  CONTENT_TYPE_META[t] ?? { Icon: DocumentText, label: t }

/** Mode badge: does the prompt EDIT your uploaded image or GENERATE new art? */
export const modeMeta = (
  mode: string
): { Icon: Glyph; label: string } =>
  mode === "transform"
    ? { Icon: Phone, label: "Görselini kullanır" }
    : { Icon: WandSparkle, label: "Sıfırdan üretir" }

/** Single icon for the tone/style filter chips. */
export const ToneIcon = Swatch

/** Short Turkish labels for tone codes (the data ships English keys). */
export const TONE_LABELS: Record<string, string> = {
  playful: "Eğlenceli",
  professional: "Profesyonel",
  witty: "Esprili",
  empathetic: "Empatik",
  inspirational: "İlham veren",
  minimalist: "Minimal",
  luxurious: "Lüks",
  bold: "İddialı",
  warm: "Sıcak",
  informative: "Bilgilendirici",
}

export const toneLabel = (code: string): string => TONE_LABELS[code] ?? code

/**
 * Brand glyphs for platforms Medusa's icon set lacks (IG/TikTok/YT/X/…).
 * Clean single-path simple-icons marks — monochrome, currentColor.
 */
const PATHS: Record<string, string> = {
  instagram:
    "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.43-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.38C1.35 2.68.93 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13.67.66 1.34 1.08 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.13-1.38 5.9 5.9 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8m6.41-10.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88",
  tiktok:
    "M12.53.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  youtube:
    "M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z",
  x: "M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23zm-1.16 17.52h1.83L7.08 4.13H5.12z",
  facebook:
    "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6 4.39 10.95 10.13 11.85v-8.38H7.08v-3.47h3.05V9.43c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.69.24 2.69.24v2.95h-1.51c-1.49 0-1.96.93-1.96 1.87v2.25h3.33l-.53 3.47h-2.8v8.38C19.61 23.02 24 18.06 24 12.07z",
  linkedin:
    "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45C23.2 24 24 23.23 24 22.27V1.73C24 .77 23.2 0 22.22 0z",
  threads:
    "M12.19 24h-.01c-3.58-.02-6.33-1.2-8.18-3.51C2.35 18.44 1.5 15.59 1.47 12.01v-.02c.03-3.58.88-6.43 2.53-8.48C5.85 1.2 8.6.02 12.18 0h.01c2.75.02 5.04.73 6.83 2.1 1.68 1.29 2.86 3.13 3.51 5.47l-2.04.57c-1.1-3.96-3.9-5.98-8.3-6.02-2.91.02-5.11.94-6.54 2.72C4.31 6.5 3.62 8.91 3.59 12c.03 3.09.72 5.5 2.06 7.16 1.43 1.78 3.63 2.7 6.54 2.72 2.62-.02 4.36-.63 5.8-2.05 1.65-1.61 1.62-3.59 1.09-4.8-.31-.71-.87-1.3-1.63-1.75-.19 1.35-.62 2.45-1.28 3.27-.89 1.1-2.14 1.7-3.73 1.79-1.2.07-2.36-.22-3.26-.8-1.06-.69-1.69-1.74-1.75-2.96-.07-1.19.41-2.29 1.33-3.08.88-.76 2.12-1.21 3.58-1.29.99-.05 1.91 0 2.74.14-.13-.74-.38-1.33-.75-1.76-.51-.59-1.31-.88-2.36-.89h-.03c-.84 0-1.99.23-2.72 1.32l-1.69-1.14c.98-1.45 2.57-2.26 4.48-2.26h.04c3.19.02 5.1 1.98 5.29 5.39.11.05.22.09.32.14 1.49.7 2.58 1.76 3.15 3.07.8 1.82.87 4.79-1.55 7.16C17.61 23.18 15.37 24 12.19 24z",
}

/** A platform's brand glyph; falls back to a globe for cross-platform. */
export const PlatformGlyph = ({
  platform,
  className = "size-3.5",
}: {
  platform: string
  className?: string
}) => {
  if (platform === "email") return <Envelope className={className} />
  if (platform === "sms") return <ChatBubble className={className} />
  const d = PATHS[platform]
  if (!d) return <GlobeEurope className={className} />
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d={d} />
    </svg>
  )
}

/**
 * A readable one-line peek at the REAL prompt: {{VARS}} resolved to their
 * example values so the card shows a filled, human prompt rather than tokens.
 * Time O(n) over template length.
 */
export const promptSnippet = (
  template: string,
  vars?: Record<string, { example?: string }>,
  max = 150
): string => {
  const filled = template.replace(/\{\{(\w+)\}\}/g, (_, k: string) => {
    if (k === "LANGUAGE") return "Türkçe"
    return vars?.[k]?.example ?? k.toLowerCase().replace(/_/g, " ")
  })
  const flat = filled.replace(/\s+/g, " ").trim()
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat
}
