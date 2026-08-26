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

## Historical bounded range-band prototype and current live direction

`three-character-range-band-prototype.md` records a completed bounded experiment and
its explicit deterministic fixture. It is no longer the active live-game direction.
The developer rejected spending multiple turns advancing before attacks become
available because the game is a menu-driven JRPG, not a tactical RPG.

The authoritative live TypeScript session starts the three anonymous loadouts and
three opponents directly Engaged in mirrored pairs. Melee is available immediately;
`Advance` is absent from legal player and AI actions; and replacement targeting after
a defeat does not consume a movement turn. The retained range-band fixture may still
exercise its former progression explicitly as historical architecture evidence.

For that bounded experiment only, force shields, Shields/Armor/Exposed, Boost,
vocations, and the esper role are excluded. A disruptor may be fired normally at
Ranged or Closing or held to interrupt an opponent advancing into Closing; it is
unusable at Engaged and has no in-fight recharge. These scoped choices intentionally
conflict with parts of the current implementation and the unlocked strategic brief.
They do not delete the wider-game systems or settle their later campaign form.

The implemented loadouts still test power, critical pressure, and queue control using
anonymous labels and existing melee abilities. The old fixture retains advance and
held-interrupt evidence; those mechanics are not exposed by the live session.
