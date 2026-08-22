# Narrative Integration Map

Use this reference when converting approved narrative material into repository work or specialist handoffs.

This map records the repository state observed on 2026-08-22. When an assignment depends on current implementation state, inspect the cited files and report drift instead of treating this reference as authoritative code documentation.

## Current seams

- `src/core/types.ts` defines `CampaignState`, `EncounterDefinition`, `ExpeditionDefinition`, `BattleState`, and `ExpeditionState`. `CampaignState` has progression and completed expeditions but no story flags, faction state, relationships, or choice history.
- `src/core/run.ts` and `src/core/progression.ts` provide deterministic ordered encounter chains, persistent run resources, history, and expedition completion. This is the strongest current boundary for story-shaped mission pacing.
- `src/data/encounters.json` joins short faction premises, enemy compositions, rewards, grade, and environment. Treat it as encounter flavor and gameplay data, not a substitute for a campaign model.
- `src/data/party.json`, `enemies.json`, `abilities.json`, and `equipment.json` contain placeholder identity and terminology but no narrative provenance or availability rules.
- `src/render/compositor.ts` and `assetManifest.ts` select environmental treatment from encounter identity. Narrative briefs can specify scene function and motifs without mutating renderer state.
- `src/main.ts` and `src/ui/battleController.ts` currently run a combat showcase that cycles encounters and resets the party. The shipped browser path does not yet consume campaign or expedition progression.
- `src/sim/simulator.ts` hard-codes the five-fight benchmark sequence. Preserve that fixture or introduce separately validated expedition data when campaign sequencing is implemented.

## Known content-pipeline issue

`EncounterDefinition` declares `environment`, and encounter JSON supplies it, but the validator currently omits it from the parsed result. The renderer imports raw encounter JSON to recover the field. Establish one validated content pipeline before adding material narrative metadata; never rely on silently discarded fields.

## Safe architecture sequence

This is a recommendation, not authorization to implement:

1. Define an approved expedition/mission data contract that references validated encounters.
2. Load and validate expedition data independently of battle state.
3. Pass battle only immutable narrative context that combat and presentation genuinely need.
4. Add explicit campaign story state only after the developer approves the concepts and identifiers.
5. Add prerequisite, branch, save/load, presentation, and traceability tests alongside each new capability.

Avoid starting with a universal quest graph. The current game benefits more from one end-to-end, data-driven expedition proving setup, ordered encounter pressure, outcome, unlock, persistence, and replay behavior.

## Specialist contracts

### Systems

Narrative provides the approved beat, participating entities, player pressure or choice, prerequisites, consequences, persistence needs, and measurable success criteria. Systems owns core types, pure transitions, encounter composition, mechanics, tunable values, and simulations.

### Presentation and Audio

Narrative provides scene function, player knowledge, emotional turn, information priority, approved text requirements, environmental cues, and intended feedback. Presentation and Audio own Canvas/UI behavior, procedural cues, performance, and live/replay parity.

### Artist

Narrative provides approved subject, place, and faction context; symbolic motifs; story function; continuity constraints; and required variants. Artist owns visual interpretation, concepts, and asset briefs. The developer approves subjective direction and final selections.

### QA / Balance

Narrative provides a traceability matrix from approved beats to encounters, state, mechanics, UI, and outcomes. QA owns schema validation, prerequisite and consequence tests, save/replay checks, pacing evidence, regression findings, and measured balance reports.

### Producer / Integrator

Producer owns central schema-file assignments, cross-discipline sequencing, approval gates, conflicting recommendations, integration, and final verification.

## Beat-to-gameplay prompts

- What must the player understand or feel, and which existing action or resource can demonstrate it?
- Does the opposing faction's encounter language match its stated ideology, technology, and threat?
- What persists after the encounter so the beat matters beyond flavor text?
- Does the next encounter exploit the resource or information consequence of this one?
- Is the reward a credible consequence of the event rather than an unrelated payout?
- Can the player predict important rules from the fiction and feedback?
- Do campaign state, UI, replay, and simulation agree about what happened?

## First recommended deliverable

Create a matrix with these columns:

| Source concept | Current prototype expression | Possible gameplay use | Narrative benefit | Owner | Approval needed |
|---|---|---|---|---|---|

Label each claim or cell as source reference, current prototype, developer-approved, or proposal. A row will often connect several states; do not force a single label onto mixed evidence. This lets the team use research without turning unapproved source material into game canon.
