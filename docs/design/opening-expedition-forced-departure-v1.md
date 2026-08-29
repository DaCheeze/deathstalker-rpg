# Opening Expedition — Virimonde Forced Departure v1

Status: **developer-approved, source-reconciled narrative architecture with a
complete authoritative playable intro; combat balance, final authored text, and
developer presentation approval remain open**.

Selected: 2026-08-24. Source-reconciled: 2026-08-25.

## Spoiler scope and authority

Spoiler scope is the opening premise only. This contract does not approve later
series events, character turns, deaths, betrayals, or the campaign ending.

The developer approved these anchors:

- Owen begins on his home world, Virimonde, before Imperial authority turns it
  hostile;
- Owen is condemned without being told why, and the opening does not answer that
  mystery;
- anonymous Deathstalker Standing personnel receive the authentic order and turn
  on Owen;
- Owen escapes through the Standing's concealed route, reaches his private flyer,
  and is shot down near a windbreak;
- wounded and exhausted, Owen braces at a tree for a last stand as many Standing
  personnel close on him;
- Hazel is a clone-legging smuggler and pirate whose damaged escape pod crashes
  into the field and scatters the closing personnel;
- Hazel actively creates the escape window and takes Owen aboard;
- they flee toward a lake where Owen's private yacht is hidden underwater, board
  it, and leave Virimonde;
- their survival and forced departure form the campaign's first Separation
  movement; and
- Virimonde remains available for a possible later transformed return.

These anchors supersede the earlier provisional capture-and-execution-site
structure. Owen's imminent violent death remains the ordeal, but it occurs at the
flyer wreck and tree rather than after a formal capture or transport. Hazel's pod
is the rescue vehicle to the lake; Owen's hidden yacht is the departure vessel.

This document does not invent dialogue, a cause for the outlawing, named supporting
characters, exact gore, the upstream cause of the pod's damage, or the next
destination.

References and status:

- `hero-journey-campaign-architecture.md` is the developer-approved structural
  authority for journey, economy, balance, pacing, and environmental guidance.
- `deathstalker-rpg-design.md` sections 13 and 14 remain the strategic scaffold:
  Owen flees Virimonde with Hazel, who is an ex-pirate and clonelegger.
- Baen's official *Deathstalker* listing supports Owen's unexplained death sentence
  and the ex-pirate alliance: <https://www.baen.com/deathstalker.html>.
- Baen's official Chapter Two sample supplies the opening action sequence used by
  this revision: <https://www.baen.com/Chapters/9781625671806/9781625671806___2.htm>.

## Approval-state ledger

| Input | State | Consequence |
|---|---|---|
| Virimonde is Owen's starting world | Developer-approved | Open on pastoral home rather than a generic industrial location |
| Owen is condemned without learning why | Developer-approved and source-supported | The order is real; its cause remains an honest mystery |
| Standing personnel turn on Owen | Developer-selected source alignment | Use anonymous functional personnel; add no names, relationships, or dialogue |
| Concealed-route flyer escape and shootdown | Source-reconciled and developer-approved | Player control narrows through a failed escape, not a false victory followed by capture |
| Wounded tree last stand | Source-reconciled and developer-approved | This is the imminent-death ordeal; no formal execution site is needed |
| Hazel is a clone-legging smuggler and pirate | Developer-approved source alignment | Her competence motivates action, not invented biography or dialogue |
| Hazel's escape pod crash and rescue | Source-reconciled and developer-approved | The impact scatters personnel and creates an active boarding window |
| Lake route and underwater yacht | Source-reconciled and developer-approved | The pod carries both protagonists to the hidden departure vessel |
| Forced departure is the opening expedition | Developer-approved | Survival begins rather than completes the Separation movement |
| Virimonde survives for possible later return | Developer-approved | Do not destroy the world merely to supply spectacle |
| Scripted flyer-wreck injury | Implemented provisional source condition | Beat 3 caps Owen at 75% HP; tune the value only during later balance work |
| Lake regroup | Developer-approved revision | Beat 7 reviews condition and continues; it does not force a medkit decision or item spend |
| Exact pod-damage cause and surviving cargo | Open | Do not invent an upstream ship, attacker, or cargo explanation |
| Final visible text and next destination | Open | Functional objectives are allowed; destination lore waits for approval |
| Numeric balance targets | Deferred by developer | Preserve values and measure the complete route before later tuning |

## Player-facing intro completion direction

Approved by the developer on 2026-08-26. This section supersedes the vertical
slice's exposed beat-card pacing and provisional consecutive-combat cadence without
changing the source-reconciled story order above.

- The ten beats remain internal deterministic boundaries for TypeScript state,
  replay, telemetry, and save/resume. The player does not see a numbered beat count,
  a Hero's Journey phase label, or a sequence of scene cards.
- From the player's viewpoint, the opening is a compact connected Virimonde area
  with limited exploration: one legible critical route, short optional branches,
  loopbacks or reused ground, inspectable environmental landmarks, and enough
  control between crises to make the place cohere. It remains more constrained than
  the main campaign.
- The main campaign expands this language into larger fields and dungeons, towns,
  shops, rest, persistent chests, optional routes, repeatable encounters, and
  player-directed grinding. The opening teaches the spatial and encounter grammar;
  it does not pretend to contain the full campaign loop.
- Normal field contacts are visible in the world. The opening uses no random
  encounter roll. A player field strike against an unaware contact grants the
  player side opening initiative; a contact that detects and reaches the player
  first grants the enemy side opening initiative; mutually aware engagement starts
  with the normal speed queue. Opening initiative changes turn order, not free
  overworld damage.
- TypeScript owns contact availability, awareness geometry, legal initiation,
  initiative result, encounter persistence, and the starting turn queue. Godot may
  present supplied positions, facing, alert feedback, pursuit, and field-strike
  input, but it does not award an advantage or decide that combat began.
- The escape-pod rescue remains a required authored confrontation. The flight and
  lake approach then return control and spatial breathing room before the required
  hidden-yacht departure confrontation. The former back-to-back provisional fights
  are retained only as historical integration evidence, not active pacing.
- Ordinary exploration shows one controlled character. Owen leads while he is the
  controlled protagonist; the already-approved impact boundary may visibly transfer
  control to Hazel for the rescue. Both remain represented after convergence where
  the presentation requires it.

Exact optional rewards, enemy-awareness distances, field-strike distance, patrol
speed, dialogue, and prose remain unapproved tunable or creative inputs. They must
be explicit validated data before they affect play.

## Expedition purpose

### Narrative purpose

Separate Owen from a life organized by Imperial legitimacy, collide his story with
Hazel's outlaw life, and force both characters to survive a crisis neither controls.
Owen does not become a committed rebel in the opening. Hazel gives him a chance to
live, while the flight makes his former place inside the Empire untenable.

### Player transformation

The player moves through five clear understandings:

1. Virimonde is Owen's familiar home and ordinary frame of reference.
2. The Imperial death order is real even though its cause is withheld.
3. Owen's attempted escape fails physically; ordinary legitimacy will not save him.
4. Hazel's violent arrival creates an unexpected survival alliance.
5. The hidden yacht restores agency without resolving the danger or mystery.

### Journey function

```text
Familiar world → death order and Standing escape → flyer pursuit and shootdown
    → tree last stand → pod impact and rescue → lake flight
    → lake regroup → hidden-yacht departure → temporary safety
```

Hazel's impact is the decisive collision between the protagonists. Boarding the
yacht completes this expedition's threshold crossing; it does not complete their
wider transformation.

## Required player knowledge

| Boundary | Player must understand | Player must not yet be told |
|---|---|---|
| Before the order | Owen belongs on Virimonde; its pastoral spaces are familiar | That Hazel is about to arrive or why Owen will be condemned |
| During the Standing escape | Imperial authority has formally targeted Owen and compliance will not make him safe | The true reason, author, motive, or future consequence of the order |
| At the flyer wreck | Owen is wounded, surrounded, and likely to die at the tree | The intervention or whether ordinary legal relief is coming |
| At the pod impact | A violent arrival scattered the closing personnel | Hazel's complete history, cargo, motives, or future role |
| After the rescue | Hazel chose to create an escape window; both need the lake route | A guaranteed alliance, next destination, or explanation of the outlawing |
| Aboard the yacht | Owen and Hazel survived; Virimonde is currently unsafe | The rebellion, later alliances, or Virimonde's eventual fate |

Numbers, damage rules, map geometry, inventory counts, and objective availability
remain truthful. The mystery concerns interpretation and motive, never false UI.

## Beat sheet

### Beat 0 — Familiar Virimonde

**Purpose:** establish Owen's ordinary life, spatial memory, and the home that exile
will make newly meaningful.

Owen approaches Deathstalker Standing through familiar farmland, passes an old
stone-and-river orientation landmark, and inspects his starting supplies before the
death order arrives. Exact dialogue remains unapproved.

The brief traversal culminates at Owen's visible supply cache. Inspection exposes
starting condition and inventory, spends nothing, and completes before the
authoritative transition to the death-order beat.

Use the depth, openness, and long sightlines appropriate to Virimonde's pastoral
food-world identity: worked land, old routes, water, woodland, stone boundaries,
settlements, and the Standing where compositionally appropriate. Do not begin in a
generic close industrial corridor.

### Beat 1 — The death order becomes pursuit

**Purpose:** turn a trusted system into immediate pressure while preserving the
reason for Owen's condemnation as an honest mystery.

Anonymous Deathstalker Standing personnel receive the authentic Imperial death
order and turn on Owen. It communicates legal targeting and credible death without
supplying a reason. No participant name, relationship, or dialogue is approved.

The Standing reverses from home to pressure: warm access closes, familiar personnel
block the approach, and the player retreats along the same stone-and-river axis used
in Beat 0. This short route consumes no combat or journey action. Do not reintroduce
movement turns or `Advance`.

### Beat 2 — Concealed-route escape

**Purpose:** make Owen's rejection by the Standing materially irreversible while
preserving player agency.

Owen escapes through concealed passages and reaches his private flyer. Move from
compressed, hostile architecture back toward a visible outside route and aircraft.
The flyer is earned as a forward anchor; it was not visible from Beat 0.

Preserve condition and supplies. The transition is escape, not capture, equipment
confiscation, or an uncommunicated invincible-opponent outcome.

### Beat 3 — Flyer shootdown and last stand

**Purpose:** break Owen's escape attempt and create the opening's first true ordeal.

Pursuers shoot down the private flyer near windbreak trees. Owen reaches a tree,
wounded and exhausted, and braces while many anonymous Standing personnel close on
him. The player must understand that violent death is imminent without a formal
execution ceremony or gratuitous gore.

The wreck, smoke, tree, and converging silhouettes must explain the situation before
objective text. After the shootdown transition, a short constrained traversal lets
the player move Owen from the wreck to the windbreak tree while visible personnel
close the surrounding space. It is not a combat, chase minigame, or fail timer.
TypeScript caps Owen at 75% HP on entering this boundary so the HUD truthfully
carries the source injury into later encounters; that value is provisional balance.
This boundary is not a secretly unwinnable tactical battle.

### Beat 4 — Hazel's escape-pod impact

**Purpose:** collide Hazel's outlaw trajectory with Owen's last stand and rupture the
closing personnel's control.

Hazel's damaged escape pod slams into the field, scattering the Standing personnel.
Register the impact through approach or impact motion, sound, debris, smoke, fire,
and displaced silhouettes. Do not invent why the pod was already damaged or what
unseen cargo or mother craft preceded it.

Control remains with Owen through the last stand, then transfers to Hazel at the
impact/rescue boundary. A brief playable path from the damaged pod toward Owen makes
that transfer tangible before the required rescue contact. The impact creates a
narrow opening rather than defeating every pursuer.

### Beat 5 — Escape-pod rescue

**Narrative job:** Hazel actively saves Owen and gets him aboard the pod.

**Gameplay job:** Hazel holds off regrouping Standing personnel while Owen reaches
the damaged escape pod. Authoritative state supplies actions, equipment, condition,
and targets. Melee is immediately legal when the encounter says it is; `Advance`
never appears.

Action may establish Hazel's competence as a smuggler, pirate, and clonelegger, but
cannot invent a sentimental motive, dialogue, or prior relationship. Success boards
Owen and makes both protagonists available to the next route.

The regrouping personnel are visible on the crash-site map. If Hazel reaches field-
strike range before detection, the player may begin with opening initiative; if the
personnel detect and close first, they receive it. This changes only the authoritative
starting queue. The confrontation itself remains required.

### Beat 6 — Flight to the lake

**Purpose:** turn rescue into shared action and make departure a spatial commitment.

The damaged pod crosses Virimonde under pursuit toward the lake hiding Owen's
private yacht. Alternate open pastoral depth with pressure and retain the impact
plume or windbreak as an intermittent rearward anchor. The lake becomes the forward
anchor only when the route reveals it.

This is now a traversal and presentation release after the required rescue rather
than a second mandatory combat. It preserves the carried condition and moves the
player toward the explorable lake approach. Any visible field contact used along the
route is avoidable and cannot silently become a required story encounter. Exact
combat and traversal tuning remain deferred; state and spending remain
deterministic.

### Beat 7 — Lake approach

Regroup at the lake, review the party's carried condition and supplies, and continue
toward Owen's hidden yacht. This beat has no forced medkit prompt, item spend,
hidden timer, secret departure requirement, surprise permanent loss, or invented
side objective.

The lake approach is a compact explorable space with a dominant water anchor, at
least one short optional branch, and a route that reveals the hidden-yacht area
without placing a numbered story step on the HUD. A visible optional contact may be
avoided, field-struck, or allowed to detect the party under the authoritative
initiative rule.

The wider campaign teaches recovery through explorable fields, optional supplies,
shops, town rest, and player-controlled preparation. The compressed forced-departure
opening does not pretend that one scripted inventory choice represents that full
economy. Optional reward contents remain unapproved until explicitly selected.

### Beat 8 — Hidden-yacht departure

**Purpose:** convert the rescue into durable agency outside Imperial legitimacy.

Owen's private yacht is concealed underwater in the lake. Hazel and Owen hold the
route long enough to board it and leave Virimonde under pursuit. Anonymous local
opposition supplies pressure; no commander name, personality, signature weapon,
survival state, or recurring importance is implied.

Use the strongest spatial release of the route: broad water, the yacht emerging as
a newly revealed anchor, then open departure. The pod is a damaged rescue vehicle,
not the long-term hub.

### Beat 9 — Temporary safety aboard the yacht

Return control promptly so the player can review party condition, inventory, and
unresolved danger while Virimonde remains visible behind. Do not display an
unapproved next destination or imply that the outlawing mystery is solved.

Preserve an explicit link to Virimonde for later return-state work. No massacre,
occupation, rescue, or associate outcome is selected here.

Return player control in a small yacht observation space rather than ending on a
beat card. Virimonde remains the dominant rearward anchor while the player can
review the truthful party condition and supplies and activate the final completion
handoff. No unapproved destination, dialogue, or ship function is inferred.

## Encounter and resource handoff

The revised chain contains two required encounter jobs plus optional visible field
pressure. The former flight-to-lake mandatory fight remains historical integration
evidence and is removed from final intro pacing:

| Sequence job | Required lesson or pressure | Persistence consequence |
|---|---|---|
| Escape-pod rescue | Hazel holds the opening while Owen boards | Establishes the joint party and post-impact state |
| Hidden-yacht departure | Master introduced rules to open escape | Resolves the expedition and records final condition |

Optional visible field contacts teach player-preemptive, enemy-advantage, and normal
engagement without blocking the critical route or becoming a hidden grind
requirement. Their rewards and exact placement require explicit data and developer
review.

The last stand and pod impact are authored story transitions rather than padded
combats. Every actual encounter enters telemetry.

Record at each boundary:

- party composition, HP, and maximum-HP percentage;
- relevant ESP, burnout, disruptor cooldown, shield, crash, and KIA state;
- equipment temporarily unavailable and the authoritative reason;
- medkits and revives carried, consumed, and remaining;
- currency or authored rewards gained, spent, or deferred;
- rounds and actions per encounter;
- recovery-choice state (null on the active route) and available recovery context;
- recovery opportunities offered and used; and
- failure location and preceding resource state.

No numeric target changes are authorized. The existing full-run balance failure
remains the baseline until the developer resumes combat tuning.

## Architectural guidance handoff

Use four linked landmarks:

1. **home anchor:** stable stone, river, farmland, and the Standing establish
   ordinary orientation;
2. **escape axis:** hostile interiors release toward the private flyer;
3. **impact anchor:** flyer wreck, windbreak tree, smoke, and pod impact explain the
   failed escape and rescue; and
4. **departure anchor:** the lake first guides the route, then reveals the hidden
   yacht.

```text
pastoral familiar space
    → hostile Standing seam
    → compressed concealed route
    → private flyer release
    → wreck and tree last stand
    → pod-impact rupture and rescue
    → reopened Virimonde depth toward lake
    → lake regroup and condition review
    → underwater-yacht reveal and departure
    → yacht safety with Virimonde behind
```

At each consequential decision, specify a gameplay-legible structural or visual
landmark. If testing finds confusion, correct destination visibility and structural
axis first, then landmarks, sensory hierarchy, camera framing, contextual prompts,
and only then explicit markers.

Capture Virimonde's ordinary, lockdown, crash-affected, lake, and post-departure
states in a reusable world profile. Transform it later only after developer plot
approval.

## Story text as interface content

Visible prose and dialogue remain open. Functional objective labels may use:

- `[inspect familiar supplies]`
- `[survive the death order]`
- `[reach Owen's private flyer]`
- `[last stand at the windbreak]`
- `[Hazel's pod impact]`
- `[hold the opening and board]`
- `[reach the lake]`
- `[regroup at the lake]`
- `[board Owen's hidden yacht]`
- `[review condition and supplies]`

Each eventual sequence must state whether it is mandatory, skippable, replayable,
revisitable, and safe across save/load. Objectives reveal required action without
answering the outlawing mystery.

## State and authority handoff

TypeScript remains authoritative over:

- expedition availability and start;
- familiar, outlawed, Standing-escaped, flyer-downed, last-stand, pod-impact,
  rescued, lake-route, departure-open, and escaped world state;
- player-control ownership and party composition at every boundary;
- lake-regroup completion and route consequence;
- route and interaction availability;
- inventory, condition, costs, rewards, and encounter order;
- opposing-force outcomes; and
- completion and later-return prerequisites.

Godot consumes resolved plain data to present environment state, traversal,
encounters, text, transitions, impact presentation, and release. It must not infer
why a route opens, decide when Hazel joins, restore losses, resolve combat, select
an opponent's fate, or advance campaign state.

The vertical slice defines the smallest expedition context without adding narrative
state to `BattleState` or creating a universal quest manager. Its Web checkpoint
stores only seed, monotonic sequence, and accepted commands; restoration rebuilds
journey, battle, inventory, telemetry, and RNG by strict deterministic replay.
Corrupted or incompatible checkpoints fail closed.

Each visited beat records boundary telemetry for party composition and HP,
inventory, retired recovery-choice state, encounter status, turn number, and action
count. The active route keeps recovery choice null; rejection of the retired choice
command, defeat boundary, full restart, mid-combat restore, and successful route are
covered independently. This is technical acceptance evidence, not final balance or
visual approval.

## Acceptance evidence

### Narrative and continuity

- The player can state that Owen is at home on Virimonde before being condemned.
- The death order is real, but its cause remains unexplained.
- The private-flyer escape, shootdown, windbreak last stand, and pod impact are
  legible without a formal capture scene.
- Hazel is understood as a crash-landed smuggler/pirate and clonelegger.
- Hazel actively creates the opening that saves Owen.
- The lake and Owen's hidden yacht supply the departure route.
- No invented prior relationship or major recurring antagonist is implied.
- Virimonde remains available for a transformed return.
- Escape creates temporary safety without resolving the mystery.

### Gameplay, environment, and economy

- Control transfers from Owen to Hazel at the impact/rescue boundary and both are
  represented after convergence.
- Every encounter has one documented job and boundary telemetry.
- Immediate melee is legal; `Advance` never appears.
- Persistent condition affects departure; Beat 7 does not require or spend a medkit.
- No grinding is required in the compressed opening. The wider campaign supplies
  towns, shops, chests, rest, and optional repeatable encounters.
- First-time players read ordinary Virimonde, Standing hostility, failed flyer
  escape, impact disruption, lake route, and yacht release through structure before
  heavy UI guidance.
- Effects, combat, camera, UI, and landmarks remain readable together.

### Technical and subjective evidence

- strict expedition, encounter, environment, and story-context validation;
- prerequisite, control-transfer, branch, consequence, save/load, and restart tests;
- deterministic seeds and replay across all encounter outcomes;
- full-run balance and economy telemetry for seeds 12345 and 98765;
- Godot traversal captures with landmark, crop, UI, audio, and performance review;
- browser console review for the exported Web path; and
- developer play review for source recognition, mystery clarity, seamlessness,
  pressure, rescue impact, and release.

Numeric acceptance thresholds remain open until balance work resumes.

The current headless opening baseline completes the route for seeds 12345 and 98765,
records all ten boundaries, wins exactly the two required encounters while skipping
the optional patrol, leaves recovery choice null, spends no medkit, and reaches
temporary safety with four medkits and one revive. After the source-faithful 75%
flyer-wreck injury cap, final combined party HP is 30.95% and 36.67% respectively.
These measurements describe the current combat chain; they do not approve its
tuning.

## Developer decision status

1. **Resolved 2026-08-25:** Deathstalker Standing approach through familiar
   farmland, the old stone-and-river landmark, and supply inspection establish
   Owen's home.
2. **Resolved 2026-08-25:** anonymous Standing personnel receive the authentic
   Imperial death order and turn on Owen without supplying a reason.
3. **Resolved 2026-08-25:** Owen uses the concealed route and private flyer; pursuit
   ends in shootdown and a wounded last stand at the windbreak.
4. **Resolved 2026-08-25:** control begins with Owen, transfers to Hazel at the pod
   impact/rescue, and represents both after convergence.
5. **Resolved 2026-08-25:** Hazel arrives in a damaged anonymous escape pod. Its
   upstream damage cause and cargo remain outside this opening contract.
6. **Resolved 2026-08-25:** the imminent-death ordeal is the encircled tree last
   stand; there is no formal custody or execution-site sequence.
7. **Resolved 2026-08-25:** the pod impact scatters the closing personnel and Hazel
   holds off regrouping personnel while Owen boards.
8. **Revised 2026-08-25:** Beat 7 is a lake regroup and condition review. It spends
   no medkit and presents no forced recovery choice; the wider town–field economy
   teaches preparation and recovery.
9. **Resolved 2026-08-25:** the pod reaches a lake where Owen's private yacht is
   hidden underwater; anonymous pursuit pressures boarding and departure.
10. **Resolved 2026-08-25:** temporary safety is aboard the yacht with condition,
    inventory, and Virimonde visible; the next destination remains withheld.

Best execution venue: **local** for source-sensitive Godot traversal, visual review,
licensed audio, and Web export; deterministic TypeScript schema, telemetry, and
tests remain browser-free and portable.
