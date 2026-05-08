import { text, confirm, select, isCancel, cancel, note } from '@clack/prompts';
import color from 'picocolors';

export async function run(state, ctx) {
  if (ctx.mode === 'bare') {
    state.answers.gitInit = state.answers.gitInit ?? true;
    state.answers.gitRemote = state.answers.gitRemote || null;
    state.answers.gitPush = state.answers.gitPush ?? false;
    return;
  }

  note(
    `${color.bold('Git')}\n${color.dim('Re-initialize git history (atom\'s history is removed; you get a fresh main branch with one initial commit).')}`,
    `Step 10/${ctx.totalSections}`,
  );

  state.answers.gitInit = true;

  if (ctx.mode === 'minimal') {
    state.answers.gitRemote = state.answers.gitRemote || null;
    state.answers.gitPush = false;
    return;
  }

  const remoteChoice = await select({
    message: 'Git remote',
    options: [
      { value: 'create-gh', label: 'Create new GitHub repo via gh', hint: ctx.preflight.gh.available ? 'requires gh authenticated' : 'gh not detected' },
      { value: 'existing', label: 'Existing remote URL' },
      { value: 'skip', label: 'Skip — set remote later' },
    ],
    initialValue: state.answers.gitRemoteChoice || 'skip',
  });
  if (isCancel(remoteChoice)) return cancel('Cancelled.');
  state.answers.gitRemoteChoice = remoteChoice;

  if (remoteChoice === 'existing') {
    const url = await text({
      message: 'Repo URL (https or ssh)',
      placeholder: 'git@github.com:user/repo.git',
      initialValue: state.answers.gitRemote || '',
      validate: (v) => (v && v.length > 0 ? undefined : 'Required'),
    });
    if (isCancel(url)) return cancel('Cancelled.');
    state.answers.gitRemote = url.trim();
  } else if (remoteChoice === 'create-gh') {
    if (!ctx.preflight.gh.available) {
      cancel('gh CLI not detected. Install gh and re-run, or pick another option.');
      return;
    }

    const ghUser = ctx.defaults.githubUser || 'me';
    const repoName = state.answers.projectName;

    const visibility = await select({
      message: 'Repo visibility',
      options: [
        { value: 'private', label: 'Private', hint: 'recommended default' },
        { value: 'public',  label: 'Public' },
      ],
      initialValue: state.answers.gitRemoteVisibility || 'private',
    });
    if (isCancel(visibility)) return cancel('Cancelled.');

    state.answers.gitRemote = `gh:${ghUser}/${repoName}`;
    state.answers.gitRemoteUser = ghUser;
    state.answers.gitRemoteName = repoName;
    state.answers.gitRemoteVisibility = visibility;
  } else {
    state.answers.gitRemote = null;
  }

  if (state.answers.gitRemote && state.answers.gitRemote.length > 0) {
    const push = await confirm({
      message: 'Push initial commit to remote?',
      initialValue: state.answers.gitPush ?? true,
    });
    if (isCancel(push)) return cancel('Cancelled.');
    state.answers.gitPush = push;
  } else {
    state.answers.gitPush = false;
  }
}
