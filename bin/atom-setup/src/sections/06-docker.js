import { select, isCancel, cancel, note } from '@clack/prompts';
import color from 'picocolors';
import { suggestDockerTier } from '../lib/manifest.js';

export async function run(state, ctx) {
  const suggested = suggestDockerTier(state.answers.stack, state.answers.deployTarget);

  if (ctx.mode === 'bare' || ctx.mode === 'minimal') {
    state.answers.dockerTier = state.answers.dockerTier || suggested;
    return;
  }

  note(
    `${color.bold('Docker')}\n${color.dim('Containerizes your app for consistent deploys. Skip it if you ship to Vercel/Netlify (they handle runtime), build a mobile app, or just want something simple.')}`,
    `Step 6/${ctx.totalSections}`,
  );

  const tier = await select({
    message: `Docker tier ${color.dim(`(suggested: ${suggested})`)}`,
    options: [
      { value: 'none', label: 'None', hint: 'no Docker files' },
      { value: 'dockerfile', label: 'Dockerfile only', hint: 'production build, lightest option' },
      { value: 'compose', label: 'Dockerfile + docker-compose', hint: 'app + Postgres + Redis · recommended' },
      { value: 'devcontainer', label: 'Full devcontainer', hint: 'code inside Docker · for teams' },
    ],
    initialValue: state.answers.dockerTier || suggested,
  });
  if (isCancel(tier)) return cancel('Cancelled.');
  state.answers.dockerTier = tier;
}
