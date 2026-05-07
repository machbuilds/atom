import color from 'picocolors';
import { listAll } from '../lib/io.js';

export function registerListCommand(program) {
  program
    .command('list')
    .alias('ls')
    .description('List your learnings, grouped by type.')
    .option('--type <type>', 'filter by type')
    .option('--applies-to <tag>', 'filter by applies_to tag (e.g. web, api, universal)')
    .option('--json', 'output JSON')
    .action((opts) => {
      let entries = listAll();

      if (opts.type) {
        entries = entries.filter((e) => e.type === opts.type);
      }
      if (opts.appliesTo) {
        entries = entries.filter((e) => {
          const list = parseList(e.frontmatter.applies_to);
          return list.includes(opts.appliesTo);
        });
      }

      if (opts.json) {
        console.log(JSON.stringify(entries.map((e) => ({
          type: e.type,
          slug: e.slug,
          path: e.path,
          frontmatter: e.frontmatter,
        })), null, 2));
        return;
      }

      if (entries.length === 0) {
        console.error(color.dim('No learnings yet. Promote nucleus entries with `nucleus promote <id>`.'));
        return;
      }

      const byType = {};
      for (const e of entries) {
        (byType[e.type] = byType[e.type] || []).push(e);
      }

      for (const type of Object.keys(byType).sort()) {
        console.log('');
        console.log(`${color.cyan(type)} ${color.dim(`(${byType[type].length})`)}`);
        for (const e of byType[type]) {
          const conf = e.frontmatter.confidence || 'medium';
          const applies = e.frontmatter.applies_to || '[universal]';
          const title = e.frontmatter.key || e.slug;
          console.log(`  ${color.bold(title)} ${color.dim(`· ${conf} · ${applies}`)}`);
        }
      }
      console.log('');
    });
}

function parseList(value) {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return [trimmed];
  const inner = trimmed.slice(1, -1).trim();
  if (inner.length === 0) return [];
  return inner.split(',').map((s) => s.trim()).filter(Boolean);
}
