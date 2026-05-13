import { confirm, select, isCancel, cancel, note } from '@clack/prompts';
import color from 'picocolors';

export async function run(state, ctx) {
  if (ctx.mode === 'bare') {
    state.answers.nucleusEnabled = state.answers.nucleusEnabled ?? true;
    state.answers.nucleusCaptureMode = state.answers.nucleusCaptureMode || 'claude-managed';
    return;
  }

  note(
    `${color.bold('nucleus')}\n${color.dim('Captures key learnings from each session into ~/.nucleus so future sessions and other projects benefit. Like a personal knowledge base for your dev work.')}`,
    `Step 3/${ctx.totalSections}`,
  );

  const enabled = await confirm({
    message: 'Enable nucleus for this project?',
    initialValue: state.answers.nucleusEnabled ?? true,
  });
  if (isCancel(enabled)) return cancel('Cancelled.');
  state.answers.nucleusEnabled = enabled;

  if (!enabled) {
    state.answers.nucleusCaptureMode = 'disabled';
    return;
  }

  const captureMode = await select({
    message: 'Capture mode',
    options: [
      {
        value: 'claude-managed',
        label: 'Claude-managed',
        hint: 'Claude captures during sessions; you promote manually · recommended',
      },
      {
        value: 'auto-timer',
        label: 'Auto-timer',
        hint: 'reserved — no daemon yet; behaves like claude-managed',
      },
      {
        value: 'manual',
        label: 'Manual',
        hint: 'you call nucleus add yourself',
      },
    ],
    initialValue: state.answers.nucleusCaptureMode || 'claude-managed',
  });
  if (isCancel(captureMode)) return cancel('Cancelled.');
  state.answers.nucleusCaptureMode = captureMode;
}
