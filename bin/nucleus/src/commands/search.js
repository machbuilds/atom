import { readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import color from 'picocolors';
import { NUCLEUS_PROJECTS_DIR, learningsFile } from '../lib/paths.js';
import { readEntries } from '../lib/jsonl.js';
import { autoMigrateIfNeeded } from './migrate.js';

const CONFIDENCE_RANK = { low: 1, medium: 2, high: 3 };

export function registerSearchCommand(program) {
  program
    .command('search [query]')
    .description('Search learnings across all projects. Keyword + structured filters.')
    .option('--type <type>')
    .option('--project <slug>', 'filter by project slug; repeat for multiple', collect, [])
    .option('--confidence <level>', 'low | medium | high (matches level and above)')
    .option('--since <duration>', 'e.g. 7d, 30d, 6m, 1y')
    .option('--files <pattern>', 'glob match against entry.files')
    .option('--tags <tags...>', 'match if entry has any of these tags')
    .option('--source <source>')
    .option('--sort <mode>', 'confidence (default) | recent', 'confidence')
    .option('--limit <n>', 'max results', parseInt)
    .option('--json', 'output JSON instead of formatted text')
    .option('--semantic', '[reserved] semantic search via embeddings (not yet implemented)')
    .action(async (query, opts) => {
      if (opts.semantic) {
        console.error('--semantic search is reserved for a future release.');
        process.exit(1);
      }

      await autoMigrateIfNeeded();

      if (!existsSync(NUCLEUS_PROJECTS_DIR)) {
        if (opts.json) console.log('[]');
        else console.error('No projects in ~/.nucleus yet.');
        process.exit(0);
      }

      const projects = opts.project.length > 0 ? opts.project : listProjects();
      const allEntries = projects.flatMap((slug) => {
        const f = learningsFile(slug);
        return existsSync(f) ? readEntries(f) : [];
      });

      const filtered = allEntries.filter((e) => matches(e, query, opts));
      const sorted = sortEntries(filtered, opts.sort);
      const limited = opts.limit ? sorted.slice(0, opts.limit) : sorted;

      if (opts.json) {
        console.log(JSON.stringify(limited, null, 2));
        return;
      }

      if (limited.length === 0) {
        console.error(color.dim('No matches.'));
        process.exit(0);
      }

      for (const e of limited) {
        printEntry(e);
      }
    });
}

function collect(value, prev) {
  prev.push(value);
  return prev;
}

function listProjects() {
  return readdirSync(NUCLEUS_PROJECTS_DIR).filter((name) => {
    const p = join(NUCLEUS_PROJECTS_DIR, name);
    try {
      return statSync(p).isDirectory();
    } catch {
      return false;
    }
  });
}

function matches(entry, query, opts) {
  if (query) {
    const q = query.toLowerCase();
    const hay = `${entry.insight || ''} ${entry.key || ''} ${(entry.tags || []).join(' ')}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (opts.type && entry.type !== opts.type) return false;
  if (opts.source && entry.source !== opts.source) return false;
  if (opts.confidence) {
    const want = CONFIDENCE_RANK[opts.confidence];
    if (!want) return false;
    const have = CONFIDENCE_RANK[entry.confidence] || 0;
    if (have < want) return false;
  }
  if (opts.tags && opts.tags.length > 0) {
    const has = (entry.tags || []).some((t) => opts.tags.includes(t));
    if (!has) return false;
  }
  if (opts.since) {
    const cutoff = parseDuration(opts.since);
    if (cutoff && new Date(entry.ts).getTime() < cutoff) return false;
  }
  if (opts.files) {
    const re = globToRegex(opts.files);
    const hit = (entry.files || []).some((f) => re.test(f));
    if (!hit) return false;
  }
  return true;
}

function parseDuration(s) {
  const m = String(s).match(/^(\d+)([dwmy])$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  const ms =
    unit === 'd' ? n * 86_400_000 :
    unit === 'w' ? n * 7 * 86_400_000 :
    unit === 'm' ? n * 30 * 86_400_000 :
    n * 365 * 86_400_000;
  return Date.now() - ms;
}

function globToRegex(glob) {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}

function sortEntries(entries, mode) {
  if (mode === 'recent') {
    return [...entries].sort((a, b) => (b.ts || '').localeCompare(a.ts || ''));
  }
  return [...entries].sort((a, b) => {
    const cb = CONFIDENCE_RANK[b.confidence] || 0;
    const ca = CONFIDENCE_RANK[a.confidence] || 0;
    if (cb !== ca) return cb - ca;
    return (b.ts || '').localeCompare(a.ts || '');
  });
}

function printEntry(e) {
  const date = (e.ts || '').slice(0, 10);
  console.log(
    `${color.cyan(e.project)} ${color.dim('·')} ${color.yellow(e.type)} ${color.dim('·')} ${color.bold(e.confidence)} ${color.dim('·')} ${color.dim(date)}  ${color.dim(e.id)}`,
  );
  for (const line of (e.insight || '').split('\n')) {
    console.log(`  ${line}`);
  }
  if (e.files && e.files.length > 0) {
    console.log(color.dim(`  → ${e.files.join(', ')}`));
  }
  console.log('');
}
