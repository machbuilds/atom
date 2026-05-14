// Canonical update-check client. Each atom CLI ships a copy of this file
// at `<cli>/src/lib/update-check-client.js` and imports it at the top of
// its entry script as a side-effect: `import './lib/update-check-client.js';`
//
// Inlined (rather than referenced as a cross-package dep) because:
//   - Each CLI is its own npm package — file: deps survive `npm install`
//     but introduce subtle resolution edge cases with `npm install -g`.
//   - The startup cost matters. Loading a sibling package costs roughly
//     the same as the work the snippet does. Inlining keeps us at a few
//     ms per CLI invocation.
//
// To update: edit this file, then mirror the change into every
// `bin/<cli>/src/lib/update-check-client.js`. The matching test
// (Test 20 in scripts/test-atom-setup.sh) verifies the five copies are
// byte-identical so drift gets caught immediately.

import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;     // 6h between network polls
const NOTIFY_INTERVAL_MS = 24 * 60 * 60 * 1000;   // 24h between repeat notices

(function maybeNotifyAndScheduleCheck() {
  if (process.env.ATOM_UPDATE_CHECK_DISABLED) return;

  const stateDir = process.env.ATOM_STATE_DIR || join(homedir(), '.atom', 'state');
  const stateFile = join(stateDir, 'update-check.json');

  let state = {};
  try { state = JSON.parse(readFileSync(stateFile, 'utf8')); } catch { state = {}; }

  const now = Date.now();
  const snoozeUntil = state.snoozeUntil ? Date.parse(state.snoozeUntil) : 0;
  const lastNotified = state.lastNotified ? Date.parse(state.lastNotified) : 0;
  const lastChecked = state.lastChecked ? Date.parse(state.lastChecked) : 0;
  const latest = state.latestVersion;

  // Print a notice if upstream is newer than installed, snooze has
  // expired, and we haven't notified in 24h.
  if (latest && now >= snoozeUntil && now - lastNotified >= NOTIFY_INTERVAL_MS) {
    let installed = null;
    try {
      const installDir = process.env.ATOM_INSTALL || join(homedir(), '.atom', 'atom');
      installed = readFileSync(join(installDir, 'VERSION'), 'utf8').trim();
    } catch { /* no installed VERSION — can't compare */ }

    if (installed && isNewerSemver(latest, installed)) {
      process.stderr.write(
        `\nnotice: atom ${latest} is available. ` +
        `(run \`atom upgrade\`, or snooze: \`atom upgrade --snooze 7d\`)\n\n`,
      );
      try {
        mkdirSync(stateDir, { recursive: true });
        state.lastNotified = new Date(now).toISOString();
        writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n');
      } catch { /* state write failed — best effort */ }
    }
  }

  // Schedule a tick if the throttle has expired. Detached so the parent
  // doesn't wait for the network call. ENOENT (atom-update-check not on
  // PATH) surfaces asynchronously via the child's 'error' event, so we
  // attach a no-op listener — without it, Node would crash the parent.
  if (now - lastChecked >= CHECK_INTERVAL_MS) {
    try {
      const child = spawn('atom-update-check', ['tick'], {
        detached: true,
        stdio: 'ignore',
      });
      child.on('error', () => { /* ENOENT or similar — silently skip */ });
      child.unref();
    } catch { /* synchronous spawn failure — silently skip */ }
  }
})();

function isNewerSemver(a, b) {
  if (!a || !b) return false;
  const pa = String(a).split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] > pb[i];
  }
  return false;
}
