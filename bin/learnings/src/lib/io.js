import { readdirSync, readFileSync, statSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { LEARNINGS_HOME, LEARNINGS_CONFIG_PATH, TYPES } from './paths.js';

export const DEFAULT_CONFIG = {
  version: 1,
  enabled: true,
  sync: { enabled: false, remote: null },
};

export function ensureHome() {
  if (!existsSync(LEARNINGS_HOME)) {
    mkdirSync(LEARNINGS_HOME, { recursive: true });
  }
}

export function readConfig() {
  if (!existsSync(LEARNINGS_CONFIG_PATH)) return null;
  return JSON.parse(readFileSync(LEARNINGS_CONFIG_PATH, 'utf8'));
}

export function writeConfig(config) {
  ensureHome();
  writeFileSync(LEARNINGS_CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
}

export function listAll() {
  const out = [];
  if (!existsSync(LEARNINGS_HOME)) return out;
  for (const type of TYPES) {
    const typeDir = join(LEARNINGS_HOME, type);
    if (!existsSync(typeDir)) continue;
    for (const entry of readdirSync(typeDir)) {
      if (!entry.endsWith('.md')) continue;
      const path = join(typeDir, entry);
      const raw = readFileSync(path, 'utf8');
      const fm = parseFrontmatter(raw);
      if (!fm) continue;
      out.push({
        type,
        slug: entry.replace(/\.md$/, ''),
        path,
        frontmatter: fm,
        body: extractBody(raw),
      });
    }
  }
  return out;
}

export function findByKey(key) {
  return listAll().find((e) => e.frontmatter.key === key || e.slug === key);
}

export function parseFrontmatter(raw) {
  const lines = raw.split('\n');
  if (lines[0] !== '---') return null;
  const end = lines.indexOf('---', 1);
  if (end === -1) return null;
  const fm = {};
  for (let i = 1; i < end; i++) {
    const m = lines[i].match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!m) continue;
    fm[m[1]] = m[2].trim();
  }
  return fm;
}

function extractBody(raw) {
  const lines = raw.split('\n');
  if (lines[0] !== '---') return raw;
  const end = lines.indexOf('---', 1);
  if (end === -1) return raw;
  return lines.slice(end + 1).join('\n').trimStart();
}
