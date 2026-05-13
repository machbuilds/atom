import color from 'picocolors';
import { readConfig } from '../lib/config.js';
import { getBacklog, markNudged } from '../lib/promote-state.js';
import { autoMigrateIfNeeded } from './migrate.js';

export function registerReviewCommand(program) {
  program
    .command('review')
    .description('List unpromoted nucleus entries grouped by project — quick triage of what to graduate.')
    .option('--limit <n>', 'max entries to show', parseInt, 20)
    .option('--project <slug>', 'filter to a single project')
    .option('--type <type>', 'filter to a single entry type')
    .option('--json', 'output JSON instead of formatted text')
    .action(async (opts) => {
      if (!readConfig()) {
        console.error('nucleus not initialized. Run `nucleus init` first.');
        process.exit(1);
      }

      await autoMigrateIfNeeded();

      const backlog = getBacklog();
      let entries = backlog.unpromoted;

      if (opts.project) {
        entries = entries.filter((e) => e.project === opts.project);
      }
      if (opts.type) {
        entries = entries.filter((e) => e.type === opts.type);
      }

      if (entries.length === 0) {
        if (opts.json) {
          console.log('[]');
        } else {
          console.log(color.green('✓') + ' No unpromoted entries — your playbook is up to date.');
        }
        // Reset nudge debounce now that the user has reviewed.
        const cfg = readConfig();
        if (cfg) markNudged(cfg);
        return;
      }

      // Oldest first, grouped by project.
      entries.sort((a, b) => (a.ts || '').localeCompare(b.ts || ''));

      if (opts.json) {
        const limited = opts.limit ? entries.slice(0, opts.limit) : entries;
        console.log(JSON.stringify(limited, null, 2));
        const cfg = readConfig();
        if (cfg) markNudged(cfg);
        return;
      }

      const limited = opts.limit ? entries.slice(0, opts.limit) : entries;
      const byProject = new Map();
      for (const e of limited) {
        const list = byProject.get(e.project) || [];
        list.push(e);
        byProject.set(e.project, list);
      }

      const total = entries.length;
      const shown = limited.length;
      const header =
        shown < total
          ? `${total} unpromoted entries (showing oldest ${shown}):`
          : `${total} unpromoted ${total === 1 ? 'entry' : 'entries'}:`;
      console.log(color.bold(header));
      console.log('');

      for (const [project, list] of byProject) {
        console.log(`${color.cyan(project)} ${color.dim(`(${list.length})`)}`);
        for (const e of list) {
          const idShort = (e.id || '').slice(0, 10);
          const age = ageString(e.ts);
          const firstLine = (e.insight || '').split('\n')[0];
          console.log(
            `  ${color.dim(idShort)} ${color.dim('·')} ${color.yellow(e.type)} ${color.dim('·')} ${color.dim(age)}`,
          );
          console.log(`    ${firstLine}`);
          console.log(color.dim(`    → nucleus promote ${e.id}`));
          console.log('');
        }
      }

      // Reset nudge debounce now that the user has reviewed.
      const cfg = readConfig();
      if (cfg) markNudged(cfg);
    });
}

function ageString(ts) {
  const t = Date.parse(ts || '');
  if (Number.isNaN(t)) return 'unknown';
  const days = Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  return `${months} months ago`;
}
