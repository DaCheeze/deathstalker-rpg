# Production Pass Ledger

Updated: 2026-08-25

## Purpose

This is the chronological source of truth for what changed in each game-development
pass. Detailed technical, art, audio, and verification reports remain authoritative
for their own measurements; this ledger links them into one developer-readable
handoff.

Every completed pass must update this file before work is handed back. Interrupted
passes receive an explicit checkpoint, including unverified edits and the exact
continuation point. A missing ledger entry means the pass is not complete.

## Documentation recovery — pass-ledger enforcement

Status: **complete documentation pass**.

This pass created the cumulative ledger, reconstructed the existing combat and
Godot pass index from their detailed records, recorded the interrupted Pass 13
checkpoint, and made ledger updates mandatory in `AGENTS.md`,
`docs/development/workflow.md`, and `docs/PROJECT-STATE.md`. It intentionally changed
no gameplay, assets, audio, bridge data, or Godot runtime behavior.

Verification is documentation-only:

- `git diff --check -- AGENTS.md docs/PROJECT-STATE.md
  docs/development/workflow.md` exited 0;
- the new ledger has zero trailing-whitespace matches;
- all 19 linked Markdown files exist.

The current game-code parse failure is reported under Pass 13 and is not attributed
to this documentation pass.

## Current position

### Classic JRPG world-loop foundation and opening recovery correction

Status: **implemented and technically verified; noncanonical fixture art/content,
numeric balance, and post-revision developer play approval remain open**.

This pass replaced the mistaken macro assumption that the opening encounter chain
was the whole campaign structure. The approved foundation is now an explorable
town–field–boss loop: town rest and shops, persistent one-time chests, discrete
enemy contacts that return to the map, repeatable regular encounters for optional
XP and gold, persistent field condition, and an authored fixed-strength boss that
never scales to the party. The recommended route must remain viable without
grinding, while voluntary overleveling remains a legitimate player-controlled
difficulty choice. Medkits are optional tactical supplies rather than mandatory
story gates.

Pure TypeScript now owns a strictly validated `WorldLoopState`, location/travel
legality, chest rewards, rest, shop purchases, encounter availability, XP, levels,
gold, persistent condition, victory counts, boss completion, combat, legal actions,
AI, and RNG. The noncanonical `world_loop_proving_fixture` supplies one functional
hub, one field route, two chests, one repeatable patrol, and one fixed boss. A
versioned world-loop session protocol and the replaceable Web host expose that state
without moving gameplay rules into Godot. Focused core/protocol/Web-host tests prove
one-time chest persistence, medkit-free rest, discrete combat return, repeatable
patrol respawn, optional overleveling, and unchanged fixed-boss HP after grinding.

Godot Web now exposes the fixture only through `?mode=world-loop`. The strict Web
client and exact-ID retry controller consume the TypeScript response. The canonical
compositor adds presentation-only walking, color-coded interaction markers, a
transparent location/campaign HUD, shop/rest/chest/travel/encounter prompts, and the
existing TypeScript-supplied combat menu. The first browser run found that the URL
flag was being passed as an engine argument and incorrectly resumed the opening;
the custom shell now inserts Godot's user-argument separator before `--world-loop`.
The corrected build entered `awaiting=explore` at sequence 0. Browser QA purchased a
revive, travelled to the field, opened a persistent gold chest, completed one
optional battle, returned automatically to the field with 35 XP/25 gold and battle
damage preserved, returned to the hub, and rested to full HP without consuming a
medkit. The browser reported zero warning/error entries, 496.20 ms to interactive,
and a warmed 17.86 ms average frame time at the 1280×720 review viewport.

The active opening no longer forces a medkit decision at the lake. Beat 7 is an
ordinary lake regroup and condition review; recovery choice remains null, the
retired `choose_recovery` command is rejected, and no item is spent. The regenerated
37-exchange transcript reaches `yacht_safety` at sequence 36. Required seeds 12345
and 98765 both complete ten boundaries and three encounters with four medkits/one
revive; final combined party HP is 15.71% and 13.33%. These values expose the current
attrition but do not approve tuning.

Verification:

- focused Vitest: 6 files, 17 tests passed;
- `npm run verify:quality`: both TypeScript builds passed, lint reported 0 errors / 0
  warnings, and 160 tests in 36 files passed;
- `npm run godot:opening` and `npm run balance-check` both encountered the host-level
  Node 24/Windows `uv_os_get_passwd returned ENOMEM` failure before project code;
  running the identical TypeScript entry modules after supplying a process-local
  `os.userInfo` shim generated the 37-exchange opening transcript, generated the
  76-exchange world-loop transcript, and executed the required balance simulation;
- the current balance simulation still reports
  `BALANCE CHECK FAILED: 14 metrics out of band.` Recommended-level completion is
  100.0% for both seeds; no targets or combat values changed in this pass;
- changed `main.gd`, `canonical_compositor_layer.gd`,
  `web_game_core_client.gd`, `world_loop_controller.gd`, and
  `validate_world_loop.gd` passed Godot 4.7.2 `--check-only`;
- strict world-loop, opening-expedition, Web-core-client, and canonical-compositor
  validators passed. The world-loop validator covered 76 responses, two chests,
  three patrol wins, overleveling, fixed-boss completion, discrete returns, and an
  exact-ID retry;
- `npm run godot:web:core` built 34 modules at 104.97 kB raw / 26.60 kB gzip /
  371.78 kB map; the release Web export completed. Godot also emitted the existing
  root-certificate and editor-settings write warnings in the restricted host;
- corrected WebGL 2 runtime QA passed shop, travel, chest, encounter, map return,
  condition persistence, rest, keyboard, pointer, strict bridge, and console review.

Subjective gates remain open. The proving map is deliberately functional and
noncanonical; its procedural landscape, marker art, labels, and numeric rewards are
not production content or visual approval. A complete browser playthrough of the
post-revision ten-beat opening remains open, as do authored town/field art, campaign
save persistence for the new loop, economy tuning, and developer feel review.

At the developer's request on 2026-08-26, source commit `725153d` was pushed to
`codex/design-reconciliation` and the verified flat Godot Web artifact was published
as `gh-pages` commit `00cff44`. The hosted cache-busted route
`https://dacheeze.github.io/deathstalker-rpg/index.html?mode=world-loop&deploy=00cff44`
booted at sequence 0 with `awaiting=explore`, a 1920×1080 Godot canvas, and no
warning/error browser entries. Hosted time to interactive was 2273.90 ms. The
owner-local licensed-audio directory and generated build directory remained ignored;
the public artifact uses repository-safe procedural audio.

Next recommended pass: keep the noncanonical fixture as regression evidence, then
map the first developer-approved town and explorable field onto this contract once
their content identities are approved. Add strict save/resume for world-loop state
before expanding the map, and tune recommended-route versus voluntary-overlevel
cohorts only after that authored route is playable.

### Opening graphics 3 — cinematic integration and Web acceptance

Status: **implemented, natively captured, and technically verified; developer
subjective visual approval remains open**.

The third and final requested opening-graphics pass integrated the reconstructed
world and landmarks with the travelers, lighting, motion accents, and noncombat UI.
The opening sky now uses one restrained sun disc, nonconcentric haze, and a
directional shaft instead of visible concentric construction. Crash and wreck
atmosphere uses offset ellipses and torn plume geometry. Owen now carries the
approved cobalt/indigo/ivory language and Hazel the peacock-teal/emerald/ivory
language, with distinct hair, tapered coats, split tails, belts, boots, contact
shadows, and restrained rim light. Beat-specific emissive accents add sparse
motes, death-order gate pressure, impact sparks, lake glints, yacht-console glints,
and traveler grounding without placing UI inside the post-process path.

The half-resolution world grade now shifts by opening environment while preserving
sharp UI. The objective card is a compact translucent upper-right anchor rather
than a large mid-frame panel, and its movement/action control follows beneath it.
The corresponding pointer rectangles moved with the presentation, so the world
landmarks, Owen's supply cache, Hazel's pod, the private flyer, and the yacht remain
visible. The hidden-yacht emergence wake was corrected from repeated circular arcs
to directional displacement lines and one restrained residual arc.

Four inspected 1280x720 native captures cover the rebuilt ordinary world, Hazel's
impact, hidden-yacht departure, and yacht safety:
`godot-opening-graphics-pass-03-polish-beat-00-2026-08-25.png`,
`godot-opening-graphics-pass-03-polish-beat-04-2026-08-25.png`,
`godot-opening-graphics-pass-03-polish-beat-08-2026-08-25.png`, and
`godot-opening-graphics-pass-03-polish-beat-09-2026-08-25.png`. Full-resolution
inspection confirmed that the revised plume/wake language and compact action UI no
longer cover their scene landmarks.

Verification completed against the production Web path. `npm run verify:quality`
passed both TypeScript builds, zero-warning lint, and 155 tests in 34 files. Both
changed GDScripts passed Godot 4.7.2 `--check-only`; the strict canonical
compositor, opening-expedition, live-session-controller, and runtime-visual-assets
validators passed. `npm run godot:web:core` rebuilt 28 host modules at 80.52 kB raw
/ 21.24 kB gzip / 288.48 kB map, and the Godot Web release export exited 0. A local
Chromium/WebGL 2 run at the same fixed 1280x720 viewport measured a warmed 17.54 ms
per frame versus the deployed 17.60 ms baseline, a 0.06 ms decrease (about 0.34%).
Canvas-native pointer QA reached Owen's supplies, activated the relocated `Inspect
supplies` and `Finish inspection` controls, and advanced into the death-order beat.
The browser log contained zero warning- or error-level entries.

This pass changes only Godot presentation geometry, lighting, color, animation
accents, UI placement, and matching pointer hit rectangles. No TypeScript
authority, story, dialogue, gameplay value, balance target, dependency, audio
recipe, commit, push, deployment, or public artifact changed. The three-pass work
is still procedural production blocking rather than final authored environment or
character art; its visual quality requires developer review.

Next: developer-review the Pass 1/2/3 comparison and identify the first scene whose
composition or material language still breaks the intended pastoral-to-rupture
arc. Best venue: a remote Godot Web preview after explicit deployment approval,
because the local native and exported-build gates are now green.

### Opening graphics 2 — source-sequence landmark reconstruction

Status: **implemented and natively captured; developer subjective approval and
final-pass Web performance remain open**.

The second of three requested opening-graphics passes rebuilt the source-sequence
landmarks so their construction, scale, and function differ before the objective
text is read. Deathstalker Standing is now an old aristocratic estate assembled
from a central hall, inhabited wings, service depth, retaining terrace,
buttresses, masonry rhythm, and one ceremonial threshold; the betrayed state closes
that same stable entrance instead of replacing the building. The concealed escape
uses a deep service tunnel with repeated diminishing arches and lights, an exterior
hangar release, and an earned flyer anchor. The windbreak is now a linked line of
trees with one broader scarred last-stand trunk rather than a single circular tree.

The private flyer is a long atmospheric lifting body with swept control planes,
cockpit, engines, and a physically broken wreck state. Hazel's escape pod is a
shorter blunt capsule with a buried angle, hatch, panel rhythm, scorch, hot seam,
crater, and debris. Owen's hidden yacht is materially larger and more architectural,
with a long hull, raised observation mass, ports, waterline, and broad wake. The
lake has a defined shore and irregular reflection rhythm. Temporary safety now
frames a whole Virimonde globe, atmosphere, terminator, yacht window structure,
console silhouettes, and interior deck instead of a symbolic green arc.

The changed compositor passed Godot 4.7.2 `--check-only`. Native OpenGL
Compatibility review on the NVIDIA GeForce RTX 5080 replayed the authoritative
transcript and saved two 1280×720 captures:
`godot-opening-graphics-pass-02-landmarks-beat-02-2026-08-25.png` for the concealed
route and `godot-opening-graphics-pass-02-landmarks-beat-04-2026-08-25.png` for
Hazel's impact. Both runs loaded the strict compositor and procedural public-audio
path and exited 0. Full-resolution inspection confirmed distinct tunnel, flyer,
windbreak, wreck, pod, crater, and party anchors while preserving the quiet upper
field and lower combat lane.

This pass changes only Godot presentation. No TypeScript authority, story,
dialogue, gameplay value, balance target, dependency, audio recipe, commit, push,
or deployment changed. Inspection also showed that circular sun/smoke construction
remains visibly synthetic and that the large noncombat objective card covers too
much of the flyer/pod landmark region. Those are explicit defects for Pass 3, not
approved final art.

Next: replace circular atmosphere with layered directional haze and irregular
plumes, strengthen character grounding/rim light and environmental motion, and
compress/reposition the opening UI so world landmarks remain visible. Best venue:
local Godot followed by a real Web export measurement.

### Opening graphics 1 — Virimonde depth and ground-plane reconstruction

Status: **implemented and natively captured; developer subjective approval and
later-pass browser performance remain open**.

The first of three developer-requested opening-graphics passes concentrated on the
world's depth hierarchy rather than adding more story content. The ordinary
Virimonde plate now uses a smoother 48-band sky, one restrained directional source,
quiet cloud streaks, three independently shaped mountain/ridge depths, broad crop
parcels, a more substantial river with bank and reflected-edge separation, and a
varied old-stone boundary. The sharp stage floor replaces most of the flat
perspective-grid impression with converging land parcels, a wider worn route,
cross-field rhythm, and deterministic ground stones. Layer 7 now frames the camera
with several translucent vegetation banks, uneven grass silhouettes, and close
stone masses without adding a full-resolution blur.

The currently deployed opening supplied the before-change performance reference:
at a fixed 1280×720 Chromium/WebGL 2 viewport, its warmed in-game diagnostic
averaged 17.60 ms per frame. The changed compositor script passed Godot 4.7.2
`--check-only`. A native OpenGL Compatibility capture on the NVIDIA GeForce RTX
5080 loaded the strict nine-layer compositor and procedural public-audio path,
replayed the authoritative opening transcript to Beat 0, saved a 1280×720 frame at
`docs/screenshots/godot-opening-graphics-pass-01-depth-beat-00-2026-08-25.png`,
and exited 0. Full-resolution inspection confirmed clearer aerial separation,
route perspective, river crossing, and foreground depth while preserving Owen,
the supply cache, UI safe zones, and the Standing anchor.

This pass changes only Godot presentation geometry; no TypeScript authority,
story, dialogue, gameplay value, balance target, dependency, audio recipe, commit,
push, or deployment changed. The procedural landmark silhouettes remain visibly
diagrammatic, and the concentric construction around the sun remains too legible;
those are explicit inputs to the next two passes rather than approved final art.

Next: reconstruct the Standing, concealed passage, flyer wreck, windbreak, escape
pod, lake reveal, yacht, and yacht interior as stronger material/story landmarks,
then capture the impact beat. Best venue: local Godot, because the work needs native
layer and crop inspection before browser promotion.

### Opening expedition 9 — remote Godot Web opening preview

Status: **deployed and remotely interaction-verified; developer visual, audio, and
full-route play approval remain open**.

At the developer's request, the completed functional opening expedition was
published to the existing artifact-only GitHub Pages preview. The dirty
`codex/design-reconciliation` source branch and `main` were not committed or
pushed. A detached temporary worktree copied the same 11-file Web allowlist used by
the prior Godot preview, and SHA-256 comparison matched every copied file to the
locally verified release export. The normalized artifact diff contained only the
updated TypeScript host, the generated HTML package-size manifest, and the Godot
package, which grew from 703,472 to 3,851,764 bytes to carry the ten-beat opening.

Artifact commit `ff9cee55c82a41c8ca6abe32cbea120282a03a7e` was pushed only to
`gh-pages`. GitHub Pages reported `built` for that exact commit after 23.418
seconds. The cache-busted public URL reached `Separation 01/10` in Chromium/WebGL 2
with a 3,385.10 ms interactive marker. Pointer movement reached Owen's supplies,
`Inspect supplies` confirmed the boundary without spending resources, and `Finish
inspection` advanced to `Separation 02/10 — Imperial death order`. The exercised
hosted route emitted zero browser warnings and zero browser errors. The preview tab
was reset to the beginning and left open for the developer.

Deployment verification also regenerated the 37-exchange authoritative transcript
and the 28-module Web host (80.52 kB raw / 21.24 kB gzip / 288.48 kB map), then
completed the Godot 4.7.2 release export. All 14 changed GDScripts passed
`--check-only`; the strict opening, runtime-visual-assets, live-session-controller,
Web-core-client, and canonical-compositor validators passed. `npm run
verify:quality` passed both TypeScript builds, zero-warning lint, and 155 tests in
34 files. `npm run opening-check` completed seeds 12345 and 98765 through ten
boundaries and three victories to sequence 36 and `yacht_safety`, ending at 35.24%
and 32.86% combined party HP. Its first sandboxed launch hit the documented Windows
Node `uv_os_get_passwd ENOMEM` defect before project code; the same command passed
outside the managed sandbox. No dependency, gameplay value, balance target, source-
branch commit, `main` push, or Pages source setting changed. The known developer-
deferred 14-metric full-game balance failure was not rerun because this pass changed
only the deployment artifact.

The remote exercise proves boot and the first authored boundary, not the complete
hosted route, subjective visuals, audio quality, mobile behavior, or production
release readiness. Next: the developer should play the cache-busted public preview
through as much of the opening as practical and report the first pacing,
composition, input, or audio issue that interrupts the experience. Best venue:
remote Godot Web review, followed by a focused local correction pass.

### Opening expedition 8 — exported-browser completion audit and D-key repair

Status: **complete technical opening pass; developer subjective play, visual, and
audio approval remain open**.

The completion audit exercised the actual exported Godot Web build rather than
inferring browser readiness from native capture or headless replay. The local
release export ran at 1280×720 in Chromium/WebGL 2 and was played from the familiar
Virimonde approach through sequence 36 and `yacht_safety`. The pass used D to reach
and inspect Owen's supplies, A to retreat from the Standing after the death order,
Enter at every story/continue boundary, the live numbered action menu through all
three encounters, and the first recovery option to spend one medkit. The final HUD
showed Owen at 29/120, Hazel at 58/90, three medkits, one revive, autosave 36, and
`OPENING EXPEDITION COMPLETE`.

That browser pass found a real input collision that native automated capture did
not expose: `D`, documented and presented as rightward traversal, also toggled the
nine-layer compositor diagnostic. Ordinary movement could therefore replace the
game view with compositor tiles. Diagnostic mode now uses F12; its in-scene labels
and Godot README were updated, while D remains exclusively available for traversal.
The rebuilt Web route then completed using repeated D and A input without reopening
diagnostics.

Persistence was checked at two meaningful boundaries. Reload at autosave sequence
25 restored `lake_recovery` with `awaiting=choice`, the same 58/120 Owen, 17/90
Hazel, four medkits, and one revive. Reload after completion restored sequence 36
with `awaiting=complete`, the same final party/resources, and the yacht-safety
frame. The browser log for the exercised sessions contained zero warning-level and
zero error-level entries. It recorded expected engine/compositor/session startup
messages and the known informational explicit-silence report for the unsupported
semantic `death` audio cue; subjective audio acceptance remains developer-owned.

Measured verification after the fix:

- `main.gd`, `canonical_compositor_layer.gd`, and
  `canonical_compositor_diagnostic.gd` passed Godot 4.7.2 `--check-only`;
- `npm run godot:web:core` transformed 28 modules in 151 ms and retained the 80.52
  kB raw / 21.24 kB gzip / 288.48 kB source-map host;
- Godot 4.7.2 Web release export packed the F12 input repair and exited 0, with only
  the known root-certificate and out-of-workspace editor-settings diagnostics;
- `npm run verify:quality` passed: both TypeScript builds passed, lint reported 0
  errors and 0 warnings, and 155 tests passed in 34 files;
- `npm run opening-check` again completed required seeds 12345 and 98765 through all
  ten boundaries and three victories, ending at 35.24% and 32.86% combined party
  HP respectively; and
- the strict Godot validator replayed all 37 responses to sequence 36,
  `yacht_safety`, and `awaiting=complete`.

No TypeScript rule, encounter value, balance target, dependency, commit, push,
deployment, or remote site changed. The full-game balance failure remains the
developer-deferred 14 out-of-band metrics recorded in Opening expedition 7.

Next: the developer can now judge the finished functional opening's pacing,
landmarks, source recognition, and audio in the real build. Final raster location
art, authored dialogue, the approved next destination, and combat tuning are later
production passes rather than missing opening-route functionality. Best venue:
local for audio and input fidelity, or the remote Godot Web site after the developer
authorizes commit/push/deployment.

### Opening expedition 7 — source-reconciled Virimonde escape and departure

Status: **implemented and technically verified locally; developer play/visual
approval and exported-browser input review remain open**.

The developer approved building the opening closer to the book material. Baen's
official Chapter Two sample was checked before implementation and corrected the
provisional structure: Owen is not captured and transported to a separate execution
site. Anonymous Standing personnel turn on him after the death order; he escapes by
a concealed route to his private flyer, is pursued and shot down near windbreak
trees, and makes a wounded last stand at a tree. Hazel's damaged escape pod slams
into the field and scatters the closing personnel, after which she gets Owen aboard.
They fly to the lake hiding Owen's private yacht, board it, and leave Virimonde.
The next source destination was deliberately withheld because the developer has not
approved it for this game. No supporting name, relationship, dialogue, pod-damage
cause, cargo history, or later plot event was added. Source:
<https://www.baen.com/Chapters/9781625671806/9781625671806___2.htm>.

The ten TypeScript beats and three existing encounter jobs now express that order:
`standing_escape`, `flyer_last_stand`, `escape_pod_crash`,
`escape_pod_rescue`, `flight_to_lake`, `lake_recovery`,
`hidden_yacht_departure`, and `yacht_safety` replace the provisional custody and
execution-site identities. Enemy rosters and all three combat definitions retain
their prior stats and rules. The one new narrative-condition value is explicit in
data: entering the flyer-wreck boundary caps Owen at 75% HP. This makes the source
injury authoritative and persistent rather than contradicting a 120/120 HUD. A 50%
trial caused a party death on the deterministic route and was rejected; 75% leaves
both the medkit and no-medkit routes completable. The exact cap remains provisional
for later balance work.

Godot now differentiates the full source sequence with a concealed-route opening,
private flyer, flyer wreck, windbreak tree, damaged escape pod and impact plume,
lake approach, underwater-yacht reveal, and yacht observation framing with
Virimonde behind. Owen remains visible at the last stand, Hazel becomes active at
the impact/rescue boundary, and both appear after convergence. Objective text was
shortened to fit the translucent card. The native capture harness can now replay
the exact committed TypeScript transcript through combat and recovery commands to
reach any later beat; it does not select actions or resolve gameplay in GDScript.

Material files include `src/core/types.ts`, `src/core/validator.ts`,
`src/session/openingExpeditionScenario.ts`, both opening data files, the regenerated
opening transcript, the opening tests, `godot/scripts/main.gd`,
`godot/scripts/canonical_compositor_layer.gd`,
`godot/scripts/opening_transcript_client.gd`,
`godot/scripts/validate_opening_expedition.gd`, the operational opening contract,
Godot README, project state, and eight source-sequence captures for Beats 2–9.

Measured verification:

- `npm run godot:opening` regenerated 37 authoritative exchanges ending at sequence
  36, `yacht_safety`, and `awaiting=complete`;
- `npm run verify:quality` passed: both TypeScript builds passed, lint reported 0
  errors and 0 warnings, and 155 tests passed in 34 files;
- `npm run opening-check` completed both required seeds with ten boundaries and the
  same 10/8/9 action and 11/9/10 turn counts across three victories. Each used one
  medkit and finished with three medkits and one revive. Final combined party HP was
  35.24% for seed 12345 and 32.86% for seed 98765 after the injury cap;
- protocol coverage also completes the no-medkit route with both party members
  alive;
- the required full `npm run balance-check` retained the known failure verbatim:
  `BALANCE CHECK FAILED: 14 metrics out of band.` Recommended-level completion
  remains 100% for both seeds versus the 85–90% target; no general combat target or
  encounter value was tuned;
- `main.gd`, `canonical_compositor_layer.gd`,
  `opening_transcript_client.gd`, and `validate_opening_expedition.gd` passed Godot
  4.7.2 `--check-only`;
- the strict Godot opening validator passed all 37 responses, controller replay,
  resume validation, sequence 36, and final `yacht_safety`;
- native OpenGL Compatibility capture on the NVIDIA GeForce RTX 5080 saved and
  inspected 1280×720 Beats 2–9. Landmark/order/cast visibility and the 90/120 injury
  HUD were coherent. These captures are implementation evidence, not developer
  approval of final art or pacing;
- `npm run godot:web:core` transformed 28 modules in 143 ms and produced an 80.52 kB
  raw / 21.24 kB gzip / 288.48 kB source-map host; and
- Godot 4.7.2 Web release export packed the revised scripts and transcript and
  exited 0. It emitted only the known root-certificate and out-of-workspace editor-
  settings diagnostics.

The Windows host temporarily returned `uv_os_get_passwd ENOMEM` from
`node:os.userInfo()` before `tsx` could start. Verification used a process-local
stable temp-suffix workaround; the helper was removed after the commands and is not
part of the project. No dependency, commit, push, deployment, or browser-visible
remote site changed. The prior localhost browser-controller policy restriction was
not bypassed, so actual exported-browser input, audio, save/resume, and full pacing
remain developer-review gates.

Next: play the complete exported opening and review its landmark readability,
control transfer, injury/resource pressure, audio, and pacing. If the route reads
correctly, replace the procedural sequence landmarks with final raster environment
art before resuming combat tuning. Best venue: local, because the review depends on
the real Godot Web runtime, local audio, and developer judgment.

### Opening expedition 6 — Deathstalker Standing household betrayal

Status: **implemented and technically verified locally; developer movement/visual
approval and exported-browser input review remain open**.

The developer selected option C for the death-order delivery: anonymous
Deathstalker Standing personnel receive the authentic Imperial order and turn on
Owen. The operational opening contract and project state now record that approval.
The order establishes legal targeting and credible death without explaining why;
no participant name, relationship, dialogue, or exact capture method was added.
Decision 2 of the opening contract is resolved, while decision 3 remains open.

Godot now makes that betrayal spatially legible by reversing Beat 0's learned route.
Beat 1 begins with Owen beside the Standing, its warm windows changed to hostile
red, its central access visibly barred, and three small anonymous personnel between
him and home. The marker moves back to the old stone-and-river landmark, the action
button remains hidden until Owen retreats there, and `Leave the Standing` then
sends the unchanged TypeScript `continue` intent. This local movement is disposable
presentation state: it does not consume a combat or journey action, mutate condition
or inventory, change RNG, enter the checkpoint, or alter the 37-exchange transcript.

The capture tool's existing route-end mode now supports beats 0 and 1, with supply
inspection still restricted to beat 0. Automated replay completes each local route
in its required direction. The next Beat 2 frame remains a deliberately neutral
custody boundary with no depicted capture technique, preserving the next developer
decision. No TypeScript rule, bridge schema, combat value, economy value, dependency,
final raster asset, dialogue, commit, push, or deployment changed.

Measured verification:

- branch status was checked before the pass; the existing dirty opening-expedition
  work was preserved and the branch remained aligned with its remote tracking ref;
- `main.gd` and `canonical_compositor_layer.gd` passed Godot 4.7.2 `--check-only`;
- native OpenGL Compatibility captures on the NVIDIA GeForce RTX 5080 saved three
  inspected 1280×720 frames: Beat 1 at the initial betrayal with two transcript
  exchanges, Beat 1 at the reversed route end with the same two exchanges, and Beat
  2 custody with three exchanges. The estate lock, personnel, Owen, reverse marker,
  objective card, and route-end action remained readable; the Beat 2 frame did not
  imply a capture method;
- `npm run verify:quality` passed: build/typecheck passed, lint reported 0 errors
  and 0 warnings, and 155 tests passed in 34 files;
- the strict opening validator replayed all 37 TypeScript exchanges to sequence 36,
  `temporary_safety`, and `awaiting=complete`;
- `npm run godot:web:core` built 28 modules in 155 ms; the host remained 79.47 kB
  raw / 20.88 kB gzip / 285.70 kB source map; and
- Godot 4.7.2 Web release export packed the changed scripts and exited 0. It emitted
  only the known root-certificate and out-of-workspace editor-settings diagnostics.

The browser controller's prior localhost URL-policy restriction still prevents a
new exported-browser input/console pass. Native captures prove composition and gate
states, but do not constitute developer approval of movement feel or final art.
Balance was not rerun because this presentation/documentation pass changes no
authoritative gameplay, progression, economy, combat value, or target.

Next: select the pursuit/capture method that makes custody credible without
invalidating player control or inventing an invincible opponent. Best venue: hybrid—
the developer owns the story lock, then local Godot work can stage and inspect it.

### Opening expedition 5 — approved Deathstalker Standing approach and supply inspection

Status: **implemented and technically verified locally; developer visual/play
approval and exported-browser input review remain open**.

The developer explicitly approved Beat 0 as Owen approaching Deathstalker Standing
through familiar Virimonde farmland, passing an old stone-and-river landmark, and
inspecting his supplies before the death order arrives. The operational opening
contract and project state now record that decision as developer-approved rather
than proposal; the first of ten previously open creative decisions is resolved.

Godot's existing bounded walk is built out around that lock. The far layer now gives
Deathstalker Standing a broad, restrained aristocratic-estate silhouette with a
clear route axis and warm inhabited windows. The river bend and enlarged old stone
boundary frame the familiar crossing. A physical travel case and rolled pack replace
the abstract endpoint, while the TypeScript-supplied Owen remains the controlled
world-scale traveler. The procedural estate, travelers, and cache are integrated
staging, not final raster assets or a claim of final costume/architecture approval.

Arrival now exposes `Inspect supplies` rather than immediately crossing the journey
boundary. The first interaction confirms the displayed starting inventory and
explicitly spends no resource; a second `Finish inspection` interaction sends the
same authoritative `continue` command that advances to the death-order beat. Local
walk and inspection state remain presentation-only and disposable. They cannot
change party condition, inventory, RNG, legal journey state, combat, checkpoint
history, or the monotonic TypeScript sequence.

Native capture support adds `--opening-capture-supplies-inspected`, which requires
the existing Beat 0 route-end option and captures the confirmation state without
advancing TypeScript. Automated replay to later beats exercises both local
interaction steps before sending one authoritative Continue. No dialogue, death-
order delivery, execution method, crash craft, rescue action, departure solution,
gameplay value, balance target, dependency, commit, push, or deployment was added.

Measured verification:

- `npm run verify:quality` passed: build/typecheck passed, lint reported 0 errors
  and 0 warnings, and 155 tests passed in 34 files;
- final `main.gd` and `canonical_compositor_layer.gd` each passed Godot 4.7.2
  `--check-only`;
- the strict opening validator replayed all 37 TypeScript exchanges to sequence 36,
  `temporary_safety`, and `awaiting=complete`;
- native OpenGL Compatibility captures at 1280×720 inspected the route start,
  reached cache with `Inspect supplies`, and confirmed supply state with zero spend
  plus `Finish inspection`. Owen, the cache, marker, estate silhouette, river,
  stone crossing, and UI remained readable without overlap in all three frames;
- the native Beat 4 capture replayed through both local supply interactions, consumed
  the unchanged five transcript exchanges from creation through Hazel's crash, and
  still showed Hazel alone beneath the crash plume;
- `npm run godot:web:core` built 28 modules in 150 ms; the host remained 79.47 kB
  raw / 20.88 kB gzip / 285.70 kB source map;
- Godot 4.7.2 Web release export packed the final GDScripts, transcript, and host and
  exited 0. The host emitted only its known root-certificate and out-of-workspace
  editor-settings diagnostics; and
- final `git diff --check` over the pass's GDScript and documentation exited 0 with
  only the repository's expected LF-to-CRLF working-copy notices.

The in-app browser's prior localhost URL-policy restriction still prevents a new
exported-browser input/console pass. Native rendering, the real interaction
functions, later-beat transcript continuity, strict validation, and release export
are objective evidence; subjective composition, movement feel, browser coordinate
behavior, and final art quality remain developer gates. Balance was not rerun
because this pass changes no authoritative gameplay, progression, economy, combat
value, or target, and the developer explicitly deferred tuning.

Next: review this approved Beat 0 implementation, then select the death-order
delivery and pursuit/capture staging without revealing the reason for Owen's
condemnation. Best venue: local, because authored Godot staging needs native
input/render inspection and the developer owns the next plot/presentation lock.

### Opening expedition 4 — source-safe playable Virimonde traversal

Status: **implemented and technically verified locally; authored landmark,
interaction, Web input review, and developer visual approval remain open**.

This pass replaces Beat 0's immediate Continue button with a real bounded walk while
leaving the unapproved location proposal out of runtime content. On the already
approved familiar pastoral Virimonde boundary, Godot now draws the TypeScript-
supplied Owen at restrained overworld scale and lets the player move along the
existing perspective route with `A`/`D`, Left/Right, or click-to-walk. A visible gold
endpoint becomes green on arrival, the movement instruction clears, and only then
does the unchanged Continue intent become available. TypeScript still owns the beat,
sequence, party, checkpoint, legal boundary transition, and all later combat; local
walk progress is disposable presentation state and is not serialized as game state.

The same noncombat party renderer uses the authoritative beat-scoped party view, so
Owen appears before the crash, Hazel appears at the crash boundary, and a later
two-person view can form a small diagonal line without Godot inventing membership.
The provisional travelers use simple Godot primitives with Owen's approved blond
anchor and Hazel's approved red-hair anchor. They are integrated procedural staging,
not approved final character assets or costume selections.

Native review capture automation now completes the presentation-only Beat 0 route
before advancing to later transcript boundaries. The optional
`--opening-capture-route-end` flag captures the reached-marker state without sending
Continue, which proves both sides of the UI gate. No story event, landmark name,
dialogue, ordinary interaction, execution method, craft, departure solution,
TypeScript rule, balance value, dependency, commit, push, or deployment changed.

Measured verification:

- `npm run verify:quality` passed: build/typecheck passed, lint reported 0 errors
  and 0 warnings, and 155 tests passed in 34 files;
- changed `main.gd` and `canonical_compositor_layer.gd` each passed Godot 4.7.2
  `--check-only`;
- the strict opening validator replayed all 37 authoritative exchanges to sequence
  36, `temporary_safety`, and `awaiting=complete`;
- the native OpenGL Compatibility renderer on an NVIDIA GeForce RTX 5080 captured
  Beat 0 at 1280×720 with Owen at the route start, a gold endpoint, movement help,
  and no Continue button. A second 1280×720 capture with
  `--opening-capture-route-end` showed Owen at the green endpoint, movement help
  removed, and Continue available. Both consumed only the initial transcript
  exchange and exited 0;
- a native capture replayed through the traversal gate to Beat 4, consumed five
  authoritative exchanges, and showed Hazel alone beneath the crash plume with
  Continue available; full-resolution inspection found no pre-crash Hazel leak or
  UI overlap;
- `npm run godot:web:core` built 28 modules in 151 ms; the host remained 79.47 kB
  raw / 20.88 kB gzip / 285.70 kB source map;
- Godot 4.7.2 Web release export completed with the new GDScripts and transcript.
  The host emitted its known root-certificate and out-of-workspace editor-settings
  diagnostics, but the export exited 0; and
- final `git diff --check` over the pass's GDScript and documentation exited 0 with
  only the repository's expected LF-to-CRLF working-copy notices.

The in-app browser's prior localhost URL-policy restriction still prevents a new
exported-browser input/console pass from this task. Native input semantics, real-
renderer composition, strict transcript continuity, compilation, and export are
objective evidence; browser coordinate behavior, feel, authored visual quality,
and pacing remain developer-reviewed gates. Combat balance was not rerun because
this pass changes no authoritative gameplay, progression, economy, or target value,
and the developer explicitly deferred tuning.

Next: approve or replace the proposed Beat 0 authored location/interaction, then
substitute final composition and interaction for the generic endpoint while keeping
this input/authority seam. Best venue: local, because native Godot input/render
inspection and developer creative approval are both required.

### Opening expedition 3 — native authoritative-transcript review and capture

Status: **implemented and technically verified locally; authored traversal,
browser save/reload proof, and developer visual approval remain open**.

This pass closes the local visual-evidence gap without reviving the retired client
or creating a second gameplay authority. The new reusable
`godot/scripts/opening_transcript_client.gd` loads the committed 37-exchange
TypeScript transcript, validates every success response through the strict Godot
opening loader, compares the next expected sequence and command semantically, and
rewrites only request/session transport IDs. A divergent command fails loudly.
Native review never calculates combat, AI, journey state, legal actions, RNG, or
outcomes and exposes no persistence; the existing `OpeningExpeditionController`
continues to submit intents exactly as it does in the Web build.

`godot/scripts/main.gd` now accepts `--opening-review` for this presentation-only
route. Optional `--opening-capture-beat=0..9` and `--opening-capture-path=...`
arguments advance only through authoritative `continue` boundaries, wait for two
rendered frames, save the real root viewport, and exit. Capture stops with an error
if a player action or recovery choice would be required before the requested beat;
it does not fabricate decisions. The strict opening validator now uses the same
reusable transcript client for its complete replay. Native capture review also
exposed a leftover `INITIAL SNAPSHOT` replay banner on noncombat opening beats;
`canonical_compositor_layer.gd` now suppresses only that redundant header while
retaining the player-action header and resolved combat-action labels.

Material files are the reusable client, `godot/scripts/main.gd`, the opening
validator, `godot/README.md`, `docs/PROJECT-STATE.md`, this ledger, and three local
capture records under `docs/screenshots/`. No TypeScript rule, story beat, dialogue,
name, execution method, craft, departure solution, gameplay value, dependency,
commit, push, deployment, or browser client behavior changed.

Measured verification:

- `npm run verify:quality` passed: TypeScript build/typecheck passed, lint reported
  0 errors and 0 warnings, and 155 tests passed in 34 files;
- `opening_transcript_client.gd`, `main.gd`,
  `validate_opening_expedition.gd`, and the changed canonical compositor each
  passed Godot 4.7.2 `--check-only`;
- the strict opening validator replayed all 37 exchanges to sequence 36 and
  `temporary_safety`, and reported
  `reusable_transcript_client=true`, `controller_replay=true`, and `resume=true`;
- three native OpenGL Compatibility runs on an NVIDIA GeForce RTX 5080 loaded the
  canonical compositor and procedural public audio path, then saved 1280×720 root-
  viewport captures for beat 0 `familiar_virimonde`, beat 4 `hazel_crash`, and beat
  5 `execution_rescue`. They consumed 1, 5, and 6 transcript exchanges respectively
  and exited 0; and
- full-resolution inspection found Owen alone at the first boundary, Hazel alone at
  her crash boundary, and Hazel facing the Imperial guard at the rescue encounter.
  This confirms the earlier party-visibility correction in the real native renderer.
  Beat 0 and beat 4 were recaptured after the redundant noncombat banner was removed;
  the final inspected frames retain the opening card and no longer show that label;
  and
- `git diff --check` over the pass's code and documentation exited 0 with only the
  repository's expected LF-to-CRLF working-copy notices.

The captured pastoral field, long sightline, crash plume, transparent cards, and
rescue layout remain functional procedural staging. They do not prove authored
exploration, final composition, browser persistence, player pacing, or developer
approval. The unresolved first authored decision is still the exact familiar
Virimonde location and ordinary interaction; the proposed Deathstalker Standing
approach with a stone-and-river landmark and supply inspection remains a proposal,
not runtime canon.

Next: obtain the developer's explicit lock for that first location/interaction,
then build the smallest traversable Godot Beat 0 while preserving the existing
TypeScript boundary. Best venue: local, because implementation requires native
Godot render/input inspection and the developer owns the visual and narrative lock.

### Campaign architecture 3 — Virimonde crash and execution rescue correction

Status: **complete documentation and source-alignment pass; implementation and
unresolved staging remain open**.

The developer corrected the opening premise toward the book material: Hazel is a
clone-legging smuggler and pirate who crash-lands on Virimonde and saves Owen when
he is on the verge of a violent execution. The operational beat sheet now makes
Virimonde, Owen's unexplained condemnation, Hazel's crash, and her active rescue the
approved anchors. It expressly supersedes the previous assumptions that Hazel was
already present on routine business, that an escape vessel was visible from the
opening, and that a House-guard commander necessarily supplied the ordeal.

The revised ten-beat handoff follows familiar pastoral Virimonde, death-order
pursuit, capture, imminent execution, crash disruption, execution rescue, shared
flight, optional recovery, departure ordeal, and temporary safety. Architectural
guidance now uses a home landmark, a narrowing Imperial-control axis, and the crash
signature before any later departure destination becomes known. Economy guidance
preserves Owen's actual pre-capture condition and treats Hazel's crash losses and
recovery as explicit authoritative state rather than narrative convenience.

The exact chronology, player-control split, craft and crash cause, execution method,
rescue action, departure route and vessel, final opposing force, dialogue, rewards,
and values remain open. No prose was copied from the source, and no name, runtime
behavior, asset, schema, combat value, or economy value changed. TypeScript remains
authoritative and Godot remains the sole presentation target.

Verification was documentation-only:

- `git diff --check` over the three affected tracked documentation files exited 0;
- the two untracked design contracts had zero relevant stale-language or
  trailing-whitespace matches;
- all referenced local design and state files exist.

Build, lint, tests, balance simulation, Godot checks, and subjective play review
were not run because this pass changes documentation only.

Next: approve the exact crash/execution control sequence and departure solution,
then repair the encounter/environment validator seam before implementing the
smallest authoritative expedition context.

### Opening expedition 2 — deterministic Web save/resume and boundary telemetry

Status: **implemented and technically verified locally; final exported-browser
reload capture and developer play review remain open**.

This pass closes two technical acceptance gaps in the source-aligned opening without
selecting any unresolved story content. `OpeningExpeditionHostV1` now exports a
strict version-1 checkpoint containing only scenario identity, seed, monotonic
sequence, and accepted commands. Restore validates the exact schema and command cap,
creates a fresh authoritative runtime, and deterministically replays those commands
to reconstruct journey state, party condition, inventory, battle, legal actions,
and RNG cursor. It deliberately replaces the last transition with a state-only
snapshot so reloading cannot replay an already-heard attack or effect. Missing saves
are distinguished from corrupted/incompatible saves; the latter fail closed.

The replaceable Web host writes this checkpoint to a namespaced `localStorage` key
after every accepted opening command. A fresh host instance can resume it, while a
restart immediately persists the reset initial state. Godot attempts resume before
creation, adopts the restored authoritative sequence, validates the new result type,
and displays `AUTOSAVED <sequence>` or an unavailable state in the transparent
noncombat HUD. TypeScript remains authoritative; Godot stores, derives, and resolves
no journey or combat state.

Every opening response now carries strict boundary telemetry for each visited beat:
beat/job identity, party IDs, HP, maximum HP and percentage, medkits/revives,
recovery choice, encounter identity/status, turn number, and action count. Telemetry
is reconstructed by the same checkpoint replay and resets with the expedition. The
tests now prove the complete victory route, actual medkit expenditure and HP gain,
the viable no-medkit branch, a deterministic defeat boundary, restart after defeat,
mid-combat checkpoint/restore, unchanged next-action RNG outcome, malformed and
missing checkpoint rejection, and browser-storage resume across two replaceable host
instances.

Material files are `src/session/openingExpeditionProtocol.ts`,
`src/host/webCoreHost.ts`, `tests/bridge/openingExpeditionProtocol.test.ts`,
`tests/bridge/webCoreHost.test.ts`, `godot/scripts/opening_expedition_controller.gd`,
`godot/scripts/web_game_core_client.gd`, `godot/scripts/main.gd`,
`godot/scripts/canonical_compositor_layer.gd`,
`godot/scripts/validate_opening_expedition.gd`, the regenerated transcript,
`docs/design/opening-expedition-forced-departure-v1.md`, `godot/README.md`,
`docs/PROJECT-STATE.md`, and this ledger. No dependency, combat value, balance
target, story event, craft, execution method, dialogue, asset, commit, push, or
deployment changed.

Measured verification:

- focused opening protocol tests passed 5/5; focused opening/Web persistence tests
  passed 6/6 before the later outcome cases were added;
- final `npm run verify:quality` passed: TypeScript build/typecheck passed, lint
  reported 0 errors and 0 warnings, and 155 tests passed in 34 files;
- `npm run opening-check` exited 0 for seeds 12345 and 98765. Both reached sequence
  36, all ten boundaries, three victories with action counts 10/8/9 and turn numbers
  11/9/10, one recovery medkit used, three medkits and one revive remaining. Final
  party HP was 49.52% and 47.14% respectively;
- `npm run godot:opening` regenerated the same 37 authoritative exchanges ending at
  sequence 36 and temporary safety;
- the five affected GDScripts passed `--check-only`;
- the strict Godot opening validator passed all 37 responses, full controller
  replay, the synthetic resume response, final sequence 36, and temporary safety;
- `npm run godot:web:core` built 28 modules in 148 ms; the expanded host bundle is
  79.47 kB raw / 20.88 kB gzip;
- Godot 4.7.2 release export completed and included the updated host, controller,
  loader, HUD, and transcript. The host again emitted only its known root-certificate
  and out-of-workspace editor-settings diagnostics; and
- the required two-seed balance gate retained the recorded failure at 14 out-of-band
  metrics. Recommended-level completion remains 100% for seeds 12345 and 98765,
  versus the 85–90% target. Tuning remains developer-deferred.

The in-app browser's URL policy had blocked the prior post-build localhost reload,
so this pass did not attempt to bypass that restriction or claim a new exported-
browser save/reload capture. TypeScript Web-storage tests, strict Godot validation,
GDScript parsing, and release export are objective evidence; actual browser storage
behavior, autosave-label composition, visual quality, and player confidence still
need an unrestricted browser and developer review.

Next: perform one unrestricted exported-browser pass that advances into combat,
reloads mid-combat, proves state/RNG/menu continuity, completes both recovery paths,
and reviews the autosave label. After that, the remaining blockers are the ten
developer-owned authored decisions in the opening contract. Best venue: local,
because the remaining technical evidence and every subjective pacing/staging choice
depend on the real Godot Web runtime and developer review.

### Opening expedition 1 — authoritative Virimonde forced-departure vertical slice

Status: **implemented and technically verified locally; post-fix browser capture,
developer play review, authored traversal/staging, and balance tuning remain open**.

This pass turns the approved opening premise into one complete functional route
without filling unresolved plot details. The pure TypeScript journey model owns ten
ordered Separation beats: familiar Virimonde, unexplained death order, capture,
imminent execution, Hazel's crash, Hazel's active rescue, shared flight, optional
recovery, departure, and temporary safety. Hazel is authoritatively identified as a
clonelegger, smuggler, and pirate. The fixed story order is that she crash-lands on
Virimonde while Owen is on the verge of execution and then saves him; exact method,
craft, dialogue, and physical staging remain open.

`src/core/expeditionJourney.ts`, `src/core/types.ts`,
`src/data/opening-expedition.json`, and
`src/session/openingExpeditionScenario.ts` now hold explicit deterministic journey,
party, inventory, recovery-choice, and beat-transition state. Three provisional
encounters in `src/data/opening-expedition-encounters.json` reuse unchanged prototype
stats while starting Engaged and exposing no `Advance`. Owen is the only visible
party member before the crash, Hazel is the only active party member during the
rescue, and both are visible after convergence. This beat-scoped party view was
added after local visual review caught Hazel leaking into the pre-crash HUD.

`src/session/openingExpeditionProtocol.ts` supplies a strict, retry-safe version-1
session protocol over the authoritative journey and combat state. The existing Web
host exposes it alongside—not instead of—the combat session. The deterministic
exporter produces `godot/data/opening-expedition-transcript-v1.json` with 37 request/
response exchanges ending at sequence 36 and temporary safety. Godot's new opening
controller and expanded Web client validate and replay that transcript, including
exact current-beat party membership and required role data. A negative validator
case rejects a party member whose role is missing.

The canonical Godot scene now uses the opening session by default in Web builds.
Noncombat beats receive a procedural deep pastoral Virimonde with long sightlines,
river, old boundaries, Imperial constriction, crash trajectory/smoke, departure
pressure, and a separate temporary-safety horizon. A transparent journey card shows
Separation progress, functional non-dialogue objectives, current party condition,
inventory, Continue, and the optional recovery choice. Combat continues through the
existing TypeScript-owned menu and transition compositor. No named supporting
character, dialogue, execution method, craft, departure vessel, dependency, raster
asset, combat stat, target band, commit, push, or deployment was added.

Measured verification:

- focused validator, journey, opening-protocol, and Web-host tests passed 13/13 in
  four files;
- `npm run verify:quality` passed: TypeScript build/typecheck passed, lint reported
  0 errors and 0 warnings, and all 149 tests passed in 33 files;
- `npm run godot:opening` generated 37 exchanges; the restricted process sandbox
  first failed before project code with `uv_os_get_passwd returned ENOMEM`, while
  the identical approved host run succeeded;
- the Godot opening validator passed all 37 strict responses, full controller replay,
  final sequence 36, `temporary_safety`, and `awaiting=complete`;
- `opening_expedition_controller.gd`, `web_game_core_client.gd`, `main.gd`,
  `canonical_compositor_layer.gd`, and `validate_opening_expedition.gd` each passed
  `--check-only`; the host emitted only its known unwritable `user://logs` and root
  certificate-store diagnostics;
- `npm run godot:web:core` built 28 modules in 142 ms; the host bundle measured
  74.55 kB raw / 19.64 kB gzip;
- Godot 4.7.2 release export completed successfully. The export host could not save
  its editor settings outside the managed workspace and could not read the root
  certificate store, but emitted the complete Web artifact;
- the first local browser load reached the opening with zero console warnings or
  errors. Review reached the crash beat and exposed the pre-crash party leak, which
  was fixed and covered by protocol tests. The browser security layer blocked the
  required post-rebuild localhost reload, so the corrected artifact does not yet
  have a final browser screenshot or interaction capture. The temporary Vite server
  also encountered Windows `EBUSY` while watching Godot's export-time `.pck*.tmp`
  replacement and was stopped; the final release export itself completed; and
- the required two-seed balance gate still failed the established baseline at 14
  out-of-band metrics. Both recommended-level seeds completed at 100%, versus the
  85–90% target. Per developer direction, combat tuning is deferred rather than
  treated as opening-route acceptance.

Subjective visual quality, final Web input flow after the party-view correction,
audio, and player pacing remain developer gates. The current scene is a functional
playable vertical slice, not finished authored exploration: several story beats use
Continue cards rather than world traversal or staged scenes, and all exact content
boundaries recorded in the opening contract remain open.

Next: review the corrected exported Web build on an unrestricted browser, then
select one authored continuation layer—ordinary Virimonde traversal, death-order/
capture staging, crash/rescue staging, or departure/temporary-safety staging. Best
venue: local, because each requires Godot runtime inspection and developer visual/
pacing approval while the TypeScript authority seam is already deterministic.

### Campaign architecture 2 — forced-departure opening beat sheet

Status: **complete documentation and story-to-gameplay pass; unresolved content
decisions and implementation remain open**.

Historical note: Campaign architecture 3 supersedes this pass's routine-Hazel,
pre-visible-embarkation, and locked House-guard assumptions while retaining this
entry as an honest record of the earlier direction.

The developer selected the recommended forced-departure opening and approved its
structural guardrails. Owen begins in a familiar Imperial world before authority
turns it hostile without explaining why; Hazel is established before the crisis
peaks and participates in the escape; a persistent embarkation anchor guides the
route; an Imperial House-guard commander supplies the ordeal instead of consuming a
major recurring antagonist; the dramatic victory is escape to the ship/frontier;
the home survives for a possible transformed return; and player control resumes
aboard the ship as the new temporary safety space.

The new `docs/design/opening-expedition-forced-departure-v1.md` translates that
selection into a ten-beat, placeholder-safe implementation handoff. It covers
familiar control, outlaw enforcement, the first forced encounter, a closed familiar
route, an optional pressure branch, a physical security threshold, an approach
chain, the House-guard ordeal, escape/boon, and shipboard release. Each beat records
narrative purpose, required player knowledge, gameplay job, resource consequence,
architectural guidance, transition intent, and approval boundaries. Separate
sections define the encounter/economy handoff, global and local landmark chain,
story text as interface content, TypeScript/Godot authority, telemetry, acceptance
evidence, and remaining developer decisions.

The pass explicitly leaves the starting-world lock, Hazel's prior business, outlaw
notice delivery and facts, associate outcomes, optional reward, commander identity
and fate, initial ship functions/recovery, and all visible text unresolved. It
introduces no invented character/place name, dialogue, plot explanation, later
series twist, combat value, economy value, schema field, or universal quest system.
The source-derived strategic scaffold remains distinguished from the newly
developer-approved opening structure.

`AGENTS.md` now routes opening-expedition work to the beat sheet. Creative direction,
the Hero's Journey contract, and project state record the selection and its open
boundaries. The project-state continuation point now asks for the remaining content
decisions before the existing encounter/environment validator gap and smallest
expedition-context schema are addressed.

Verification was documentation-only:

- `git diff --check` over the five affected tracked instruction/state/design files
  exited 0 with only the repository's existing LF-to-CRLF warnings;
- a separate trailing-whitespace scan of the new untracked beat sheet returned zero
  matches;
- the beat sheet contains exactly ten numbered beats from 0 through 9;
- every repository-local authority, source dossier, type, and validator reference
  introduced by the pass resolves; and
- no TypeScript, GDScript, game data, Godot asset, dependency, target, commit, push,
  or deployment changed.

Build, lint, tests, balance simulation, Godot checks, browser QA, and subjective
presentation review were skipped because this pass changes documentation and
narrative authority only. The next concrete continuation point is selection of the
remaining opening content inputs, beginning with whether the prototype location is
explicitly Virimonde and why Hazel is present before the outlaw order. Best venue:
hybrid, because those decisions and later Godot traversal review need the local
developer loop while validated schema, telemetry, save/replay checks, and simulation
can later run in isolated cloud work.

### Campaign architecture 1 — Hero's Journey systems contract

Status: **complete documentation and architecture pass; first expedition inputs and
implementation remain open**.

The developer approved the Hero's Journey as the full campaign's structural model
and required balance, economy, pacing, and intuitive environmental guidance to
reinforce it. The new
`docs/design/hero-journey-campaign-architecture.md` treats Separation, Initiation,
and Return as the durable campaign spine rather than a rigid mandatory-scene list.
Eight functional phases map that transformation to encounter jobs, persistent
resource pressure, predictable sources and sinks, recovery and boon timing,
landmarks, thresholds, compression/release, shortcuts, and changed return spaces.
The contract cites the Joseph Campbell Foundation's structural explanation and a
peer-reviewed wayfinding literature review; it paraphrases both and imports no
protected story, wording, visual design, or level composition.

The contract distinguishes the newly developer-approved direction, existing
prototype seams, and open implementation proposals. It authorizes no character or
place names, dialogue, plot events, consequences, replacement lore, balance values,
economy values, or numeric wayfinding gates. It preserves the current run-state
rules and numeric targets, explicitly records the existing 100% recommended-level
completion and 14 out-of-band metrics as failures, rejects journey phase as a hidden
difficulty multiplier, and keeps deterministic TypeScript authoritative over
progression and route availability. Godot remains presentation-only.

`AGENTS.md` now routes Hero's Journey, campaign pacing, economy, and architectural
guidance work to the contract. Creative direction records the approved campaign
principle; run-and-balance records the pressure and economy guardrails; presentation
records a world-first guidance hierarchy using global and local landmarks; and
project state records both the durable decision and the first open implementation
seam. The contract identifies the existing `ExpeditionState` boundary as the
smallest proving path and requires repair of the validator that currently drops
declared encounter `environment` data before narrative state can depend on it.

Verification was documentation-only:

- `git diff --check` over the six affected tracked instruction, state, and design
  files exited 0; a separate trailing-whitespace scan of the new untracked contract
  returned zero matches; only the repository's existing LF-to-CRLF conversion
  warnings appeared;
- the campaign matrix contains exactly eight functional phase rows across all three
  essential movements;
- both external research links were opened and reviewed, and every repository-local
  reference introduced by the pass resolves; and
- no game data, TypeScript, GDScript, Godot asset, dependency, test target, balance
  target, commit, push, or deployment changed.

Build, lint, tests, balance simulation, Godot checks, browser QA, and subjective
visual/audio review were skipped because this pass changes documentation and design
authority only. The next concrete continuation point is developer approval of the
first proving expedition's functional inputs: narrative purpose, participants,
location, threshold, ordeal, boon, return consequence, and required visible text.
After those choices, repair the encounter/environment validator and define the
smallest validated expedition-context schema before tuning. Best venue: hybrid,
because narrative and traversal approval need the local developer/Godot loop while
later schema tests, telemetry, and deterministic simulations are cloud-safe.

### Godot 27 — authored Imperial depth hall and JRPG formation hierarchy

Status: **implemented and technically verified locally; final developer visual
approval and warmed Web frame measurement remain open**.

The developer selected Imperial layered set A because its repeated arches and long
central vanishing point preserve environmental depth; the close industrial corridor
was rejected as visually compressed. The exact 1920x1080 RGB far backdrop, RGBA
stage floor, and RGBA foreground occluder were copied unchanged into
`godot/assets/environment/imperial/`, registered in the new strict
`runtime-visual-assets-manifest-v1.json`, and wired only to compositor layers 2, 3,
and 7. Startup fails on selection, approval, path, layer number, dimensions, alpha
contract, or locally verifiable SHA-256 drift. Web startup validates imported
Texture2D presence and dimensions without depending on raw source-file access.

Two developer-provided turn-based JRPG reference frames then informed a composition
pass without copying their sprites, UI, typography, iconography, or exact encounter
layouts. Procedural humanoids now render at 0.72 scale. The party occupies a clear
back-left to front-right diagonal with 178 design pixels of horizontal separation
and 45 pixels of depth rise per slot. Opponents use a tighter 110-pixel cluster,
smaller bars and names, and no duplicate role subtitle so the party owns the
identity hierarchy. Both formations were lowered onto the authored deck after the
first combined frame exposed floating ground anchors. Combat state, targeting,
legality, queue order, bridge data, TypeScript authority, audio, and timings did not
change.

Measured verification:

- all three runtime copies retain the cataloged source SHA-256 values and exact
  1920x1080 dimensions; the strict runtime validator passed selection A, three
  layers, verified local hashes, dimensions, and alpha contracts;
- changed `runtime_visual_assets.gd`, `validate_runtime_visual_assets.gd`,
  `main.gd`, and `canonical_compositor_layer.gd` passed Godot 4.7.2
  `--check-only`;
- compositor, Web-core client, and live-session controller validators passed their
  exact layer/post/UI, protocol, retry, sequence, error, and restart contracts;
- legacy and range-band scene smokes completed 25/25 and 34/34 snapshots, retained
  21/6 and 20/3 audible/silent routing, and preserved two historical held
  interrupts with zero duplicate interrupt audio;
- `npm run godot:web:core` transformed 22 modules in 141 ms and the final Godot Web
  release export completed with all three imported textures and the strict manifest;
- raw Web output increased from 38.90 MiB to 41.47 MiB (+2.57 MiB); `index.pck` is
  3.23 MiB versus the previous 0.68 MiB approximate baseline;
- the first combined local Web frame reached the authoritative menu with zero
  browser warnings or errors; the browser controller then blocked the final
  localhost reload under its URL policy, so no warmed post-integration frame-time
  value replaces the measured 17.64 ms Godot 26 baseline; and
- the final native Compatibility-renderer capture at
  `docs/screenshots/godot-imperial-choice-a-runtime-2026-08-24.png` is 1280x720 and
  was inspected at original resolution for grounding, hierarchy, crop safety, label
  collisions, and the party diagonal. Movie Maker recorded three frames at 30 FPS;
  its fixed 33.33 ms delta is capture configuration, not a runtime performance
  measurement.
- `npm run verify:quality` passed build/typecheck, lint at zero errors/warnings, and
  143/143 tests across 31/31 files.

The recurring sandbox root-certificate and editor-settings messages remained
non-fatal. Fixture regeneration and balance were skipped because this is a Godot-only
presentation pass over unchanged bridge and core data. Headless smokes forced the
repository-safe procedural audio path and suppressed output; the 52 owner-local
licensed staging files remain untouched and no listening approval is claimed. No
dependency, commit, push, or deployment changed. The next concrete continuation
point is developer review of the final combined capture, followed by one focused
formation/grade correction or selection of the first authored party raster branch.
Best venue: local, because the approved source art, Godot renderer, owner-local
licensed audio, and performance-review environment remain available together.

### Godot 26 — functional-role silhouettes and geometric queue tokens

Status: **implemented and technically verified locally; developer visual approval
and deployment remain open**.

The developer positively reviewed Godot 24/25's battlefield direction as "way
better" and requested continued graphics iteration. This pass preserves that
environment and targets the remaining mannequin-like combatants. Existing bridge
fields now drive presentation-only differentiation: Power uses a broader stance,
torso, shoulders, and heavy single blade; Critical uses a narrow forward lean,
asymmetrical coat tail, and two opposed knives; Queue Control uses an asymmetrical
mantle and long weighted emitter weapon. Party silhouettes retain human-scale heads
and role-varying hair masses, while opponents use angular masks and eye slits. All
roles receive restrained breathing, role-matched emissive traces, coherent warm rim
light, visible role labels, and material/value separation beyond color alone.

The numbered queue circles are replaced by compact diamond tokens whose interior
geometry identifies Power, Critical, or Queue Control while a side wedge and accent
retain party/enemy recognition. The first Web capture revealed that the new role
label overlapped the active actor's command card. The card's existing actor-relative
vertical lift increased from 230 to 290 design pixels; the corrected opening and
next-actor layouts clear both labels and bodies while remaining in the open upper
field. No unapproved raster candidate, portrait, font, new lore, gameplay rule,
schema field, fixture, dependency, commit, push, or deployment was introduced.

Measured verification:

- the prior warmed local Web sample was 17.53 ms/frame; the corrected role pass
  measured 17.64 ms/frame, a +0.11 ms / approximately 0.6% change, with zero browser
  warnings or errors;
- local browser review confirmed all three party and enemy roles are distinguishable
  by silhouette and weapon, the geometric queue updates after turn order changes,
  and opening/next-actor command cards clear combatant names, roles, and bodies;
- local key `2` completed Twin Vibro-Daggers, advanced the TypeScript-owned enemy
  response, and returned the moved three-action menu with zero browser warnings or
  errors;
- changed `canonical_compositor_layer.gd` and `main.gd` passed Godot 4.7.2
  `--check-only`;
- the compositor validator passed exact layers, 960x540 world/post surfaces, one
  1920x1080 upscale, layer-08 bypass, and UI outside post;
- the strict Web client validator passed protocol/success/error/invalid envelope
  checks, and the live controller validator passed retry/sequence/error/restart;
- legacy and range-band scene smokes rendered 25/25 and 34/34 snapshots, retained
  21/6 and 20/3 audible/silent selections, and preserved two historical held
  interrupts with zero duplicate interrupt audio;
- `npm run godot:web:core` transformed 22 modules in 114 ms and the Godot Web release
  export completed; and
- `npm run verify:quality` passed build/typecheck, lint at zero errors/warnings, and
  143/143 tests across 31/31 files.

The sandbox-only Godot log, root-certificate, and editor-settings messages remained
non-fatal; all required commands exited 0. Balance and fixture regeneration were
skipped because the pass changes only Godot presentation and consumes existing
bridge fields. Browser QA cannot substitute for the developer's subjective review.
The next concrete continuation point is developer review of the new role silhouettes
and queue tokens, followed by either a focused proportion/palette correction or the
first selected authored combatant/background runtime package. Best venue: hybrid,
because implementation and frame measurement are local while a Pages preview makes
remote visual review practical.

### Godot 25 — remote battlefield-visual preview publication

Status: **deployed and remotely interaction-verified; developer visual approval
and production release-pipeline gates remain open**.

At the developer's request, the locally verified Godot 24 visual pass was promoted
to the existing artifact-only GitHub Pages preview. The dirty
`codex/design-reconciliation` source branch and `main` were not committed or pushed.
A detached temporary worktree copied exactly the 11 allowlisted Web files from
`godot/build/web`; source and staged SHA-256 hashes matched for every file. Git's
normalized artifact diff contained only the cache-busted `index.html` reference and
the revised `index.pck` (`699440` to `703472` bytes).

Artifact commit `ea5f4109ab0e6fd3c3ba50460eadab96e6c02755` was pushed only to
`gh-pages`. GitHub Pages build `1171048438` reported `built` for that exact commit
after 25.872 seconds. The cache-busted public URL reached the revised live battle
scene in 3251.60 ms in the current in-app-browser profile, showed the default-hidden
diagnostic surface and actor-clear command card, and emitted zero browser warnings
or errors. Remote key `2` completed Twin Vibro-Daggers, advanced the
TypeScript-owned enemy response, moved the command card to the next acting party
member, and returned three legal actions with zero browser warnings or errors.

The 3251.60 ms sample is under the existing 4-second desktop startup gate but is not
labeled cold because this browser profile had loaded the shared Web engine before.
The earlier 4805.70 ms cold miss remains the recorded cold evidence. No core rule,
bridge schema, fixture, dependency, licensed audio, new visual implementation,
source-branch commit, `main` push, or Pages source setting changed in this deployment
pass. The implementation's build, zero-warning lint, 143/143 tests, GDScript checks,
validators, scene smokes, local browser capture, and 17.53 ms revised frame sample
remain recorded under Godot 24. This artifact-only follow-up required no balance run
or fixture regeneration.

Subjective atmosphere, silhouette, composition, and menu readability remain for the
developer to judge on the public build. The next concrete continuation point is that
remote visual review, followed by one focused correction or selection of the first
authored runtime combatant/background package. Best venue: hybrid, because the
developer can review the hosted build remotely while implementation and frame
measurement remain local.

### Godot 24 — canonical battlefield atmosphere and combatant-readability pass

Status: **implemented and technically verified locally; developer visual approval
and remote deployment remain open**.

This pass measured the current public Web presentation before changing it. The
deployed build averaged 17.54 ms per frame in its own diagnostic overlay and emitted
zero browser warnings or errors. The limiting issue was presentation maturity, not
a newly demonstrated renderer regression: nine evenly spaced blocks, bright grid
lines, rectangular combatants, and always-visible bridge/debug chrome made the
canonical scene read as a technical harness.

The existing nine-layer compositor now draws a deeper decaying-Imperial deck from
cached/static geometry: recessed asymmetrical wall bays, large structural ribs, a
broken central crown, restrained warm practical slits, a darker plated floor, a
central inlay, and soft edge machinery. The six procedural stand-ins now use layered
human-scale silhouettes with a coat, split legs, boots, torso plate, inset trim,
shoulders, arms, head, hair/helmet mass, belt, contact shadow, and three readable
weapon profiles. No unapproved raster candidate was integrated. Live Web play now
starts with the large diagnostic card hidden, removes bridge/sequence/audio
instrumentation from the normal battle view, and retains Tab access to diagnostics;
fixture replay behavior remains unchanged.

Measured verification:

- the public baseline capture reported 17.54 ms/frame; the revised local Web export
  reported 17.53 ms/frame after warm-up in the same browser profile, with zero
  browser warnings or errors in both cases;
- the local Web export reached the opening menu, selected Twin Vibro-Daggers, played
  the resolved transition, advanced TypeScript-owned enemy behavior, and returned
  to a legal player menu with zero browser warnings or errors;
- `canonical_compositor_layer.gd` and `main.gd` each passed Godot 4.7.2
  `--check-only`;
- the canonical compositor validator passed exact order `01>02>03>04>05>06>07`,
  960x540 world/post surfaces, one 1920x1080 upscale, layer-08 bypass, and UI outside
  post;
- the live-session controller validator passed retry, sequence, preserved-error,
  and restart recovery checks;
- legacy and range-band headless scene smokes rendered 25/25 and 34/34 snapshots,
  retained 21/6 and 20/3 audible/silent selections, and preserved two historical
  held interrupts with zero duplicate interrupt audio;
- `npm run godot:web:core` transformed 22 modules in 122 ms and the final Godot Web
  release export completed; and
- `npm run verify:quality` passed build/typecheck, zero-warning lint, and 143/143
  tests across 31/31 files. `git diff --check` passed for the implementation files.

The sandbox-only root-certificate, log-path, and editor-settings write messages
remain non-fatal; all relevant commands exited 0. Balance and bridge-fixture
regeneration were skipped because no core rule, content, serializer, schema, or
fixture changed. Automated inspection cannot approve atmosphere, silhouettes,
composition, or readability. The next concrete continuation point is developer
review of the revised battle screen, followed by either one targeted procedural
correction or selection of the first authored combatant/background direction for a
strict runtime package. Best venue: hybrid, because implementation and frame
measurement are local while subjective review benefits from a hosted Web build.

### Godot 23 — public procedural Twin Vibro-Daggers translation

Status: **implemented, technically verified, and deployed; developer remote
listening approval remains open**.

After approving the owner-local Dagger Hit recipe, the developer requested that its
sharp double-hit character be translated into the repository-safe procedural cue
for remote GitHub Pages testing. The implementation uses the approved timing and
impact hierarchy only; it neither copies nor derives samples from the owner waveform.
The former tonal metal layers were removed. The public cue now uses a fast
left-directed edge sweep, one compact broadband/low-mid first contact, an exact
silent notch, and a broader right-directed second contact without a tonal ping.

The pre-change public baseline measured `0.2391` peak / `0.0201` RMS, with first and
second contact windows at `0.0214` and `0.0407` RMS. The first synthesis attempt was
rejected by the new headroom gate at `0.7313–0.8050` peak rather than weakening the
gate. After gain calibration, the representative render measures `0.4406` peak /
`0.0502` RMS; the first contact is `0.0634` RMS, the second is `0.0841` RMS (1.33×),
and the `120–142 ms` notch remains sample-silent. New deterministic checks cap peak
at `0.52` and require the second contact to exceed the first by at least 1.20× in all
six variations.

Measured verification:

- changed GDScript passed `--check-only`; the ten-cue renderer passed all six
  deterministic variations, contact bounds, exact dagger notch, second-contact
  hierarchy, and headroom checks;
- `npm run verify:quality` passed build/typecheck, zero-warning lint, and 143/143
  tests across 31/31 files;
- procedural legacy/range-band smokes completed 25/25 and 34/34 snapshots, retaining
  21/6 and 20/3 audible/silent selections, two historical held interrupts, and zero
  duplicate interrupt audio;
- the procedural listening validator and accelerated scene scheduler each passed all
  60 procedural selections;
- `npm run godot:web:core` transformed 22 modules in 116 ms at 52.55 kB raw /
  14.78 kB gzip, and the Godot 4.7.2 Web release export completed;
- local exported-browser input selected Twin Vibro-Daggers through sequence 2 with
  zero browser warnings/errors; and
- isolated artifact commit `a3cfc51d7e56bb7834d882a628c43e2d59a04cbd`
  was pushed only to `gh-pages`. GitHub Pages reported the matching build `built`;
  the cache-busted public page reached ready state in 2473.10 ms in the current
  browser profile, selected Twin Vibro-Daggers through sequence 2, and retained zero
  browser warnings/errors.

The latest hosted timing is not labeled cold. Headless and browser automation cannot
approve timbre. The developer should now play Twin Vibro-Daggers at
<https://dacheeze.github.io/deathstalker-rpg/> and judge whether the procedural
translation preserves the approved sharp two-hit character in the actual remote
mix.

### Godot 22 — owner-selected Dagger Hit source

Status: **technically integrated and exact-recipe listening-approved;
distribution provenance and broader in-game/device gates remain open**.

The developer identified `C:\Users\Daniel\Desktop\Assets\dagger hit.mp3` and
explicitly requested it replace the Twin Vibro-Daggers trial sources. The file is a
1.248 s, 48 kHz stereo, 256 kb/s MP3 with no embedded provenance metadata. FFmpeg
converted it to a 48 kHz stereo PCM16 WAV under the owner-controlled local source
vault; the original MP3 remains byte-untouched at SHA-256
`5b2bc29d...b5aad9`. The converted WAV is local-only and excluded from public
exports; no distribution-clearance claim is made without an owner provenance
record.

Measured before integration, the converted source peaks at `0.0 dBFS`, begins its
20%-of-peak onset at `239.313 ms`, and places its strongest five-millisecond window
at `438.188 ms`. The licensed recipe seeks into that recording to align its main
transient to both unchanged `85/145 ms` Twin Vibro-Daggers contacts. Each variation
uses the selected source twice with conservative unequal gains from `-10.0` to
`-6.5 dB`, keeps the second strike stronger, stops the first at `120 ms`, and starts
the second no earlier than `142 ms` to retain the exact notch.

The three immediately rejected dry-sword staging WAVs and import sidecars were
removed only after exact-path and SHA-256 comparison against their untouched source
copies. Staging then reported `1 copied, 25 already verified, 26 total`, and Godot
imported `owner_dagger_hit.wav`. No licensed WAV/import sidecar, TypeScript rule,
bridge schema, fixture, scene, dependency, commit, push, or public deployment
changed.

Measured verification:

- the strict licensed validator passed `state=ready`, seven cues, 26 assets, 13
  deterministic layers, matching hashes, manifested WAVs, and the absent-bank
  fallback probe;
- required-licensed legacy/range-band smokes completed 25/25 and 34/34 snapshots,
  retaining `13/8/6` and `18/2/3` licensed/procedural/silent selections, two
  historical held interrupts, and zero duplicate interrupt audio; and
- the listening validator and accelerated scheduler each passed all 60 selections
  (`42` licensed / `18` procedural), retaining ten cues, six variations, and
  suppressed technical output.

The next gates are recording the owner's source provenance and checking the approved
recipe inside full-speed Godot combat on the main machine. Separately reshape the
public procedural cue if the GitHub Pages sound also needs to match this attack
identity.

Because the developer was remote from the main machine, the exact variation-1
recipe was rendered to a private 225 ms PCM preview rather than requiring Godot.
The preview measured `-7.0 dBFS` peak, placed its strongest five-millisecond window
at the authored `145 ms` second contact, and was approved by the developer as
“sounds good.” This approves the selected source, timing, and representative gain
relationship. It does not establish distribution rights, Godot output-device
latency, full-encounter mix, speaker/headphone translation, or the public procedural
fallback.

### Godot 21 — Twin Vibro-Daggers dry sword-source trial

Status: **technically integrated; developer listening review is in progress**.

The developer rejected the current Twin Vibro-Daggers sound because it did not read
as a knife, sword, or slicing weapon and requested a different WAV. Before changing
the recipe, this pass confirmed that the local licensed cue used `Knife slice_2/3/4`
and measured five no-effect dry sword candidates plus five additional standard anime
sword candidates. The public GitHub Pages build was also identified separately: it
cannot load owner-staged licensed WAVs and continues to use the repository-safe
procedural Twin Vibro-Daggers cue.

The local licensed recipe now uses `Sword_Slice_DRY_01/03/05.wav` from the owner
library's Retro RPG Sounds Bundle. Those sources are short (`0.304–0.504 s`), peak
at `-4.0 dBFS`, and place their strongest five-millisecond windows at `27.574–52.086
ms`. The licensed bank aligns them to the unchanged `85/145 ms` semantic contacts,
retains the exact `120–142 ms` silence/notch, and uses unequal conservative gains
(`-5.0` to `-2.5 dB`) so the second cut remains the punctuation. Vibro-Blade keeps
its separate standard anime sword family.

The three rejected ignored staging WAVs and import sidecars were removed only after
their exact resolved paths and SHA-256 hashes matched the untouched purchased-source
copies. They remain recoverable from the owner source vault. The strict stager then
reported `28 already verified, 28 total`, and Godot imported the three replacement
WAVs. No licensed source or import sidecar is tracked, and no semantic timing,
TypeScript rule, bridge schema, fixture, scene, dependency, commit, push, or public
deployment changed.

Measured verification:

- transient analysis recorded exact duration, peak, onset, strongest-window timing,
  and SHA-256 for the ten candidates and the three rejected knife sources;
- the strict licensed validator passed `state=ready`, seven cues, 28 assets, 13
  deterministic layers, matching hashes, manifested WAVs, and the absent-bank
  fallback probe;
- required-licensed legacy/range-band smokes completed 25/25 and 34/34 snapshots,
  retaining `13/8/6` and `18/2/3` licensed/procedural/silent selections, exactly two
  historical held interrupts, and zero duplicate interrupt audio; and
- the listening validator and actual accelerated scheduler each passed all 60
  selections (`42` licensed / `18` procedural), retaining ten cues, six variations,
  and suppressed technical output.

The interactive listening harness was opened in `--audio=licensed` mode for the
developer. Automated checks cannot establish whether these dry slices now sound
convincing on the developer's device. If this local source family is accepted, the
next separate pass is to reshape the public procedural Twin Vibro-Daggers cue to
carry the same fast two-cut identity without shipping owner-controlled WAVs.

### Godot 20 — direct engagement and contextual translucent command card

Status: **implemented, verified, and republished; developer visual/play approval and
the existing cold-start gate remain open**.

The developer rejected the live range-band/`Advance` loop because waiting several
turns to attack made the game feel like a tactical RPG rather than the intended
menu-driven JRPG. The authoritative TypeScript live session now starts all six
combatants Engaged in mirrored pairs, offers melee on the first player turn, never
returns `Advance` to the player or AI, and retargets a living opponent after a defeat
without spending a movement turn. The explicit 34-snapshot range-band replay was
preserved unchanged as historical experiment and interrupt evidence; Godot does not
hide or synthesize legal actions.

The initial fixed Godot action panel also obscured the party. The final presentation
uses a compact smoky translucent card positioned from the active party member and
lifted above party names and bodies. It keeps thin luminous borders, restrained
selected-row emphasis, and battlefield visibility, follows the next acting party
member, and disappears during resolved player and enemy transitions. This applies
the supplied menu reference at the level of spatial behavior and transparency only;
no icons, typography, or exact layout were copied.

Material changes include the direct-engagement scenario/session/core/AI path and its
protocol tests; Godot actor-relative menu geometry, pointer hit testing, and
compositor drawing; and matching project-state, combat, presentation, transition,
prototype, README, workflow, and always-on instruction records. Unrelated Owen art
register work and the editor-written `godot/project.godot` delta were preserved.

Measured verification:

- `npm run verify:quality` passed build/typecheck, zero-warning lint, and 143/143
  tests across 31/31 files;
- the required two-seed `npm run balance-check` retained the known baseline failure
  verbatim: `BALANCE CHECK FAILED: 14 metrics out of band.` Recommended-level
  completion remained 100.0% for both seeds;
- fixture regeneration remained byte-identical: legacy 25 snapshots at
  `c5d6546a...22cf` and historical range-band 34 snapshots at
  `16d8c17b...19f`;
- changed GDScript passed `--check-only`; the live-session controller and compositor
  validators passed; procedural legacy/range-band scene smokes completed 25/25 and
  34/34 snapshots, retaining exactly two historical held interrupts and zero
  duplicate interrupt audio;
- `npm run godot:web:core` transformed 22 modules in 123 ms and produced a 52.55 kB
  raw / 14.78 kB gzip host; the Godot 4.7.2 Web release export completed;
- local exported-browser review confirmed the menu is absent during transitions,
  moves to the next active party member, accepts keyboard and pointer actions, and
  retains zero browser warnings/errors; and
- isolated Pages artifact commit
  `0acea809140484660bd853375e204a18e322a9db` was pushed only to `gh-pages`.
  GitHub reported the matching build `built`; the public HTTPS preview reached its
  ready live scene in 2623.10 ms in the current browser profile, completed immediate
  melee plus the TypeScript-owned AI response through sequence 2, returned a moved
  command card without `Advance`, and retained zero browser warnings/errors.

The 2623.10 ms hosted sample is not labeled cold because the browser profile had
previously loaded the site; Godot 19's measured 4805.70 ms cold miss remains the
authoritative cold-start result. The developer still needs to judge the card's
transparency, placement, and combat feel. The next best step is hybrid: play the
published slice through a complete encounter, then collect the already-planned cold
load waterfall before optimizing or automating preview promotion.

### Godot 19 — first remote Godot Web preview

Status: **deployed and remotely interaction-verified; cold-start and reproducible
release-pipeline gates remain open**.

At the developer's request, this pass replaced the historical Canvas site at
<https://dacheeze.github.io/deathstalker-rpg/> with the verified Godot Web live
combat slice. It did not merge the dirty development tree into `main` or reactivate
the retired Canvas workflow. Instead, an isolated root commit containing only the
11 required Web artifact files was pushed to a new `gh-pages` branch at
`32abcd8bf855bd967b46d0570b80038e473eaf31`. GitHub Pages was changed from workflow
mode to legacy branch publication from `gh-pages:/`, and an explicit Pages rebuild
was requested after the source switch. The prior `main` quality workflow and the
developer's unrelated working-tree edits remain unchanged.

Remote verification used the public HTTPS URL, not the local server:

- GitHub reported Pages status `built`, source `gh-pages:/`, and deployment SHA
  `32abcd8bf855bd967b46d0570b80038e473eaf31`;
- a fresh cache-busted load reached the Godot live menu in 4805.70 ms, loaded the
  single-threaded Compatibility/WebGL 2 engine, strict compositor, repository-safe
  procedural audio path, and authoritative TypeScript session with five legal
  actions;
- pressing `4` remotely completed the player Advance plus TypeScript-owned AI
  response through sequence 2, returned control with two legal actions, and produced
  zero browser warnings or errors; and
- a subsequent normal canonical-URL load reached the ready scene in 593.70 ms with
  zero browser warnings or errors.

The cache-busted 4805.70 ms measurement misses the current 4-second required-desktop
startup gate by 805.70 ms and is recorded as a miss, not averaged away with the warm
load. This manual artifact publication also lacks source-to-artifact provenance,
automated Godot export/template provisioning, artifact verification, cache/header
policy, multi-browser/mobile checks, touch coverage, and automated rollback. No
gameplay value, core rule, bridge schema, Godot runtime code, dependency, production
art, or licensed audio changed during this deployment pass.

The next best step is local/hybrid: collect a small cold-load waterfall to determine
whether the 39.5 MiB WASM transfer, GitHub Pages compression/cache behavior, or
engine initialization dominates the 805.70 ms miss, then encode the verified export
and preview promotion as a reproducible GitHub Actions workflow only after the
current source changes are reviewed and committed.

### Godot 18 — exported live Web combat slice

Status: **technically integrated and locally browser-verified; developer play,
visual, and listening approval plus broader Web acceptance remain open**.

This pass first classified the reported performance concern before changing code.
The TypeScript live-session host was not the bottleneck: over 5,000 sessions,
create-session measured 0.0102 ms median / 0.0192 ms p95 / 0.0672 ms p99 and
apply-action measured 0.0112 ms median / 0.0184 ms p95 / 0.0565 ms p99. The blocked
work was Godot Web presentation/export integration: matching export templates were
absent and the canonical scene still replayed fixtures instead of issuing live
requests.

The canonical Web scene now creates the version-1 TypeScript range-band session,
renders only the host-supplied legal intents, sends keyboard or pointer selection
back to the host, presents one strictly validated resolved transition at a time,
and advances TypeScript-owned AI only after presentation recovery. Restart clears
pending presentation/audio state and requests a fresh authoritative state while
preserving monotonic host sequence numbers. A transport-neutral Godot coordinator
provides exact-request-ID retry and visible fail-loud error state; validators prove
retry, sequence, error preservation, and restart recovery without moving any combat
rule into GDScript.

The public Web export now excludes the owner-local licensed-audio staging root even
when that ignored bank exists on the development machine. Procedural combat audio
forces Godot streaming playback so `AudioStreamGenerator` cues work under the Web
backend instead of producing the sample-playback warning found during the first
real export. The custom shell fills the browser viewport, reports boot failure, and
exposes an exact engine-start-to-live-scene timing. Official Godot 4.7.2
single-threaded Web templates were downloaded from the matching release, verified
against SHA-256
`F298490B8D44D934BE425A5A65A51BF15F422428B229A06A6E11D9FFEA248011`,
and installed locally; no dependency or licensed asset entered Git.

Measured verification:

- every changed GDScript passed `--check-only`; the live-session, strict Web-client,
  bridge-contract, legacy-fixture, range-band-fixture, compositor, and ten-cue audio
  validators passed;
- deterministic fixture regeneration retained legacy `25` snapshots at
  `c5d6546a...22cf` and range-band `34` snapshots at `16d8c17b...19f`;
- canonical procedural smokes completed `25/25` and `34/34` snapshots, with the
  range-band path retaining two held interrupts, zero duplicate interrupt audio,
  and a passing shared reset;
- `npm run godot:web:core` transformed 22 modules in 118 ms and retained the
  51.21 kB raw / 14.47 kB gzip TypeScript host;
- the Godot release export completed at 38.90 MiB raw / 10.06 MiB under local
  maximum-gzip simulation, below the 15 MiB compressed-payload gate;
- a clean local in-app-browser run reached the live menu in 533.70 ms, showed a
  warmed 17.54 ms frame average, completed keyboard player action plus authoritative
  AI response through sequence 2, restarted to initial state at sequence 3,
  accepted a pointer action through sequence 5, and retained zero console warnings
  or errors after the procedural-stream fix; and
- final `npm run verify:quality` passed build/typecheck, lint at 0 errors/0 warnings,
  and 142/142 tests across 31/31 files.

These results are one local desktop/browser sample, not hosted cold-cache,
multi-browser, mobile/touch, p99-frame, audible-device, soak, or subjective approval.
The exact retry/error behavior is validator-proven but has not yet been deliberately
fault-injected inside the exported runtime. No TypeScript combat rule, game value,
bridge schema, production art selection, dependency, commit, push, or deployment
changed. The unrelated Owen asset-register/ledger work and editor-written
`godot/project.godot` delta were preserved.

The next best step is local: the developer should briefly play this exported slice
and assess input, pacing, visuals, and audible cues. After that, add an exported
fault-injection smoke plus touch/complete-encounter coverage before preview hosting.

### Godot 17 — Vibro-Blade sword-source correction

Status: **technically integrated; developer listening approval remains open**.

The licensed `vibro_blade` recipe previously used files named `Knife slice_1/2/3`.
After inventorying the owner audio library and measuring sixty standard, super, and
special sword candidates, this pass selected three standard `Sword_Slice` sources
whose strongest five-millisecond windows occur at `100–113 ms`. The strict licensed
bank aligns each to the unchanged `100 ms` contact, trims playback to the unchanged
`300 ms` cue window, and keeps the new raw source peaks conservatively about
`0.3–0.6 dB` below the former gained knife layers. Twin Vibro-Daggers retains its
lighter knife sources and exact two-contact notch.

The ignored staged copy and import sidecar for the now-unused first knife source
were removed only after resolving both exact paths inside the licensed staging root,
confirming the ignore rule, and verifying the owner-library source remained intact.
Three sword WAVs were then staged and imported. The source vault and purchase proof
remain owner-controlled; no licensed file is committed.

Material files are `godot/data/licensed-combat-audio-manifest-v1.json`,
`docs/design/combat-audio-direction.md`, `docs/PROJECT-STATE.md`,
`docs/development/godot-vibro-blade-sword-source-pass-2026-08-23.md`, and this
ledger. No gameplay value, TypeScript core rule, bridge schema/fixture, GDScript,
scene, dependency, commit, or push changed.

Measured verification:

- staging reported `3 copied, 25 already verified, 28 total`;
- Godot imported all three new sword WAVs and the strict validator passed seven
  cues / `28` assets / `13` deterministic layers with matching hashes;
- licensed legacy and range-band smokes completed `25/25` and `34/34` snapshots,
  preserving `13/8/6` and `18/2/3` licensed/procedural/silent routing respectively;
- the range-band smoke retained two held interrupts and zero duplicate interrupt
  audio;
- listening validation and the licensed scheduler smoke each passed all `60`
  selections (`42` licensed / `18` procedural); and
- `npm run verify:quality` passed build/typecheck, lint `0/0`, and `142/142` tests
  across `31/31` files.

Automated and headless checks do not approve timbre, mix, tail quality, perceived
weight, or contact feel. The next step is a same-device developer review of licensed
Vibro-Blade against Twin Vibro-Daggers on headphones and ordinary speakers. Best
venue: local, because the decision depends on ignored owner-staged sources and the
actual Godot audio-device path.

### Art direction 5 — ten-cover visual and sword-family calibration

Status: **complete visual-research documentation pass; cover files remain external,
and no costume, likeness, sword casing, concept image, or runtime asset is
approved**.

The developer supplied ten photographed or scanned *Deathstalker* covers and
approved folding the useful high-level observations into project direction. The
copyrighted temporary attachments were inspected but not copied into the
repository. The new paraphrased review separates three inconsistent edition-art
families: formal blue aristocratic action, gritty yellow-green sword-and-sidearm
pulp, and cleaner uniformed action. Their contradictory faces, hair, outfits, armor,
and equipment are explicitly noncanonical.

Direction-approved transfers are limited to sword-plus-compact-sidearm silhouettes,
human heroes against overwhelming scale, large saturated character blocks,
practical belts/holsters/boots, aristocratic-versus-repaired material contrast,
operatic pressure, and selective acid-gold/yellow-green/hot-amber danger atmosphere.
Exact costumes, likenesses, weapons, armor, creatures, typography, borders, logos,
poses, and cover compositions remain excluded.

The follow-up sword review records two recurring medium-confidence families from
the readable covers: slender straight dueling blades with open or basket-like guards
and long shallow-curved sabers/cutlasses with compact guards. Crowded battle-cover
blades remain low-confidence, while covers 9 and 10 provide no reliable sword
evidence. Owen now has independently original dueling-frame and field-saber study
directions. Hazel retains a distinct forward-weighted straight-backed industrial
vibroblade and may inherit only the one-handed scale and protected-hand clarity.
Exact published curves, guards, grips, housings, and poses remain excluded.

Material files are `docs/design/deathstalker-cover-art-visual-review.md`,
`docs/design/deathstalker-visual-source-index.md`,
`docs/design/visual-style-bible.md`,
`docs/design/owen-combatant-raster-brief-v1.md`,
`docs/design/hazel-combatant-raster-brief-v1.md`, `docs/PROJECT-STATE.md`, and this
ledger. No copyrighted image, generated concept, game rule, feedback value, bridge
schema/fixture, GDScript, scene, raster asset, manifest, audio recipe, dependency,
commit, push, or player-visible runtime behavior changed. Existing unrelated
worktree edits were preserved.

Measured verification:

- all ten supplied cover attachments were opened at original available detail;
- focused `git diff --check` passed for all tracked documentation changed by this
  pass;
- a direct trailing-whitespace scan of the new cover review returned zero matches;
  and
- repository-wide `git diff --check` exited 0, with only Git's existing LF-to-CRLF
  working-copy notices.

Build, lint, tests, balance, bridge-fixture regeneration, GDScript checks, Godot
headless runs, and capture review were skipped because this pass changes only art-
direction documentation. No generated asset or sword construction was visually
approved.

The next concrete continuation point is an original Owen dueling-frame versus field-
saber A/B prop sheet, followed by a separate Hazel industrial-vibroblade A/B sheet.
Best venue: hybrid—use cloud generation for independent original prop exploration,
then perform silhouette cleanup, socket planning, atlas integration, and Godot
gameplay-scale review locally.

### Art direction 4 — Hazel combatant direction and nominal motion timing

Status: **complete direction and documentation pass; concept generation, visual
selection, weapon casing selection, signature choreography, schema extension, and
runtime integration remain open**.

The developer approved the reviewed Hazel recommendations. The new combatant brief
locks red hair, green eyes, a tall lithely muscular build, and a sharp angular face
as next-study identity direction. A peacock-teal/ivory industrial field kit with
compact black protection is preferred; an emerald/cream thermal field kit remains
an independently viable comparison. Repairs, blackened edges, and old scorch wear
are restrained, while major fresh damage is reserved for a separately approved
variant or runtime treatment. Large warm fields remain away from Hazel's head.

The equipment brief retains a forward-weighted straight-backed vibroblade with a
mechanical frame guard as the preferred construction, with a narrower integrated
comparison, and retains the compact rear-hip ring-capacitor disruptor as a proposed
paired casing study. Base weapons remain neutral; vibration, charge, beam, spent,
and impact states remain runtime-owned.

The new timing sheet maps anticipation, travel, semantic contact, and recovery into
the existing `melee_anticipation`, `melee_contact`, and `melee_recovery` clips rather
than silently adding a schema state. The preferred sequence totals `200 ms` with one
`contact` marker at `100 ms`. Standard `60 ms` hit-stop pauses active delta at that
marker and is not encoded as duplicate sprite frames; the comparison motion uses
identical timing. Disruptor source timing follows the current `810 ms` wider-game
reference. Signature choreography remains explicitly `TBD`.

Material files are `docs/design/hazel-combatant-raster-brief-v1.md`,
`docs/design/hazel-animation-timing-sheet-v1.md`,
`docs/design/visual-style-bible.md`, `docs/PROJECT-STATE.md`, and this ledger. No
game rule, feedback value, bridge schema/fixture, GDScript, scene, raster asset,
manifest, audio recipe, dependency, commit, push, or player-visible runtime
behavior changed. Existing unrelated worktree edits were preserved.

Measured verification:

- focused `git diff --check` passed for all tracked documentation changed by this
  pass;
- direct trailing-whitespace scans of both Hazel documents returned zero matches;
- timing arithmetic resolves melee contact at `100 ms`, the melee source sequence
  at `200 ms`, and the wider-game disruptor source sequence at `810 ms`; and
- repository-wide `git diff --check` exited 0, with only Git's existing LF-to-CRLF
  working-copy notices.

Build, lint, tests, balance, bridge-fixture regeneration, GDScript checks, Godot
headless runs, and capture review were skipped because this pass changes only art-
direction documentation. No animation, weapon, or sprite was visually approved.

The next concrete continuation point is a Hazel A/B costume, vibroblade, disruptor,
and melee-motion concept sheet, followed by one ranged-idle/advance/melee-contact
vertical slice. Best venue: hybrid—use cloud generation for independent source-
frame exploration, then perform timing cleanup, atlas assembly, semantic retiming,
and Godot capture review locally.

### Art direction 3 — Owen preferred costume and nominal motion timing

Status: **complete direction and documentation pass; concept generation, visual
selection, signature choreography, schema extension, and runtime integration remain
open**.

The developer approved following the prior Owen review recommendations. The Owen
brief now treats the long tailored cobalt travel coat as the preferred next-study
direction and retains the shorter field coat as a viable readability fallback. His
visual thesis is a tall, lean, rangy, flamboyant aristocratic adventurer with dark
protective field construction, restrained steelmesh, and one warm-leather luxury
accent. Fur is excluded from the base study because its bulk and edge noise work
against that silhouette. No existing concept image was promoted or approved.

The new timing sheet defines nominal frames, durations, loops, secondary-motion
notes, and events for Owen's idle, movement, preferred forward sweep, comparison
draw-cut, hit, defeat, and disruptor sequences. The melee source sequence totals the
current `200 ms` routine-action reference with its one `contact` marker at `100 ms`.
The disruptor source sequence follows the wider-game `220 ms` charge, `460 ms`
contact, and `810 ms` total reference. These values guide authored motion only;
TypeScript bridge timing remains authoritative and Godot retimes or samples clips
to meet resolved semantic markers. Signature choreography remains explicitly `TBD`
instead of inventing a filler action.

Material files are `docs/design/owen-combatant-raster-brief-v1.md`,
`docs/design/owen-animation-timing-sheet-v1.md`,
`docs/design/visual-style-bible.md`, `docs/PROJECT-STATE.md`, and this ledger. No
game rule, feedback value, bridge schema/fixture, GDScript, scene, raster asset,
manifest, audio recipe, dependency, commit, push, or player-visible runtime
behavior changed. Existing unrelated worktree edits were preserved.

Measured verification:

- focused `git diff --check` passed for all tracked documentation changed by this
  pass;
- direct trailing-whitespace scans of both Owen documents returned zero matches;
  and
- the timing arithmetic resolves the preferred melee contact at `100 ms`, the
  melee sequence at `200 ms`, and the wider-game disruptor sequence at `810 ms`;
  and
- repository-wide `git diff --check` exited 0, with only Git's existing LF-to-CRLF
  working-copy notices.

Build, lint, tests, balance, bridge-fixture regeneration, GDScript checks, Godot
headless runs, and capture review were skipped because this pass changes only art-
direction documentation. No animation or sprite was visually approved.

The next concrete continuation point is an Owen A/B costume-and-motion concept
sheet, followed by one ranged-idle/advance/melee-contact vertical slice. Best venue:
hybrid—use cloud generation for independent source-frame exploration, then perform
timing cleanup, atlas assembly, semantic retiming, and Godot capture review locally.

### Art direction 6 — Owen preferred full-body concept Choice A

Status: **complete exploratory generation pass; Choice B, developer selection,
transparent production source, animation coverage, schema extension, and runtime
integration remain open**.

This pass generated the first full-body Owen concept from the direction-approved
raster brief. Choice A uses the preferred long tailored cobalt travel coat, blonde
hair, dark field construction, restrained steelmesh, one warm-leather accent, an
original slender dueling-frame sword, and a compact neutral ring-capacitor
disruptor. The setting is a restrained decaying-Imperial interior with cool
blue-black shadow and one narrow warm source. The image does not promote a final
face, costume, sword, sidearm casing, or character asset.

Material files are
`art/choices/characters/owen/owen-character-choice-a-v1-concept.png`,
`art/GENERATED-ASSET-REGISTER.md`, and this ledger. The generated source is a
1023 x 1537 opaque RGB PNG intended only for concept review. It is not referenced by
Godot, present in a runtime manifest, or suitable as an anchored transparent
combatant frame without further production work.

Measured verification:

- full-resolution visual inspection found one complete figure, one fully framed
  sword, both feet visible, coherent anatomy, readable blonde/cobalt separation,
  and no text or watermark;
- image inspection reported `1023 x 1537`, `Format24bppRgb`; and
- repository `git diff --check` is the required documentation verification for this
  concept-only pass.

Build, lint, tests, balance, bridge-fixture regeneration, GDScript checks, Godot
headless runs, and runtime capture review were skipped because no code, schema,
manifest, scene, gameplay value, or runtime asset reference changed. Subjective
developer approval remains open.

The next concrete continuation point is an independently viable Owen Choice B using
the shorter indigo field coat and a materially distinct field-saber/readability
construction, followed by an equalized A/B review. Best venue: hybrid—cloud
generation for the alternate concept, then local cleanup, comparison, transparent
source preparation, anchoring, metadata, and Godot capture review after selection.

### Art direction 7 — Owen Choice A ranged-idle sprite study

Status: **complete exploratory sprite-source pass; developer selection, Choice B,
animation coverage, sockets/metadata, schema extension, manifest registration, and
runtime integration remain open**.

This pass used the existing Owen Choice A concept as an identity reference and
converted it into one screen-left ranged-idle combat sprite study. The derivative
preserves the blonde hair, tall rangy build, cobalt split travel coat, dark field
layers, ivory and restrained black-gold trim, warm-leather accent, slender
dueling-frame sword, and compact neutral disruptor. It contains no floor, contact
shadow, environment grade, bloom, beam, particles, text, UI, or baked combat effect.

The built-in image-generation tool produced the character successfully but returned
an opaque checkerboard for both direct transparency attempts. Those intermediates
were rejected. A targeted edit placed the preserved character on a flat chroma
background; local deterministic cleanup then created straight alpha, normalized the
figure into the contract's `512 x 512` frame, and removed edge spill. The discarded
invalid workspace intermediate was removed before handoff.

Material files are
`art/choices/characters/owen/owen-character-choice-a-v2-ranged-idle-sprite.png`,
`art/GENERATED-ASSET-REGISTER.md`, and this ledger. No game rule, bridge schema,
fixture, GDScript, scene, runtime manifest, package metadata, dependency, commit,
push, or player-visible runtime behavior changed.

Measured verification:

- the final PNG is `512 x 512`, 8-bit RGBA with alpha range `0..255`;
- 51,574 pixels are visible and 3,028 carry partial alpha;
- inclusive visible bounds are `x=105..406`, `y=32..471`, satisfying at least
  32 px top/side and 40 px bottom safety with provisional anchor `(256, 472)`;
- full-size transparent inspection plus equal black/white matte review found one
  complete screen-left figure, one complete sword, both feet, readable blonde/cobalt
  separation, no checkerboard, no obvious material holes, and no remaining chroma
  fringe; and
- repository `git diff --check` is the required tracked-file verification for this
  exploratory art pass.

Build, lint, tests, balance, bridge-fixture regeneration, GDScript checks, Godot
headless runs, package validation, and canonical runtime capture were skipped. A
single static source cannot satisfy Owen's required animation coverage, and the
current v1 package schema intentionally excludes named combatants. Subjective
developer approval remains open.

The next concrete continuation point is a normal-scale Choice A/Choice B sprite
comparison, then—only after selection—a ranged-idle/advance/melee-contact vertical
slice with stable anchor, sockets, metadata, semantic timing, and Godot capture.
Best venue: hybrid—cloud generation for independent motion/source-frame exploration,
then local alpha cleanup, atlas assembly, validation, semantic retiming, and capture.

### Art direction 8 — Hazel preferred concept and ranged-idle sprite study

Status: **complete exploratory concept-and-sprite pass; developer selection, Choice
B, animation coverage, sockets/metadata, schema extension, manifest registration,
and runtime integration remain open**.

This pass created a standalone Hazel Choice A concept from the direction-approved
brief, then used that image as the identity anchor for one screen-left ranged-idle
sprite source. Both retain Hazel's unruly red hair, green eyes, tall lithely muscular
build, compact black protection, peacock-teal and ivory industrial field kit,
restrained brass hardware, repaired/scorched wear, durable boots, forward-weighted
straight vibroblade, and closed rear-hip disruptor holster. The newer protective
field-kit authority superseded the older open-blouse and fashion-boot look-dev
details.

The built-in image-generation tool produced the opaque `1024 x 1536` concept and a
square chroma-key sprite intermediate. Local deterministic cleanup created straight
alpha, normalized the figure into the contract's `512 x 512` cell, and removed edge
spill without cutting the ivory panels or metal blade. Neither artifact is referenced
by Godot or a runtime manifest.

Material files are
`art/choices/characters/hazel/hazel-character-choice-a-v1-concept.png`,
`art/choices/characters/hazel/hazel-character-choice-a-v1-ranged-idle-sprite.png`,
`art/GENERATED-ASSET-REGISTER.md`, and this ledger. No game rule, bridge schema,
fixture, GDScript, scene, runtime manifest, package metadata, dependency, commit,
push, deployment, or player-visible runtime behavior changed.

Measured verification:

- the concept is `1024 x 1536`, opaque RGB, and 2,420,741 bytes;
- the sprite is `512 x 512`, 8-bit RGBA with alpha range `0..255`, 40,588 visible
  pixels, 3,617 partial-alpha pixels, and a 133,916-byte file size;
- inclusive sprite bounds are `x=102..408`, `y=32..471`, satisfying at least 32 px
  top/side and 40 px bottom safety with provisional anchor `(256, 472)`;
- concept inspection found one complete figure, one complete weapon, coherent
  anatomy, readable red-hair/green-eye/teal-ivory identity, practical coverage, and
  no text or watermark;
- full-size transparent inspection plus equal black/white matte review found one
  complete screen-left sprite, clean red-hair and weapon edges, no checkerboard, no
  obvious material holes, and no remaining chroma fringe; and
- repository `git diff --check` is the required tracked-file verification for this
  exploratory art pass.

Build, lint, tests, balance, bridge-fixture regeneration, GDScript checks, Godot
headless runs, package validation, and canonical runtime capture were skipped. A
single static source cannot satisfy Hazel's required animation coverage, and the
current v1 package schema intentionally excludes named combatants. Subjective
developer approval remains open.

The next concrete continuation point is an independently viable Hazel Choice B in
the emerald/cream thermal-field direction, followed by an equalized A/B concept and
sprite review. After selection, build a ranged-idle/advance/melee-contact vertical
slice with stable anchor, sockets, metadata, semantic timing, and Godot capture.
Best venue: hybrid—cloud generation for the alternative and motion source frames,
then local alpha cleanup, atlas assembly, validation, retiming, and capture.

### Art direction 9 — Hazel 256px website-animation derivative

Status: **complete deterministic derivative pass; animation-frame coverage, site
implementation, developer approval, and runtime integration remain open**.

This pass produced an exact `256 x 256` transparent derivative of Hazel's existing
Choice A ranged-idle sprite for website animation prototyping. It preserves the
approved source frame's identity and design—unruly red hair, green eyes, tall
lithely muscular build, compact black protection, peacock-teal and ivory industrial
field kit, restrained brass, repaired wear, durable boots, one forward-weighted
straight vibroblade, and a closed rear-hip disruptor holster—without a generative
redraw. The reusable sprite specification records the subject, colors, pose, style,
and exact size for consistent future animation-frame requests.

Material files are
`art/choices/characters/hazel/hazel-character-choice-a-v1-ranged-idle-sprite.png`,
`art/choices/characters/hazel/hazel-character-choice-a-v1-ranged-idle-sprite-256.png`,
`art/GENERATED-ASSET-REGISTER.md`, and this ledger. No game rule, bridge schema,
fixture, GDScript, scene, runtime manifest, package metadata, dependency, commit,
push, deployment, or player-visible runtime behavior changed.

Measured verification:

- the derivative is exactly `256 x 256`, 8-bit RGBA, non-interlaced, with alpha
  range `0..255`, 10,611 visible pixels, 1,833 partial-alpha pixels, and a
  36,953-byte file size;
- inclusive visible bounds are `x=50..204`, `y=15..236`, and the exact half-scale
  provisional ground anchor is `(128, 236)`;
- transparent visual inspection at native size found the complete screen-left
  figure and weapon readable, with clean silhouette separation and no visible
  clipping or material holes; and
- repository `git diff --check` is the required tracked-file verification for this
  exploratory art pass.

Build, lint, tests, balance, bridge-fixture regeneration, GDScript checks, Godot
headless runs, package validation, and canonical runtime capture were skipped
because this pass changes only one exploratory raster derivative and its records.
The file is a static animation source, not a sprite sheet or completed animation.

The next concrete continuation point is to select the website's animation states
and build matching 256 px frames around the fixed `(128, 236)` ground anchor. Best
venue: local deterministic assembly and site integration for existing frames; use
cloud generation only if new pose source art is requested.

### Godot 17 — Web-first live-session and future-Windows portability foundation

Status: **complete architecture foundation pass; canonical Godot input/presentation
wiring, save/load, full Web export, and a Windows host remain open**.

The developer chose Web-first distribution to put the game in front of players,
with a possible later Windows release or Windows sequel. This pass retained Godot
as the sole presentation client and the deterministic TypeScript core as authority,
while making the live boundary transport-neutral rather than Web-specific.

Before implementation, the existing 34-frame/33-action range-band fixture was
benchmarked over 500 iterations on Node 24.19.0. Complete encounter resolution plus
presentation serialization measured 0.316 ms median, 0.525 ms p95, 0.737 ms p99,
and 1.245 ms maximum. Its 134,653-byte replay JSON encoded in 0.156 ms median /
0.196 ms p95 / 0.273 ms p99 and decoded in 0.225 ms median / 0.260 ms p95 /
0.608 ms p99. These measurements justified bounded action messages and did not
justify moving combat into GDScript or adding per-frame synchronization.

`src/session/liveSessionProtocol.ts` now owns a version-1 plain-data session host.
It creates a validated range-band session, returns legal player intents, advances
TypeScript-owned enemy AI, resolves actions through the existing core, emits one
presentation-only transition, rejects malformed/unsupported/illegal/stale requests,
deduplicates identical retries, rejects request-ID conflicts, keeps sequence numbers
monotonic through restart, bounds its response cache, and resolves actions against a
cloned RNG cursor so failed requests cannot consume authoritative randomness.
`src/session/rangeBandScenario.ts` separates production session setup from replay
fixture generation. Mulberry32 cursors can now be exported/restored exactly for
later save/recovery work.

The portability boundary is explicit. `src/host/webCoreHost.ts` is a replaceable
browser adapter around the transport-neutral session; no rule imports a browser or
Godot API. Vite builds the host into the ignored Godot Web output directory, the
custom Web shell loads it before Godot, and
`godot/scripts/web_game_core_client.gd` calls and validates the JSON response
envelope through `JavaScriptBridge`. The compiled-host smoke creates a session and
resolves the first real action without loading the retired Canvas client. The
canonical scene does not yet issue live requests or present returned transitions.

The reviewed core-boundary defects were also corrected. `src/core/` contains no
`Math.random`, `Date.now`, `process`, dynamic `require`, or filesystem access; AI
requires an explicit RNG, campaign/run/expedition IDs are caller-injectable with
deterministic defaults, and balance override file loading remains in simulation
tooling. `tsconfig.core.json` compiles core/session/bridge/shared policy with ES2022
only and no ambient DOM or Node types. Shared feedback policy moved to
`src/presentation/feedbackConfig.ts`; the frozen Canvas path only re-exports it.
Node 24 LTS replaced end-of-life Node 20 in the package contract and CI without a
dependency change. The repository-readiness audit also corrected
`project:status` to validate that same Node 24 contract instead of retaining its
obsolete Node 20 expectation.

Post-implementation measurement over 5,000 sessions reported create-session
latency of 0.0119 ms median / 0.0226 ms p95 / 0.0549 ms p99 and apply-action latency
of 0.0122 ms median / 0.0204 ms p95 / 0.0433 ms p99. The first transition response
was 4,446 bytes in that harness. `npm run godot:web:core` transformed 22 modules in
118 ms and produced 51.21 kB raw / 14.47 kB gzip JavaScript plus a source map.

Measured verification:

- `npm run verify:gameplay` passed the browser-free core check, full TypeScript
  check, lint at 0 errors/0 warnings, and 142/142 tests across 31 files;
- the final `npm run verify:quality` rerun also exited 0 with those same quality
  results after the boundary lint rules and documentation were finalized;
- its required two-seed 500-iteration balance gate retained the known result,
  `BALANCE CHECK FAILED: 14 metrics out of band.`, with recommended-level
  completion at 100.0% for both seeds;
- both deterministic fixtures regenerated byte-identically: legacy 25 snapshots at
  `c5d6546a...22cf`, range-band 34 snapshots at `16d8c17b...19f`;
- both changed GDScripts passed `--check-only`, and the Web client validator passed
  protocol v1 success, error, and invalid-envelope cases;
- the existing bridge contract rejected all 12 malformed documents, both fixture
  validators passed, and canonical procedural scene smokes completed 25/25 and
  34/34 snapshots with the range-band replay retaining exactly two held interrupts;
- the rebuilt compiled-host browser smoke passed creation sequence 0, applied
  sequence 1, an authoritative disruptor transition, and a 4,451-byte response with
  zero browser warnings or errors; and
- `npm run project:status` reported installed Node 24.19.0 as supported and
  recommended the gameplay plus relevant Godot verification gates; and
- `git diff --check` exited 0; its output contained only expected LF-to-CRLF
  working-copy notices.

Matching Godot 4.7.2 Web export templates remain absent, so no complete exported
Godot Web game, payload/startup/frame metric, hosting change, or deployment is
claimed. Save/load state validation, canonical input/menu integration, transition
queueing, and Windows process/embedded-host packaging remain deferred. No gameplay
value, art, audio recipe, dependency, commit, or push changed. The unrelated
editor-written `godot/project.godot` delta remains preserved.

The next continuation point is to connect the canonical Godot action menu to
`WebGameCoreClient`, queue each returned transition through the existing compositor,
and prove player action → TypeScript resolution → Godot presentation plus restart,
retry, and error recovery in an actual Godot Web export. Best venue: local first,
then hybrid for repeatable hosted artifact checks after export templates are
available.

### Art direction 2 — proposed Owen combatant raster brief

Status: **complete documentation handoff; costume, sidearm casing, motion, named-
combatant schema extension, generated art, and runtime integration remain open**.

The developer's proposed Owen presentation and animation notes were reconciled with
the active Godot visual, compositor, raster-package, and audio contracts. The new
brief keeps the `512 x 512` straight-alpha frame-cell target and provisional
`(256, 472)` anchor, adds the required safe bounds and full animation coverage, and
keeps base rasters free of compositor-owned effects. It corrects advance direction
to screen-left, enemy staging to screen-left, and production audio ownership from
Web Audio to Godot semantic routing. It also separates semantic timeline markers
from spatial sprite sockets: the bridge/Godot timeline owns contact timing, while
sockets position the resulting effects.

The long cobalt travel coat and compact ring-capacitor disruptor remain proposed
directions rather than silently approved identity. The brief adds an independently
viable field-coat alternative, requires paired compact casing studies, and preserves
the developer as final selection authority. It explicitly does not place Owen in
the v1 package manifest because that machine-validated schema is intentionally
bounded to the anonymous three-character prototype.

Material files are `docs/design/owen-combatant-raster-brief-v1.md`,
`docs/design/visual-style-bible.md`, `docs/PROJECT-STATE.md`, and this ledger. No
game rule, data value, bridge schema/fixture, GDScript, scene, raster asset,
manifest, audio recipe, dependency, approved character identity, commit, push, or
player-visible runtime behavior changed. Existing unrelated worktree edits were
preserved.

Measured verification:

- `git diff --check -- docs/design/visual-style-bible.md docs/PROJECT-STATE.md
  docs/development/production-pass-ledger.md` exited 0;
- a direct trailing-whitespace scan of the new, untracked Owen brief returned zero
  matches; and
- the Owen brief exists and contains the compositor, socket/event, Godot-audio, and
  named-schema approval boundaries.

The repository-wide `git diff --check` still reports the unrelated pre-existing
`src/render/feedbackConfig.ts:3: new blank line at EOF`; that user-owned source file
was not changed during this pass.

Build, lint, tests, balance, bridge-fixture regeneration, GDScript checks, Godot
headless runs, and visual capture were skipped because this pass changes only art-
direction documentation. No character concept or runtime asset was subjectively
approved.

The next concrete continuation point is developer selection between costume A and
B, followed by two compact disruptor casing studies and one ranged-idle/advance/
melee-contact vertical slice. Best venue: hybrid—keep schema, anchors, cleanup,
atlas assembly, Godot integration, and capture review local; use cloud image
generation for independently viable A/B visual exploration.

### Art direction 1 — five-text visual-source synthesis

Status: **complete documentation and direction pass; individual concept and asset
selection remains open**.

The five developer-provided searchable Deathstalker texts were treated as reference
material, not instruction sources, and reviewed for repeatable visual systems rather
than copied prose. The visual source index now records non-redistributed filename,
chapter, and approximate line locators for all five texts. The visual bible now
separates named world families, permits source-grounded high-key horror, treats
Haden and Shub spaces as extended machine bodies, distinguishes Shub core machines,
Ghost Warriors, and Furies, expands Golgotha into surface/corporate, buried-palace,
and mutable-Court branches, and keeps later Golden Age Logres separate from the
game's decaying-Empire baseline.

Material files are `docs/design/visual-style-bible.md`,
`docs/design/deathstalker-visual-source-index.md`,
`docs/design/creative-direction.md`, `docs/PROJECT-STATE.md`, and this ledger. No
game rule, data value, bridge schema/fixture, GDScript, scene, raster asset,
manifest, audio, dependency, final character identity, commit, push, or
player-visible runtime behavior changed. Existing unrelated worktree edits were
preserved.

Measured verification:

- all five local reference paths existed and were readable;
- the corpus contained 68,669 lines in total across the five files;
- `git diff --check -- docs/design/visual-style-bible.md
  docs/design/deathstalker-visual-source-index.md
  docs/design/creative-direction.md docs/PROJECT-STATE.md
  docs/development/production-pass-ledger.md` exited 0; and
- the resulting source index retains paraphrase-only notes and does not copy source
  passages into the repository.

Build, lint, tests, balance, bridge-fixture regeneration, GDScript checks, Godot
headless runs, and visual capture were skipped because the pass changes only art-
direction documentation. No generated concept has been subjectively approved.

The next concrete continuation point is a Shub subtype A/B silhouette sheet covering
core machine, Ghost Warrior, and Fury reveal states, followed by a mutable-Court
shell/state environment study. Best venue: hybrid—lock silhouettes, state anchors,
Godot safe zones, and originality constraints locally; use cloud image generation
for independent A/B exploration; then perform selection, cleanup, and any canonical
Godot integration locally.

### Godot 16 — sole presentation cutover and Canvas workflow retirement

Status: **complete production-direction and active-workflow cutover; live Godot
bridge interaction and Godot release deployment remain open**.

The developer explicitly selected Godot 4 as the sole presentation client. Canvas
is no longer a fallback, parity target, comparator, deployable client, acceptance
reference, or destination for new work. The deterministic TypeScript core remains
authoritative, and Godot continues to consume versioned resolved bridge data rather
than calculating combat in GDScript.

Active tooling now enforces the decision. The obsolete 1920x1080 Canvas benchmark
runner and route were removed, along with `benchmark:compositor`, `npm run dev`, and
`npm run preview`. The standard `build` command now type-checks authoritative
TypeScript without producing the old Canvas bundle. CI still runs build, zero-warning
lint, and tests, but it no longer uploads or deploys `dist/` to GitHub Pages.
`project:status` labels remaining browser presentation edits as `legacy-browser` and
does not request browser runtime verification.

The root README, active project rules, current state, presentation/audio/visual direction,
range-band contract, studio/workflow guidance, Godot README, and former transition
plan were reconciled around Godot-only production. The plan is now a forward Godot
production plan: live bounded TypeScript↔Godot interaction, authored presentation,
device/Web acceptance, Godot release automation, and finally safe legacy-source
cleanup. Historical transition/pass records were intentionally not rewritten.

Material implementation files are `.github/workflows/deploy.yml`, `package.json`,
`scripts/project-status.mjs`, `src/main.ts`, `vite.config.ts`, and deletion of
`src/ui/perfRunner.ts` plus `src/sim/runBrowserPerf.ts`. No combat rule, data value,
bridge schema/fixture, GDScript, Godot scene, asset, audio recipe, dependency,
commit, push, or approved art choice changed. The unrelated editor-written
`godot/project.godot` delta that appeared when Godot was closed remains preserved
outside this pass.

Measured verification:

- `npm run verify:quality` exited 0: `tsc --noEmit`, lint 0 errors/0 warnings, and
  134/134 tests in 29 files;
- canonical range-band headless replay exited 0 with 34/34 validated TypeScript
  snapshots, 33 contact-gated transitions, exact two held interrupts, 20 procedural
  cues, three intentional silences, zero duplicate interrupt audio, and successful
  replay reset;
- the headless run retained the known non-fatal local `user://logs` and Windows
  root-certificate warnings; and
- `npm run project:status` reports `documentation`, `godot`, `legacy-browser`, and
  `tooling`, recommends quality plus relevant Godot checks, and no longer requests a
  browser path or console check; and
- `git diff --check` exited 0.

Fixture regeneration, changed-GDScript `--check-only`, balance, Godot Web export,
device listening, visual review, and deployment were skipped: the bridge, GDScript,
gameplay values, assets, and audio recipes did not change, and Web/export templates
remain unavailable. Verification used installed Node 24.19.0 rather than pinned
Node 20. No commit or push was made.

The next continuation point is Phase 1 of the Godot production plan: implement a
bounded live request/response loop where Godot sends input intents to the
authoritative TypeScript session and presents the resolved documents it receives.
Best venue: local, because the work requires simultaneous Godot runtime, TypeScript
process, and interactive input debugging.

The Canvas measurements in Performance 16 below remain truthful historical
diagnostic evidence, but their comparator and future-optimization recommendations
are superseded by this Godot-only decision.

### Performance 16 — cross-client workflow baseline and Vite watcher isolation

Status: **complete development-workflow performance pass; no player runtime
optimization was justified by the measurements**.

This pass classified the reported performance concern before changing code. On the
current RTX 5080 workstation, the canonical Godot client sustained the V-Sync-capped
60 FPS target and reached 787 FPS / 1.27 ms per frame with V-Sync disabled; sampled
CanvasItem GPU work was 0.17–0.21 ms. The real 1920x1080 Canvas harness measured
0.450 ms average / 0.900 ms worst CPU render time and a 16.67 ms presentation delta.
The production build completed in 1.814 seconds and all 134 tests in 1.480 seconds.
Those results did not justify changing either runtime renderer or the build/test
pipeline.

The measurement run did expose a reproducible local/Codex workflow failure: Vite
watched Godot's transient `project.godot*.tmp` and `.godot/editor/*.tmp` writes and
crashed on Windows with `EBUSY` while the two presentation clients were exercised
concurrently. `vite.config.ts` now excludes the non-Canvas `art/`, `docs/`,
`experiments/`, and `godot/` trees from the dev-server watcher. Browser source and
data remain watched; no TypeScript core, gameplay, bridge, Godot runtime, Canvas
rendering, asset, audio, dependency, commit, push, or player-visible behavior
changed.

Measured verification:

- before the change, Vite started in 176 ms and then exited 1 on the Godot temporary
  file watcher `EBUSY` failure;
- after the change, Vite started in 168 ms, a concurrent 180-frame native Godot
  Compatibility run exited 0, Vite remained alive without watcher output, and the
  performance route returned HTTP 200;
- the post-change Canvas run measured 0.655 ms average / 1.000 ms worst with post,
  0.543 ms average / 0.800 ms worst during the disruptor sample, and 16.67 ms rAF
  presentation with zero browser warnings or errors;
- `npm run verify:quality` exited 0: 40-module production build, lint 0/0, and
  134/134 tests in 29 files; and
- `git diff --check` exited 0; and
- all measurements used installed Node 24.19.0 rather than the still-pinned Node 20
  runtime.

Balance, Godot fixture regeneration, GDScript checks, Godot Web export, and
subjective visual/audio review were skipped because this pass changes only Vite's
development watcher scope. Codex model/network latency is not measurable from the
repository; this pass addresses the demonstrated local tool-overlap component only.
The next continuation point is to reproduce any remaining developer-observed slow
action by name, then add a p50/p99 benchmark for that exact path before optimizing
it. Best venue: local, because file-watcher behavior, frame pacing, and editor/client
overlap depend on the developer workstation.

### Pass 13 — range-band party resolved-timeline motion rehearsal

Status: **complete as isolated comparison evidence; developer selection remains
open**.

The interrupted functions are implemented. The fifth review view now runs complete
Party A and Party B side-by-side through the same hash-pinned 34-frame,
25.75-second authoritative replay. It provides resolved-frame/time stepping,
playback speed control, contact-gated state reveal, advance interpolation,
restrained anchor-preserving whole-raster action poses, procedural disruptor/melee
traces, abstract opponent markers, and clear HP/band/action readouts.

Material scope remains isolated to the review harness, its manifest/instructions,
three promoted PNGs, one short MP4, and pass documentation. No animation frames,
gameplay, bridge schema/fixture content, audio, dependency, raster package,
canonical Godot registration, art decision, commit, or push changed.

Measured verification:

- Godot `scripts/main.gd --check-only`: exit 0;
- scene validation: exit 0 with five intentional approval/package blockers;
- three representative motion scene smokes: exit 0;
- three final 1920×1080 stills inspected at full resolution;
- 4× motion capture: 194 frames, 1920×1080, 30 FPS, 6.466667 seconds;
- `npm.cmd run verify:quality`: build passed, lint 0/0, 134 tests passed in
  29 files.

The restricted Windows sandbox initially blocked esbuild with `spawn EPERM`, and
headless dummy-renderer Movie Maker crashed on a null texture. The identical quality
gate passed outside the process-launch restriction; normal headless scene checks
passed, and final captures succeeded through the real OpenGL Compatibility renderer.
Balance was skipped because the pass is presentation-only.

Detailed evidence: [Pass 13 motion rehearsal](godot-range-band-party-motion-rehearsal-2026-08-23.md).

### Godot 14 — owner-staged hybrid combat-audio replacement bank

Status: **implemented and technically verified; developer listening approval
remains open**.

This pass replaced the source path—not the semantics—for the four melee cues and
Particle, Scatter, and Plasma that had the clearest negative listening feedback.
A strict manifest now allowlists 26 WAVs from the developer's purchased
Humble/GameDev Market library. The safe stager, SHA/WAV validator, aligned playback
bank, `auto`/`procedural`/`licensed` runtime modes, canonical bridge integration,
and 10×6 hybrid listening route are implemented. Purchased sources, proof of
purchase, and staged WAVs remain owner-controlled and Git-ignored. Disruptor,
Shield, and Psionics remain procedural. No combat/core rule, bridge schema,
fixture, dependency, balance value, commit, push, or deployment changed.

Measured verification:

- local staging copied all 26 selected assets; the second run retained 26/26 with
  zero copies, and `git ls-files -- godot/assets/audio/licensed` remained empty;
- 21/21 relevant canonical/harness GDScripts passed `--check-only`, and Godot import
  processed all 26 staged WAVs;
- procedural, ranged, and strict licensed validators passed; the licensed result
  was `state=ready`, seven cues, 26 hash-matched/manifested assets, 13 deterministic
  selected layers, and a passing absent-public-state probe;
- both full fixtures passed in procedural and required-licensed modes: legacy
  routed 13 licensed/8 procedural when licensed was required; range-band routed 18
  licensed/2 procedural and retained its exact two held interrupts;
- listening validator and scheduler smoke each passed all 60 selections with 42
  licensed/18 procedural in `auto`; a procedural scheduler run passed 0/60;
- build passed with 40 modules and the two recorded Vite browser-externalization
  warnings, lint passed at zero warnings/errors, and tests passed 134/134 across
  29/29 files; and
- `git diff --check` passed. Balance was skipped as presentation-only.

All automated playback was output-suppressed, so none of this approves timbre,
impact, mix, device latency, cancellation, soak, ordinary-speaker translation, or
Web behavior. The next step is developer same-device A/B in the harness using
`--audio=auto` and `--audio=procedural`, reviewing the four melee cues first and
then Particle, Scatter, and Plasma.

Detailed evidence: [Hybrid licensed combat audio](godot-hybrid-licensed-combat-audio-pass-2026-08-23.md).

### Godot 15 — hybrid-audio project reconciliation

Status: **complete integration audit and workflow hardening; developer listening
approval remains open**.

This pass confirmed that the owner-staged bank is wired through the canonical
Godot client and shared 10×6 listening harness, that its exact seven-cue allowlist
uses all 26 declared assets, and that Disruptor, Shield, and Psionics remain
procedural. The staging command now refuses to copy unless Git confirms the
destination is ignored. Project status now recognizes Godot work and recommends
the required GDScript and headless gates. No cue recipe, gain, timing, licensed
binary, gameplay rule, bridge fixture, dependency, commit, push, or deployment
changed.

Measured verification:

- staging was idempotent at 0 copied / 26 verified, with zero tracked licensed
  files;
- manifest audit found seven exact cues, 26 assets, 21 variations, 39 layer
  definitions, and zero missing or unused assets;
- 21/21 canonical and listening-harness GDScripts passed `--check-only`;
- the strict licensed validator passed seven cues / 26 assets / 13 deterministic
  selected layers plus the empty-public-state probe;
- required-licensed legacy and range-band replays passed 25/25 and 34/34 snapshots,
  routing 13/8 and 18/2 licensed/procedural cues respectively;
- listening auto passed 42 licensed / 18 procedural selections, and forced
  procedural passed 0 / 60; and
- `npm run verify:quality` passed a 40-module build, lint 0/0, and 134/134 tests in
  29 files on installed Node 24.19.0. The project still requires Node 20.

Balance and bridge-fixture regeneration were correctly skipped. Automated output
was suppressed, so listening/device/Web approval remains open. Next, perform the
same-device `auto` versus `procedural` listening review and record per-cue decisions.

Detailed evidence: [Hybrid audio reconciliation](godot-hybrid-audio-reconciliation-2026-08-23.md).

### Commit preparation — external art archive and coherent local history

Status: **complete locally; main-repository push remains developer-controlled**.

The root ignore policy now hides nested Godot caches, generated GDScript UID
and shader UID sidecars, TypeScript build-info artifacts, and unreferenced
one-frame Movie Maker WAV stubs without deleting them. The remaining
audit found 501.10 MiB across 294 untracked media files, including 216.59 MiB of
current catalog media and 72.67 MiB of exact duplicate bytes. The asset register
deliberately preserves superseded provenance, so no art was deleted or silently
selected. Licensed audio remains ignored and untracked.

Ordinary Git would bring this actively changing Pages source repository close to
GitHub's recommended 1 GiB envelope, while Git LFS cannot back a GitHub Pages source
repository. The developer approved the separate repository. The 265-file art tree
was copied with zero SHA-256 mismatches, committed to private Git LFS repository
`DaCheeze/deathstalker-rpg-art` as `e1a26c4`, and pushed successfully. LFS uploaded
236 unique objects (430 MiB after deduplication), remote `main` equals the verified
local commit, and `git lfs fsck` passes. The game repository now ignores optional
exploratory binaries below `art/` while retaining its metadata and local review
files. No candidate was deleted, selected, or integrated.

The main repository is split into three implementation commits:
`f862af6` restores the combat presentation and range-band prototype, `59b7104`
separates exploratory art storage, and `6f11675` adds the Godot presentation bridge
and hybrid audio. The main repository has not been pushed. The Windows ACL failure
was traced to a 22-byte NUL-corrupted Codex `deny_read_acl_state.json`, preserved as
a backup and regenerated as valid state. Native sandbox setup and ordinary commands
now complete under the configured `elevated` Windows sandbox. This task's managed
profile intentionally keeps `.git` read-only, so Git metadata writes correctly use
the approval path; that remaining boundary is policy rather than ACL corruption.

Verification: diff checks pass; build passes with the existing Vite Node builtin
warnings; lint reports 0 warnings/0 errors; tests pass 134/134 in 29 files; all 38
staged GDScripts pass `--check-only`; both fixtures regenerate and all canonical
bridge, compositor, audio, licensed-bank, replay, listening-harness, and study
checks exit 0. The two-seed balance gate still fails the recorded baseline at 14
out-of-band metrics, although both recommended-level seeds complete at 100%.
Installed Node is 24.19.0 rather than required Node 20 LTS. Visual quality,
same-device listening, and Web audio approval remain subjective developer gates.

Detailed evidence: [Commit-preparation checkpoint](repository-commit-preparation-checkpoint-2026-08-23.md).

## Recorded pass index

### 2026-08-22 — combat restoration sequence

| Pass | Outcome | State | Detailed record |
|---|---|---|---|
| Restoration 0 | Recovered audiovisual evidence and isolated reported failures. | Complete evidence pass | [Combat restoration log](combat-restoration-pass-log-2026-08-22.md#pass-0---evidence-recovery-and-failure-isolation) |
| Restoration 1 | Reduced range-band opening pressure and restored restart recovery. | Implemented and verified | [Combat restoration log](combat-restoration-pass-log-2026-08-22.md#pass-1---range-band-opening-pressure-and-restart-recovery) |
| Restoration 2 | Added named attack identities and bounded transient variation. | Implemented; listening remained open | [Combat restoration log](combat-restoration-pass-log-2026-08-22.md#pass-2---named-attack-identities-and-transient-variation) |
| Restoration 3 | Unified semantic audio/visual contact timing for live combat and replay. | Implemented and verified | [Combat restoration log](combat-restoration-pass-log-2026-08-22.md#pass-3---shared-audiovisual-contact-timing) |
| Restoration 4 | Ran the full regression and produced the developer review route. | Complete technical handoff | [Combat restoration log](combat-restoration-pass-log-2026-08-22.md#pass-4---full-regression-and-review-handoff) |
| Restoration 5 | Revised melee audio from the clean-room reference analysis. | Implemented; listening remained open | [Combat restoration log](combat-restoration-pass-log-2026-08-22.md#pass-5---reference-driven-melee-audio-revision) |

Supporting records from this sequence include the
[cloud-chat recovery](cloud-chat-recovery-2026-08-22.md),
[balance diagnosis](balance-diagnosis-2026-08-22.md), and
[Gemini audiovisual workflow](gemini-audiovisual-review.md).

### 2026-08-23 — staged Godot transition

| Pass | Outcome | State | Detailed record |
|---|---|---|---|
| Godot 0 | Recorded the engine decision, authority boundary, and cutover gates. | Complete decision baseline | [Transition log](godot-transition-pass-log-2026-08-23.md#pass-0--decision-baseline) |
| Godot 1 | Added the strict TypeScript presentation bridge and canonical replay client. | Implemented; architecture review open | [Transition log](godot-transition-pass-log-2026-08-23.md#pass-1--canonical-bridge-and-replay-client) |
| Godot 2 | Added bounded Godot-native procedural combat audio. | Implemented; listening open | [Transition log](godot-transition-pass-log-2026-08-23.md#pass-2--bounded-native-procedural-combat-audio) |
| Godot 3 | Added strict legacy/range-band fixture selection and replay validation. | Implemented; presentation review open | [Transition log](godot-transition-pass-log-2026-08-23.md#pass-3--strict-dual-fixture-selector) |
| Godot 4 | Proved the isolated nine-layer compositor architecture. | Complete technical evidence; visual approval open | [Compositor proof](godot-nine-layer-compositor-proof-2026-08-23.md) |
| Godot 5 | Integrated the canonical nine-layer compositor and true full-scene post path. | Implemented and verified; authored-art review open | [Canonical compositor](godot-canonical-compositor-pass-2026-08-23.md) and [full-scene post](godot-full-scene-post-pass-2026-08-23.md) |
| Godot 6 | Expanded native audio to seven cues and added a listening surface. | Technically integrated; listening/device approval open | [Listening harness](godot-combat-audio-listening-harness-2026-08-23.md) |
| Godot 7 | Built transparent Power Melee A/B sources and a strict review harness. | Reviewable evidence; both packages intentionally blocked | [Art study](godot-power-melee-art-study-2026-08-23.md) and [study harness](godot-power-melee-combatant-study-harness-2026-08-23.md) |
| Godot 8 | Built an isolated layered Empire battle-stage A/B study. | Deterministic evidence; selection open | [Layered stage study](godot-empire-layered-battle-study-2026-08-23.md) |
| Godot 9 | Audited Web export and concurrent ranged-audio readiness. | Blockers recorded; not integrated | [Web preflight](godot-web-export-preflight-2026-08-23.md) and [ranged audit](godot-ranged-cue-bank-read-only-audit-2026-08-23.md) |
| Godot 10 | Built and wrapped the isolated Power Melee motion-pipeline checkpoint. | Runnable but intentionally incomplete | [Motion checkpoint](godot-power-melee-motion-pipeline-study-checkpoint-2026-08-23.md) |
| Godot 11 | Integrated ten native cue identities and reconciled current three-role art. | Technically verified; audio/art approval open | [Ranged integration](godot-ranged-audio-integration-2026-08-23.md), [disruptor pass](godot-disruptor-audio-pass-2026-08-23.md), and [shield/psionic pass](godot-shield-psionic-audio-pass-2026-08-23.md) |
| Godot 12 | Built the complete three-role party A/B review surface with pinned sources and captures. | Runnable deterministic evidence; developer selection open | [Party A/B review](godot-range-band-party-art-review-2026-08-23.md) |
| Godot 13 | Ran both party branches through one pinned resolved timeline with restrained whole-raster motion and promoted still/video evidence. | Complete isolated comparison; developer selection open | [Motion rehearsal](godot-range-band-party-motion-rehearsal-2026-08-23.md) |
| Godot 14 | Added a strict owner-staged licensed replacement bank for four melee and three ranged cues while preserving procedural fallback. | Implemented and verified; listening/device/Web approval open | [Hybrid licensed audio](godot-hybrid-licensed-combat-audio-pass-2026-08-23.md) |
| Godot 15 | Reconciled hybrid audio with repository safety and verification workflow, adding a fail-closed ignore preflight and Godot-aware project status. | Complete integration audit; listening/device/Web approval open | [Hybrid audio reconciliation](godot-hybrid-audio-reconciliation-2026-08-23.md) |
| Godot 16 | Selected Godot as the sole presentation client, retired active Canvas benchmark/build/deployment paths, and replaced transition parity gates with a forward Godot production plan. | Complete direction/workflow cutover; live bridge and Godot release pipeline open | [Production ledger](#godot-16--sole-presentation-cutover-and-canvas-workflow-retirement) |
| Art direction 1 | Synthesized five developer-provided texts into named environment families, machine-faction spatial rules, high-key horror guidance, and era separation. | Complete documentation/direction pass; asset selection open | [Production ledger](#art-direction-1--five-text-visual-source-synthesis) |
| Art direction 6 | Generated Owen's preferred long-cobalt-coat full-body concept Choice A and recorded its provenance and review limits. | Complete exploratory generation; Choice B and selection open | [Production ledger](#art-direction-6--owen-preferred-full-body-concept-choice-a) |
| Art direction 7 | Converted Owen Choice A into a contract-sized transparent ranged-idle sprite study and recorded its limits. | Complete exploratory source frame; selection and package work open | [Production ledger](#art-direction-7--owen-choice-a-ranged-idle-sprite-study) |
| Art direction 8 | Created Hazel's preferred protective-field-kit concept and transparent ranged-idle sprite study. | Complete exploratory concept/source frame; selection and package work open | [Production ledger](#art-direction-8--hazel-preferred-concept-and-ranged-idle-sprite-study) |
| Art direction 9 | Produced Hazel's exact 256 px transparent website-animation derivative and reusable sprite specification. | Complete deterministic derivative; animation and site integration open | [Production ledger](#art-direction-9--hazel-256px-website-animation-derivative) |

## Required entry format for the next pass

Each new entry must include:

1. objective and state: complete, incomplete, blocked, or rejected;
2. material files and player-visible behavior changed;
3. exact commands, exit codes, test counts, captures, or measurements;
4. skipped checks and subjective developer-review gates;
5. the next concrete continuation point.
