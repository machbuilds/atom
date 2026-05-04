import { select, isCancel, cancel, note } from '@clack/prompts';
import color from 'picocolors';

export async function run(state, ctx) {
  state.answers.year = state.answers.year || ctx.defaults.year;
  state.answers.author = state.answers.author || ctx.defaults.author || 'atom user';

  if (ctx.mode === 'bare') {
    state.answers.license = state.answers.license || 'MIT';
    return;
  }

  note(
    `${color.bold('License')}\n${color.dim('Sets the legal terms under which others can use your project. MIT is the most permissive and most common for OSS. Pick "None" to decide later.')}`,
    `Step 7/${ctx.totalSections}`,
  );

  const license = await select({
    message: 'License',
    options: [
      { value: 'MIT', label: 'MIT', hint: 'most permissive · most common for OSS' },
      { value: 'Apache-2.0', label: 'Apache 2.0', hint: 'permissive + patent grant' },
      { value: 'GPL-3.0', label: 'GPL 3.0', hint: 'copyleft' },
      { value: 'Proprietary', label: 'Proprietary', hint: 'all rights reserved' },
      { value: 'None', label: 'None', hint: 'decide later' },
    ],
    initialValue: state.answers.license || 'MIT',
  });
  if (isCancel(license)) return cancel('Cancelled.');
  state.answers.license = license;
}
