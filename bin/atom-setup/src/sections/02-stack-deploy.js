import { select, isCancel, cancel, note } from '@clack/prompts';
import color from 'picocolors';

const STACKS = [
  { value: 'nextjs', label: 'Next.js', hint: 'App Router, TypeScript, Biome' },
  { value: 'react', label: 'React (SPA)', hint: 'Vite + React + TypeScript' },
  { value: 'astro', label: 'Astro', hint: 'static-first, content-driven' },
  { value: 'static', label: 'Static site', hint: 'plain HTML/CSS/JS' },
  { value: 'node-api', label: 'Node API', hint: 'Express / Fastify / Hono' },
  { value: 'python-api', label: 'Python API', hint: 'FastAPI / Flask' },
  { value: 'swift', label: 'Swift / iOS', hint: 'native iOS app' },
  { value: 'react-native', label: 'React Native', hint: 'cross-platform mobile' },
  { value: 'cli', label: 'CLI tool', hint: 'Go / Rust / Node / Python CLI' },
  { value: 'library', label: 'Library', hint: 'npm / pip / cargo package' },
  { value: 'ai', label: 'AI app / agent', hint: 'LLM-driven application' },
  { value: 'other', label: 'Other', hint: 'pick presets manually later' },
  { value: 'decide-later', label: 'Decide later', hint: 'minimal scaffolding' },
];

const DEPLOYS = [
  { value: 'railway', label: 'Railway' },
  { value: 'vercel', label: 'Vercel' },
  { value: 'netlify', label: 'Netlify' },
  { value: 'fly', label: 'Fly.io' },
  { value: 'aws', label: 'AWS (ECS / Lambda)' },
  { value: 'custom', label: 'Custom (self-hosted)' },
  { value: 'none', label: 'Not deploying yet' },
  { value: 'decide-later', label: 'Decide later' },
];

export async function run(state, ctx) {
  if (ctx.mode === 'bare') {
    state.answers.stack = state.answers.stack || 'other';
    state.answers.deployTarget = state.answers.deployTarget || 'decide-later';
    return;
  }

  note(
    `${color.bold('Stack & deploy')}\n${color.dim('Decides which preset, linter, and Dockerfile we ship.')}`,
    `Step 2/${ctx.totalSections}`,
  );

  const stack = await select({
    message: 'Primary stack',
    options: STACKS,
    initialValue: state.answers.stack || 'other',
  });
  if (isCancel(stack)) return cancel('Cancelled.');
  state.answers.stack = stack;

  if (ctx.mode === 'minimal') {
    state.answers.deployTarget = state.answers.deployTarget || 'decide-later';
    return;
  }

  const deployTarget = await select({
    message: 'Deploy target',
    options: DEPLOYS,
    initialValue: state.answers.deployTarget || 'decide-later',
  });
  if (isCancel(deployTarget)) return cancel('Cancelled.');
  state.answers.deployTarget = deployTarget;
}
