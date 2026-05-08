import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  // Dual-output: ESM + CJS for maximum consumer compat. The package.json
  // `exports` field routes consumers to the right one.
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  // Minify is off by default for libraries — consumers' bundlers do
  // their own optimization, and unminified output makes stack traces
  // legible.
  minify: false,
  // Skip bundling node_modules — declare runtime deps as
  // peerDependencies / dependencies so consumers can dedupe.
  splitting: false,
  treeshake: true,
});
