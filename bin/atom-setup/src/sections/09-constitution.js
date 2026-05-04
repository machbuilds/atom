import { confirm, isCancel, cancel, note } from '@clack/prompts';
import color from 'picocolors';

export async function run(state, ctx) {
  if (ctx.mode === 'bare' || ctx.mode === 'minimal') {
    state.answers.constitution = state.answers.constitution ?? false;
    return;
  }

  note(
    `${color.bold('Constitution')}\n${color.dim('A document defining your project\'s principles, tech stack lock, and constraints. Acts as a north star for both you and AI tooling.')}`,
    `Step 9/${ctx.totalSections}`,
  );

  const generate = await confirm({
    message: 'Generate a starter constitution after setup?',
    initialValue: state.answers.constitution ?? false,
  });
  if (isCancel(generate)) return cancel('Cancelled.');
  state.answers.constitution = generate;
}
