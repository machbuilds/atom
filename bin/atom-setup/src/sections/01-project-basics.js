import { text, confirm, select, isCancel, cancel, note } from '@clack/prompts';
import color from 'picocolors';

export async function run(state, ctx) {
  if (ctx.mode === 'bare') {
    state.answers.projectName = state.answers.projectName || ctx.defaults.projectName;
    state.answers.description = state.answers.description || '';
    state.answers.visibility = state.answers.visibility || 'public';
    state.answers.multiAgent = state.answers.multiAgent ?? false;
    return;
  }

  note(
    `${color.bold('Project basics')}\n${color.dim('Name, description, visibility, agent split.')}`,
    `Step 1/${ctx.totalSections}`,
  );

  const projectName = await text({
    message: 'Project name',
    placeholder: ctx.defaults.projectName,
    initialValue: state.answers.projectName || ctx.defaults.projectName,
    validate: (v) => {
      if (!v || v.trim().length === 0) return 'Required';
      if (!/^[a-z0-9][a-z0-9-]*$/i.test(v.trim())) return 'Letters, numbers, dashes only';
    },
  });
  if (isCancel(projectName)) return cancel('Cancelled.');
  state.answers.projectName = projectName.trim();

  if (ctx.mode === 'minimal') return;

  const description = await text({
    message: 'One-line description',
    placeholder: 'What it does, who it is for.',
    initialValue: state.answers.description || '',
  });
  if (isCancel(description)) return cancel('Cancelled.');
  state.answers.description = description?.trim() || '';

  const visibility = await select({
    message: 'Visibility',
    options: [
      { value: 'public', label: 'Public', hint: 'open source, anyone can clone' },
      { value: 'internal', label: 'Internal', hint: 'private repo, team-only' },
    ],
    initialValue: state.answers.visibility || 'public',
  });
  if (isCancel(visibility)) return cancel('Cancelled.');
  state.answers.visibility = visibility;

  if (ctx.mode === 'full') {
    const multiAgent = await confirm({
      message: 'Use multi-agent skills (Backend / Design / Test / Deploy split)?',
      initialValue: state.answers.multiAgent ?? false,
    });
    if (isCancel(multiAgent)) return cancel('Cancelled.');
    state.answers.multiAgent = multiAgent;
  } else {
    state.answers.multiAgent = state.answers.multiAgent ?? false;
  }
}
