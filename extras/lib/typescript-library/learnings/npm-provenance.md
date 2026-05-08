---
type: pattern
applies_to: [node, library]
slug: npm-provenance
---

# Publish with npm provenance from CI

## Pattern

Always publish with `npm publish --provenance` from a CI workflow
(GitHub Actions or supported equivalent). Never publish from a
developer's local machine for a public package.

## Why

- Provenance attaches a cryptographic statement to the npm package
  recording exactly which CI run + git commit produced it. Consumers
  can verify the package came from your repo, not from a stolen
  npm token.
- Local-machine publishes mean any developer with an npm token can
  publish anything as the package, with no audit trail. Several
  high-profile supply-chain attacks (event-stream, ua-parser-js)
  exploited compromised maintainer machines.
- Provenance is free for public packages, supported by npm, and
  shows up as a badge on the npm package page.

## How to apply

In `package.json`:
```json
{
  "publishConfig": {
    "access": "public",
    "provenance": true
  }
}
```

In the GitHub Actions workflow:
```yaml
permissions:
  contents: read
  id-token: write   # required for provenance OIDC
steps:
  - run: npm publish --provenance --access public
    env:
      NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Notes:
- `id-token: write` is what lets the runner exchange an OIDC token
  with npm, replacing static tokens for the provenance flow.
- The workflow in this preset triggers on `push: tags: ['v*']` —
  pair it with `npm version <bump>` locally so the tag and version
  stay in sync.
- Always run tests + build in the same workflow before publish, so
  the published artifact is exactly what passed CI.
