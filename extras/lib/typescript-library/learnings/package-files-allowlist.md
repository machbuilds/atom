---
type: pattern
applies_to: [node, library]
slug: package-files-allowlist
---

# Use `files` as an allowlist, not `.npmignore`

## Pattern

Always declare a `files` array in `package.json` listing exactly what
should ship to npm. Don't rely on `.npmignore` to subtract from the
default include set.

## Why

- `.npmignore` is opt-out: forget to add a new directory and it ships
  by default. `files` is opt-in: only listed paths ship, full stop.
- The default npm include set ships things like `.env`, `src/`,
  test fixtures, and IDE config files when authors don't notice.
  This bloats the tarball and occasionally leaks secrets.
- A small `files` allowlist also documents what consumers depend on.
  When you're tempted to refactor, the allowlist tells you what's
  actually part of the public package surface.

## How to apply

```json
{
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ]
}
```

Things you almost never want to ship:
- `src/` (consumers use `dist/`; `src/` doubles tarball size)
- `node_modules/` (npm strips this, but `.npmignore` errors can leak it)
- Tests, fixtures, snapshots
- `.env*`, `.tsbuildinfo`, `tsconfig.json`, `tsup.config.ts`
- CI workflows, dotfiles

Verify with `npm pack --dry-run` before every release — it prints
the exact file list of the tarball that would publish.
