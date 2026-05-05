## Summary

<!-- One-paragraph description of what this PR changes and why. -->

## Type of change

- [ ] New feature (atom CLI, scaffold content, extras preset)
- [ ] Bug fix
- [ ] Documentation
- [ ] New learning (`learnings/<type>/<slug>.md`)
- [ ] New stack preset (`extras/<category>/<preset>/`)
- [ ] Refactor / hygiene

## Generalisation test (if adding to `learnings/` or `docs/`)

> Would this help a project unrelated to where it came from?

- [ ] Yes — it teaches a pattern, pitfall, or lesson that applies broadly
- [ ] Project-specific — moving to my source project's docs instead

If you ticked the first box, also confirm:

- [ ] No project-specific names, IDs, or vendor quirks remain
- [ ] `applies_to:` field is set correctly (see `docs/LEARNINGS_TAXONOMY.md`)

## Verification

<!-- How did you verify this? -->

- [ ] Ran `atom-setup --bare` against a clone copy and the result is correct
- [ ] Ran the relevant CLI's smoke test (`nucleus add` + `nucleus search`, etc.)
- [ ] CI passes locally (`npm install && node --check bin/<cli>/bin/<cli>.js`)
- [ ] No stale references to deprecated names (GBrain, Dockerfile.example, etc.)

## Voice check

<!-- Read the changed text out loud. Does it match docs/VOICE.md? -->

- [ ] Builder-to-builder voice (no AI vocabulary, no em-dashes-as-commas)
- [ ] Concrete (file paths, command examples, real numbers — not vague references)
- [ ] No corporate hedging
