/** Keep in sync with content plugin `lib/social/platform-rules.ts`. */
const MEDIA_REQUIRED = new Set([
  "instagram",
  "tiktok",
  "pinterest",
  "youtube",
])

export const normalizePlatform = (platform: string): string =>
  platform.toLowerCase().trim()

export const platformRequiresMedia = (platform: string): boolean =>
  MEDIA_REQUIRED.has(normalizePlatform(platform))

export const accountsRequireMedia = (
  accounts: { id: string; platform: string }[],
  selected: Set<string>
): string[] => [
  ...new Set(
    accounts
      .filter((a) => selected.has(a.id) && platformRequiresMedia(a.platform))
      .map((a) => normalizePlatform(a.platform))
  ),
]
