#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises"
import { basename, resolve } from "node:path"

const DEFAULT_URLS = [
  "https://tweakcn.com/r/themes/doom-64.json",
  "https://tweakcn.com/r/themes/claude.json",
  "https://tweakcn.com/r/themes/elegant-luxury.json",
]

const args = process.argv.slice(2)
const urls = args.length ? args : DEFAULT_URLS

const outDir = resolve(process.cwd(), "src/themes/tweakcn-raw")
await mkdir(outDir, { recursive: true })

for (const url of urls) {
  const res = await fetch(url)
  if (!res.ok) {
    console.error(`failed ${url}: ${res.status}`)
    process.exitCode = 1
    continue
  }

  const json = await res.text()
  const file = basename(new URL(url).pathname)
  await writeFile(resolve(outDir, file), `${json}\n`, "utf8")
  console.log(`saved ${file}`)
}
