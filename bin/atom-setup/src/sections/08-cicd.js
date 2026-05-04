import { confirm, isCancel, cancel, note } from '@clack/prompts';
import color from 'picocolors';

const CONCRETE_DEPLOYS = ['railway', 'vercel', 'netlify', 'fly', 'aws', 'custom'];

export async function run(state, ctx) {
  const deploy = state.answers.deployTarget;

  if (ctx.mode === 'bare' || ctx.mode === 'minimal') {
    state.answers.autoDeploy = state.answers.autoDeploy ?? false;
    return;
  }

  if (!CONCRETE_DEPLOYS.includes(deploy)) {
    state.answers.autoDeploy = false;
    return;
  }

  note(
    `${color.bold('CI/CD')}\n${color.dim('Lint/test/build run on every PR. The question here is just whether to auto-deploy on push to main.')}`,
    `Step 8/${ctx.totalSections}`,
  );

  const autoDeploy = await confirm({
    message: `Auto-deploy on push to main → ${deploy}?`,
    initialValue: state.answers.autoDeploy ?? true,
  });
  if (isCancel(autoDeploy)) return cancel('Cancelled.');
  state.answers.autoDeploy = autoDeploy;
}
