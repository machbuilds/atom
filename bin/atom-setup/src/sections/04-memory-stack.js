import { confirm, isCancel, cancel, note } from '@clack/prompts';
import color from 'picocolors';

export async function run(state, ctx) {
  if (ctx.mode === 'bare' || ctx.mode === 'minimal') {
    state.answers.mem0 = state.answers.mem0 ?? false;
    state.answers.multica = state.answers.multica ?? false;
    state.answers.chromeDevtools = state.answers.chromeDevtools ?? false;
    return;
  }

  note(
    `${color.bold('Memory stack')}\n${color.dim('External services Claude can use across sessions for memory, web access, and browser inspection.')}`,
    `Step 4/${ctx.totalSections}`,
  );

  const mem0 = await confirm({
    message: 'Set up mem0 MCP? (long-term episodic memory across sessions)',
    initialValue: state.answers.mem0 ?? true,
  });
  if (isCancel(mem0)) return cancel('Cancelled.');
  state.answers.mem0 = mem0;

  if (ctx.mode !== 'full') {
    state.answers.multica = false;
    state.answers.chromeDevtools = false;
    return;
  }

  const multica = await confirm({
    message: 'Set up Multica skills? (procedural per-agent memory)',
    initialValue: state.answers.multica ?? false,
  });
  if (isCancel(multica)) return cancel('Cancelled.');
  state.answers.multica = multica;

  const chromeDevtools = await confirm({
    message: 'Set up Chrome DevTools MCP? (browser inspection during web work)',
    initialValue: state.answers.chromeDevtools ?? false,
  });
  if (isCancel(chromeDevtools)) return cancel('Cancelled.');
  state.answers.chromeDevtools = chromeDevtools;
}
