# Three-Character Range-Band Prototype

## Status and purpose

**Developer-approved prototype direction.** This is the smallest testable contract
for the next combat experiment. It supersedes conflicting legacy rules only within
this prototype. It does not define the final campaign combat system.

The prototype answers one question: does a fight shaped as volley, advance, then
blades remain tense when melee must carry its middle and end?

## Contract

- One authored encounter with exactly three anonymous functional party loadouts.
- The three loadouts are Power Melee (steady blade and heavy strike), Critical Melee
  (steady blade and high-critical dual strike), and Queue Control Melee (steady
  blade and lower-damage turn displacement). They have no identities, vocations,
  names, or lore.
- A visible conditional turn queue previews action-order changes before commitment.
- Each combatant owns one band state: Ranged, Closing, or Engaged.
- Advancing costs an action and follows Ranged to Closing to Engaged.
- Entering Engaged selects a specific opposing combatant as the engagement target.
- Every combatant exposes one visible disruptor state as ready or spent. After the
  rejected six-charge opening, only the fastest loadout on each side starts ready;
  the other four charges start spent.
- A disruptor may be fired normally while Ranged or Closing.
- Holding a ready charge enables an interrupt against an opponent advancing from
  Ranged into Closing. The first ready opponent in projected queue order fires; only
  that interrupt resolves, and it spends the charge before movement completes.
- A disruptor is unusable while Engaged and never recharges during this encounter.
- Melee provides the decisions and damage that carry the middle and end of the fight.
- Movement is advance-only. If an engagement target falls, selecting a new living
  opponent costs an Advance action and the combatant remains Engaged.

## Explicit exclusions

Do not add force shields, Shields/Armor/Exposed, Boost, an esper, vocations, party
swapping, multi-encounter persistence, between-encounter recharge, recruitment
chapters, Legend, corruption, ship power, faction reputation, campaign progression,
or new numerical balance targets to this prototype.

These are scope exclusions, not decisions to remove those systems from the full
game. The current implementation may retain them until a bounded implementation
task replaces or bypasses them for this experiment.

## State distinctions

| Topic | State |
|---|---|
| Four-character combat, owner-turn disruptor cooldowns, force shields, sole-captain Boost, exactly one esper, and multi-encounter persistence | **Current prototype** and legacy wider-game rules |
| Volley-to-blades rhythm, three range bands, one disruptor charge, and campaign scaffolding described in `deathstalker-rpg-design.md` | **Developer-authored strategic direction**; only items repeated in this contract are approved for this prototype |
| Three anonymous functional loadouts; per-combatant bands; targeted engagement; Ranged/Closing fire; held-charge interrupt on advance into Closing; no Engaged disruptor; one encounter; and exclusion of defense, Boost, esper, vocations, persistence, and numeric tuning | **Developer-approved for this prototype** |
| Three mirrored anonymous opponents; current legacy stat values reused as initial test inputs; projected queue order resolves one interrupt; advance-only movement; hover preview for queue displacement | **Developer-approved implementation choices** |
| Final encounter-length, damage, and balance thresholds | **Approval gaps after playtesting** |

## Acceptance evidence

Implementation is not complete until all of the following are observable and tested:

1. Deterministic core state represents band, engagement target, and disruptor
   readiness for every combatant without browser dependencies or hidden mutation.
2. Tests cover legal and illegal advances, target selection on engagement, normal
   disruptor use, the held-charge interrupt, charge spending, and the Engaged ban.
3. Godot shows the affected queue, band, engagement, and disruptor state and the
   affected scene is exercised with clean runtime output.
4. An encounter can proceed after every disruptor is spent, and melee choices carry
   its middle and end without relying on excluded systems.
5. Build, current lint, tests, and the full two-seed balance check are run and
   reported. The balance check is regression evidence only; its legacy targets are
   not acceptance gates for this prototype.

## Implemented neutral choices

- The opposing side mirrors the three functional roles as Opponent A, B, and C.
- The first ready opponent in the currently projected queue resolves the held
  interrupt; later eligible opponents retain their charges.
- Retreat is absent. Only Ranged to Closing to Engaged advancement is implemented.
- The canonical Godot range-band fixture presents this encounter. Legacy
  encounter/run data remains available to simulations and wider-game systems; the
  former browser route is frozen historical source.
- After the first developer play review, the prototype disruptor multiplier was
  reduced from the legacy 3.2 input to a prototype-only 1.6. Its single charge is
  still consequential, but it no longer removes most of a healthy target's HP.
- After the second rejected play review, opening readiness was reduced from all six
  combatants to the fastest loadout on each side. This retains a visible held-shot
  decision while capping the opening at one possible interrupt per side.
- The player-facing command surface is contextual: before engagement it shows only
  Advance/Engage, an available Disruptor charge, and Wait; once engaged it shows
  Strike and Wait. Unavailable actions are hidden rather than shown disabled.

## First play-review failure

The first two developer play reviews rejected the six-charge encounter feel. Even
at the reduced 1.6 multiplier, automatic interrupts made advancement feel like
unavoidable punishment before the party could access its core melee decisions. The
one-charge-per-side recovery described above is implemented but not yet accepted by
developer play review. The anonymous kit and prototype exclusions also make this
route a poor replacement for the full combat showcase. Keep it isolated at
`?mode=range-band`; do not make it the default demo again without a new developer
review.

No implementation from the prior cloud ChatGPT conversation has been recovered in
this repository. The current implementation was produced locally from this contract.
