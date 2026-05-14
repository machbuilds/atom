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

1. **GitHub Security Advisories** (preferred). Open a private advisory at https://github.com/machbuilds/atom/security/advisories/new. The maintainer is notified directly and the disclosure stays embargoed until a fix lands.
2. **Email**: send a description to the maintainer's contact email listed in the GitHub profile at https://github.com/machbuilds. Include "atom security" in the subject.

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

## Trust model for the curl-pipe installer

The README's Quick Start is:

```bash
curl -fsSL https://raw.githubusercontent.com/machbuilds/atom/main/install.sh | bash
```

`curl … | bash` is a contentious UX. Some people will not run it under any circumstances. That is the right call for them. Here is exactly what is being trusted, and what we do to keep that surface small.

**What you're trusting when you run the one-liner:**

1. **HTTPS to GitHub.** `raw.githubusercontent.com` is GitHub's content host. The TLS certificate chain anchored in your OS trust store is the only mechanism preventing a network attacker from substituting a different script.
2. **The `main` branch of `github.com/machbuilds/atom`.** Whatever is at `HEAD` of `main` when you run the command is what executes on your machine. We tag releases, but the one-liner pulls `main` for ergonomics, not a pinned tag.
3. **The maintainer's GitHub credentials.** If the maintainer's account is compromised and `main` is force-pushed with malicious content, the next person to curl-pipe gets that content.

**What the script itself does:**

- Runs as your user (no sudo prompts unless `npm install -g` triggers EACCES, which the script flags rather than silently elevating).
- Only writes to `~/.atom/atom/` (the clone) and your npm global prefix (which `npm config get prefix` reports).
- Calls `git`, `npm`, and `node` from your PATH. No new binaries are downloaded outside of npm's own dependency resolution for the five CLIs.
- Refuses to overwrite an existing `~/.atom/atom/`.
- The full script is short and auditable: read it at https://github.com/machbuilds/atom/blob/main/install.sh before running.

**If that's not enough, install manually:**

```bash
git clone https://github.com/machbuilds/atom.git ~/.atom/atom
cd ~/.atom/atom
git verify-tag v0.2.x   # if you've imported the maintainer's signing key
for cli in bin/atom bin/atom-setup bin/nucleus bin/learnings bin/model-race; do
  (cd "$cli" && npm install && npm install -g .)
done
```

You inspect everything before any code runs. The script under the curl one-liner does the same steps; the only thing you skip is the visual diff.

**What we will add when there's a concrete threat model:**

- A signed `install.sh` checksum file and a one-line verification step.
- Tag-pinned install (`?ref=v0.2.1` in the URL) as the default.
- Reproducible npm install via `npm ci` once the CLIs ship lockfiles.

Currently these are deferred — the curl-pipe path is functionally identical to manual `git clone` + `npm install -g .`, which is the standard for git-distributed CLIs. PRs that raise the bar are welcome.
