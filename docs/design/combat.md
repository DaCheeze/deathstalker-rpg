# Combat Design

## Current shipped prototype

Four party members fight up to four enemies plus field objects using a discrete
speed/tick turn queue. The projected queue is first-class state, displays roughly
the next eight turns, and supports displacement. Speed-zero objects never act; dead
combatants leave the queue immediately.

## Disruptors

Every combatant carries a devastating disruptor that deals roughly 65% of a healthy
target's maximum HP. Only force shields partly mitigate it. Cooldown advances on the
owner's turns and persists across encounters. Enemy charge state must be visible.

## Boost

Only the captain has `canBoost: true`. Entry is a free action. Boost increases damage
and speed while accruing burnout on entry and during boosted turns. Burnout decays
outside boost, chips HP past its threshold, and forces a multi-turn crash at the
crash threshold. Voluntary exit is clean. Baseline simulation must outperform
`--no-boost`.

## Force shields

Raising a shield costs an action. The shield is single use, fully blocks melee and
projectiles, partly mitigates disruptors, and does not block psionics.

## Espers and psi-blockers

The party has exactly one esper. ESP is a per-battle pool with slow regeneration and
partial recovery between encounters. Her kit separates armor-bypassing damage from
defense debuffs. Never combine damage and turn displacement; displacement belongs
to the physical striker.

A psi-blocker is a destructible speed-zero field object with no offense. While any
blocker lives, both sides lose access to esper abilities. It occupies an enemy slot
and may take splash damage, but incidental splash should account for less than about
30% of blocker deaths.

## Party roles

| Role | Identity |
|---|---|
| Captain / Striker | Burst damage and sole access to boost |
| Esper | Armor bypass and debuffs; weak blade attacks |
| Mercenary Striker | Highest speed, high critical rate, turn displacement |
| Heavy Tech Marine | Multi-target crowd control against swarms |

Each role should lead damage in at least one encounter type. Marine scatter shot
hits all living enemies at reduced damage, breaks even at two targets, and is clearly
better at three or more.

## Faction encounter languages

- Empire: balanced soldiers and House guards; fields psi-blockers.
- Shub: identical, fast, coordinated machines that punish slow play.
- Hadenmen: few heavily armored post-humans who punish wasted disruptor shots.

## Approved next prototype

The current systems above remain an accurate description of the shipped prototype,
but they are not the acceptance contract for the next combat experiment. The
developer-approved next target is
`three-character-range-band-prototype.md`: three anonymous functional loadouts, one
authored encounter, per-combatant Ranged/Closing/Engaged state, a visible conditional
queue, one ready/spent disruptor decision per combatant, and melee carrying the
middle and end of the fight.

For that bounded experiment only, force shields, Shields/Armor/Exposed, Boost,
vocations, and the esper role are excluded. A disruptor may be fired normally at
Ranged or Closing or held to interrupt an opponent advancing into Closing; it is
unusable at Engaged and has no in-fight recharge. These scoped choices intentionally
conflict with parts of the current implementation and the unlocked strategic brief.
They do not delete the wider-game systems or settle their later campaign form.

The implemented loadouts test power, critical pressure, and queue control using only
anonymous labels and existing melee abilities. Three mirrored anonymous opponents
use the same functional spread. Movement is advance-only; after an engagement target
falls, selecting another opponent costs an Advance action. If several held charges
could interrupt movement into Closing, only the first ready opponent in the projected
queue fires. The live queue shows range and ready/spent state and previews the control
strike's displacement while the choice is hovered.
