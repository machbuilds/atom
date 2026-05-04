import { spawnSync } from 'node:child_process';

const CHECKS = [
  { id: 'git', cmd: ['git', '--version'], required: true },
  { id: 'node', cmd: ['node', '--version'], required: true },
  { id: 'gh', cmd: ['gh', '--version'], required: false },
  { id: 'docker', cmd: ['docker', '--version'], required: false },
  { id: 'gum', cmd: ['gum', '--version'], required: false },
];

export function runPreflight() {
  const results = {};
  for (const check of CHECKS) {
    const r = spawnSync(check.cmd[0], check.cmd.slice(1), { stdio: ['ignore', 'pipe', 'ignore'] });
    results[check.id] = {
      available: r.status === 0,
      version: r.status === 0 ? extractVersion(r.stdout?.toString() || '') : null,
      required: check.required,
    };
  }
  return results;
}

export function preflightOk(results) {
  for (const id of Object.keys(results)) {
    if (results[id].required && !results[id].available) return false;
  }
  return true;
}

function extractVersion(s) {
  const m = s.match(/(\d+\.\d+(\.\d+)?)/);
  return m ? m[1] : null;
}
