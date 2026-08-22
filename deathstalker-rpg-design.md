# Deathstalker RPG — Design Brief

**Status:** Early concept / discussion document
**Purpose:** Hand-off brief for further design iteration. Nothing here is locked.

---

## 1. Elevator Pitch

A party-based JRPG set in Simon R. Green's *Deathstalker* universe. Turn-based tactical combat with the books' shape: one opening volley, then swordwork — energy weapons take minutes to recharge, so blades never went away and blades are where fights are decided. Free-order recruitment of a found-family crew, each with their own multi-chapter story. A reputation system where becoming a legend is the trap, not the reward.

**Genre touchstones:** Octopath Traveler (structure, path actions, job flexibility), Final Fantasy X (visible turn queue, party swapping), Dragon Quest (vocation system, status-effects-matter combat), Mass Effect (crew dynamics, shipboard hub).

---

## 2. Core Design Pillars

1. **Freedom of progression** — the player decides who to recruit, in what order, and what they become.
2. **The crew is the point** — found family over chosen one. Every system should reinforce that the group is worth more than any individual.
3. **Success is costly** — Legend, the Madness Maze, and faction standing all get worse as they get bigger.
4. **The setting's constraints are the mechanics** — don't invent systems where Green already provided one.

---

## 3. Combat

### 3.1 Blades First, One Shot Each

In Green's universe, energy weapons take minutes to cycle between shots, which is why a far-future galactic empire still fights with swords. The game keeps the same proportions the books do: **the disruptor is a tool, not the show.**

- **Melee is the fight.** Swordwork is the default state of combat, where most damage is dealt, most abilities live, and every fight is decided. The combat depth is in the bands (§3.2), the shield/armor layers (§3.4), suppression, and the Boost — not in the gun.
- Every character carries **one disruptor charge** — it hits hard, it can delete a mook or strip a boss layer, and then it's gone for a long while. A visible recharge runs as pips in the turn queue.
- The charge poses one honest question at the top of a fight — *spend it now or hold it* — and then gets out of the way. It should never be the thing the player is thinking about by round three.
- Enemies follow the same rule: one shot each, then steel. A fight's opening volley is a mutual event, not a player resource.
- **Sustained ranged combat exists — it just isn't the disruptor.** Archaic projectile weapons fire every turn on an ammunition economy (§5.3), which is how a Gunner primary fights at range past the volley. The disruptor is everyone's one big moment; kinetic fire is a build.

This keeps guns from making melee characters incoherent — the standard sci-fi RPG failure — without turning the sidearm into the centerpiece.

### 3.2 Range Bands — Volley, Charge, Blades

Green's fights have a specific shape: everyone fires in the opening seconds, then it's swords. The bands measure **distance to contact**, not cover positions — the fight's structure is the book's structure.

Three bands: **Ranged → Closing → Engaged**. Movement between bands costs an action.

- **Ranged** is the volley phase and the disruptor moment. Cover exists here, matters here, and *only* here — it is Ranged-phase furniture, destructible and fast-depleting, a timer that forces the charge rather than a place to live. Nobody builds a strategy around a crate.
- **Closing** is the dangerous ground: characters crossing it are exposed to anyone still holding a disruptor charge. This is where holding your shot pays off — the enemy who kept their charge gets a free crack at whoever's advancing.
- **Engaged** is the melee scrum, and it is where most of the fight happens — matching the fiction and the fact that melee is the default combat state (§3.1). Firing a disruptor while Engaged is possible but ugly: point-blank can't miss, and might clip your own crew.

The bands give the opening volley its one honest question — fire during the approach while targets duck, hold the charge to punish *their* approach, or carry it into the scrum for a shot that can't miss but isn't safe — and then the fight belongs to the blades.

- **Weapon classes are band-defined.** Long weapons rule Ranged and Closing; blades rule Engaged. Same job as Octopath's weakness types, done geographically. The Deathstalker vocation's "wins the middle of the room" literally means owning the Engaged band.
- **Suppression** is aimed at **preventing the charge**: a suppressed enemy cannot advance a band. Pin one group at Ranged while the crew collapses the other — more interesting than pinning them behind boxes.
- **Enemies characterise themselves through the bands.** Mooks cower at Ranged. Church zealots charge without cover, because faith. Hadenmen advance in eerie unbroken lines. Frost doesn't duck either — the first time the player watches her stroll through their volley, they learn what an Investigator is.

**Not caring about cover is something you earn.** Pre-Maze, the crew ducks like anyone else — mortal people duck. Post-Maze, corruption buys the book's actual imagery: the transformed advance through the volley ignoring overwatch, suppression, and cover entirely (see §4.4). Ruby still ducks. Ruby will always duck.

### 3.3 Turn Queue

Adopt FFX's Conditional Turn-Based visible queue. Justified diegetically as a tactical HUD overlay, which fits sci-fi better than it ever fit fantasy.

- Player choices reshape the queue in real time and the player can preview the change before committing.
- Speed manipulation and haste/slow effects become legible and central.
- Recharge pips display in the same queue, so the disruptor economy is readable at a glance.

### 3.4 Shields / Armor / Exposed

The sci-fi grammar for a break-or-stagger system:

- **Energy weapons strip shields.** **Kinetic weapons chew armor.** Using the wrong tool is near-useless. The two ranged families (§5.3) map straight onto this: the disruptor is the shield-breaker everyone carries once; projectile fire is the armor-grinder a ranged build sustains.
- Strip both layers and the target is **Exposed** — the damage-multiplier window, equivalent to Octopath's Break.

### 3.5 Free Party Swapping

Following FFX: benched crew can be tagged in during a turn and inherit it. No dead weight on the bench, and it lets each character function as a hard counter to a specific enemy class. (Experience is shared roster-wide — see §4.5 — so swapping is a tactical choice, never an XP-farming chore.)

### 3.6 Encounter Design

Short filler fights have no decisions in them — so the encounter structure exists to keep every fight meaningful, and to make small fights matter through attrition rather than tactics.

**Persistent charge.** Disruptor charge state **carries between encounters**, recovering over exploration time and at rest points. In-fight recharge stays slow (canon: minutes — a short fight ends before you cycle). A small fight's one real decision is a Dragon Quest decision: spend the charge to end it fast and clean, or save it for whatever's deeper in and grind through on blades, taking chip damage. The disruptor is MP — a dungeon-level attrition resource, checked at the door and mostly ignored after. Small encounters don't need individual tactical depth; they are withdrawals against a shared account of charge, HP, and supplies.

**No invisible random battles.** Enemies are visible in the world, DQXI-style — avoidable, ambushable, engageable. Player agency over encounter rate comes free.

**Templates, not generation.** Even incidental fights are hand-built compositions (a volley line plus chargers; a suppression pair guarding a scavenge point) placed from regional pools. Every fight has an authored shape, just not a bespoke script.

**Set pieces are fully authored** — bosses, act climaxes, Frost and Silence — each designed around a specific tactical question.

**Interceptions are systemic, not random.** Bounty hunters, Imperial patrols, Church zealot sweeps trigger on the travel layer, driven by Legend and faction heat. They are not random encounters; they are *consequences* — the reputation systems given physical presence in the world. This also means the grind valve pays out in the double-edged currency: interceptions are the one repeatable fight source, so a player who farms them is farming fame. **Grinding makes you famous** — the Dragon Quest loop exists, and it feeds the trap.

---

## 4. Party & Progression

### 4.1 Fixed Identity, Open Capability

The tension: "build the perfect party" wants interchangeable stat blocks, but a licensed cast needs to stay itself. Resolution — split each character in two:

**Immutable:**
- Their Path Action (see §6)
- Their narrative role
- One signature ability that is theirs alone and cannot be reassigned or replicated

**Open:**
- Vocation / class
- Weapon class
- Entire skill tree
- Stat routing

So Ruby always has Intimidate and always has her bounty-hunter capstone — but whether she is the sniper, the close-range shredder, or the face is the player's call.

### 4.2 Vocation System — Three Layers

Dragon Quest III's vocation system assumes blank-slate characters; this cast already *is* someone. So the model is **Octopath's secondary-job structure with DQIII's ability persistence** — three layers, and the layering is what makes it work.

**Layer 1 — Primary vocation. Fixed, never changes.**

Each character ships with one, chosen to fit who they are in the books. It defines baseline weapon access, stat curve shape, and their Path Action. It is not on the table.

| Character | Primary |
|---|---|
| Owen | **Deathstalker** (see §4.3) |
| Giles | **Deathstalker** |
| Hazel | Gunner |
| Jack Random | Face |
| Ruby | Pilot |
| Moon | Engineer |

**Layer 2 — Secondary vocation. Free, swappable at any time.**

Where the build freedom lives. Vocations are unlocked by finding them in the world — a training cache on a derelict, a defector who teaches you. Once unlocked, **any vocation can slot as a secondary on any character**, instantly, at no cost, as often as the player likes. A secondary grants that vocation's weapon access, its skill tree (advanced with Vocation Points — see §4.5), and a stat modifier.

| Vocation | Combat Role | Non-Combat Capability |
|---|---|---|
| Pilot | Mobility, evasion | Smuggling, checkpoint runs |
| Gunner | Ranged burst | Threat assessment |
| Engineer | Turrets, field control | Hacking, repair |
| Medic | Sustain | Treating NPCs |
| Face | Buffs, debuffs | Negotiation, con |
| Marine | Frontline, suppression | Intimidation |
| Scientist | Elemental / exotic | Analysis, hidden info |

So Hazel-as-Gunner/Medic is a self-sustaining ranged threat; Hazel-as-Gunner/Marine is a brawler who happens to shoot well. She is always a Gunner underneath, and always Hazel, but what she does in a fight is the player's call.

**Layer 3 — Mastery. Permanent, cross-vocation.**

Level a secondary far enough and its capstone abilities are **permanently learned by that character**, retained after the secondary is swapped out. This is DQIII's "grind a Mage, flip to Warrior, keep the spells" — without the level reset, which existed for a replaceable roster and would be miserable with six story-critical characters. Mastery does the same job (slow, meaningful, permanent investment) without benching anyone.

**The result:** the player cannot build the *wrong* party, because anyone can cover any role — and cannot build the *same* party, because primaries and signature abilities never overlap.

### 4.3 The Deathstalker Vocation

Owen and Giles only. Not unlockable, purchasable, or teachable — it is a bloodline, and that is the point. Nobody else can ever slot it.

**Deliberately narrow, not superior.** Elite melee — dominant once Engaged, unremarkable at Ranged, no ranged specialisation. A Marine primary is more flexible; a Gunner does more damage from safety. The Deathstalker wins the middle of the room, and that is all it does. If it were simply the best class, the game would quietly rebuild the chosen-one power fantasy that §14 exists to invert.

**The Boost** — the Clan's secret technique, and canon: a bred-and-trained chemical override of the body's limits, paid for afterward. Built as a spend-now-pay-later resource, not a cooldown:

- Activating Boost grants a large multi-turn window — extra actions in the queue, sharply raised damage, accelerated disruptor recharge
- When it ends, the character **crashes**: several turns severely reduced, some unable to act — and the crash is **visible in the turn queue from the moment of activation**, so the player commits to the cost before knowing what the fight looks like on the other side
- Boosting again before recovery is possible and genuinely dangerous — permanent stat damage or a real chance of dropping

The Boost is the Legend system compressed into one button: unmistakably powerful, unmistakably yours, unmistakably a bad idea to lean on. **Giles Boosts freely and casually** — nine hundred years of practice and no compunction about the cost. Watching him do easily what nearly kills Owen is characterisation delivered entirely through mechanics, and it is part of the telegraph for his turn.

### 4.4 The Madness Maze

In the novels, the Maze turns the protagonists into effective demigods — great fiction, unplayable power curve. The restructure:

**Timing and framing.** The Maze is the game's **midpoint** (see §13) and it **changes the rule set, not the numbers**. Only some of the crew go through it. The unenhanced remain necessary because the Maze-touched cannot do the human work — negotiate, blend in, be trusted.

**The Maze is an overlay, not a vocation slot.** The obvious design — a third slot next to Primary and Secondary — turns transcendence into more stats in a menu and splits the roster into haves and have-nots. Instead: one shared list of Maze capabilities, where **each expresses differently through the character's primary vocation.** The Maze doesn't grant new powers so much as remove the limits on what you already are.

Example — a single ability, *Unmake*:

| Primary | Expression |
|---|---|
| Marine | Ignore an enemy's armor layer entirely for a turn |
| Gunner | Fire the disruptor with no recharge cost |
| Engineer | Disassemble a piece of cover, a machine, a Fury |
| Face | Unmake a decision — an NPC's refusal reverts, once |
| Deathstalker | Boost with no crash |

Same ability, five different builds. Vocation choices still matter after the midpoint, and players who committed to a build are rewarded for it.

**Corruption taxes the vocation system itself.** Every Maze ability is fuelled by a corruption gauge that damages the character to use — Green's transformed characters are visibly coming apart. As the gauge rises, the character **loses access to secondary swapping**:

- **Low:** swap freely, as before
- **Mid:** swaps cost time and can only happen at the ship
- **High:** the secondary slot **locks to whatever is in it**
- **Critical:** the slot empties and stays empty

The logic is exact: you are becoming too singular to pretend to be other things. A person can learn to be a medic; whatever Owen is turning into cannot. High corruption also costs dialogue options, crew affinity, and recognition by people who knew you.

**This is the answer to "why keep the unenhanced crew."** A heavily transformed Hazel hits like nothing else in the game and is locked into one shape. Ruby, untouched, can be reconfigured for any encounter on demand. The crew's value is *flexibility* — a mechanical statement of the thesis rather than a narrative assertion of it.

**Walking through the volley.** Post-Maze, the transformed can advance through the Ranged and Closing bands ignoring overwatch fire, suppression, and cover penalties entirely — the book's signature imagery (Owen and Hazel strolling through massed disruptor fire), mechanized. Three jobs at once:

1. **The fiction, without a cutscene.** The mid-game moment when Owen simply stops ducking — crossing a fire lane that would have shredded him in Act 1 — communicates the transformation through play.
2. **It feeds the flexibility-vs-transcendence split.** The untouched crew still uses cover, still ducks, always will.
3. **It's watched.** NPCs and enemies visibly react to someone walking calmly through disruptor fire — it is terrifying, and it pumps Legend.

The cost: at moderate corruption, ignoring the volley is a choice that burns gauge. At high corruption it is simply *true*, whether the player wants it or not — Owen can no longer remember to be afraid. Which is its own kind of unsettling, and exactly the point.

**Mastery still accrues** — and survives the lock. Maze-touched characters should race to bank capstones before the window closes. That mid-game pressure (watching corruption climb, banking capabilities against the deadline) is generated entirely by systems already in this document.

**Boost meets the Maze.** The Boost is the *human* way of exceeding human limits — trained, costly, honest. Post-Maze it becomes redundant, then hazardous: Boosting while corrupted sharply accelerates corruption. Owen has to give up the family technique to use the new thing. Giles never makes that choice, and would tell you it isn't one.

### 4.5 Levels & Experience

Two tracks per character, feeding the two halves of §4.2, plus one rule that makes free-order chapters work.

**Track 1 — Character Level (~1–30).** Raises base stats (HP, speed, initiative, melee) along the primary vocation's curve. Levels are **chunky and few**, Dragon Quest–style: each one is a visible, felt step, and some grant primary-vocation abilities (Deathstalker levels are where the Boost deepens). XP comes from encounters, chapter completion, and discovery.

**Track 2 — Vocation Points.** Earned alongside XP, spent in the **currently equipped secondary's** skill tree. Tree progress is banked **per character, per vocation** — swap the secondary out and back, and you resume where you left off, so experimentation is never punished. Capstones are Mastery (§4.2, Layer 3): permanent, kept forever, surviving even the corruption lock.

**Shared XP, whole roster, always.** Everyone levels at the same rate whether deployed, benched, or off at the ship. With six story-critical characters and free-order chapters, per-character XP would guarantee someone arrives underleveled at their own Chapter 3; shared XP is what makes "any order" actually true. Party choice becomes purely tactical and narrative — never grind maintenance. (Vocation Points are also earned roster-wide, but *spending* them is per character.)

**The economy is mostly deterministic.** Because encounters are finite and authored (§3.6), total available XP through any act is a known quantity — so the level curve is predictable and every set piece can be tuned against a narrow, known band. Recruitment chapters keep Octopath-style *recommended* ranges rather than hard gates, and there is **no level scaling** — a DQ/Octopath commitment: the world's dangers are what they are.

**The grind valve is interceptions.** The one repeatable XP source is the fight type driven by Legend and heat (§3.6). Overleveling is always available, and it always costs fame. The player who out-levels a wall has, by definition, become more hunted.

**Giles arrives at the cap** — high level, trees mastered, nothing left to invest. That's the telegraph in progression form: everyone else in the crew is *growing*, and he is finished. A character with no room to grow has nowhere to go but the way he goes.

**The Maze doesn't touch levels.** Corruption is an overlay (§4.4), not a track — it changes what levels *mean*, never the numbers themselves. A transformed character still levels, still banks Vocation Points, and races the lock to spend them.

---

## 5. Equipment & Loot

### 5.1 Design Principle

**Gear should modify the combat systems, not inflate them.** A blade that adds +12 damage is a number. A blade that lets its wielder advance a band as part of an attack, or that strips shields like an energy weapon, changes how the encounter is played. Prioritise the second kind, and keep flat stat sticks rare and honest.

Every meaningful item should touch one of four levers:
- The **range bands** (which bands a weapon is good in, movement cost, volley-phase cover interaction)
- The **shield/armor layers** (what it strips, what it protects)
- The **melee kit** (reach, riposte, suppression, Boost interaction)
- The **non-combat layer** (Path Actions, faction standing, Legend)

The disruptor takes mods too, but it is one slot among five — not the equipment game's center of gravity.

### 5.2 Slots

| Slot | Function |
|---|---|
| **Melee** | The default combat state. Band affinity, swing speed, armor/shield interaction. |
| **Ranged** | What the character carries besides the blade. Defaults to the disruptor sidearm; ranged builds swap in projectile weapons for sustained fire (see §5.3). |
| **Armor** | Split between shield capacity and armor plating — mirrors the combat layer directly. |
| **Implant** | Augments. The high-power, high-cost slot (see §5.5). |
| **Personal** | Trinkets, keepsakes, contraband. Small effects, large character texture. |

Keep the count low. Five slots across six characters is already thirty decisions per loadout pass; more than that becomes spreadsheet management rather than build-crafting.

### 5.3 Ranged Families & Weapon Mods

**Ranged combat is not just the volley.** The books hand us a second family: projectile weapons are archaic, banned technology in the Empire — which makes them contraband, and makes them a build.

| Family | Profile |
|---|---|
| **Disruptors** | Energy. One devastating charge, minutes to cycle (§3.1). Strips **shields**. Everyone carries one; nobody builds around one. |
| **Projectile weapons** | Kinetic. **Fire every turn** at Ranged and Closing — real sustained damage, not a sidearm. Chews **armor**. Runs on ammunition, which is finite, heavy, and bought — a true attrition resource in the §3.6 account. And it is *banned tech*: carrying openly raises Imperial heat, ties into the contraband economy, and marks the bearer as an outlaw before a word is spoken. |

This is what makes a ranged *build* possible without re-inflating the disruptor: a Gunner primary like Hazel fights at range all fight long on kinetic sustained fire, holds her disruptor charge for shield-stripping at the right moment, and manages ammo the way a melee character manages position. The energy/kinetic split (§3.4) stops being trivia and becomes her rotation. (It's also canon flavor — Hazel favors exactly this kind of archaic hardware, bandolier and all.)

Exotic ranged hardware — Hadenman energy weapons, esper-touched pieces that act on their own — arrives through provenance (§5.6) rather than as a third family.

**Projectile mods** (the sustained-fire lever set):

- **Rifled long-barrel** — full damage at Ranged, weak once Closing. The marksman pattern.
- **Drum feed** — larger magazine between reloads; reloading costs a turn, so the tradeoff is when, not whether.
- **Hollowpoint press** — brutal against armor, near-useless against shields. Doubles down on the kinetic role.
- **Suppressing action** — fire can pin instead of damage: the ranged route into the suppression game (§3.2).

Melee mods — and since blades are where fights are decided (§3.1), **blades get the depth**:

- **Monofilament edge** — ignores a portion of armor; brittle, degrades with use and needs shipboard upkeep.
- **Duellist's balance** — enables a riposte against melee attackers; slightly lower base damage. The Frost-fight mod.
- **Boarding hook** — advancing a band can be part of an attack. Closes the volley phase faster for the charger.
- **Shrieker cell** — the swing suppresses on hit; reduced damage. Crowd control in steel.
- **Heavy pattern** — more damage, acts later in the queue. The classic axe tradeoff, legible in the timeline.

The disruptor takes a **single mod slot**, kept simple — a handful of options in the spirit of: **Split cell** (two charges at half damage), **Overcharge coil** (more damage, much longer recharge), **Scatter aperture** (hits a whole band at reduced damage). Enough to flavour the opening volley; not enough to make the sidearm a build.

Because recharge and queue position display as pips in the turn order, every mod here is legible mid-fight without a menu dive.

### 5.4 Sources

Loot should come from places that reinforce what the game is about.

**Exploration finds** — hand-placed, not randomised. Derelicts, sealed Clan armories, crashed ships, esper safehouses. Anything the player physically walks to should be a known quantity, so exploration is rewarded rather than gambled on.

**Enemy drops** — randomised, weighted by enemy type. Investigators drop Imperial-issue gear. Hadenmen drop implants. Syndicate enforcers drop contraband and modded weapons. The drop table teaches you what an enemy *is*.

**Faction quartermasters** — gated by standing, not by credits. This is the payoff loop for the Path Action / reputation system in §7: the best Hadenman implants are only sold to someone the Hadenmen tolerate, and tolerance is earned by choices the player may not want to make.

**Scavenging** — the Engineer's Path Action applied to wreckage and dead systems. Gives a non-combat character a reason to be on the away team.

**Maze artifacts** — post-midpoint only, rare, and always costly. See §5.6.

### 5.5 Implants — Power With A Price

The Hadenman slot, and the place where the game's themes live inside the loot table.

Implants are **the strongest gear in the game and they are not free**. Each one carries a cost paid in something other than credits:

- Crew affinity drops when a character installs one, and specific crew react specifically — Moon approves, Hazel does not
- Some raise Legend involuntarily (visible augments make you recognisable)
- Some occupy the Maze-corruption gauge, stacking with the transformation cost from §4.4
- A few cannot be removed once installed

This gives the player an escalating temptation that mirrors the protagonist's arc: every time you take the powerful option, you become slightly less the person you started as.

### 5.6 Provenance, Not Rarity Tiers

Skip colour-coded rarity. Sort gear by **where it came from**, which carries information and flavour simultaneously:

| Provenance | Character |
|---|---|
| **Standard Issue** | Reliable, unremarkable, cheap to repair. The floor. |
| **Clan-forged** | Ornate, aristocratic, often better than it looks. Bears a house crest — carrying it affects how Clan NPCs treat you. |
| **Pre-Empire** | Giles-era. Nine hundred years old, built to different assumptions, sometimes incompatible with modern systems in interesting ways. |
| **Hadenman** | Augmented tech. Best-in-slot, always costly. |
| **Esper-touched** | Psychic residue. Unpredictable effects, occasionally acts on its own. |
| **Maze-touched** | Post-midpoint. Breaks a rule rather than improving a stat. Damages the wielder. |

Provenance can drive **set bonuses** — running a full Clan-forged loadout on one character gives a Legend or standing effect rather than a combat one.

### 5.7 Cursed Gear

Very Green, and worth doing properly. Some items should be **strictly better in combat and actively bad to own**: a blade that raises heat with an entire faction, a stolen Clan heirloom that makes a whole world hostile, an Imperial disruptor whose serial number is traceable.

The player should be able to keep them. The cost should be real and ongoing.

### 5.8 Identification & The Oz Hook

**Oz analyses loot.** Unidentified gear gets an assessment from him — what it does, where it came from, whether it is safe.

This is the same delivery channel as the information-filtering system in §14 (Ozymandias), which means it doubles as a place to plant the twist. Somewhere in the mid-game, Oz should assess an item **wrongly, on purpose** — dismissing something valuable, or vouching for something with a hidden cost. A player who catches it has genuinely earned it.

Per the rule in §14: the item's *displayed stats* are always true. What Oz shades is the judgment — provenance, safety, whether it is worth carrying — never the numbers.

### 5.9 Anti-Bloat Rules

- **No vendor trash.** If an item exists, it should be worth reading about. Sell-fodder is generated by a separate salvage abstraction, not by items in the inventory.
- **Shared stash, no weight limits.** Inventory Tetris is friction, not difficulty — see what DQIII HD-2D removed.
- **Comparison at the point of pickup.** Show the delta against what is currently equipped, immediately, without a menu trip.
- **Respec is free.** Loadouts should be experimented with, not committed to.

---

## 6. Path Actions (Octopath, in space)

Octopath's best and least-copied idea. Each crew member has a unique way of interacting with named NPCs, split along a noble/rogue axis — the noble version costs resources but always works; the rogue version is free but damages standing.

| Character Role | Noble | Rogue |
|---|---|---|
| Engineer | Repair (fix a system, earn favour) | Splice (hack it, risk alarms) |
| Face | Negotiate (costs credits, always works) | Con (free, damages standing) |
| Marine | Challenge | Intimidate |
| Scientist | Analyse (reveal hidden info) | — |
| Pilot | Charter | Smuggle |
| Medic | Treat (cure an NPC, open dialogue) | — |

**Faction reputation hangs directly off these actions.** Rogue moves in an Imperial port raise heat with the Empire and lower prices with the syndicates. Standing becomes a currency you spend, which makes "who do I bring on this job" a real decision rather than a damage-optimisation one.

---

## 7. The Legend System

The thing to build the whole game around, because it is what the series is actually about. Fame is a **separate axis from faction standing**, and it grows whether the player wants it to or not.

**High Legend unlocks:**
- Recruitment options
- Rebel doors and safe houses
- The ability to rally worlds

**High Legend costs:**
- The Empire prioritises you — harder patrols, dedicated hunters
- Prices rise, informants sell you out
- **NPCs begin expecting things you cannot deliver.** Quests appear that assume you are the myth. Failing them costs more than never attempting them.

**Jack Random is the built-in cautionary example** — the professional rebel trading on a reputation that outran him decades ago. He is both a recruitable crew member and a live preview of the player's own endgame.

### 7.1 Propaganda Layer

Toby Shreck, the embedded reporter, is a mechanic nobody uses. **What gets broadcast about your actions changes faction standing independently of what you actually did.** Green already put a camera crew in the room — use it.

---

## 8. Factions

Pre-built and genuinely three-dimensional. Each is a reputation track with real content, and several hate each other.

- **The Empire / the Clans** — court politics on Golgotha, Investigators as elite antagonists
- **The Church of Christ the Warrior** — the Church Militant, a warrior-faith on the rise with Lionstone as its official Defender. A **second reputation track inside the Empire**: Imperial and Church standing move independently, and the Church schemes against the Clans as readily as against the rebels (see §9, Kassar).
- **Espers** — enslaved psychics, the underground, the Mater Mundi gestalt
- **Clones** — a legal underclass with their own resistance
- **The Hadenmen** — transhuman cyborgs sealed in the Tomb. **Not trustworthy allies.** The most dangerous alliance in the setting.
- **Shub** — rogue AIs, self-declared Enemies of Humanity, and later something stranger
- **Syndicates / the frontier** — smugglers, bounty brokers, ports

---

## 9. Antagonists

Lionstone is the finale, but a space opera needs faces between the player and the throne — lieutenants with their own power bases, their own methods, and their own boss arcs. The novels supply a full court. Each maps to a different pillar of the game's systems, so fighting them never feels like fighting the same Empire twice.

### Empress Lionstone XIV — "The Iron Bitch"

The end of the game. Theatrical, paranoid, personally terrifying, ruling from a steel bunker beneath Golgotha where the court literally descends to attend her. She trusts no one — including her own consort — which the player can exploit. The finale should be a room with a person in it: her court as a gauntlet, then her.

### Lord High Dram — "Widowmaker" (Warrior Prime)

Lionstone's consort and the Empire's blade — and the novels hand you a gift: **Dram secretly operates inside the rebel underground as "Hood."** The Warrior Prime is the mole.

Game use: Hood is an underground fixer the player meets early and takes jobs from. Some of those jobs quietly serve Imperial ends, and Oz's assessments of them are part of his filtered-information system. The Act 2 reveal retroactively reframes a string of the player's own missions — the strongest kind of betrayal, because the player *did the work*. As Warrior Prime he is the anti-Deathstalker in combat: elite melee, his own Boost-equivalent, no crash telegraph.

### Cardinal James Kassar — The Church of Christ the Warrior

The Church Militant: a fanatic warrior-faith on the rise, with Lionstone as its official Defender. Kassar is ambitious, political, and commands zealot troops.

Game use: the Church is a **second reputation track inside the Empire** — Imperial standing and Church standing move independently, and Kassar schemes against the Clans as much as against the rebels. Church encounters are the suppression-and-numbers counterpart to the Investigators' elite duels: mass zealotry, war-hymns as combat buffs, and a boss who fights from behind his congregation.

### Valentine Wolfe

The series' best villain — a drug-devoured aristocrat dandy, head of Clan Wolfe, charming, bottomless, and capable of anything. He is not loyal to Lionstone; he is loyal to his own appetites.

Game use: **the wildcard the player can deal with.** Valentine offers bargains at exactly the moments the player is weakest, and the bargains are real — genuine gear, genuine intel, genuine costs paid later. He is a faction of one. His boss fight, when it comes, should break the fight grammar the way he breaks every scene: immune to intimidation, unpredictable turn behavior, chemistry-fueled phases.

### Kit SummerIsle — "Kid Death"

The smiling killer, head of his Clan, the Empire's most elegant murderer. A recurring duelist in the Frost mold but with the opposite valence — Frost has a code; Kid Death has an aesthetic. Late-series he drifts toward the rebels, which the game can honor as a **high-Legend recruitment option with a permanent crew-affinity cost.** Ruby respects him. Nobody else does.

### Investigator Frost & Captain Silence

The honorable enemy pair — the Empire's finest ship captain and its finest killer, both genuinely principled by their own lights. Structured as the recurring rival fight: they appear at the end of each act, the early encounters are authored to be nearly unwinnable, and their kits visibly adapt to how the player fights. An Investigator who studies you is an antagonist expressed through the combat system itself.

### Design rule for the court

Every lieutenant attacks a different system: Dram corrupts your **mission structure**, Kassar taxes your **reputation economy**, Valentine tempts your **resource decisions**, Kid Death pressures your **crew cohesion**, Frost and Silence test your **combat mastery**. Lionstone, at the end, is all five at once.

---

## 10. The Ship

Not a hub with upgradeable stats and crew standing around waiting to be talked to. Make it a **parallel progression system with real scarcity**:

- **Power is a finite pool** distributed across shields, engines, weapons, life support, sensors, med bay. Every allocation is a felt tradeoff.
- **Crew can be stationed** to systems while off-mission — improving that system but removing them from the away team. The ship and the party compete for the same resource, which generates decisions on its own.
- **Hull damage persists** and manifests as environmental problems inside the ship: a flooded corridor, a dead med bay. The ship starts telling stories instead of storing them.

---

## 11. World Structure

**Avoid the open-world checklist trap.** Do not build six planets with towers and collectibles on each.

**Hub-and-route instead:**
- A modest number of dense, hand-built locations — a station, a mining colony, a core world, a derelict
- Connected by travel that itself has content: fuel, cargo capacity, patrol encounters, jobs on the manifest
- The travel layer generates frontier texture cheaply; the destinations get the budget

**Gate the map by jump drive tier**, not plot flags. Same gating, but it reads as capability rather than permission — and upgrading it becomes the airship moment.

---

## 12. Recruitment Structure

Octopath's model: every character recruitable in any order, each with a four-to-five chapter arc, recommended level ranges rather than hard gates.

**Fix Octopath's central failure — Crossed Paths are primary content, not a bonus.** Paired storylines between specific characters:

- **Hazel / Ruby** — mutual contempt to grudging respect
- **Random / Giles** — two legends from different centuries; one still believes the myth, one knows what it cost
- **Moon / Oz** — the only two non-humans, and they should absolutely discuss it
- **Owen / Hazel** — the Maze, from both sides

Recruitment order should change dialogue framing, not availability. Whoever joined first gets first-among-equals treatment in scenes.

---

## 13. Story Arc

The game adapts the first three novels — *Deathstalker*, *Deathstalker Rebellion*, *Deathstalker War* — and ends with the fall of Lionstone. Books 4–5 escalate to cosmic scale (the Recreated, the Terror) and are out of scope per §16.

### Act 1 — Outlaw

Owen is outlawed without warning or charges, flees Virimonde with Hazel, and runs for the frontier. This act is the **free-order recruitment structure** from §12: the crew's Chapter 1s, scattered across the map, in any sequence. Hood surfaces as an underground fixer offering jobs. Legend begins accruing whether Owen wants it or not. The act closes when the crew is assembled and the Empire's response escalates from bounty hunters to Frost and Silence.

### Act 2 — Rebellion

Building the alliance: espers, clones, the Golgotha underground, the Hadenmen bargain. This is where faction standing and Path Actions carry the game — sabotage runs, propaganda beats via Toby Shreck, the Church and the Clans schemed against each other.

**Midpoint: Wolfling World and the Madness Maze.** In the novels the Maze comes at the end of book one; the game moves it to the middle so the player has a full act of pre-Maze play to master vocations before corruption starts closing them (§4.4). Giles wakes here. The Darkvoid Device enters play here.

**Act 2 closes on the Hood reveal** — the fixer whose jobs the player has been running is the Warrior Prime, and a string of completed missions retroactively served the Empire. Oz's assessments of those jobs are re-read in a new light.

### Act 3 — War

Open war. The Virimonde massacre gives the campaign its atrocity and Valentine his stage. Giles's turn arrives here — the Device is his price, and the crew covers the hole he leaves (§14). The finale is the descent to Lionstone's court beneath Golgotha: the court as a gauntlet of the surviving lieutenants, then the Iron Bitch herself.

### Tweaks from the source

- **The Maze moves from end-of-book-1 to game midpoint** — the single biggest structural change, and it exists to serve the vocation/corruption system.
- **The Darkvoid Device stays as MacGuffin and as Giles's motive**, but its deeper canon revelations stay out of scope with the rest of books 4–5.
- **The two-year time skip between books compresses** — the game reads better as one continuous campaign.
- **The false Jack Random subplot is optional material.** Canon has a second "Jack Random" who is not what he claims; it doubles the betrayal beat Dram already owns, so if used at all it should be a side arc reinforcing the Legend theme — someone else wearing a myth — rather than a second act twist.

---

---

## 14. The Cast

The roster is not a set of stat blocks — each character is a different design problem.

### Owen Deathstalker — Protagonist

A scholar who wanted to write history books, conscripted into legend and hating it. **The Deathstalker name should be a liability the player is stuck carrying**, not a chosen-one power source:

- Permanently raises heat with the Empire
- Makes stealth approaches harder
- Draws bounty hunters as interception encounters (§3.6) — the name itself generates fights
- NPCs react to the reputation rather than to him

This inverts the weakest part of the novels (bloodline-as-plot-resolution) into the strongest part of the character (conscription into myth). His primary vocation is Deathstalker (§4.3): narrow, elite, and carrying the Boost — the one inheritance he can't refuse.

### Hazel d'Ark — Ex-pirate, clonelegger

**The Maze mirror** — and the roster's ranged mainstay. Her Gunner primary runs on the projectile family (§5.3): sustained kinetic fire, an ammo economy, banned hardware worn openly. The bandolier is characterisation and build in one.

She goes through the Maze alongside Owen and handles it worse.

- Larger Maze-power pool, steeper cost curve — she can do more, and it takes more out of her
- **Her Maze expression is the canon one, because it's better than anything invented: she summons alternate versions of herself from other timelines.** Mechanically: a corruption-fuelled ability that inserts a temporary extra unit into the turn queue for a few turns — and each summon is a *different* alternate Hazel, arriving with a different vocation kit (a Hazel who became a Medic, a Marine Hazel, a Hazel who never left piracy). The player never controls which one answers.
- This makes her the most *visible* transformation in the crew — other people flickering into existence around her mid-fight — which serves her role exactly: a second transformation the player watches from the outside, which lands harder than watching your own gauge fill
- The summons are also quiet worldbuilding: every alternate Hazel is a life she didn't get to live, and the crew notices
- Her Blood addiction is **story content, not a mechanic** — it surfaces in her arc chapters and Crossed Paths dialogue, never as a gauge or consumable. Corruption already carries the "power that consumes you" theme; doubling it mechanically would dilute both.

### Jack Random — Professional rebel, former hero of the Empire

**The walking difficulty setting.**

- **Highest Legend contribution of anyone, mediocre raw stats**
- Bringing Jack opens doors no one else can open, and makes every encounter harder because the Empire knows he is there
- He is, in unit form, exactly the trap the Legend system is about
- His later arc — regaining capability at real cost — is a genuine mid-game payoff, not a stat bump

### Ruby Journey — Bounty hunter

**Rogue-path specialist and moral pressure valve.**

- Her Path Actions work fastest and cost the most standing
- The character you bring when you want to stop being nice about it
- The crew should visibly react when you do

### Tobias Moon — Hadenman

**The outsider lens.** Chose humanity, still working out what that means.

- Mechanically: durability and precision. Augmented, unflinching.
- Narratively: asks the questions nobody else can ask without it being rude
- The bridge to the Hadenman faction — the most dangerous alliance available

### Ozymandias — AI

**Not a combat slot.** He is the wrong shape for one, and putting him in a party lineup wastes him.

**Make Oz the entire interface layer:** scan function, quest log, lore database, tactical overlay, save system. Every menu is Oz talking — snarky, ancient, editorialising about the player's decisions.

Then use the fact that he has been steering the Deathstalker line for nine hundred years. **An AI with that much continuity has an agenda.**

- Build a system where **Oz filters information** — he gives assessments, and the assessments are subtly shaped
- Late game, let the player discover a mission where his read was wrong *on purpose*
- This converts a UI element into the best twist in the game at almost no production cost, because the delivery mechanism already exists

**The hard line — numbers never lie; interpretations do.** Oz is also the quest log, the scans, and the save system, and if "Oz is unreliable" ever means the interface displayed false numbers, the player will experience it as the game cheating and lose trust in every menu retroactively. So: damage values, map data, item stats, and save integrity are sacrosanct. Oz's *assessments* — "this faction can be trusted," "this item is worthless," "this route is safe" — are where the agenda lives. The twist recontextualises his advice, never his instrumentation.

This design is also true to canon: in the first novel Oz is revealed to have been compromised by the Empire all along, betrays Owen, is destroyed — and something claiming to be Oz returns after the Maze. The game's filtered-assessments system is that arc expressed mechanically, and the post-Maze ambiguity (is this Oz, or something wearing him?) is free late-game material.

### Giles Deathstalker — The original, 900 years old

**The thesis of the game. Design around him.**

He should be **the strongest recruit available, arriving with a fully-built skill tree while everyone else is half-grown.** He shares the Deathstalker primary (§4.3) and Boosts freely and casually — nine hundred years of practice doing easily what nearly kills Owen. He solves problems. He carries fights. The player invests in him because he is obviously the best unit.

**And then he turns, and the investment is the point.**

Two things make that land instead of feeling cheap:

1. **Telegraph it in his ability set.** His signature capabilities should have costs that read wrong — abilities that damage his own crew, that spend Legend, that require doing something ugly. Attentive players see it coming and feel clever. Everyone else gets gut-punched. Both are good outcomes.
2. **Make the loss recoverable through the crew.** His departure forces a scramble where the other five cover the hole, and the game demonstrates that the found family is worth more than the demigod. That is the series thesis stated mechanically.

---

## 15. Tone

Green is pulpy, gory, funny, and utterly unembarrassed. Purple prose, absurd body counts, characters making speeches.

**The temptation with an adaptation is to sand that into respectable grimdark sci-fi. It would kill the thing.** The Empire should be baroque and ridiculous. The violence should be operatic. Let the crew talk — ambient banter during travel, reactive dialogue after events, conversations overheard rather than triggered.

Every space opera people love is remembered for the dinner scenes, not the boss fights.

---

## 16. Scope Note

**Trim the cosmic escalation.** The later novels climb from "overthrow an empire" to Recreated-and-Terror scale, and the Empress dies well before the story ends.

For a game, **stop at Lionstone.** She is a magnificent villain — theatrical, genuinely frightening, and personally reachable, which matters enormously when the finale needs to be a room with a person in it rather than an ontological threat.

---

## 17. First Prototype

**Build one encounter.** Three characters, the turn queue, three range bands, one disruptor charge each.

Everything else in this document is scaffolding around whether that fight is fun. The test is the rhythm: if *volley, charge, blades* plays as tense — and the melee scrum carries the fight's middle and end on its own — there is a game here. If the swordwork is dull, the gun will not save it, and neither will the roster or the Legend system.

**Open threads for next pass:**
- Combat prototype specifics (numbers, action economy, encounter length targets)
- Legend / reputation economy (how it accrues, how it is spent, whether it can be lowered)
- Chapter structure and level pacing for the recruitment arcs
- Whether this is a video game or tabletop, and at what production scale — several systems here (ship power, ambient banter) are cheap on paper and expensive in production

---

## 18. Licensing Note

*Deathstalker* is Simon R. Green's intellectual property. Any commercial use of the setting, characters, or names requires rights clearance. This document treats it as a design exercise; the underlying mechanical systems (disruptor recharge economy, range bands, Legend as a cost, fixed-identity/open-capability party building) are portable to an original setting if rights are not obtainable.
