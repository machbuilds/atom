# Security policy

## Supported versions

atom is in active early-stage development. The latest tagged release on `main` is the only supported version.

| Version | Supported |
|---|---|
| v0.1.x  | yes (current) |
| < v0.1  | no  |

## Reporting a vulnerability

If you discover a security vulnerability in atom, the three CLIs (`atom-setup`, `nucleus`, `model-race`), or any shipped scaffold/extras content, **do not open a public issue**.

Instead, use one of these private channels:

1. **GitHub Security Advisories** (preferred). Open a private advisory at https://github.com/mach273/atom/security/advisories/new. The maintainer is notified directly and the disclosure stays embargoed until a fix lands.
2. **Email**: send a description to the maintainer's contact email listed in the GitHub profile at https://github.com/mach273. Include "atom security" in the subject.

Please include:

- A clear description of the vulnerability.
- Steps to reproduce, or proof-of-concept code.
- Affected versions / commits.
- Your assessment of the impact.
- Suggested mitigation, if you have one.

You'll get an acknowledgement within 72 hours. We aim to ship a fix within 14 days for high-severity issues, longer for low-severity.

## What counts

In scope:

- The three CLIs (`atom-setup`, `nucleus`, `model-race`).
- `scripts/copy-learnings.mjs` and any other shipped automation.
- Default scaffold content, including `.github/workflows/*.yml` and Dockerfiles in `extras/`.
- Documentation that could mislead users into insecure configurations.

Out of scope:

- Vulnerabilities in third-party dependencies (report those upstream; we'll bump versions when they're patched).
- Vulnerabilities in projects bootstrapped from atom that are caused by user customisation, not by atom's defaults.
- Issues only reproducible with intentionally malformed configuration.

## Disclosure

We follow a coordinated-disclosure model: we won't publish details of an issue until a fix is shipped, and we credit reporters in the release notes (with permission). If you'd prefer to remain anonymous, say so when you report.
