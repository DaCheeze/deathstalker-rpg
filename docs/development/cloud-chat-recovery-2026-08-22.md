# Cloud Chat Recovery — 2026-08-22

## Purpose

This note preserves decisions and claims from the developer-provided ChatGPT
transcript without treating unverified chat output as repository fact.

## Verified repository facts

- Checked-out branch: `codex/design-reconciliation` at `cf64827`.
- `cf64827` added `deathstalker-rpg-design.md`, the narrative-systems skill, and its
  workflow routing.
- Commit `54f7c24` is not present in this clone's object database.
- No local or known remote branch named `codex/range-band-prototype-implementation`
  exists, and `git worktree list` reports only the primary worktree.
- No range-band implementation changes are present in the working tree.

## Developer-approved information recovered from the transcript

The developer accepted the recommended sequence and defaults:

1. Track range per combatant; entering Engaged selects a specific opponent.
2. Permit normal disruptor use at Ranged and Closing, allow a held charge to
   interrupt an opponent advancing into Closing, and prohibit use at Engaged.
3. Exclude both force shields and Shields/Armor/Exposed from the prototype.
4. Use three anonymous functional loadouts with distinct melee choices; exclude
   vocations and an esper. Exact loadouts were not supplied and remain unapproved.
5. Exclude Boost from the prototype.
6. Build one encounter; defer between-encounter persistence and recharge.
7. Establish numeric balance targets only after mechanics are playable and measured.

The developer also requested that every future recommendation say whether the work
is best completed locally, in cloud autonomy, or as a hybrid, with a brief reason.

## Unverified claims from the transcript

- Documentation reconciliation allegedly completed in commit `54f7c24`.
- An autonomous Codex sub-agent allegedly began TypeScript core, renderer, UI, and
  test changes in a separate range-band implementation worktree.

These claims may describe an ephemeral ChatGPT environment, but no resulting Git
objects or files are available here. They must not be used as completion evidence.

## Recovery action

The accepted defaults are now captured in
`docs/design/three-character-range-band-prototype.md`, scoped in `AGENTS.md`, and
summarized in `docs/PROJECT-STATE.md`. No gameplay code, data, tests, balance values,
dependencies, commits, pushes, merges, or deployments were performed during this
recovery.

## Subsequent local implementation

After the recovery, the developer authorized the bounded prototype implementation
locally. That later work is a new repository change based on the recovered contract;
it is not evidence that the missing cloud-chat branch or commit was recovered.
