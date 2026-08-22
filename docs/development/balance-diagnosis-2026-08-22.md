# Balance Diagnosis — 2026-08-22

## Conclusion

The balance collapse is primarily an encounter-pressure and action-economy problem,
not an excessive-supply problem. Recommended-level parties still completed every run
with supplies disabled. Supplies do mask the under-level curve, but base encounter
pressure must be corrected before inventory tuning can create the intended attrition.

Do not change balance values yet. Correct or explicitly accept the measurement and
simulation-policy defects below, then tune encounters selectively.

## Reproduced baseline

The full 500-iteration check ran on Node 20.20.2 for seeds 12345 and 98765. It exited
non-zero with 14 failed metrics, 3 passed metrics, and 3 failure-distribution metrics
with no data because neither seed produced a failed run.

| Metric | Seed 12345 | Seed 98765 | Target |
|---|---:|---:|---:|
| Recommended-level completion | 100% | 100% | 85–90% |
| Level -1 completion | 100% | 100% | 55–65% |
| Level -2 completion | 100% | 99.6% | 20–30% |
| Full-minus-half supply completion | 0 points | 0 points | more than 10 points |
| Skirmish HP cost | 5.6% | 5.6% | 7–13% |
| Standard HP cost | 8.8% | 9.0% | 22–28% |
| Elite HP cost | 16.6% | 16.7% | 30–40% |
| HP entering final encounter | 87.7% | 88.2% | 50–70% |
| Medkits entering final encounter | 2.60 | 2.52 | 1–2 |

For seed 12345, the five encounters reported only 45.4% total pre-healing HP cost
against an intended run budget of about 105%. Recommended-level completion remained
100% with no supplies and 73.7% HP entering the final encounter. At level 1, however,
completion fell from 100% with full supplies and 98.4% with half supplies to 8.2%
without supplies. Supplies therefore hide the low-level curve but do not explain the
recommended-level ceiling.

The weakest encounters are the Shub fights:

| Encounter | Reported rounds | HP cost |
|---|---:|---:|
| F1 Empire skirmish | 3.6 | 8.3% |
| F2 Shub skirmish | 2.6 | 3.0% |
| F3 Empire standard | 5.4 | 12.7% |
| F4 Shub standard | 4.0 | 4.8% |
| F5 Hadenman elite | 6.5 | 16.6% |

## Measurement and policy defects

Resolve these before treating every failed metric as a tuning defect:

1. `src/sim/simulator.ts` stops after 140 actions but can pass an `in_progress`
   battle to `completeRunEncounter()`. `src/core/run.ts` advances any non-defeat
   battle with living party members. A capped stall can therefore become a clear.
   Current saved samples do not prove that cap hits caused this baseline, so add
   explicit cap-hit telemetry and treat a hit as an error or timeout.
2. Reported rounds are total loop actions divided by four. Enemy counts and speeds
   vary, and free boost toggles add loop actions without advancing the queue. Define
   a round explicitly, retain raw action and tick counts, and check both seeds.
3. HP cost sums damage-event values rather than actual clamped HP reduction. Overkill
   and repeated loss after healing can inflate the value. Separate actual HP removed,
   gross damage, overkill, and healing.
4. Failure-distribution targets conflict with `docs/design/run-and-balance.md`: the
   data requires 60–90% of failures at the final encounter, while the design calls
   for roughly 30–45%. The developer must select the intended target before tuning.
5. The simulator policy evaluates emergency healing and shielding before voluntary
   boost exit, which can postpone exit and cause avoidable crashes. Retest boost after
   correcting the policy order.
6. `rules.disruptor.targetHpPercent` is declared but unused; disruptor damage remains
   attack-based and hardcoded elsewhere. Clarify the intended 65%-of-healthy-target
   mechanic before changing its values.
7. The checker may silently load `balance-overrides.json`. Report active override and
   target provenance so local and cloud baselines cannot diverge invisibly.

### Follow-through status

Implemented without changing targets or gameplay values:

- `in_progress` encounters can no longer complete, and action-cap hits now throw a
  detailed simulation diagnostic.
- Replays capture initial combatant state before battle execution and distinguish
  timeout outcomes.
- Voluntary boost exit is evaluated before turn-consuming healing or shielding.
- Balance output reports target and override provenance; invalid override JSON fails
  loudly.
- Missing level-sweep entries fail loudly, percentage conversion uses explicit units,
  pacing checks both seeds, and no-data rows prevent an overall green result.

Still requires a developer decision or a separate telemetry design:

- Define rounds for the speed/tick queue; the provisional `actions / 4` metric remains.
- Select the HP measurement that represents the pre-healing attrition target.
- Reconcile failure-distribution targets with `docs/design/run-and-balance.md`.
- Decide whether disruptor damage is target-HP-based as the rules currently imply.

## Likely gameplay causes

- F2 and F4 enemies deal very little damage and die before receiving enough useful
  turns. Their short lives also prevent fresh enemy disruptor cooldowns from maturing.
- F3 already has near-target pacing but insufficient damage pressure, so adding only
  durability would lengthen the fight without necessarily fixing attrition.
- F5 duration appears nominal but its damage is about half the elite target, so it
  needs greater threat rather than blanket HP scaling.
- Party focus fire, reliable shielding, healing, persistent disruptor readiness, and
  level scaling deny enemy actions. Enemy templates do not scale with party level.
- Single-system ablations all remain at the completion ceiling. No individual player
  mechanic is the root cause, though their combined action-economy advantage matters.

## Ordered remediation

1. Fix action-cap handling, round accounting, HP-loss telemetry, override provenance,
   and the boost-policy ordering. Add focused tests for each.
2. Reconcile the failure-distribution target with the design document.
3. Decide whether disruptors are truly target-HP-based and align rules, core logic,
   and tests.
4. Instrument enemy turns, attacks landed, damage by actor and ability, disruptor
   shots, shields and prevented damage, healing, overkill, and turns denied by kills.
5. Increase F2/F4 pressure first; adjust F3 and F5 threat separately from duration.
6. Re-evaluate party/enemy progression and only then tune supplies.
7. Run the full two-seed balance check after every controlled change and report all
   misses verbatim.

No mechanics, game data, simulator code, or target values were changed during this
diagnosis.
