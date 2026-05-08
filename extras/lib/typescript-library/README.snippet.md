## Quick start

```bash
# 1. Install (Node 18+)
npm install

# 2. Run the build
npm run build         # produces dist/index.{js,cjs,d.ts}

# 3. Run tests
npm test
```

## Project layout

```
src/
├── index.ts         Public API surface (only exports the consumer should see)
└── index.test.ts    vitest, colocated next to the file under test
package.json         Dual ESM/CJS exports, npm provenance, files allowlist
tsconfig.json        Strict mode + noUncheckedIndexedAccess
tsup.config.ts       Bundler config (ESM + CJS + .d.ts)
.github/workflows/release.yml   Tag push → npm publish with provenance
```

## Releasing

```bash
# 1. Bump the version
npm version patch | minor | major

# 2. Push the tag
git push --follow-tags

# The release workflow runs npm publish with provenance.
# Requires NPM_TOKEN secret in the repo settings.
```

## Common commands

| Task | Command |
|---|---|
| Build | `npm run build` |
| Watch build | `npm run dev` |
| Test (one-shot) | `npm test` |
| Test (watch) | `npm run test:watch` |
| Type-check only | `npm run lint` |
| Local install in another project | `npm pack`, then `npm install /path/to/your-library-x.y.z.tgz` |
