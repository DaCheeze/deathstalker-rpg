# Repository Commit-Preparation Checkpoint — 2026-08-23

Status: **media storage and coherent local commit sequence complete; main-repository
push remains developer-controlled**.

## Objective

Prepare the accumulated local combat, Godot, audio, art, and documentation work for
coherent commits without including generated caches, owner-only licensed audio, or
an unsustainable binary archive in the GitHub Pages source repository.

## Safe work completed

The root `.gitignore` now excludes every nested `.godot/` cache, generated
`*.gd.uid`/`*.gdshader.uid` sidecar, TypeScript `*.tsbuildinfo` artifact, and
unreferenced one-frame Godot Movie Maker WAV stub. This reduced the visible
working-tree entries from 524 to 493 and untracked entries from 490 to 458. No file
was deleted or moved. The owner-staged licensed audio root remains ignored by its
more specific `godot/.gitignore` rule, and zero licensed WAVs are tracked.

No A/B art choice was selected, rejected, integrated, renamed, or removed. The
generated-asset register explicitly preserves superseded material as provenance,
so duplicate deletion is not authorized as ordinary cleanup.

## Measured media audit

- 294 untracked media files occupy 501.10 MiB.
- The machine-readable current candidate catalog references 112 existing media
  files occupying 216.59 MiB; all 115 catalog paths exist.
- Twenty-seven exact-hash duplicate groups account for 72.67 MiB of repeated
  bytes. These include deliberate harness copies, source/review aliases, and
  historical proposal aliases.
- No untracked file exceeds 50 MiB or GitHub's 100 MiB hard per-file limit.
- The current local Git object store reports 429.34 MiB of loose objects plus 8.22
  MiB of garbage from prior operations; no media file is currently tracked.

The largest exact duplicate family is the 3.92 MiB Imperial skirmish Choice A
plate, present four times across current choice, historical runtime preview, and
two isolated harnesses. The audit did not remove these because harness isolation
and provenance policy need an explicit storage decision first.

## Storage decision

GitHub recommends repositories remain ideally below 1 GiB, and GitHub Pages source
repositories also have a recommended 1 GiB limit. Adding roughly 501 MiB of binary
media to ordinary Git now would consume most of that practical envelope before
future art iteration. Git LFS 3.7.1 is installed and GitHub Free currently includes
10 GiB of LFS storage and monthly bandwidth, but GitHub documents that Git LFS
cannot be used with GitHub Pages sites.

Recommended architecture:

1. Keep the game/Pages repository focused on code, content, manifests, compact
   review evidence, and only developer-approved runtime assets.
2. Store the complete exploratory/provenance art library in a separate art-source
   repository using Git LFS, or another developer-approved binary archive.
3. Keep stable asset IDs, hashes, approval state, and provenance metadata in this
   repository; copy only selected, production-normalized runtime derivatives back
   after approval.
4. Replace isolated harness copies with shared repository paths only where doing so
   does not weaken a harness's explicit portability or hash-pinned evidence.

The fallback is ordinary Git for the full library. It is technically below the
hard limits today, but it is not recommended because binary revisions permanently
grow history and the current repository is still in active art development.

## Proposed commit sequence after the storage decision

1. `chore: harden repository artifact hygiene`
   - root ignore rules and commit-preparation record;
2. `feat: restore combat presentation and add range-band prototype`
   - authoritative TypeScript/data/browser work and its focused tests;
3. `feat: add Godot presentation bridge and hybrid combat audio`
   - bridge, canonical Godot project, audio manifests/tools, and listening harness;
4. `docs: record production passes and transition state`
   - design contracts, project state, pass reports, and ledgers;
5. art-source commit in the approved storage location;
6. optional main-repository art commit containing only explicitly retained compact
   review evidence or approved runtime derivatives.

Package and cross-cutting documentation changes must be staged with the first
commit that requires them and checked for a buildable intermediate state.

## Approved archive result

The developer approved the recommended private art-source repository. The complete
265-file `art/` tree was copied to `F:\deathstalker-rpg-art`, verified with zero
SHA-256 mismatches, committed as `e1a26c43de68effd1ffe3f3f408a56e578558824`,
and pushed to private repository
<https://github.com/DaCheeze/deathstalker-rpg-art>. Git LFS uploaded 236 unique
objects (430 MiB after content deduplication); 259 repository paths are LFS-managed.
Remote `main` exactly matches the local commit and `git lfs fsck` passes.

The game repository now ignores exploratory media below `art/` while retaining the
files locally, plus the register, catalog, slice-plan JSON, and a restoration
README. No art was deleted, selected, or integrated.

## Main-repository commit result

Four coherent local commits now preserve the accumulated work without
mixing the complete exploratory art archive into the Pages repository:

1. `f862af61681fb9402eee8050fb139b451eebfe72` —
   `feat: restore combat presentation and add range-band prototype`;
2. `59b7104b606d4f0712e245d191f34e89e4e2f118` —
   `chore: separate exploratory art from game history`; and
3. `6f11675659a6042db8d9d6c77c21b5e746533138` —
   `feat: add Godot presentation bridge and hybrid audio`; and
4. `docs: record Godot transition and production handoff` — the design contracts,
   project state, production ledger, pass evidence, and compact review captures.

The third commit contains the canonical Godot presentation client, strict bridge,
generated legacy and range-band fixtures, hybrid audio pipeline, verification
tools, and isolated comparison harnesses. Its 118 files total approximately 22.12
MiB. The main branch has not been pushed; the developer retains the push decision.

The Windows sandbox initially prevented creation of `.git/index.lock`. The durable
root cause was a 22-byte NUL-corrupted
`C:\Users\Daniel\.codex\.sandbox\deny_read_acl_state.json`, which made sandbox
setup fail while parsing its ACL state. The corrupt file was preserved as
`deny_read_acl_state.corrupt-2026-08-23.json.bak`; Codex regenerated a valid
`{"principals": {}}` state file, and sandbox setup now completes without errors.
Ordinary commands and read-only Git checks run normally. Git metadata writes still
require approval because this task's managed workspace profile intentionally marks
`.git` read-only; that approval boundary is policy, not ACL corruption. The native
Windows sandbox is now configured in the recommended `elevated` mode.

## Verification and open gate

- staged and unstaged `git diff --check` exit 0;
- ignored-cache probes report zero visible `.godot`, `.gd.uid`, and
  `.gdshader.uid`, `tsconfig.tsbuildinfo`, and one-frame capture-WAV entries;
- owner-staged licensed audio remains ignored and untracked; and
- `npm run verify:gameplay` passed build, lint at 0 warnings/0 errors, and 134/134
  tests in 29 files; its two-seed balance gate reported the known baseline failure
  of 14 out-of-band metrics while both recommended-level seeds completed at 100%;
- legacy and range-band fixtures regenerated to 25 and 34 snapshots respectively,
  and the raster-package validator passed all 21 deterministic self-tests;
- all 38 staged GDScripts passed `--check-only`;
- all seven canonical bridge/compositor/audio validators passed, including the
  strict owner-staged licensed bank at seven cues, 26 assets, and 13 deterministic
  layers;
- canonical legacy and range-band licensed-mode replays completed 25/25 and 34/34
  contact-gated snapshots with no combat logic in Godot; and
- the listening harness, audio spike, layered-stage study, visual A/B harness,
  HD-2D spike, combatant studies, and party review all completed their documented
  headless checks. Their intentional art/package approval blockers remain open.

Godot emitted local `user://logs` and Windows certificate-store warnings during
headless runs, but every required command exited 0 with its expected PASS result.
Verification used installed Node 24.19.0 rather than the required Node 20 LTS, so
Node-version parity remains an environment caveat. Subjective device listening,
Web audio, and visual approval remain developer gates.

References:

- <https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github>
- <https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits>
- <https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage>
- <https://docs.github.com/en/billing/concepts/product-billing/git-lfs>
