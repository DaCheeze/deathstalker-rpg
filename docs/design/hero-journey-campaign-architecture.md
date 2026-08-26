# Hero's Journey Campaign Architecture

Status: **developer-approved structural direction; first Separation expedition
selected; implementation and unresolved plot details remain open**.

Approved: 2026-08-24.

## Purpose and authority

The full campaign follows the Hero's Journey as a transformation expressed through
story, play, economy, balance, and world architecture. The player should not merely
watch a protagonist cross a threshold, endure trials, gain a boon, and return
changed; the player should experience those movements through commitment, resource
pressure, mastery, recovery, and a world whose spatial language changes with them.

This contract approves the structural model and its cross-system responsibilities.
It does not approve character or place names, dialogue, plot events, twists,
relationships, deaths, endings, replacement lore, specific rewards, balance values,
or economy values. Those remain developer decisions.

## Research basis

The Joseph Campbell Foundation describes Separation, Initiation, and Return as the
essential movements of the monomyth and cautions against treating every commonly
listed episode as a mandatory plot checklist. This project therefore uses the three
movements as its durable campaign spine and treats the more detailed phases below as
functional pacing language rather than compulsory scene order.

Environmental guidance follows evidence that distinctive, visible landmarks aid
orientation; that local landmarks are especially useful at route decisions; and
that distant or global landmarks can help people form orientation in unfamiliar,
large-scale spaces. The game applies those principles as art and level-design
guidance, then validates them through player behavior rather than assuming that a
beautiful landmark automatically produces clear navigation.

Sources:

- Joseph Campbell Foundation, [Separation, Initiation, and Return](https://www.jcf.org/post/separation-initiation-and-return), 2020.
- Yesiltepe et al., [Landmarks in wayfinding: a review of the existing literature](https://pmc.ncbi.nlm.nih.gov/articles/PMC8324579/), 2021.

## Approval-state ledger

| Input | State | Consequence |
|---|---|---|
| The campaign follows the Hero's Journey | Developer-approved | Campaign planning must express Separation, Initiation, and Return |
| Balance and economy reinforce that journey | Developer-approved | Resource pressure, recovery, rewards, and mastery must have a dramatic function |
| World architecture guides the player intuitively | Developer-approved | Critical routes cannot depend solely on markers, minimaps, or text prompts |
| Town–field–boss loop with persistent excursion resources | Developer-approved | Town rest/shops, explorable fields/chests, discrete fights, optional grinding, and fixed bosses are the campaign foundation |
| Eight functional phases below | Developer-approved structural vocabulary | They organize pacing but do not authorize a plot event |
| Forced-departure opening expedition | Developer-approved selection | Use `opening-expedition-forced-departure-v1.md` for the first Separation handoff |
| Exact phase count per act or expedition | Open proposal | The full campaign uses all three movements; smaller arcs use only the phases they need |
| Journey-state schema, economy values, and navigation thresholds | Open implementation | Requires focused systems work, baseline measurement, and developer approval where values change |

## Scale of application

The structure applies at three scales without becoming mechanically repetitive:

1. **Campaign scale:** one complete Separation, Initiation, and Return arc carries
   the protagonist and party through the full transformation.
2. **Expedition or chapter scale:** a mission receives a specific dramatic job and
   may echo a smaller departure, trial, or return when that supports the campaign.
   It is not required to reproduce the full journey.
3. **Area scale:** architecture uses anticipation, threshold, compression, ordeal,
   release, and reconnection as spatial rhythm. An individual corridor or dungeon
   does not pretend to be a complete Hero's Journey.

Do not build a universal quest graph first. Prove this model through one complete,
data-driven expedition whose story function, encounter chain, resource pressure,
environmental route, outcome, persistence, and replay evidence agree.

## Campaign movement and phase contract

| Movement | Functional phase | Player experience | Gameplay and balance function | Economy function | Architectural function |
|---|---|---|---|---|---|
| Separation | Familiar world and call | Understand the current order and perceive a reason to leave it | Teach or refresh core decisions under forgiving pressure; establish a trustworthy baseline | Introduce resources and their purposes before meaningful scarcity | Open circulation, readable landmarks, short return paths, and visible normality |
| Separation | Threshold | Make a legible commitment into uncertainty | First encounter chain where condition and supplies persist long enough to matter | Ask the player what to carry or spend; make departure meaningful without a trap choice | Present an unmistakable crossing, descent, gate, transit, or change of spatial grammar |
| Initiation | Trials | Learn allies, threats, factions, and the real uses of the party's systems | Vary encounter language so each role and resource solves a recognizable problem | Convert supplies into survival and information; reward judgment rather than hoarding alone | Maintain a distant orientation anchor and use distinct local landmarks at decisions |
| Initiation | Approach | Feel mounting consequence and anticipate the central test | Recombine learned pressures; reduce safe resets; preserve counterplay and readable preparation | Tighten replenishment access and expose opportunity costs without arbitrary price inflation | Narrow choices, deepen sightlines, increase compression, and repeatedly reveal the destination |
| Initiation | Ordeal | Risk meaningful loss and demonstrate learned mastery | Deliver the expedition's highest pressure through established rules, not surprise invalidation or inflated statistics alone | Make prior spending and conservation visible in the party's condition; do not require grinding | Converge routes into a dominant confrontation space with the strongest threshold contrast |
| Initiation | Boon and recovery | Feel that survival changed capability, knowledge, or agency | Release pressure and make the result legible before introducing a new demand | Grant a credible reward, recovery, unlock, or strategic option rather than unrelated payout | Use spatial release, restored function, warmth, height, visibility, or newly opened circulation |
| Return | Road back | Re-enter known concerns with altered understanding and higher responsibility | Recombine familiar encounter languages so mastery reduces friction without removing stakes | Let accumulated capabilities create efficiency; avoid erasing the journey with complete free resets | Revisit recognizable structures from another route or in a visibly changed state; open meaningful shortcuts |
| Return | Resurrection and integration | Prove transformation and see its consequence for the wider world | Capstone mastery test uses previously taught systems and consequences; it is not merely the largest HP pool | Resolve long-term investment and deliver the campaign's boon into persistent state | Produce the clearest before/after contrast, then return control in a readable, transformed space |

The names in the table are functional labels, not required on-screen terminology.
The player should feel the curve without seeing a “Hero's Journey phase” indicator.

## Balance contract

Narrative specifies the pressure shape; balance owns measured tuning. Journey phase
must never become a hidden global difficulty multiplier.

- Balance complete expeditions and campaign transitions, not isolated encounters.
- Preserve the existing HP, ESP, burnout, disruptor-cooldown, KIA, medkit, and
  revive persistence rules unless a later approved mechanics pass changes them.
- Give each encounter a dramatic job: orientation, capability test, resource test,
  complication, approach, ordeal, release, mastery recombination, or consequence.
- Reach pressure through encounter composition, sequencing, objectives, known
  mechanics, and recovery placement before raising global statistics.
- The ordeal must test established understanding. It may intensify combinations but
  must not revoke previously taught rules or depend on an undisclosed immunity.
- The road back and resurrection should test transfer and recombination. Familiar
  problems may become faster for a skilled player even while consequences grow.
- Recommended party level should make completion likely without making decisions or
  resource history irrelevant. Forced grinding is a pacing failure, not a journey
  beat. Voluntary grinding is an explicit player-controlled difficulty option and
  must remain meaningful because encounters and bosses do not scale to party level.
- Retain the current numeric targets until a measured, developer-approved tuning
  pass changes them. The current 100% recommended-level completion and 14 out-of-band
  metrics are recorded failures, not an acceptable ordeal curve.

## Economy contract

Economy expresses commitment, consequence, and earned agency. It must remain
predictable enough that the player can make intentional decisions.

- Towns are stable recovery and preparation anchors: rest restores condition and
  shops expose declared prices. Field and dungeon excursions preserve condition
  until the party returns.
- One-time chests provide persistent authored rewards. Repeatable regular encounters
  provide optional XP and gold. Neither source silently respawns or scales unless
  its data contract says so.
- Bosses have authored fixed strength. The player may face them near the recommended
  level for intended pressure or overlevel deliberately for an easier fight.

- **Sources** must have a credible relationship to what the player accomplished.
  Rewards can restore capacity, create a new option, improve future efficiency, or
  visibly return a boon to campaign state.
- **Sinks** must correspond to survival, preparation, opportunity, recovery, or an
  approved consequence. Do not drain currency merely because an act is darker.
- Do not use unexplained price inflation as dramatic pacing. Prefer authored changes
  in availability, route safety, supply access, optional risk, or reward timing.
- The threshold should make loadout and supply commitment legible before departure.
- Trials should make both spending and hoarding imperfect: supplies prevent losses,
  while optional opportunities can reward accepting pressure.
- The approach should expose remaining capacity and credible preparation choices,
  not spring an unavoidable tax after the player can no longer respond.
- The ordeal should reveal the consequence of the expedition's economy without
  requiring one exact inventory solution.
- The boon should change agency or future efficiency, not only increase a number.
- A return can reopen familiar economic relationships in a changed context, but any
  change in price, stock, access, or ownership must be visible in the fiction and
  deterministic campaign state.

## Seamless architectural guidance contract

Architecture owns first-line navigation. UI guidance remains a recovery layer for
accessibility, unusual states, or a player who asks for help.

### Route language

- Give every unfamiliar area one dominant global orientation anchor visible from
  multiple useful positions, when the fiction and camera allow it.
- Put distinctive local landmarks on the route and at consequential decisions.
- Use floor direction, openings, light hierarchy, material rhythm, motion, sound,
  and inhabited activity to reinforce the critical path.
- Keep the main route's visual grammar consistent. Optional routes may break its
  axis or rhythm, but must look intentionally explorable rather than accidental.
- Reveal important destinations before arrival, then alternate partial concealment
  and renewed sightlines to create anticipation without losing orientation.
- Use compression before danger or commitment and spatial release after discovery,
  victory, or safe reconnection.
- Let shortcuts reconnect to recognizable spaces and show the relationship between
  the outward and return route.
- Use enemy placement, environmental damage, security posture, and sound to announce
  danger before a forced encounter.
- Never rely on decorative clutter as a landmark. A landmark must be visually,
  structurally, or semantically distinct and must survive the gameplay camera.

### Guidance priority

When a mandatory route proves unclear, correct guidance in this order:

1. destination visibility and structural axis;
2. local landmark placement at the decision;
3. light, value, color, material, motion, and audio hierarchy;
4. camera framing and traversal affordance;
5. contextual environmental prompt;
6. explicit objective marker or map intervention.

This is not a ban on maps, accessibility navigation, or objective reminders. It is
a requirement that the world remain understandable when those aids are minimized.

## Data and authority boundary

The deterministic TypeScript campaign and expedition layers remain authoritative.
Godot presents resolved availability, world state, route state, and transitions; it
must not decide prerequisites, costs, rewards, encounter order, or consequences.

The first implementation should extend one validated expedition/mission data path,
not add story behavior to `BattleState` or invent a universal quest manager.
Conceptually, each expedition needs immutable authored context for:

- campaign movement and functional phase;
- narrative purpose and required player knowledge;
- ordered encounter jobs and pressure intent;
- resource-entry, recovery, and reward intent;
- environment and architectural-guidance profile;
- prerequisites, completion outcome, and persistent consequences; and
- presentation requirements and developer-review gates.

Exact field names and schemas remain an implementation decision. Before adding
them, repair the existing encounter-validation gap that declares `environment` but
drops it from the validated result. Narrative state must not depend on raw JSON or
renderer-only recovery paths.

## Measurement and acceptance evidence

The contract adds measurement categories without silently approving new target
values.

### Balance and economy telemetry

Record at expedition start, each encounter boundary, threshold, approach, ordeal,
and completion or failure:

- party HP and maximum HP percentage;
- ESP and burnout by relevant party member;
- disruptor cooldown state and KIA state;
- medkits and revives carried, consumed, and remaining;
- gold and authored rewards earned, spent, or deferred;
- rounds and actions per encounter;
- optional encounters or rewards accepted and skipped;
- recovery opportunities offered and used; and
- failure location and the resource or rule state that preceded it.

Continue reporting seeds 12345 and 98765 for deterministic balance evidence. Set
new phase-specific numeric targets only after a baseline expedition is playable and
the developer approves the intended curve.

### Wayfinding telemetry and observation

For first-time and returning players, record:

- time from area entry to identifying or reaching the next mandatory destination;
- wrong turns, reversals, and repeated decision-point hesitation;
- map, objective-reminder, or guidance-prompt use;
- whether the global anchor and critical local landmarks were noticed;
- optional-route discovery without confusing it for the mandatory route;
- shortcut recognition and successful return orientation; and
- points where combat, camera, effects, or UI obscured architectural guidance.

Numeric acceptance thresholds remain open until a baseline playtest establishes
the current behavior. Developer observation remains required for whether movement
feels seamless rather than merely producing a successful path.

## First proving expedition handoff

The developer selected the forced-departure opening as the first proving expedition.
Its approved structure and unresolved content boundaries are recorded in
`opening-expedition-forced-departure-v1.md`. It carries the campaign's first
Separation movement through familiar Virimonde, Owen's unexplained condemnation,
capture, imminent execution, Hazel's disruptive crash and rescue, shared flight,
and departure. The execution rescue is their active convergence, while the exact
departure vessel and final opposing force remain open. The expedition preserves
Virimonde for a possible transformed Return without attempting the full campaign
Return in the opening.

The first implementation deliverable should trace one developer-approved expedition
through this table before code or content tuning begins:

| Field | Required content |
|---|---|
| Narrative purpose | What changes for the player, party, world, or central question |
| Approved inputs | Approved characters, places, factions, concepts, and terminology |
| Player knowledge | What is understood before departure, at threshold, before ordeal, and after return |
| Journey function | Campaign movement and functional phases actually used |
| Gameplay expression | Encounter jobs, mechanics tested, optional pressure, and recovery placement |
| Economy expression | Starting commitment, sources, sinks, rewards, and persistent consequence |
| Architecture | Global anchor, decision landmarks, compression/release, threshold, shortcut, and return transformation |
| Persistence | Explicit flags, unlocks, costs, injuries, cooldowns, inventory, and world state |
| Ownership | Systems, Presentation, Artist, Audio, QA/Balance, or Producer |
| Acceptance evidence | Tests, simulation, replay, telemetry, capture, and developer play review |
| Approval gaps | Plot, names, dialogue, values, art choices, and consequences still awaiting the developer |

Until the developer supplies the approved narrative inputs, use functional
placeholders such as `[approved departure location]`, `[threshold decision]`,
`[ordeal encounter]`, and `[return-state environment]`. Do not turn a structural
placeholder into canon.

## Implementation sequence

1. Developer approves the first expedition's narrative purpose, participants,
   location, threshold, ordeal, boon, return consequence, and any visible text.
2. Repair and test the single validated encounter/environment content pipeline.
3. Define and validate the smallest expedition narrative-context schema.
4. Extend deterministic campaign state only with approved prerequisites,
   consequences, and world-state identifiers.
5. Add the new balance, economy, and wayfinding telemetry without changing targets.
6. Build the expedition's exploration and encounter path in Godot from
   TypeScript-supplied state.
7. Run deterministic simulation, replay, save/load, Godot route capture, and
   first-time playtesting before tuning values.
8. Tune only against measured failures, then record the approved curve as data.

Best execution venue: **hybrid**. Narrative and journey approvals, Godot traversal,
and subjective seamlessness need the local workstation and developer review;
isolated validators, telemetry, simulations, and schema tests can later run in the
cloud after those inputs are approved.
