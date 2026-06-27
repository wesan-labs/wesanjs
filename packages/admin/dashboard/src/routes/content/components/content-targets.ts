import { ContentTarget } from "../../../hooks/api/content"

export interface PlatformFormats {
  platform: string
  /** platform display, e.g. "Instagram" */
  label: string
  formats: { id: string; label: string }[]
}

/**
 * Platforms with their valid formats. Platform and format are picked SEPARATELY
 * (nested checkboxes); a checked (platform, format) pair becomes one target,
 * each generated in its own platform+format-tailored variant.
 */
export const PLATFORM_FORMATS: PlatformFormats[] = [
  {
    platform: "instagram",
    label: "Instagram",
    formats: [
      { id: "post", label: "Gönderi" },
      { id: "reels", label: "Reels" },
      { id: "story", label: "Story" },
      { id: "carousel", label: "Karusel" },
    ],
  },
  { platform: "tiktok", label: "TikTok", formats: [{ id: "video", label: "Video" }] },
  { platform: "linkedin", label: "LinkedIn", formats: [{ id: "post", label: "Gönderi" }] },
  {
    platform: "x",
    label: "X",
    formats: [
      { id: "tweet", label: "Tweet" },
      { id: "thread", label: "Thread" },
    ],
  },
  { platform: "youtube", label: "YouTube", formats: [{ id: "short", label: "Short" }] },
  {
    platform: "facebook",
    label: "Facebook",
    formats: [
      { id: "post", label: "Gönderi" },
      { id: "story", label: "Story" },
      { id: "reels", label: "Reels" },
    ],
  },
  { platform: "threads", label: "Threads", formats: [{ id: "post", label: "Gönderi" }] },
]

/** Flat platform options for the platform multi-select. */
export const ALL_PLATFORMS: { value: string; label: string }[] =
  PLATFORM_FORMATS.map((p) => ({ value: p.platform, label: p.label }))

/** Distinct format options for the type multi-select (label = first seen). */
export const ALL_FORMATS: { value: string; label: string }[] = (() => {
  const seen = new Map<string, string>()
  for (const p of PLATFORM_FORMATS) {
    for (const f of p.formats) {
      if (!seen.has(f.id)) {
        seen.set(f.id, f.label)
      }
    }
  }
  return [...seen].map(([value, label]) => ({ value, label }))
})()

/** Does a platform support a given format? (TikTok has no Story, etc.) */
export const supports = (platform: string, format: string): boolean =>
  PLATFORM_FORMATS.find((p) => p.platform === platform)?.formats.some(
    (f) => f.id === format
  ) ?? false

/** Set key for a (platform, format) selection. */
export const targetKey = (platform: string, format: string): string =>
  `${platform}:${format}`

/** Build a full ContentTarget (with label) from a selection key. */
export const targetFromKey = (key: string): ContentTarget | undefined => {
  const [platform, format] = key.split(":")
  const p = PLATFORM_FORMATS.find((x) => x.platform === platform)
  const f = p?.formats.find((x) => x.id === format)
  if (!p || !f) {
    return undefined
  }
  return { platform, format, label: `${p.label} · ${f.label}` }
}

/** Valid cross-product of selected platforms × formats → tailored targets. */
export const buildTargets = (
  platforms: string[],
  formats: string[]
): ContentTarget[] => {
  const out: ContentTarget[] = []
  for (const platform of platforms) {
    for (const format of formats) {
      if (supports(platform, format)) {
        const t = targetFromKey(targetKey(platform, format))
        if (t) {
          out.push(t)
        }
      }
    }
  }
  return out
}
