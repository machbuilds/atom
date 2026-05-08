---
type: pattern
applies_to: [node, library]
slug: dual-esm-cjs-with-tsup
---

# Ship dual ESM + CJS via tsup; let exports route consumers

## Pattern

For a library that wants to be consumable from both ESM and CommonJS
projects, ship both formats and use the `package.json` `exports` field
to route each consumer to the right one. tsup handles both builds in
one config.

## Why

- ESM-only libraries break for consumers stuck on CJS (CRA, older
  Jest configs, ts-node without ESM, server-side environments
  pinned to older Node).
- CJS-only libraries can't be tree-shaken by ESM consumers and can
  trip "default export" interop bugs.
- A dual build (with `exports` map) lets each consumer's bundler
  pick the format that matches their module system. No more "this
  package is ESM-only" issues in your inbox.

## How to apply

`tsup.config.ts`:
```ts
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
});
```

`package.json`:
```json
{
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

Notes:
- The `types` condition must come **first** in each `exports`
  block — TypeScript walks conditions in order.
- `"type": "module"` makes the `.js` outputs ESM and tsup names
  the CJS output `.cjs` to disambiguate.
- Always test the install: `npm pack`, then install the tarball in
  both an ESM and a CJS sandbox project before publishing.
