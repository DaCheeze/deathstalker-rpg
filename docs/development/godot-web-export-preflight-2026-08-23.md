# Godot Web Export Preflight — 2026-08-23

Status: **preset present; matching export templates absent; no Web artifact or
browser acceptance claimed**.

## Scope

This read-only preflight checked whether the canonical Godot client is ready for
the first Phase 3 Web export attempt. It did not download tools, alter the export
preset, produce a partial release, deploy anything, or change the Canvas client.

## Measured result

- `godot/export_presets.cfg` contains one runnable `Web` release preset.
- The preset targets `build/web/index.html`, exports all resources except
  `build/*`, uses Compatibility-friendly unthreaded Web output, and has no custom
  debug or release template override.
- Godot `4.7.2.stable.official.ed1daf0bf` opens the canonical project headlessly
  and loads the current full-scene post shader without an editor-load error.
- The required matching template directory
  `C:/Users/Daniel/AppData/Roaming/Godot/export_templates/4.7.2.stable` does not
  exist on this machine.

Because the version-matched templates are absent, an export would not establish a
valid payload, startup, frame-time, memory, cache, audio, or browser result. No Web
export command was represented as passing.

## Next gate

Install the official export templates matching the installed Godot 4.7.2 stable
editor, then run the existing `Web` preset as a local, non-default preview. Record:

- output size against the 15 MiB proposed compressed-payload gate;
- desktop startup against 4 seconds and required-mobile startup against 8 seconds;
- median and p99 frame time, memory, and 100-run final-state/event identity;
- audible trigger latency, crackle/underrun behavior, and a ten-minute stress run;
- console-clean loading in the required Chrome, Edge, Firefox, Safari, and mobile
  targets.

Those measurements remain Phase 3 evidence. They do not authorize a default-client
switch or removal of the Canvas parity client.

No dependencies, templates, source files, gameplay data, commits, or pushes changed
in this preflight.
