import { defineConfig } from "tsup"
import path from "path"

export default defineConfig({
  entry: ["src/index.ts", "src/runtime.ts"],
  format: ["cjs", "esm"],
  tsconfig: path.resolve(__dirname, "tsconfig.json"),
  dts: true,
  clean: true,
})
