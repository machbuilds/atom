import { existsSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import color from 'picocolors';
import { NUCLEUS_PROJECTS_DIR, learningsFile } from '../lib/paths.js';
import { readEntries } from '../lib/jsonl.js';
import { isGitRepo } from '../lib/git.js';

export function registerPromoteCommand(program) {
  program
    .command('promote <id>')
    .description('Generate a learnings/<type>/<slug>.md draft from a nucleus entry; opens $EDITOR.')
    .option('--target <dir>', 'project root that contains learnings/ (default: cwd)', process.cwd())
    .option('--no-editor', 'do not open $EDITOR; just write the draft')
    .option('--applies-to <values...>', 'override default applies_to (default: [universal])')
    .action((id, opts) => {
      const entry = findEntry(id);
      if (!entry) {
        console.error(`No nucleus entry found with id ${id}.`);
        process.exit(1);
      }

      const learningsRoot = join(opts.target, 'learnings');
      const typeDir = join(learningsRoot, entry.type);
      mkdirSync(typeDir, { recursive: true });

      const slug = entry.key || autoSlug(entry.insight);
      const filePath = join(typeDir, `${slug}.md`);

      if (existsSync(filePath)) {
        console.error(`${filePath} already exists. Pick a different key or remove the existing file.`);
        process.exit(1);
      }

      const draft = renderDraft(entry, opts.appliesTo);
      writeFileSync(filePath, draft, 'utf8');

      console.log(`${color.green('✓')} Drafted ${color.cyan(filePath)}`);

      if (opts.editor) {
        openEditor(filePath);
      }

      if (isGitRepo(opts.target)) {
        console.log(color.dim(`  Review and: git add ${filePath}`));
      }
    });
}

function findEntry(id) {
  if (!existsSync(NUCLEUS_PROJECTS_DIR)) return null;
  const projects = readdirSync(NUCLEUS_PROJECTS_DIR);
  for (const slug of projects) {
    const f = learningsFile(slug);
    if (!existsSync(f)) continue;
    const match = readEntries(f).find((e) => e.id === id);
    if (match) return match;
  }
  return null;
}

function renderDraft(entry, appliesToOverride) {
  const appliesTo = appliesToOverride && appliesToOverride.length > 0
    ? appliesToOverride
    : ['universal'];

  const tags = entry.tags && entry.tags.length > 0 ? entry.tags : [];

  const front = [
    '---',
    `key: ${entry.key}`,
    `type: ${entry.type}`,
    `confidence: ${entry.confidence}`,
    `source: promoted-from-nucleus`,
    `nucleus_id: ${entry.id}`,
    `ts: ${(entry.ts || '').slice(0, 10)}`,
    `tags: [${tags.join(', ')}]`,
    `supersedes: null`,
    `applies_to: [${appliesTo.join(', ')}]`,
    '---',
    '',
  ].join('\n');

  const body = [
    `# ${entry.insight.split('\n')[0]}`,
    '',
    entry.insight,
    '',
    entry.files && entry.files.length > 0 ? `Files: ${entry.files.join(', ')}\n` : '',
  ].join('\n');

  return front + body;
}

function autoSlug(insight) {
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

function openEditor(file) {
  const editor = process.env.EDITOR || process.env.VISUAL || 'nano';
  spawnSync(editor, [file], { stdio: 'inherit' });
}
