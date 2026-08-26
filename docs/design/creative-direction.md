# Creative Direction

## Identity

This is a full turn-based JRPG set in a decaying star empire: aristocratic Families
scheme in a rotting court, an Empress occupies the Iron Throne, rogue machine
intelligences operate on the fringe, and a small crew of salvagers becomes involved
in rebellion.

It is a JRPG, not a roguelike. Campaign progress and recommended party level should
make completion likely without making combat decisions irrelevant.

The campaign loop is the classic town–field–dungeon–boss JRPG structure. Towns
provide rest, shops, and a stable return point. Explorable areas contain discrete
enemy contacts, one-time chests, supplies, and routes that return control after
each fight. Regular encounters may be revisited for optional XP and gold. A player
who follows the recommended route should remain viable; a player who enjoys
grinding may deliberately overlevel and make a fixed-strength boss easier. Enemies
and bosses do not scale to erase that choice. Medkits support tactical recovery but
are not mandatory narrative keys or substitutes for town rest.

The full campaign follows the Hero's Journey as a player-experienced transformation,
not a rigid scene checklist. Separation, Initiation, and Return shape story
progression, expedition pressure, economy, rewards, recovery, and the changing
architecture of the world. Critical routes should be legible through the world
itself before UI guidance is required. The operational cross-system contract is
`hero-journey-campaign-architecture.md`; it does not authorize names, dialogue, plot
events, or balance values that the developer has not separately approved.

The developer selected a source-aligned Virimonde forced departure as the opening
expedition. Imperial authority condemns Owen without explaining why. Hazel, a
clone-legging smuggler and pirate, crash-lands on Virimonde and saves him on the
verge of execution; their flight off the planet begins the campaign's Separation
movement while leaving Owen's home available for a possible transformed return.
The operational beat sheet is `opening-expedition-forced-departure-v1.md`. Exact
crash timing, execution staging, rescue action, departure route and vessel,
opposition, dialogue, rewards, and visible text remain open.

## Reference points

- Simon R. Green's *Deathstalker* series supplies the prototype's story tone:
  operatic scale, decadent imperial politics, rebellion, swordplay, psychic power,
  and far-future technology.
- The *Octopath Traveler* series supplies the game-design direction: readable
  turn-based tactics, differentiated party roles, encounter-specific decisions,
  strong combat feedback, and HD-2D-inspired presentation.
- *Final Fantasy X* supplies an excursion-pacing reference: explore, fight several
  encounters, and arrive at a boss carrying prior damage and reduced supplies,
  while retaining the wider JRPG ability to return to safety, rest, shop, and grow.
- *Warhammer 40,000* supplies a secondary visual reference only: monumental scale,
  decayed grandeur, dense machinery, ritualized maintenance, and human
  insignificance. Do not reproduce its factions, armor, weapons, vehicles,
  iconography, typography, or compositions. The approved project-specific split is
  restrained gothic decay for Imperial court/elite spaces and heavier
  reliquary-industrial construction for Imperial military spaces; the party remains
  practical and human-scale, Hadenmen are golden fortress-machines, and Shub use a
  red/rust/iron-black machine palette with no blue or purple faction color, as
  defined in `visual-style-bible.md`.

These are references, not final source material to reproduce.

The operational art direction, faction shape/material rules, palette, camera,
portrait system, A/B policy, and visual QA live in `visual-style-bible.md`.
Paraphrased visual evidence, exact lawful public-sample links, and non-redistributed
locators into developer-provided local reference texts live in
`deathstalker-visual-source-index.md`; that research distinguishes source facts,
inferences, and developer overrides and does not itself approve an asset.

## Placeholder policy

During prototyping, retain recognizable *Deathstalker*-derived placeholders for:

- Mechanics and combat terminology
- Families, factions, and organizations
- Character races/types
- Technology and psychic concepts
- Related story concepts

They make the design easier for the developer to follow and evaluate. Do not rename
or abstract them piecemeal. Internal and visible prototype text may use them.

Original terminology, characters, places, plot, dialogue, lore, and visual identities
will be created together in a deliberate developer-requested narrative and rename
pass. Until then, do not invent names, places, dialogue, or plot without asking.

## Design authority and scope

`deathstalker-rpg-design.md` is the developer-authored strategic direction. Its
campaign-scale material remains discussion scaffolding unless a focused design
contract marks it developer-approved. Current code and older design documents record
prototype behavior; they do not automatically overrule newer approved direction.

The first approved proving ground is the bounded contract in
`three-character-range-band-prototype.md`. It tests only whether the visible queue,
one disruptor decision, advance to contact, and melee rhythm are fun. Vocation,
Legend, corruption, recruitment chapters, ship power, faction reputation, and other
campaign scaffolding remain outside that prototype and are not authorized for
implementation by the strategic brief alone.
