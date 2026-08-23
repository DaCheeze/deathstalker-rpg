# Studio Agent Workflow

Use specialist agents only when a milestone separates into independent workstreams.
Keep small, sequential, or file-overlapping changes with one agent. The developer
remains creative director and decides when work is committed or pushed.

## Roles

| Role | Responsibility | Required references |
|---|---|---|
| Producer / integrator | Scope the milestone, assign non-overlapping work, integrate results, and own final verification | `AGENTS.md`, `docs/PROJECT-STATE.md`, and the task-area references it routes to |
| Narrative systems designer | Research source concepts and connect developer-approved story, worldbuilding, factions, and themes to campaign structure, encounters, mechanics, presentation, and testable handoffs | `.agents/skills/narrative-systems-designer/SKILL.md`, `docs/design/creative-direction.md`, plus the affected system references |
| Systems | Core mechanics, combat, progression, and tunable game data | `docs/design/combat.md`, `docs/design/run-and-balance.md` |
| Presentation | Godot rendering, UI, input, animation, effects, assets, and presentation integration | `docs/design/presentation.md` |
| Audio engineering | Godot procedural/licensed cue integration, weapon timbre profiles, cue routing, mix headroom, and live/replay behavior | `docs/design/presentation.md`, current semantic audio resolver, and relevant ability data |
| Artist | Visual development, concept art, approved repository assets, procedural-visual briefs, modeling studies, and visual QA | `.agents/skills/game-artist/SKILL.md`, `docs/design/presentation.md`, and `docs/design/creative-direction.md` when narrative context applies |
| QA / balance | Independent review, tests, simulation, replay analysis, and measured balance evidence | `docs/design/run-and-balance.md`, `docs/development/workflow.md` |

Narrative and creative decisions remain developer-directed. The Narrative Systems
Designer may research, structure approved material, expose missing decisions, and
produce story-to-gameplay handoffs, but it must not invent character names, place
names, dialogue, or plot. It must distinguish source reference, current prototype,
developer-approved material, and unapproved proposals.

The Artist and Presentation roles are complementary. The Artist owns visual intent,
asset candidates, production specifications, and visual review. The Presentation
specialist owns Godot implementation, compositor integration, animation code, and
runtime behavior. Assign one owner when a milestone deliberately combines both.

Use the Audio Engineering role when a milestone needs focused sound design or mix
work beyond ordinary presentation wiring. It may implement deterministic procedural
profiles and objective routing tests, but the developer still approves timbre,
loudness, fatigue, and the final mix by listening on the target workstation.

## Assignment contract

Before delegating, the producer gives each specialist:

- One bounded objective and a clear stopping condition.
- The files or subsystem it may inspect or edit.
- The required evidence and output format.
- The applicable verification commands.
- Explicit approval boundaries for value changes, dependencies, external writes,
  commits, and pushes.

Agents read only the references needed for their assignment. They report measured
results, file locations, assumptions, and unresolved risks. They do not silently
expand scope or replace a missed target with an estimate.

## Coordination rules

- Prefer parallel read-only investigation before parallel implementation.
- Assign exclusive ownership of every file that specialists may edit.
- Do not let agents make concurrent edits to shared core types, central data files,
  manifests, package configuration, or project-state documentation.
- The producer resolves conflicting recommendations before implementation.
- The producer reviews the combined diff and runs every gate required by
  `docs/development/workflow.md`; specialist checks do not replace final verification.
- Subjective Godot visual and audio quality remains developer-reviewed.

## Local and cloud execution

When recommending work to the developer, always label the best execution venue as
**local**, **cloud**, or **hybrid**, with one short reason:

- Prefer local for foundational design approvals, hands-on Godot play review, and
  subjective visual or audio judgment.
- Prefer cloud for isolated, bounded work with objective acceptance tests and no
  dependency on the developer's live workstation state.
- Prefer hybrid when cloud implementation or simulation should follow local approval
  or playtesting.

The same role contracts apply locally and in cloud tasks. Local subagents may share a
working tree, so edit ownership must be explicit. Parallel cloud tasks use isolated
branches or worktrees and return reviewable findings or commits to one integration
task. Do not allow independent tasks to merge or push without developer direction.

For a cloud task, use the supported Node version and run `npm ci` before project
commands. Keep each task on its own branch or isolated task workspace. Return a
concise summary, verification results, and reviewable diff or pull request; never
merge the result or deploy it automatically.

### Default autonomy boundaries

Within a bounded assignment, an agent may autonomously:

- Inspect the repository and relevant project references.
- Implement the requested change, add or update tests, and iterate on failures.
- Run applicable local or cloud-safe verification.
- Update documentation directly affected by the implementation.

An agent must stop and request developer direction before:

- Inventing character names, place names, dialogue, plot, or replacement lore.
- Changing specified balance targets or gameplay values without an approved
  diagnosis or explicit tuning assignment.
- Adding dependencies, replacing the stack, or changing load-bearing architecture.
- Making subjective art-direction decisions or generating material visual assets.
- Deleting material files, performing risky migrations, or expanding the assignment
  beyond its stated objective.

Agents must never merge, push directly to `main`, deploy, or publish without explicit
developer direction. Commits and pushes to a review branch are allowed only when the
assignment explicitly authorizes them.

Cloud verification cannot replace hands-on browser, visual, or audio review. When a
required check depends on a developer workstation, browser session, listening, or
subjective judgment, complete the cloud-safe work and report that check as outstanding
instead of claiming the task is fully verified.

## Adoption check

After a multi-agent milestone, compare it with single-agent work using:

- Correctness and completeness of the delivered result.
- Important issues found before integration.
- Wall-clock time and credit usage.
- Duplicate investigation, conflicting edits, and integration effort.
- Verification failures or developer rework.

Keep using multiple agents only when the additional coverage or speed justifies its
credit and integration cost. Turn a role contract into a reusable skill only after
the workflow succeeds on repeated milestones.
