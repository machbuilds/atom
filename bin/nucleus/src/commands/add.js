import { ulid } from 'ulid';
import color from 'picocolors';
import { readFileSync } from 'node:fs';
import { deriveSlug } from '../lib/slug.js';
import { readConfig, isEnabled } from '../lib/config.js';
import { learningsFile } from '../lib/paths.js';
import { appendEntry, SCHEMA_VERSION } from '../lib/jsonl.js';
import {
  getBacklog,
  shouldNudge,
  markNudged,
  formatNudge,
} from '../lib/promote-state.js';
import { autoMigrateIfNeeded } from './migrate.js';

const TYPES = [
  'architecture',
  'pitfall',
  'pattern',
  'workflow',
  'decision',
  'bug-fix',
  'performance',
  'security',
];

const CONFIDENCE = ['low', 'medium', 'high'];
const SOURCES = ['human', 'claude', 'cross-model', 'observation'];

export function registerAddCommand(program) {
  program
    .command('add [insight]')
    .description('Append a learning to the current project. Insight from arg, --insight, or stdin.')
    .option('--insight <text>', 'the actual learning, prose form')
    .option('--type <type>', `one of: ${TYPES.join(', ')}`)
    .option('--key <slug>', 'kebab-case stable key (auto-generated from insight if omitted)')
    .option('--confidence <level>', `${CONFIDENCE.join(' | ')}`, 'medium')
    .option('--source <source>', `${SOURCES.join(' | ')}`, 'human')
    .option('--files <paths...>', 'file paths the learning relates to')
    .option('--tags <tags...>', 'free-form tags')
    .option('--supersedes <id>', 'ULID of older entry this replaces')
    .option('--session-id <id>', 'group entries from same session')
    .option('--cwd <path>', 'directory to derive slug from', process.cwd())
    .option('--no-check-enabled', 'append even if nucleus is disabled in config')
    .action(async (insightArg, opts) => {
      if (!readConfig()) {
        console.error('nucleus not initialized. Run `nucleus init` first.');
        process.exit(1);
      }

      await autoMigrateIfNeeded();

      const slug = deriveSlug(opts.cwd);
      if (!slug) {
        console.error('Could not derive project slug.');
        process.exit(1);
      }

      if (opts.checkEnabled && !isEnabled(slug)) {
        console.error(`nucleus is disabled for project "${slug}". Skipping.`);
        process.exit(0);
      }

      const insight = await resolveInsight(insightArg, opts.insight);
      if (!insight) {
        console.error('Insight required (positional, --insight, or via stdin).');
        process.exit(1);
      }

      const type = opts.type;
      if (!type || !TYPES.includes(type)) {
        console.error(`--type required. One of: ${TYPES.join(', ')}`);
        process.exit(1);
      }

      const confidence = opts.confidence || 'medium';
      if (!CONFIDENCE.includes(confidence)) {
        console.error(`Invalid --confidence. One of: ${CONFIDENCE.join(', ')}`);
        process.exit(1);
      }

      const source = opts.source || 'human';
      if (!SOURCES.includes(source)) {
        console.error(`Invalid --source. One of: ${SOURCES.join(', ')}`);
        process.exit(1);
      }

      const key = opts.key || autoKey(insight);

      const entry = {
        id: ulid(),
        ts: new Date().toISOString(),
        schema_version: SCHEMA_VERSION,
        project: slug,
        type,
        key,
        insight: insight.trim(),
        confidence,
        source,
        files: opts.files || [],
        tags: opts.tags || [],
        supersedes: opts.supersedes || null,
        session_id: opts.sessionId || null,
      };

      const file = learningsFile(slug);
      await appendEntry(file, entry);

      process.stdout.write(`${color.green('✓')} ${color.dim(entry.id)} ${color.cyan(slug)} ${color.yellow(type)} ${entry.key}\n`);

      maybeNudge();
    });
}

function maybeNudge() {
  try {
    const config = readConfig();
    if (!config) return;
    const backlog = getBacklog();
    if (!shouldNudge(config, backlog)) return;
    process.stderr.write(color.dim(formatNudge(backlog)) + '\n');
    markNudged(config);
  } catch {
    // Nudging is best-effort; never break the main command.
  }
}

async function resolveInsight(positional, flagInsight) {
  if (positional && positional.trim().length > 0) return positional;
  if (flagInsight && flagInsight.trim().length > 0) return flagInsight;
  if (!process.stdin.isTTY) {
    const stdin = readFileSync(0, 'utf8');
    if (stdin.trim().length > 0) return stdin;
  }
  return null;
}

function autoKey(insight) {
  return insight
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .join('-')
    .slice(0, 60)
    .replace(/-+$/, '');
}
