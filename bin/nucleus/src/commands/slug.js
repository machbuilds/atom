import { deriveSlug } from '../lib/slug.js';

export function registerSlugCommand(program) {
  program
    .command('slug')
    .description('Print the slug for the current project (from git remote, cwd fallback).')
    .option('--cwd <path>', 'directory to derive slug from', process.cwd())
    .action((opts) => {
      const slug = deriveSlug(opts.cwd);
      if (!slug) {
        console.error('Could not derive slug.');
        process.exit(1);
      }
      console.log(slug);
    });
}
