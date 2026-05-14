# Migrating to the v0.2 install layout

If you installed atom in **v0.1.x** by `git clone`-ing the repo and running `./atom-setup` from inside that clone, you're on the **in-place model**: your clone is both the atom source and a candidate project directory. Globals point back at that clone.

**v0.2** introduces the canonical install location `~/.atom/atom/`, alongside `~/.atom/nucleus/` and `~/.atom/learnings/`. New projects scaffold from there via `atom-setup new <name>` and never touch the source.

This doc walks you from the in-place model to the new layout in one command (or four manual ones, if you prefer to see every step).

> Already on `~/.atom/atom/`? You don't need this doc. Run `atom upgrade` when a new version ships.

---

## Auto path — one command

```bash
atom migrate-install
```

That command:

1. Refuses if `~/.atom/atom/` already exists.
2. Clones `https://github.com/machbuilds/atom.git` to `~/.atom/atom/`.
3. Runs `npm install` + `npm install -g .` for each of the five CLIs (`atom`, `atom-setup`, `nucleus`, `learnings`, `model-race`), re-linking globals to the new location.
4. Leaves your old in-place clone untouched.

Verify when it's done:

```bash
atom --version           # confirms the dispatcher
atom-setup --version
nucleus --version
learnings --version
model-race --version
```

All five should report the v0.2 version. Your old clone is still where it was — keep it for a few days as a safety net, then delete it:

```bash
rm -rf /path/to/your/old/atom/clone
```

`~/.atom/nucleus/` and `~/.atom/learnings/` are **never touched** by migration. Your captured learnings and curated playbook stay put.

---

## Manual path — the four steps

If you'd rather do it yourself (or `atom migrate-install` failed partway through), this is the exact sequence:

### 1. Confirm `~/.atom/atom/` is free

```bash
ls ~/.atom/atom 2>/dev/null && echo "EXISTS — stop and inspect" || echo "free to use"
```

If something's there from an earlier experiment, decide whether to keep it. The migration won't overwrite.

### 2. Clone fresh

```bash
git clone https://github.com/machbuilds/atom.git ~/.atom/atom
```

### 3. Re-install every CLI globally

```bash
cd ~/.atom/atom
for cli in bin/atom bin/atom-setup bin/nucleus bin/learnings bin/model-race; do
  (cd "$cli" && npm install && npm install -g .)
done
```

If you hit `EACCES`, either prefix with `sudo` or [set up a user-owned npm prefix](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally) and retry.

### 4. Verify globals point at the new location

```bash
atom --version           # should match ~/.atom/atom/VERSION
which atom-setup         # should be on your PATH
```

If `which atom-setup` still feels stale, run `hash -r` (bash/zsh) to drop the shell's cached lookups.

---

## What changes for you after migration

| Before (in-place) | After (`~/.atom/atom/`) |
|---|---|
| `git clone … my-project && cd my-project && ./atom-setup` | `atom-setup new my-project` from anywhere on PATH |
| Re-running `./atom-setup` against an existing project risked clobbering it | Source and project are separate; the wizard always writes into the chosen target |
| Editing your atom source = live for your "user install" | Edits live in your dev clone (separate dir); your user install at `~/.atom/atom/` only changes on `atom upgrade` |
| No upgrade command — you re-cloned to update | `atom upgrade` polls upstream and re-installs in place |

The legacy in-place mode still works for one release with a deprecation notice. v0.3 will remove it.

---

## Cleanup checklist

Once `atom --version` returns the new version and you've used `atom-setup new <name>` to scaffold at least one project successfully, you can clean up:

- [ ] Verify all five globals (`atom`, `atom-setup`, `nucleus`, `learnings`, `model-race`) point at code under `~/.atom/atom/`
- [ ] Delete the old in-place clone: `rm -rf /path/to/old/atom/clone`
- [ ] (Optional) `atom upgrade --check` to confirm the dispatcher can poll upstream

`~/.atom/nucleus/` and `~/.atom/learnings/` were not part of this migration — they were already in `~/.atom/` from v0.1.x. Nothing to do there.

---

## Troubleshooting

**`atom migrate-install` says `~/.atom/atom/` already exists.**

You may have run the migration twice, or have an unrelated checkout there. Inspect with `ls ~/.atom/atom`; if it's the migrated install, you're done. If it's an experiment, delete it and re-run.

**`atom: command not found` after migration.**

Either your shell cached the old `atom` lookup (run `hash -r` to clear), or your npm prefix's bin dir is not on `PATH`. Run `npm config get prefix` and confirm `<that-prefix>/bin` is in `$PATH`.

**`npm install -g .` failed with EACCES.**

Either `sudo` the migration or [reconfigure npm to use a user-owned prefix](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally). Once `npm install -g .` works for one CLI manually, re-run `atom migrate-install` — it will refuse because the dir exists, so `rm -rf ~/.atom/atom` first.

**My old in-place clone's `~/.atom-setup-state.json` got included somehow.**

It can't — migration only touches `~/.atom/atom/`. Anything in the old clone (project state files, dev work, branches you haven't pushed) stays exactly where it was.
