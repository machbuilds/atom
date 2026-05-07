import color from 'picocolors';
import { latestVersion, migrateAll } from '../lib/migrate.js';

export function registerMigrateCommand(program) {
  program
    .command('migrate')
    .description('Apply any pending JSONL schema migrations across all projects.')
    .option('--dry-run', 'show what would migrate without writing')
    .option('--quiet', 'suppress per-file output (still prints summary)')
    .action(async (opts) => {
      const target = await latestVersion();
      if (target === 0) {
        console.log('  no migrations registered.');
        return;
      }

      if (opts.dryRun) {
        const { readFileVersion } = await import('../lib/migrate.js');
        const { readdirSync, existsSync } = await import('node:fs');
        const { NUCLEUS_PROJECTS_DIR, learningsFile } = await import('../lib/paths.js');
        if (!existsSync(NUCLEUS_PROJECTS_DIR)) {
          console.log('  no nucleus projects yet.');
          return;
        }
        const projects = readdirSync(NUCLEUS_PROJECTS_DIR);
        let pending = 0;
        for (const slug of projects) {
          const file = learningsFile(slug);
          if (!existsSync(file)) continue;
          const cur = readFileVersion(file);
          const status = cur < target ? color.yellow(`v${cur} → v${target}`) : color.dim(`v${cur} (up to date)`);
          if (cur < target) pending++;
          console.log(`  ${slug}  ${status}`);
        }
        console.log(`\n  ${pending} file(s) would migrate. Re-run without --dry-run to apply.`);
        return;
      }

      const results = await migrateAll();
      let migrated = 0;
      for (const r of results) {
        if (r.applied.length === 0) {
          if (!opts.quiet) console.log(`  ${color.dim('·')} ${r.filePath} ${color.dim('(up to date)')}`);
          continue;
        }
        migrated++;
        if (!opts.quiet) {
          console.log(`  ${color.green('✓')} ${r.filePath} ${color.dim(`v${r.from} → v${r.to}`)}`);
        }
      }
      const total = results.length;
      console.log(`\n  ${color.green('✓')} migrated ${migrated} of ${total} file(s) to schema v${target}.`);
    });
}

// Best-effort lazy run from add/search. Only triggers I/O when at
// least one file is behind. Prints a one-line notice when it actually
// migrates; otherwise silent. Errors are swallowed so this never
// blocks the actual command — the user can run `nucleus migrate`
// explicitly to surface them.
export async function autoMigrateIfNeeded() {
  try {
    const { anyFileNeedsMigration, migrateAll } = await import('../lib/migrate.js');
    if (!(await anyFileNeedsMigration())) return;
    const results = await migrateAll();
    const migrated = results.filter((r) => r.applied.length > 0).length;
    if (migrated > 0) {
      const target = results.find((r) => r.applied.length > 0)?.to;
      console.error(
        color.dim(`  (migrated ${migrated} nucleus file(s) to schema v${target})`),
      );
    }
  } catch {
    // intentional swallow — see comment above
  }
}
