import { unlinkSync } from 'node:fs';
import { confirm, isCancel } from '@clack/prompts';
import color from 'picocolors';
import { findByKey } from '../lib/io.js';

export function registerRemoveCommand(program) {
  program
    .command('remove <key>')
    .alias('rm')
    .description('Delete a learning by key.')
    .option('--yes', 'skip confirmation prompt')
    .action(async (key, opts) => {
      const entry = findByKey(key);
      if (!entry) {
        console.error(`No learning found with key "${key}".`);
        process.exit(1);
      }

      if (!opts.yes) {
        const ok = await confirm({
          message: `Delete ${color.cyan(entry.path)}?`,
          initialValue: false,
        });
        if (isCancel(ok) || !ok) return;
      }

      unlinkSync(entry.path);
      console.log(`${color.green('✓')} Removed ${color.cyan(entry.path)}`);
    });
}
