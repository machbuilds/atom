// Schema migration framework for nucleus JSONL files.
//
// Each project's `learnings.jsonl` may carry a header line at the top:
//
//   {"_atom_nucleus": true, "_schema": N, ...}
//
// Plain entries (no `_atom_nucleus` field) follow. Files without a
// header are treated as schema 0 (the v0.1.x format).
//
// Migrations live in `bin/nucleus/src/migrations/00X-description.js`,
// each exporting:
//
//   export const version     = N
//   export const description = 'short prose'
//   export function up({ header, entries }) -> { header, entries }
//
// The migrator finds the numerically-largest version in the registry,
// applies all migrations strictly greater than the file's current
// version, and writes back atomically (.tmp + rename) under the same
// proper-lockfile that `appendEntry` uses.

import {
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import lockfile from 'proper-lockfile';
import { NUCLEUS_PROJECTS_DIR, learningsFile } from './paths.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

// Loaded lazily so command modules don't pay the import cost.
let _migrations = null;

export async function loadMigrations() {
  if (_migrations) return _migrations;
  if (!existsSync(MIGRATIONS_DIR)) {
    _migrations = [];
    return _migrations;
  }
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d+-.*\.js$/.test(f))
    .sort();
  const loaded = [];
  for (const f of files) {
    const mod = await import(join(MIGRATIONS_DIR, f));
    if (typeof mod.version !== 'number' || typeof mod.up !== 'function') {
      throw new Error(`Migration ${f} must export numeric \`version\` and \`up\` function.`);
    }
    loaded.push({
      version: mod.version,
      description: mod.description || '',
      up: mod.up,
      filename: f,
    });
  }
  loaded.sort((a, b) => a.version - b.version);
  _migrations = loaded;
  return _migrations;
}

export async function latestVersion() {
  const migs = await loadMigrations();
  return migs.length === 0 ? 0 : migs[migs.length - 1].version;
}

// Read a JSONL file into { header, entries }. Header is the first line
// if it parses as an object with `_atom_nucleus: true`; otherwise null.
// Entries are every other non-blank line, parsed as JSON.
export function readFileWithHeader(filePath) {
  if (!existsSync(filePath)) return { header: null, entries: [] };
  const raw = readFileSync(filePath, 'utf8');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { header: null, entries: [] };
  let header = null;
  let firstEntryIdx = 0;
  try {
    const parsed = JSON.parse(lines[0]);
    if (parsed && parsed._atom_nucleus === true) {
      header = parsed;
      firstEntryIdx = 1;
    }
  } catch {
    // first line wasn't valid JSON — leave it for entry parsing to fail loudly
  }
  const entries = lines.slice(firstEntryIdx).map((line, i) => {
    try {
      return JSON.parse(line);
    } catch (err) {
      throw new Error(
        `Failed to parse JSONL at line ${firstEntryIdx + i + 1} of ${filePath}: ${err.message}`,
      );
    }
  });
  return { header, entries };
}

// Cheap check: returns the file's current schema version without
// parsing entries. Used to skip up-to-date files in O(1).
export function readFileVersion(filePath) {
  if (!existsSync(filePath)) return null;
  const raw = readFileSync(filePath, 'utf8');
  const firstLine = raw.split('\n', 1)[0].trim();
  if (firstLine.length === 0) return 0;
  try {
    const parsed = JSON.parse(firstLine);
    if (parsed && parsed._atom_nucleus === true) {
      return typeof parsed._schema === 'number' ? parsed._schema : 0;
    }
  } catch {
    return 0; // unparseable; treat as legacy and let the migrator decide
  }
  return 0; // first line is an entry, not a header → legacy
}

// Apply all pending migrations to a single file, atomically.
// Returns { applied: [version,...], from, to } or { applied: [], from, to }
// when nothing to do.
export async function migrateFile(filePath) {
  const migs = await loadMigrations();
  if (migs.length === 0) return { applied: [], from: 0, to: 0, filePath };

  const target = migs[migs.length - 1].version;
  const current = readFileVersion(filePath);
  if (current === null) return { applied: [], from: 0, to: target, filePath, skipped: 'missing' };
  if (current >= target) return { applied: [], from: current, to: target, filePath };

  // Acquire the same lock appendEntry uses, so a concurrent `nucleus add`
  // can't race against us.
  const release = await lockfile.lock(filePath, {
    retries: { retries: 5, factor: 1.5, minTimeout: 50, maxTimeout: 1000 },
    stale: 10_000,
  });

  let state;
  const applied = [];
  try {
    state = readFileWithHeader(filePath);
    for (const mig of migs) {
      if (mig.version <= current) continue;
      state = mig.up(state) || state;
      applied.push(mig.version);
    }
    // Ensure the header reflects the new schema version so future runs
    // skip in O(1).
    state.header = state.header || {};
    state.header._atom_nucleus = true;
    state.header._schema = target;

    writeAtomically(filePath, serialize(state));
  } finally {
    await release();
  }

  return { applied, from: current, to: target, filePath };
}

// Walks all project files under NUCLEUS_PROJECTS_DIR and migrates each.
// Returns an array of per-file results. Caller decides how to render.
export async function migrateAll() {
  const results = [];
  if (!existsSync(NUCLEUS_PROJECTS_DIR)) return results;
  const projects = readdirSync(NUCLEUS_PROJECTS_DIR);
  for (const slug of projects) {
    const file = learningsFile(slug);
    if (!existsSync(file)) continue;
    results.push(await migrateFile(file));
  }
  return results;
}

// Cheap predicate used by add/search to decide whether to silently
// trigger migrateAll. True iff any project's file lags the latest version.
export async function anyFileNeedsMigration() {
  const target = await latestVersion();
  if (target === 0) return false;
  if (!existsSync(NUCLEUS_PROJECTS_DIR)) return false;
  const projects = readdirSync(NUCLEUS_PROJECTS_DIR);
  for (const slug of projects) {
    const file = learningsFile(slug);
    if (!existsSync(file)) continue;
    const v = readFileVersion(file);
    if (v !== null && v < target) return true;
  }
  return false;
}

// ─── helpers ──────────────────────────────────────────────────────────

function serialize({ header, entries }) {
  const lines = [];
  if (header) lines.push(JSON.stringify(header));
  for (const e of entries) lines.push(JSON.stringify(e));
  return lines.join('\n') + (lines.length ? '\n' : '');
}

function writeAtomically(filePath, content) {
  const tmp = filePath + '.tmp';
  writeFileSync(tmp, content, 'utf8');
  renameSync(tmp, filePath);
}
