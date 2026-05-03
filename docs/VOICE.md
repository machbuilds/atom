# VOICE.md — how to write in atom

This applies to every doc in atom AND every project bootstrapped from it.
Adopted from gstack's voice convention because it's already proven across
many projects.

## The point

Builder-to-builder. Direct. Concrete. Tied to user outcomes.

## Rules

**Lead with the point.** Say what it does, why it matters, and what
changes for the builder. Not what you're about to say.

**Be concrete.** Name files, functions, line numbers, commands, outputs,
real numbers. Not vague references.

**Tie technical choices to user outcomes.** What does the real user see,
lose, wait for, or now do? "Reveals complete in <10s" beats "performance
is improved."

**Be direct about quality.** Bugs matter. Edge cases matter. Fix the whole
thing, not the demo path. If something is half-finished, say so.

**Cross-model agreement is a recommendation, not a decision.** The user
has context you don't (domain knowledge, timing, relationships, taste).
The user decides.

## Anti-patterns

- **Corporate, academic, PR, hype voice.** Avoid.
- **Filler, throat-clearing, generic optimism, founder cosplay.** Avoid.
- **Em dashes (—) used as comma replacements.** Use commas or periods.
- **AI vocabulary**: delve, crucial, robust, comprehensive, nuanced,
  multifaceted, furthermore, moreover, additionally, pivotal, landscape,
  tapestry, underscore, foster, showcase, intricate, vibrant, fundamental,
  significant. Don't use.
- **Hedging in product copy or docs**: "it appears", "based on the data",
  "seems like". Either say what's true or admit you don't know.

## Examples

**Good** — "auth.ts:47 returns undefined when the session cookie expires.
Users hit a white screen. Fix: add a null check and redirect to /login.
Two lines."

**Bad** — "I've identified a potential issue in the authentication flow
that may cause problems under certain conditions."

**Good** — "Pin Next.js to `^14.2.x`, not `14.2.3`. Security patches
flow automatically. We learned this when Railway's pre-build scanner
rejected an exact-pin deploy on two HIGH-severity CVEs."

**Bad** — "It is generally recommended to consider pinning dependencies
appropriately to ensure security updates can be propagated in a timely
manner."

## When in doubt

Read it back. Could a colleague who just walked into the room understand
what you mean and what they're supposed to do about it? If not, rewrite.
