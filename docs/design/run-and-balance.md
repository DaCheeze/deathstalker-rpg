# Run, Progression, and Balance

## Hero's Journey pressure shape

`hero-journey-campaign-architecture.md` is the campaign-level authority for how
Separation, Initiation, and Return shape expedition pressure, resource commitment,
recovery, reward timing, and mastery. Journey phase is authored narrative context,
not a hidden difficulty multiplier. Reach the intended curve through encounter
jobs, composition, sequencing, recovery placement, availability, and credible
rewards before changing global statistics or prices.

The current numeric targets below remain unchanged. Future phase-specific targets
require a playable baseline, explicit resource-boundary telemetry, and developer
approval. Forced grinding, unexplained price inflation, and surprise invalidation of
previously taught rules are pacing failures rather than acceptable ordeal design.

## Persistent excursion state and campaign loop

`RunState` owns condition across an ordered field or dungeon excursion ending in an
elite or boss fight. The wider campaign loop returns the party to towns where rest,
shops, and preparation reset pressure without erasing permanent progression.

| Resource | Between encounters |
|---|---|
| HP | Persists exactly; no free healing |
| ESP | Partial regeneration |
| Burnout | Persists at half value |
| Disruptor cooldown | Persists exactly |
| Force shield | Clears |
| Crash state | Clears |
| Deaths | KIA persists unless revived |

Medkits and revives are limited excursion resources usable during combat at an
action cost or between encounters. They do not replenish automatically while the
party remains in the field. One-time chests persist, shops sell declared supplies,
and town rest restores party condition without consuming a medkit. Tune this
economy before party HP or enemy statistics, but diagnose whether supplies are
actually being consumed before assuming inventory alone can repair an attrition
failure.

Regular encounters may be repeated for optional XP, gold, and supply purchasing.
Recommended-route balance must not require grinding. Optional grinding is a valid
player-controlled difficulty lever: added levels and equipment make later fixed
encounters easier. Enemy and boss definitions do not scale to the current party
level, victory count, or recent performance. Boss strength is authored and fixed;
the player chooses preparation, route risk, and how much to grow before committing.

Campaign-field encounters use visible contacts rather than random encounter rolls.
TypeScript validates the contact geometry and opening condition: striking an
unaware enemy from the declared field range grants the party the first action,
being detected and contacted grants the enemy the first action, and an undetected
collision uses the normal speed/tick queue. Godot reports the observed trigger and
player position but never decides initiative. These openings change immediate risk,
not enemy level or boss strength, so scouting and approach are additional
player-controlled preparation choices alongside grinding and supplies.

## Encounter targets

| Tier | Rounds | HP cost before healing |
|---|---:|---:|
| Skirmish | 3–5 | about 10% of party maximum |
| Standard | 5–7 | about 25% |
| Elite | 6–8 | about 35% |
| Boss | 8–10 | remainder |

Hit the HP-cost budget before tuning to completion rate. A correct win rate does not
prove that the attrition budget is correct.

Opening fights should produce 0–5% of run failures, middle standard fights roughly
10–20% each, and the final elite/boss roughly 30–45%. If only the final fight kills,
improve encounter variety rather than blindly scaling all enemy statistics.

## Simulation requirements

- Simulate full runs. Completion rate is primary; individual battle win rate is a
  secondary diagnostic.
- Measure both recommended-route and voluntary-overlevel cohorts. Do not average
  them together or tune the boss upward because the overlevel cohort succeeds.
- Baseline must outperform `--no-disruptor`, `--no-boost`, and `--no-esper`.
- Always report seeds 12345 and 98765. Variance over a few points is noise.
- Report rounds and actions per encounter; never use ambiguous "turns" in reports.
- `balance-targets.json` and `npm run balance-check` are the source of truth.
- Never widen targets or call a missed metric successful.

Use `npm run balance:smoke` for fast diagnosis only. It does not replace the full
500-iteration, two-seed `npm run balance-check` required for gameplay completion.

## Replays

Record battles as seed plus ordered actions so they replay exactly.
`--record-samples` saves median, shortest, and longest examples per encounter. Use
replays to determine whether a fight reads clearly, contains meaningful choices,
or stalls despite acceptable aggregate metrics.

## Range-band prototype acceptance

The existing run targets and two-seed baseline describe the current multi-encounter
game and remain unchanged. They are obsolete as acceptance criteria for the bounded
three-character range-band prototype because that prototype deliberately contains
one encounter and excludes persistence, Boost, the esper, and defense layers.

Do not tune numbers or replace targets before the prototype mechanics are playable
and measured. Initial acceptance is structural and experiential: deterministic
actions, a readable conditional queue, visible range and disruptor state, a real
hold-or-fire choice, and melee sustaining the middle and end of the encounter. New
numeric targets require a later developer-approved balance task.
