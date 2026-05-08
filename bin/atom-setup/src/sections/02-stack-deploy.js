import { select, isCancel, cancel, note } from '@clack/prompts';
import color from 'picocolors';

const STACKS = [
  // Presets — opinionated scaffolding ships with these
  { value: 'nextjs', label: 'Next.js + Railway', hint: 'preset: App Router, TS, Dockerfile' },
  { value: 'python-fastapi', label: 'Python / FastAPI', hint: 'preset: uvicorn, Pydantic v2, Railway' },
  { value: 'swift-vapor', label: 'Swift / Vapor', hint: 'preset: server-side Swift, Fly' },
  { value: 'rust-axum', label: 'Rust / Axum', hint: 'preset: tokio + tracing, Fly' },
  { value: 'go-cobra', label: 'Go CLI (Cobra)', hint: 'preset: GoReleaser, release binaries' },
  { value: 'ts-library', label: 'TypeScript library', hint: 'preset: tsup, vitest, npm publish' },
  // No preset — generic scaffolding only
  { value: 'react', label: 'React (SPA)', hint: 'Vite + React + TypeScript (no preset)' },
  { value: 'astro', label: 'Astro', hint: 'static-first, content-driven (no preset)' },
  { value: 'static', label: 'Static site', hint: 'plain HTML/CSS/JS (no preset)' },
  { value: 'node-api', label: 'Node API', hint: 'Express / Fastify / Hono (no preset)' },
  { value: 'python-api', label: 'Python API (other)', hint: 'Flask / Django / etc. (no preset)' },
  { value: 'swift-ios', label: 'Swift / iOS', hint: 'native iOS app (no preset)' },
  { value: 'react-native', label: 'React Native', hint: 'cross-platform mobile (no preset)' },
  { value: 'cli', label: 'CLI tool (other)', hint: 'Rust / Node / Python CLI (no preset)' },
  { value: 'library', label: 'Library (other)', hint: 'pip / cargo package (no preset)' },
  { value: 'ai', label: 'AI app / agent', hint: 'LLM-driven application (no preset)' },
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
