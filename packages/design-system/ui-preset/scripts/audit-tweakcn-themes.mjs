#!/usr/bin/env node

/**
 * Audit tweakcn theme fidelity and coverage.
 * Run: node scripts/audit-tweakcn-themes.mjs
 */

import { readFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")
const rawDir = resolve(root, "src/themes/tweakcn-raw")

const { getThemeTokens, themes } = await import("../dist/runtime.js")

const checks = [
  ["background", "--bg-subtle"],
  ["primary", "--bg-interactive"],
  ["card", "--bg-base"],
  ["sidebar", "--chrome-bg"],
  ["primary", "--primary"],
  ["font-sans", "--font-sans-theme"],
  ["radius", "--radius"],
]

let failures = 0
const slugs = Object.values(themes).map((theme) => theme.name)

console.log(`Auditing ${slugs.length} themes...\n`)

for (const slug of slugs.sort()) {
  const raw = JSON.parse(readFileSync(resolve(rawDir, `${slug}.json`), "utf8"))
  const light = getThemeTokens(slug, "light")
  const dark = getThemeTokens(slug, "dark")
  const lv = raw.cssVars.light
  const dv = raw.cssVars.dark

  if (!light || !dark) {
    console.error(`[fail] ${slug}: theme not registered`)
    failures++
    continue
  }

  let themeOk = true
  for (const [rawKey, tokenKey] of checks) {
    if (lv[rawKey] !== light[tokenKey]) {
      console.error(`[fail] ${slug} light ${rawKey} → ${tokenKey}`)
      failures++
      themeOk = false
    }
    if (dv[rawKey] !== dark[tokenKey]) {
      console.error(`[fail] ${slug} dark ${rawKey} → ${tokenKey}`)
      failures++
      themeOk = false
    }
  }

  const tokenCount = Object.keys(light).length
  if (themeOk) {
    console.log(
      `[ok] ${slug} — ${tokenCount} tokens, font: ${light["--font-sans-theme"]?.split(",")[0]}`
    )
  }
}

if (failures) {
  console.error(`\n${failures} audit failure(s).`)
  process.exit(1)
}

console.log("\nAll theme audits passed.")
