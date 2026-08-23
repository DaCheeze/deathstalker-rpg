# Godot Power Melee Motion Pipeline — Wrap Checkpoint — 2026-08-23

Status: **runnable engineering checkpoint; incomplete and not promoted as a
finished visual-QA or animation-package pass**.

At the developer's wrap-up request, work stopped on
`experiments/godot-combatant-motion-study/` without adding more features. The
isolated project contains the two unapproved Power Melee studies, two neutral
Empire backgrounds, a deterministic motion manifest, whole-raster and restrained
hybrid presentation code, one hybrid-deformation shader, and review overlays.

Measured checkpoint evidence:

- all three GDScripts pass `--check-only`;
- isolated import and deterministic validation exit 0;
- 1,360 timeline/pipeline/asset combinations were sampled;
- raster-anchor error is `0.00000000 px` and hybrid shader-anchor error is
  `0.00000000 uv`;
- observed maxima are bend `0.004`, squash `0.020`, ripple `0.003`, emissive
  `0.180`, and trail `1.000`;
- a fixed 60-frame contact smoke exits 0;
- a temporary two-frame Choice A/checker/contact capture was byte-identical at
  SHA-256 `41D28FCD370327754EE48CB595601B87CE269558C0FD7C24C0095B52F86CC67F`.

The temporary capture was not promoted. Choice B, the remaining timeline states,
Empire-background motion captures, strict readiness, and final visual evidence are
unfinished. This checkpoint does not supply sprite frames, select a direction,
approve motion, satisfy the raster package, or integrate anything into canonical
Godot.

No canonical/shared project files, gameplay, bridge, audio, dependencies, commits,
or pushes changed in this checkpoint.
