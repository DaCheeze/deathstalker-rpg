# Run, Progression, and Balance

## Persistent run state

`RunState` owns condition across an ordered encounter chain ending in an elite or
boss fight.

| Resource | Between encounters |
|---|---|
| HP | Persists exactly; no free healing |
| ESP | Partial regeneration |
| Burnout | Persists at half value |
| Disruptor cooldown | Persists exactly |
| Force shield | Clears |
| Crash state | Clears |
| Deaths | KIA persists unless revived |

Medkits and revives are limited run resources usable during combat at an action cost
or between encounters. Supplies do not replenish. Tune this economy before party HP
or enemy statistics, but diagnose whether supplies are actually being consumed
before assuming inventory alone can repair an attrition failure.

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
