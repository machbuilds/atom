import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, renameSync, mkdirSync } from 'node:fs';

// In v0.1.0, nucleus lived at ~/.nucleus/. In v0.1.1 it moved under
// the umbrella ~/.atom/nucleus/ for namespace consistency with
// learnings (~/.atom/learnings/) and any future per-machine atom
// state. The migration is a one-shot rename on first nucleus run.

const ATOM_HOME = process.env.ATOM_HOME || join(homedir(), '.atom');
const LEGACY_NUCLEUS_HOME = join(homedir(), '.nucleus');

export const NUCLEUS_HOME =
  process.env.NUCLEUS_HOME || join(ATOM_HOME, 'nucleus');

export const NUCLEUS_CONFIG_PATH = join(NUCLEUS_HOME, 'config.json');
export const NUCLEUS_PROJECTS_DIR = join(NUCLEUS_HOME, 'projects');

export function projectDir(slug) {
  return join(NUCLEUS_PROJECTS_DIR, slug);
}

export function learningsFile(slug) {
  return join(projectDir(slug), 'learnings.jsonl');
}

// Migrate from v0.1.0 location if needed. Idempotent: a no-op if the
// new location already exists or the legacy one doesn't.
export function migrateLegacyHomeIfNeeded() {
  if (existsSync(NUCLEUS_HOME)) return false;
  if (!existsSync(LEGACY_NUCLEUS_HOME)) return false;
  // Source exists, destination doesn't — move it.
  mkdirSync(ATOM_HOME, { recursive: true });
  renameSync(LEGACY_NUCLEUS_HOME, NUCLEUS_HOME);
  return true;
}
