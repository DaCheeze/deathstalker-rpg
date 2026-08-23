# Production Pass Ledger

Updated: 2026-08-23

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

### Art direction 5 — Owen preferred full-body concept Choice A

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
| Art direction 5 | Generated Owen's preferred long-cobalt-coat full-body concept Choice A and recorded its provenance and review limits. | Complete exploratory generation; Choice B and selection open | [Production ledger](#art-direction-5--owen-preferred-full-body-concept-choice-a) |

## Required entry format for the next pass

Each new entry must include:

1. objective and state: complete, incomplete, blocked, or rejected;
2. material files and player-visible behavior changed;
3. exact commands, exit codes, test counts, captures, or measurements;
4. skipped checks and subjective developer-review gates;
5. the next concrete continuation point.
