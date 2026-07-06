/** Platforms that reject text-only posts (Late/Zernio contract). */
export const MEDIA_REQUIRED_PLATFORMS = new Set([
  "instagram",
  "tiktok",
  "pinterest",
  "youtube",
])

export const normalizePlatform = (platform: string): string =>
  platform.toLowerCase().trim()

export const platformRequiresMedia = (platform: string): boolean =>
  MEDIA_REQUIRED_PLATFORMS.has(normalizePlatform(platform))

export const targetsRequiringMedia = (
  targets: { platform: string }[]
): string[] => [
  ...new Set(
    targets
      .filter((t) => platformRequiresMedia(t.platform))
      .map((t) => normalizePlatform(t.platform))
  ),
]

export const mediaRequiredError = (platforms: string[]): string => {
  const list = platforms.join(", ")
  return `Şu platformlar görsel veya video gerektirir: ${list}. Herkese açık medya URL'i girin veya stüdyo görselini platform barındırma ile gönderin.`
}
