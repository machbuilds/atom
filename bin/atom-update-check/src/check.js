// atom-update-check core logic.
//
// Two responsibilities:
//   - `runTick()` polls upstream VERSION and writes `~/.atom/state/update-check.json`.
//     Designed to run as a detached, fire-and-forget grandchild.
//   - `applySnooze(duration)` sets `snoozeUntil` so the next notice is
//     suppressed until that timestamp passes.
//
// The "should we print a notice?" decision is NOT here — it's inlined into
// each CLI's startup as `update-check-client.js`. That keeps the per-CLI
// startup cost down to a few ms (one JSON read + a synchronous decision +
// optionally spawning this tick worker as a detached child).
//
// Env overrides (used for tests; users do not normally set these):
//   ATOM_STATE_DIR        where update-check.json lives (default ~/.atom/state)
//   ATOM_VERSION_URL      upstream VERSION URL
//   ATOM_VERSION_FILE     local file to read instead of fetching (test escape hatch)
//   ATOM_INSTALL          install dir for reading the locally installed VERSION
//                         (default ~/.atom/atom)

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const DEFAULT_VERSION_URL = 'https://raw.githubusercontent.com/machbuilds/atom/main/VERSION';

export function stateDir() {
  return process.env.ATOM_STATE_DIR || join(homedir(), '.atom', 'state');
}

export function stateFile() {
  return join(stateDir(), 'update-check.json');
}

export function readState() {
  try {
    return JSON.parse(readFileSync(stateFile(), 'utf8'));
  } catch {
    return {};
  }
}

export function writeState(state) {
  const dir = stateDir();
  mkdirSync(dir, { recursive: true });
  writeFileSync(stateFile(), JSON.stringify(state, null, 2) + '\n');
}

export async function runTick() {
  // Fetch upstream VERSION. Silent on failure — the check is best-effort,
  // and we never want this background worker to surface errors. The
  // ATOM_VERSION_FILE escape hatch lets tests skip the network call.
  let upstream = null;
  try {
    if (process.env.ATOM_VERSION_FILE) {
      upstream = readFileSync(process.env.ATOM_VERSION_FILE, 'utf8').trim();
    } else {
      const url = process.env.ATOM_VERSION_URL || DEFAULT_VERSION_URL;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const text = (await res.text()).trim();
        if (/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(text)) upstream = text;
      }
    }
  } catch {
    // network failed, dns failed, whatever — best effort, swallow.
  }

  const state = readState();
  state.lastChecked = new Date().toISOString();
  if (upstream) state.latestVersion = upstream;
  try {
    writeState(state);
  } catch {
    // Can't write state — disk full, permission, etc. Nothing useful to
    // do; the next tick will retry.
  }
}

const SNOOZE_DURATIONS = {
  '24h': 24 * 3600 * 1000,
  '48h': 48 * 3600 * 1000,
  '7d': 7 * 24 * 3600 * 1000,
};

export function applySnooze(duration) {
  if (!SNOOZE_DURATIONS[duration]) {
    process.stderr.write(`atom-update-check: unknown snooze duration '${duration}'. Use one of: 24h, 48h, 7d\n`);
    process.exit(1);
  }
  const ms = SNOOZE_DURATIONS[duration];
  const state = readState();
  state.snoozeUntil = new Date(Date.now() + ms).toISOString();
  // Reset lastNotified so the FIRST run after snooze expires can print
  // a notice (otherwise the 24h-since-notified gate could still hide it).
  state.lastNotified = null;
  writeState(state);
  console.log(`atom: upgrade notice snoozed for ${duration} (until ${state.snoozeUntil}).`);
}

export function printStatus() {
  const state = readState();
  const lines = [];
  lines.push(`state file:    ${stateFile()}`);
  lines.push(`lastChecked:   ${state.lastChecked || '(never)'}`);
  lines.push(`latestVersion: ${state.latestVersion || '(unknown)'}`);
  lines.push(`lastNotified:  ${state.lastNotified || '(never)'}`);
  lines.push(`snoozeUntil:   ${state.snoozeUntil || '(none)'}`);
  console.log(lines.join('\n'));
}

// Exported for tests + the inlined client. Pure: returns true if `a` is
// strictly newer than `b` according to a simple x.y.z comparison.
export function isNewerSemver(a, b) {
  if (!a || !b) return false;
  const pa = a.split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] > pb[i];
  }
  return false;
}
