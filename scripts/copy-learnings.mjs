#!/usr/bin/env node
// copy-learnings.mjs — copy filtered learnings from atom/learnings/ into a target project.
// Used by atom-setup at clone time. Filters by `applies_to` against project stack tags.

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { parseArgs } from 'node:util';

const HELP = `
copy-learnings — filter and copy atom/learnings/ into a new project

Usage:
  node scripts/copy-learnings.mjs --target <dir> --stack-tags <tag1,tag2,...> [options]

Required:
  --target <dir>          Destination project root. Files land in <dir>/learnings/.
  --stack-tags <list>     Comma-separated stack tags. Must include 'universal' to get
                          the always-ship learnings. Example: universal,web,api

Options:
  --source <dir>          Source learnings dir. Default: ./learnings (atom repo root).
  --dry-run               Show what would be copied without writing.
  --force                 Overwrite files that already exist in target.
  -h, --help              Show this help.

Examples:
  node scripts/copy-learnings.mjs --target /path/to/new-project --stack-tags universal,web
  node scripts/copy-learnings.mjs --target . --stack-tags universal,api --dry-run
`;

const { values } = parseArgs({
  options: {
    target: { type: 'string' },
    'stack-tags': { type: 'string' },
    source: { type: 'string', default: 'learnings' },
    'dry-run': { type: 'boolean', default: false },
    force: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
  allowPositionals: false,
});

if (values.help) {
  console.log(HELP);
  process.exit(0);
}

if (!values.target || !values['stack-tags']) {
  console.error('Missing required --target or --stack-tags. Run with --help for usage.');
  process.exit(1);
}

const sourceDir = values.source;
const targetDir = join(values.target, 'learnings');
const stackTags = new Set(values['stack-tags'].split(',').map((s) => s.trim()).filter(Boolean));
const dryRun = values['dry-run'];
const force = values.force;

if (stackTags.size === 0) {
  console.error('--stack-tags resolved to an empty set.');
  process.exit(1);
}

if (!existsSync(sourceDir)) {
  console.error(`Source not found: ${sourceDir}`);
  process.exit(1);
}

const files = walkMarkdown(sourceDir);
const result = {
  copied: 0,
  skippedExisting: 0,
  skippedFilter: 0,
  errors: 0,
  byType: {},
};

for (const file of files) {
  if (file.endsWith('README.md')) continue;
  let raw;
  try {
    raw = readFileSync(file, 'utf8');
  } catch (err) {
    console.error(`Read failed: ${file} — ${err.message}`);
    result.errors++;
    continue;
  }

  const fm = parseFrontmatter(raw);
  if (!fm) {
    console.error(`No frontmatter: ${file}`);
    result.errors++;
    continue;
  }

  const appliesTo = parseList(fm.applies_to) || ['universal'];
  if (!matches(appliesTo, stackTags)) {
    result.skippedFilter++;
    continue;
  }

  const relPath = relative(sourceDir, file);
  const dest = join(targetDir, relPath);
  const type = relPath.split('/')[0];

  if (existsSync(dest) && !force) {
    result.skippedExisting++;
    continue;
  }

  if (!dryRun) {
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, raw, 'utf8');
  }

  result.copied++;
  result.byType[type] = (result.byType[type] || 0) + 1;
  console.log(`${dryRun ? '(dry-run) ' : ''}copy  ${relPath}`);
}

console.log('');
console.log(`${result.copied} copied${dryRun ? ' (dry-run; no writes)' : ''}`);
if (result.skippedFilter > 0) console.log(`${result.skippedFilter} skipped (filtered out by stack)`);
if (result.skippedExisting > 0) console.log(`${result.skippedExisting} skipped (target exists; use --force to overwrite)`);
if (result.errors > 0) console.log(`${result.errors} errors`);
if (result.copied > 0) {
  const breakdown = Object.entries(result.byType).map(([t, n]) => `${n} ${t}`).join(', ');
  console.log(`by type: ${breakdown}`);
}

process.exit(result.errors > 0 ? 1 : 0);

// ---

function walkMarkdown(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    let s;
    try {
      s = statSync(p);
    } catch {
      continue;
    }
    if (s.isDirectory()) {
      out.push(...walkMarkdown(p));
    } else if (entry.endsWith('.md')) {
      out.push(p);
    }
  }
  return out;
}

function parseFrontmatter(raw) {
  const lines = raw.split('\n');
  if (lines[0] !== '---') return null;
  const end = lines.indexOf('---', 1);
  if (end === -1) return null;
  const fm = {};
  for (let i = 1; i < end; i++) {
    const line = lines[i];
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!m) continue;
    fm[m[1]] = m[2].trim();
  }
  return fm;
}

function parseList(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
    return [trimmed];
  }
  const inner = trimmed.slice(1, -1).trim();
  if (inner.length === 0) return [];
  return inner.split(',').map((s) => s.trim()).filter(Boolean);
}

function matches(appliesTo, stackTags) {
  if (appliesTo.includes('universal')) return true;
  for (const tag of appliesTo) {
    if (stackTags.has(tag)) return true;
  }
  return false;
}
