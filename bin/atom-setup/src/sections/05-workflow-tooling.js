import { confirm, isCancel, cancel, note } from '@clack/prompts';
import color from 'picocolors';

export async function run(state, ctx) {
  if (ctx.mode === 'bare' || ctx.mode === 'minimal') {
    state.answers.specKit = state.answers.specKit ?? false;
    state.answers.gsd = state.answers.gsd ?? false;
    state.answers.modelRace = state.answers.modelRace ?? false;
    return;
  }

  note(
    `${color.bold('Workflow tooling')}\n${color.dim('Optional CLIs for planning, task breakdown, and parallel-model comparison.')}`,
    `Step 5/${ctx.totalSections}`,
  );

  const specKit = await confirm({
    message: 'Install Spec Kit + Task Master? (break specs into Claude tasks)',
    initialValue: state.answers.specKit ?? false,
  });
  if (isCancel(specKit)) return cancel('Cancelled.');
  state.answers.specKit = specKit;

  const gsd = await confirm({
    message: 'Install GSD skills? (project planning + execution skills)',
    initialValue: state.answers.gsd ?? false,
  });
  if (isCancel(gsd)) return cancel('Cancelled.');
  state.answers.gsd = gsd;

  const modelRace = await confirm({
    message: 'Enable model-race? (parallel AI model comparison via Git worktrees)',
    initialValue: state.answers.modelRace ?? false,
  });
  if (isCancel(modelRace)) return cancel('Cancelled.');
  state.answers.modelRace = modelRace;
}
