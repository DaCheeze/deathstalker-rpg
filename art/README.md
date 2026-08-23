# Local Art Review Library

The binary files below `art/` are an optional owner-local review library. They are
not runtime assets, approved selections, or required for the browser/Canvas or
canonical Godot client.

The complete exploratory and proposed library is archived with Git LFS in the
private repository:

<https://github.com/DaCheeze/deathstalker-rpg-art>

The game repository retains the generated-asset register, candidate catalog,
slice-plan JSON, approval state, and production documentation as ordinary text.
PNG/JPEG/WebP/MP4 files under `art/` are ignored so active image iteration does not
inflate the GitHub Pages source history. Existing local binaries are intentionally
left in place.

## Restore the private library

From the game repository's parent directory:

```powershell
gh repo clone DaCheeze/deathstalker-rpg-art deathstalker-rpg-art
Copy-Item -Path '.\deathstalker-rpg-art\art\*' -Destination '.\RPG v1\art' -Recurse
```

Run a review harness only after restoring the exact cataloged files it requires.
Harnesses and catalog tools should fail loudly when an optional source is absent.

When the developer approves a production asset, create its normalized derivative,
manifest, anchors, animation metadata, and import settings under the appropriate
runtime asset path (for example `godot/assets/`). Do not force-add an exploratory
`art/` file as a substitute for that promotion process.
