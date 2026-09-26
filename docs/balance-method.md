# Repeating the promotion timing experiment

The benchmark uses only `createSession`, `command`, `advance`, and `frame`. It never modifies runtime content, injects cash, or reads random state. Ordinary `npm test` runs ledger smoke tests and skips the campaign panel; it generates no reports. Run the panel explicitly:

```sh
SMTD_BALANCE_OUT=/tmp/baseline.json SMTD_BALANCE_LABEL=baseline npm run test:balance
```

The output includes each attempted command, result, integer simulation tick, cash changes, and before/after frame hashes. Wave records cover preparation for that wave through its exact clear/defeat tick. Initial purchases belong to wave one. Purchases immediately following a clear belong to the next wave, whose automatic start is exactly 360 ticks later. Income is the earned-stat delta, spending is gross spending, and successful sales are separate refunds. Each wave must satisfy `ending cash = opening cash + income + refunds − spending`. Every panel validates all ledgers and replays the first seed for each of its five policies, checking exact command results, boundary frames, and final frames.

The JSON carries SHA-256 hashes of runtime source, content, the runner, and the frozen policy specification. A replay rejects a different source or policy hash. No timestamps are included in deterministic results. Command logs are embedded in `runs[].commands`; keep reports private until reviewed for the intended audience.

`compareReports` validates schema, split, strike mode, exact declared seeds, policy specification and hash, source inventory and hashes, and unique seed/policy run membership. Only `src/content.ts` may differ between paired source inventories. Run provenance must match its panel. Comparison recomputes summaries from runs and ignores supplied summary values before evaluating gates; mixing tuning, held-out, or strike panels fails. Validate saved private panels without rerunning combat by setting `SMTD_BALANCE_REVIEW_DIR` and running `npm test -- tests/comparison.test.ts`.

## Frozen policies and samples

Both mixed rosters deploy four opening Cadets, then fill the same fixed sixteen-pad order. Diverse follows the existing campaign regression roster. Splash/control uses four Grenadiers and two Engineers, versus two of each in Diverse, and fewer Gunners. This alternative emphasizes splash and slowing without optimizing against individual seed outcomes. Concentrated policies place only Gunners or only Snipers in that same pad order. Frozen follows Diverse through preparation for wave ten, then stops purchasing. All retain default first-target policy.

At initial setup and each intermission start, each policy makes one deployment pass and three promotion passes in deployment order. Refused purchases are logged. These policies have identical decision opportunities; their spending amounts differ. Results therefore do not establish equal-budget role dominance.

Tuning seeds: 52, 914, 7341, 1009, 65537, 20260926, 17, 97. Held-out seeds: 113, 509, 12347, 98761, 314159, 271828, 8675309, 424242. Select with tuning results before running the held-out panel once. The main panel uses no airstrikes. The separate fixed-rescue sensitivity attempts one strike on waves 15, 25, and 30 at the first observed combat tick with wave time at least eight seconds, with no retry. A wave that clears earlier uses no strike.

The two promotion candidates preserve deployment and first-promotion prices. Measured multiplies second/third promotion prices by 2/4; Deep uses 3/6. Neither changes damage, rate, range, effects, bounties, rewards, encounters, boss HP, automatic cadence, or strike rules. The mildest candidate passing tuning advances to held-out. A held-out failure rejects that candidate without another coefficient search.

```sh
SMTD_BALANCE_OUT=/tmp/candidate.json SMTD_BALANCE_LABEL=measured \
SMTD_BALANCE_BASELINE=/tmp/baseline.json npm run test:balance

SMTD_BALANCE_OUT=/tmp/baseline-held-out.json SMTD_BALANCE_LABEL=baseline \
SMTD_BALANCE_SPLIT=held-out npm run test:balance

SMTD_BALANCE_OUT=/tmp/selected.json SMTD_BALANCE_LABEL=measured \
SMTD_BALANCE_SPLIT=held-out SMTD_BALANCE_BASELINE=/tmp/baseline-held-out.json \
SMTD_BALANCE_REQUIRE_PASS=1 npm run test:balance

SMTD_BALANCE_OUT=/tmp/rescue.json SMTD_BALANCE_LABEL=measured \
SMTD_BALANCE_SPLIT=held-out SMTD_BALANCE_STRIKES=fixed-rescue npm run test:balance
```

## Gates and limits

Both mixed policies must win at least six of eight seeds and lose no more than two victories against baseline. Neither may suffer more than two defeats before wave ten. Median full-sixteen-pad rank-three saturation must move at least four waves later and reach wave twenty or remain censored, and median spending in waves 21–30 must be positive. Frozen must have fewer wins or lower median ending integrity than evolving Diverse. Timeouts fail. Concentrated outcomes are disclosed without forcing them to lose.

Raw saturation stays `null` when unobserved. `saturationLowerBoundWave` uses one beyond the last observed wave as the censoring bound; it is not an observed saturation wave. `medianSaturationWave` is null when the middle observations are censored. Completion gates prevent interpreting starvation alone as successful pacing. These small deterministic samples test the declared policies; they do not estimate general player win rate, enjoyment, or equal-budget roster balance. Interactive inspection and independent human play remain necessary.

## Accepted promotion timing pass

Both candidates passed the tuning gates, so the milder Measured candidate was selected before held-out evaluation. Its single held-out panel also passed every gate. Both mixed policies won eight of eight seeds with twenty remaining lives and no airstrikes. Diverse moved full-board saturation from wave 20 to wave 26, with $3,020 spending during waves 21–30; Splash/control moved from wave 20 to wave 27, with $3,240 late spending. Their final cash fell from $8,149/$8,039 to $4,894/$4,704. Frozen after preparation for wave ten won zero of eight. Concentrated Gunners and Snipers still won eight of eight; this pass does not establish meaningful roster tradeoffs.

All reported panels passed every wave/command ledger check and exact first-seed replay across all five policies. The selected changes affect twelve price fields: second and third promotions for each role. Base and first-promotion costs, combat values, enemies, waves, rewards, proc semantics, and strike mechanics remain unchanged. The runner records its exact source hashes so accepted, baseline, and Deep content can be reconstructed and checked from their price matrices. No large reports or workstation-specific output paths belong in the public repository.

The paired fixed-rescue sensitivity did not change completion counts: both mixed and both concentrated policies won eight of eight, while Frozen won none. It is a timing sensitivity, not proof that three strikes rescue every weak defense. Across the seven final panels, 280 run ledgers and 35 complete command replays passed. Ordinary tests passed 22 checks and skipped the opt-in benchmark; the production build passed. Browser and human-play verification are separate work.

To reconstruct baseline, restore `src/content.ts` from source revision `b306702547492a2e1bded9e17446f902138bf828` while retaining this runner. For each candidate change only the twelve declared second/third-promotion cost fields, then verify the report's content hash. Changing the runner invalidates the recorded source hash and requires rerunning paired panels.
