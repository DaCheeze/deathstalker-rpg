# Project State

Updated: 2026-08-22

## Durable decisions

- Build and ship a complete game.
- Use *Deathstalker* for story/tone placeholders and *Octopath Traveler* for game
  design direction.
- Retain recognizable *Deathstalker*-derived mechanics, factions, races/types,
  technology, and concepts until one developer-requested originality pass.
- Work locally first. The developer decides when to commit and push.
- Use Node 20 LTS. Do not add dependencies without approval.

## Current implementation

- Pass 18 established the current scene composition.
- Pass 19 procedural combat audio and shared live/replay cue routing are implemented
  and covered by unit tests. Reactive event and outcome cues now share the same
  browser-free routing, including lethal burnout and MAX-speed replay suppression.
- The first listening review found muted, laser-like melee attacks and insufficient
  ranged-weapon differentiation. Weapon abilities now carry validator-checked audio
  profiles for blade, blunt, ballistic, ballistic scatter, particle, plasma, and
  laser synthesis. Blade attacks use separated swing/body/metal beats, current
  particle/plasma/scatter weapons route to distinct procedural timbres, and force
  shield activation rises into an energy spike. No current ability is labeled as a
  laser or single-shot ballistic weapon; those profiles are ready for future data.
- Human listening and final mix approval for the revised Pass 19 cues remains
  outstanding.
- GitHub Pages is live at <https://dacheeze.github.io/deathstalker-rpg/>.
- Pull requests and `main` pushes run build, lint, and tests; only successful `main`
  pushes deploy.

## Known verification state

- Build passes.
- Tests pass: 74/74 as of 2026-08-22.
- Lint exits zero with 99 known non-null-assertion warnings.
- Node 20.20.2 runs the full balance checker reliably.
- Node 20 is now end-of-life upstream. It remains the pinned project runtime until
  the developer approves and the project verifies a supported replacement.
- Full balance check: failed identically on two repeated runs, 14 metrics out of
  band at 500 iterations for seeds 12345 and 98765.
- Recommended-level completion is 100% for both seeds; the game is currently far
  easier and less attritional than its targets.
- The first studio-agent pilot diagnosed encounter-pressure collapse plus several
  measurement defects; see `docs/development/balance-diagnosis-2026-08-22.md`.
- Action-cap handling, replay initial-state capture, input provenance, two-seed
  pacing assertions, percentage conversion, no-data status, and boost-exit policy
  ordering are corrected. No targets or gameplay values changed.
- Cloud autonomy boundaries are encoded in `docs/development/agent-workflow.md`.
- Do not add balance checking to deployment until the baseline is green.

## Open work

1. Human audio listening/mix review of revised blade, particle, plasma, ballistic
   scatter, blunt, and force-shield cues.
2. Choose and verify a supported Node runtime to replace end-of-life Node 20.
3. Define round and HP-attrition telemetry, reconcile the failure-distribution
   target, and decide disruptor semantics before tuning encounter pressure.
4. Clean the lint-warning backlog, then enforce zero warnings.
5. Combat animation, recoil, parallax, and hit-stop polish.
6. Optional Shub and Hadenmen background plates under the asset policy.

## Working tree

The handoff and Pass 19 work are intentionally uncommitted. Always inspect
`git status` for the authoritative current file list; do not duplicate it here.
