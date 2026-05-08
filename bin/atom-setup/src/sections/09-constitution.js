import { confirm, isCancel, cancel, note } from '@clack/prompts';
import color from 'picocolors';

export async function run(state, ctx) {
  if (ctx.mode === 'bare' || ctx.mode === 'minimal') {
    state.answers.constitution = state.answers.constitution ?? false;
    return;
  }

  note(
    `${color.bold('Constitution')}\n${color.dim('A short, opinionated, version-controlled document capturing the non-negotiables of your project — principles, tech stack lock, agent matrix. atom can scaffold a v0.1.0 draft using your earlier answers; you refine the principles before treating it as binding.')}`,
    `Step 9/${ctx.totalSections}`,
  );

  const generate = await confirm({
    message: 'Generate a starter CONSTITUTION.md from your answers?',
    initialValue: state.answers.constitution ?? false,
  });
  if (isCancel(generate)) return cancel('Cancelled.');
  state.answers.constitution = generate;
}
