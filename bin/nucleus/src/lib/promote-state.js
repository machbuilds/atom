import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { NUCLEUS_PROJECTS_DIR, learningsFile } from './paths.js';
import { learningsFilePath } from './promote-paths.js';
import { readEntries } from './jsonl.js';
import { writeConfig } from './config.js';

const NUDGE_COUNT_THRESHOLD = 10;
const NUDGE_AGE_THRESHOLD_DAYS = 14;
const NUDGE_DEBOUNCE_MS = 24 * 60 * 60 * 1000;

export function getBacklog() {
  if (!existsSync(NUCLEUS_PROJECTS_DIR)) {
    return { unpromoted: [], oldestAgeDays: 0, count: 0 };
  }

  const slugs = readdirSync(NUCLEUS_PROJECTS_DIR).filter((name) => {
    const p = join(NUCLEUS_PROJECTS_DIR, name);
    try {
      return statSync(p).isDirectory();
    } catch {
      return false;
    }
  });

  const unpromoted = [];
  for (const slug of slugs) {
    const f = learningsFile(slug);
    if (!existsSync(f)) continue;
    for (const entry of readEntries(f)) {
      if (isAlreadyPromoted(entry)) continue;
      unpromoted.push(entry);
    }
  }

  const now = Date.now();
  let oldestMs = now;
  for (const e of unpromoted) {
    const t = Date.parse(e.ts || '');
    if (!Number.isNaN(t) && t < oldestMs) oldestMs = t;
  }
  const oldestAgeDays =
    unpromoted.length === 0
      ? 0
      : Math.floor((now - oldestMs) / (24 * 60 * 60 * 1000));

  return { unpromoted, oldestAgeDays, count: unpromoted.length };
}

export function isAlreadyPromoted(entry) {
  if (!entry || !entry.type || !entry.key) return false;
  const path = learningsFilePath(entry.type, entry.key);
  return existsSync(path);
}

export function shouldNudge(config, backlog) {
  if (!config || !backlog) return false;
  const meetsThreshold =
    backlog.count >= NUDGE_COUNT_THRESHOLD ||
    backlog.oldestAgeDays >= NUDGE_AGE_THRESHOLD_DAYS;
  if (!meetsThreshold) return false;

  const last = config.lastNudgeAt ? Date.parse(config.lastNudgeAt) : NaN;
  if (Number.isNaN(last)) return true;
  return Date.now() - last >= NUDGE_DEBOUNCE_MS;
}

export function markNudged(config) {
  const next = { ...config, lastNudgeAt: new Date().toISOString() };
  writeConfig(next);
  return next;
}

export function formatNudge(backlog) {
  const age =
    backlog.oldestAgeDays > 0
      ? ` (oldest: ${backlog.oldestAgeDays} day${backlog.oldestAgeDays === 1 ? '' : 's'})`
      : '';
  return `ℹ ${backlog.count} unpromoted entries${age}. Run \`nucleus review\` to triage.`;
}

export const THRESHOLDS = {
  count: NUDGE_COUNT_THRESHOLD,
  ageDays: NUDGE_AGE_THRESHOLD_DAYS,
  debounceMs: NUDGE_DEBOUNCE_MS,
};
