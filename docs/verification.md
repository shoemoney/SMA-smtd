# Verification record

Checkpoint: September 25, 2026. This records evidence supplied by the engine and browser verification leads for the current development build. Documentation work did not rerun those checks. It is a first-playable checkpoint, not a claim that every release gate has passed. Later changes require the affected checks to be repeated.

The campaign is completable through legal player commands, Chrome has rendered it with WebGPU, and automatic continuation and an airstrike have been observed in a player run. Balance remains forgiving: several single-role strategies finish with full integrity. WebGL2 compatibility startup, hover statistics, affordable-card transitions, and the corrected mobile target layout were also checked. Publication and deployment are recorded separately below. The live release was activated successfully on September 25, 2026 (America/Chicago).

## Engine evidence

The engine lead reports **18 passing deterministic tests** in [the engine test suite](../tests/game.test.ts). The suite covers authored content and rank limits; starting resources; valid and invalid purchases; refund rounding; pause and deterministic replay; clear resolution and once-only rewards; a legal diverse campaign completion; bounty tiers and boss HP; rage timing and proc sampling; Sniper headshots; idle shot credit and strongest-only Officer support; slow refresh and boss resistance; splash and targeting; medic pulses; and current-enemy airstrike damage, future packets, and once-only payment.

Passing these tests supports the specific assertions in the suite. It does not establish comprehensive input, accessibility, device-loss, performance, browser compatibility, or human difficulty coverage. In particular, the full boundary matrix in [the playtest plan](playtest-plan.md) remains a plan unless separately recorded below.

The engine lead also completed a legal public-command simulation using all six soldier roles. All three tested seeds—7341, 42, and 914—completed all 30 waves with 20 lives and all three airstrikes unused. Each reported run spent $2,435, earned $10,484, and finished with $8,149. The balance reconciles as `$100 start + $10,484 earned − $2,435 spent = $8,149`.

These are feasibility runs, not an estimate of the general win rate. Three seeds cannot characterize the low-proc tail, and an automated purchase policy is not a new-player usability test. The unused strikes also show that this particular defense did not need the emergency resource.

## Current balance findings

The engine lead tested these additional legal strategy policies:

| Strategy | Observed outcome | Interpretation to investigate |
| --- | --- | --- |
| Base-rank Cadets only | Lost on wave 12 | Unpromoted mass deployment eventually runs out of effectiveness. |
| Maximum-rank Cadets only | Lost on wave 23 | Promotion extends the policy, but does not carry it through this campaign. |
| Maximum-rank Gunners only | Completed wave 30 with full integrity | This policy does not require the other five roles to survive the current campaign. |
| Maximum-rank Grenadiers only | Completed wave 30 with full integrity | Splash remains sufficient against the tested mixed and boss pressure. |
| Maximum-rank Snipers only | Completed wave 30 with full integrity | The tested density and escort timing do not force this policy to diversify. |

The additional policies used seeds 7341, 42, and 914 with no strikes. Spending and placements were not matched across policies. Do not rank the three winning roles against one another from this table. Preserve the purchase schedules and seed sets before drawing stronger comparisons.

The generous mixed-run surplus and perfect single-role wins are an explicit **balance limitation**. They establish a forgiving, feasible starting campaign; they do not establish meaningful roster tradeoffs or validated difficulty. No balance values were changed as part of this report. Follow-up experiments should measure when cash becomes surplus, compare equal-budget policies over prespecified and held-out seeds, and adjust escort spacing, pressure timing, health, upgrades, or rewards only after identifying the cause. Preserve the required $100 start, $10 Cadet, escalating deployment prices, six escorted bosses, automatic waves, three strikes, and promised proc mechanics.

## Browser evidence

The browser verification lead observed the following in Chrome:

- The actual renderer used WebGPU. This is the observed backend for this browser session; it is not a cross-device compatibility claim.
- A player run started with $100, and Cadet deployment cost $10. Placing two Cadets, one Gunner, and one Sniper left $15, consistent with the displayed prices.
- The run reached wave 6 through automatic wave continuation. An airstrike changed the remaining campaign count from three to two.
- No console errors were observed during that tested session. This does not cover unvisited paths or future sessions.
- Keyboard focus exposed Sniper statistics. Actual pointer hover exposed Machine Gunner and Sniper statistics without changing the selected card. Mobile-width tapping selected Combat Engineer and exposed its statistics.
- At desktop width 1440 CSS pixels and mobile viewport width 390 CSS pixels, inspected readable text met the 18 CSS pixel minimum and there was no horizontal page overflow.

The initial 390-pixel viewport revealed a slight overlap around pad 8. After reducing pad buttons to 36 CSS pixels wide, a fresh browser check found zero overlapping deployment controls and no horizontal overflow. This is browser viewport emulation, not a physical-phone test.

Unaffordable cards were checked at $15: Cadet remained colored and enabled; the other five cards used grayscale and exposed their unavailable state. Sniper hover statistics remained readable. After normal kills and wave income increased funds to $350, all six cards were enabled again. No cash injection was used.

Forced `?renderer=webgl` startup reported the actual WebGL2 compatibility backend with no console errors. This check did not run a full compatibility campaign. The normal route returned to actual WebGPU.

The ECharts wave-composition and soldier-comparison tabs rendered and switched correctly. The exact robot artwork remained visible behind the road. All six military roles were placed in an ordinary browser run, which reached boss wave 10. The checked-in preview is 54 captured gameplay frames, including the aircraft and impact effects, encoded as an 18-second GIF and a matching PNG poster.

## Pending release checks and evidence slots

The verification lead should complete these entries with concrete outcomes and evidence references. An unchecked item remains pending; source presence or a successful build alone is insufficient.

- [x] **Release identity:** release `20260925225846-2fae35`; September 25, 2026; macOS Chrome at 1440/390 CSS viewport widths. Backend observed as WebGPU; exact browser/GPU model and physical-mobile performance were not captured.
- [x] **Tests and production build:** root reran all 18 tests successfully, and the production TypeScript/Vite build passed after recorded audio integration. Vite reports large Three.js/ECharts chunks; the field manual is loaded on demand.
- [x] **Mobile pad fix:** at 390 CSS pixels, all 16 control rectangles had zero overlap; no horizontal page overflow. Labels met the 18px minimum. Browser viewport emulation only.
- [x] **Pointer/focus/card sampling:** actual Gunner and Sniper hover exposed the correct specials; focus exposed Sniper; mobile-width tapping selected Engineer. Unaffordable Sniper retained hover stats. All six use the same handlers; this was sampled, not six independent physical-device checks.
- [x] **WebGL compatibility startup:** forced route reported WebGL2 with no console errors. A complete WebGL campaign remains untested.
- [x] **Visual assets:** all six soldiers, boss escorts, original faded robot, and aircraft strike appeared in captured actual WebGPU play. The gameplay poster and GIF are included in `public/preview/`. Audio checks are recorded separately.
- [ ] **Lifecycle and failure paths:** pause/resume, help dialog open/close, and resize were exercised. Fullscreen was refused by the controlled browser and the fallback notice was shown; real fullscreen remains unverified. GPU loss/recovery and unavailable-storage cases remain untested in a browser.
- [ ] **Physical devices and accessibility:** real mobile devices, keyboard completion, screen-reader limitations, reduced motion, mute, and measured busy-wave performance. Result/evidence: _pending_.
- [x] **Source publication:** [SMA-smtd](https://github.com/shoemoney/SMA-smtd) is public. Initial implementation revision `aa97aa519a9999673ac28a88242d1d3eccb9b799` passed [GitHub CI](https://github.com/shoemoney/SMA-smtd/actions/runs/36216998457). Anonymous page/API access succeeded; the exact-commit ZIP returned 200 and all 36 files matched the reviewed source. A clean packaging checkout installed successfully, passed all 18 tests, and produced byte-identical build files. License and asset credits were reviewed; outgoing source and initial commit history passed secret scanning.
- [x] **Deployment:** the complete two-game arcade release passed its privacy clearance and deployment health check. `https://arcade.shoemoney.com/smtd/` and its GIF/PNG return HTTP 200. Chrome opened the production route with actual WebGPU and successfully placed Cadet, Gunner and Sniper, then launched the first wave without console errors. The original Last Engineer files matched the previously live release.

Retain screenshots, test output, seed and command logs, and browser observations alongside the relevant revision. Use interactive ECharts for the expanded balance comparison, with these raw values and policy definitions available as drilldowns. Do not replace missing evidence with an inferred pass.

## Live audio and scores

Enabling sound on the production game created a running 48 kHz realtime WebAudio context. All three bundled firearm WAVs and both existing arcade suppressed-shot/casing MP3s returned HTTP 200. No console errors were observed. An API-level stress harness also checked role selection, delayed casings, at most 15 simultaneous sources, mute cleanup, time-rewind cleanup, and failed-request fallback. This does not establish subjective loudness quality across physical speakers or headphones.

A clearly named zero-point `QA verification` entry was submitted through the live API. The first request returned 201; the identical retry returned 200 with `replayed: true`, the same score ID, and exactly one matching board row. That verification entry remains because there is no documented cleanup operation. No database was copied, edited or replaced. Leaderboard scores are client-reported.

## Checkpoint: September 26, 2026 — presentation, identity and audio pass

This checkpoint records a later change set. It does not revisit or replace the September 25
evidence above; the figures recorded there remain the figures that were observed on that day.

**Test suite growth.** The suite is now **48 tests: 46 passing and 2 skipped** (the opt-in
campaign benchmark and the private saved-panel validation), across four files under `tests/`.
The earlier "18 tests" figures above are correct as historical records of that release and are
deliberately left unedited. Note that `npx vitest` run from the repository root will report a
much larger count, because it also globs stale copies of the suite under the gitignored
`.local/` directory; scope the run to `tests/` for the real number.

**Battlefield framing (measured, Chrome, WebGPU).** At a 1728 x 1000 CSS viewport the field
moved from 618 px down the page to 387 px, visible height above the fold from 382 px to
613 px, and the fraction of canvas width covered by the map from 66% to 89%. The frustum
carries a 1.5-unit margin, re-measured at aspect ratios 1.40, 1.55, 1.65 and 1.78. Checked at
390x844, 1280x800, 1440x900, 1728x1000 and 2560x1440. Backend reported WebGPU throughout.

**Unit and enemy identity.** All six soldiers and all seven enemy profiles were rendered and
inspected at actual field scale, including a frame carrying every enemy kind on the route at
once. Two enemy cues failed that inspection and were corrected: armored shoulder blocks were
floating clear of the body, and the elite crest was vertical and therefore invisible under a
top-down camera. Both were re-checked after the fix. This is a visual inspection of captured
frames, not a controlled legibility study with human subjects.

**Production artifact.** The built release, served statically from `dist/` at the `/smtd/`
route, reproduced the same framing measurements and reported WebGPU. This checks the built
bundle rather than only the development server.

**Not covered by this checkpoint.** Physical devices, screen readers, keyboard-only
completion, measured busy-wave performance and subjective audio quality remain open exactly
as recorded above. Arcade preview art still shows the pre-change battlefield framing.

### Difficulty re-tune, September 26, 2026

The September 25 record already said "balance remains forgiving: several single-role
strategies finish with full integrity." Measured against the scripted policies in
`tools/balance.ts` across all sixteen tuning and held-out seeds, that understated it: **every
greedy policy won 16 of 16 campaigns with all 20 lives intact and zero leaked integrity**, and
finished holding more unspent cash (median $5,224) than it had spent (median $5,360).

Literal "3x harder" is not reachable. A flat 3x HP multiplier takes every policy from 8/8 wins
to 0/8 with zero lives; the entire playable band sits between roughly 1.6x and 2.75x, and any
count or speed increase stacked on top collapses it. The difficulty response is a cliff, not a
slope.

What shipped instead is a **ramp**: the authored wave HP multiplier is scaled x1.0 at wave 1
rising to x2.6 at wave 30, and commander HP is scaled on a gentler x1.0 to x1.5 ramp. Scaling
bosses at the full trash rate left exactly one viable policy; leaving them unscaled made
commanders the easy part of a late wave and removed the Sniper's purpose.

Measured on the shipped content, no mutation, eight tuning and eight held-out seeds:

| Policy | Before (both sets) | After, tuning | After, held-out |
| --- | --- | --- | --- |
| gunner-greedy | 8/8, 20 lives | 4/8, 4 lives | 6/8, 6 lives |
| splash-control | 8/8, 20 lives | 4/8, 1 life | 5/8, 4 lives |
| sniper-greedy | 8/8, 20 lives | 1/8 | 0/8 |
| diverse-greedy | 8/8, 20 lives | 0/8, ends wave 27 | 0/8, ends wave 27 |

Median leaked integrity moved from 0 to between 7 and 11. The campaign remains provably
completable: a six-role plan finishes seed 7341 with 12 of 20 lives and is pinned by
`tests/game.test.ts`. A well-built splash-weighted mixed squad still wins on every seed
sampled, so the curve rewards construction rather than punishing everyone equally.

These are scripted-policy results with fixed purchase order and first-target policy. They
bound the difficulty; they are not a measurement of human play, and no human playtest of the
re-tuned campaign has been recorded yet.

### Enemy plating and difficulty reshape, September 27, 2026

The September 26 re-tune made the ending hard and left the opening untouched. Measured over
40 seeds with the machine-gunner-only policy, first integrity loss was **median wave 29,
earliest wave 29**: twenty-eight waves at a full 20/20 before anything happened.

Attempts to move that earlier by tuning numbers all failed, and the negative results are the
useful part. None of the following moved first blood earlier than wave 25: enemy HP at twice
the shipped ramp, enemy speed +15% and +30%, enemy count +40%, spawn interval cut to 0.6,
wave rewards halved, kill bounty halved. Each one only made the ending less winnable. The
cause is structural rather than numeric: the scripted policy holds **4 towers at wave 1, 7 at
wave 5 and all 16 pads by wave 9**, and complete coverage of a single route cannot leak while
per-unit HP stays under the threshold that survives the whole gauntlet.

What changed the shape was an **archetype**, not a multiplier. Armored Infantry and Elites now
carry flat *plating* — 6 and 8 respectively — subtracted from every individual hit after
percentage armor, with a floor of 1 so nothing is immune. Percentage armor scales with the
incoming hit and therefore cannot distinguish sixteen cheap shots from four expensive ones;
a flat subtraction can. Airstrikes ignore it via the existing armor-ignoring path, and Sniper
headshots still kill non-bosses outright, so both locked behaviours are unchanged.

The wave HP ramp was then reshaped from rising (x1.0 to x2.6) to nearly flat and slightly
rising (x1.90 to x2.20 on the authored curve), because plating now carries the early load and
the old curve stacked on top of it produced an 8% win rate.

Machine-gunner-only, 40 seeds, measured on the shipped file:

| | Before Sept 26 | After Sept 26 | Now |
| --- | --- | --- | --- |
| Win rate | 100% | 65% | **50%** |
| Median final lives | 20 | 4 | **2** |
| First integrity loss | never | wave 29 | **wave 8 (earliest 4)** |
| Runs that bleed at all | 0/40 | 36/40 | **40/40** |

Lives now read 20 at wave 5, 12 from wave 10 through wave 28, and 10 at wave 30. The midgame
plateau is real and is not yet addressed: once coverage and ranks catch up, Armored stop
leaking until the final waves.

Across all five policies on tuning and held-out seeds, three strategies are viable where the
September 26 build had two. **Sniper-greedy recovered from 0/8 to 5/8 and 6/8**, which is the
archetype working as intended: flat plating barely touches high damage per shot, so it
restored a role that percentage armor had made pointless.

These remain scripted-policy measurements with fixed purchase order and first-target policy.
No human playtest of this build has been recorded.

### Gunfire presentation, September 27, 2026

Reported: the shots looked like lasers. They were. Every shot built a `CylinderGeometry`
stretched the full tower-to-target distance, held at constant length for 0.25 s and faded in
place — a beam by construction, with no muzzle flash and no travel.

Replaced with an actual round. The effect root now sits at the shooter and points down the
line of fire, so everything is positioned in local +Y along that line: a hot muzzle flash
cone and white spark at the origin, a short tracer (capped at 0.5 units, or a third of the
gap) that travels and arrives at 70% of the effect's life, a faint trail behind it, and an
impact spark at the far end for the remaining 30%. Shot effects run 0.32 s rather than 0.25 s
so the round is perceptible in flight. Reduced motion places the round at the target
immediately and suppresses the flash.

The muzzle origin needed correcting after the first capture: shots were leaving from y = 0.28,
which is pad height, so the flash bloomed around the soldier's boots. The soldier models carry
their weapons just under y = 1, and the origin now matches at 0.95.

Audio gained a synthesized muzzle blast layered under the existing CC0 samples: near-instant
attack, broadband crack, low body thump, pitched per role so the six firing voices stay
distinct, and excluded for the Grenadier which already carries its own detonation. It takes an
ordinary rather than priority voice, so a busy wave drops the layer instead of the shot. It is
synthesized rather than sampled, so the licensing statement in ASSETS.md remains true: the
Last Engineer recordings referenced for sound design were not copied into this repository.

Verified in a real browser during combat rather than from source: muzzle flashes appear at the
weapons of multiple firing soldiers and a short tracer is visible mid-flight between shooter
and target. All three CC0 wavs load, sound enables, and no console errors were raised across
the run.

### Midgame plateau investigation and new guards, September 28, 2026

**The plateau is kept, deliberately.** `npm run difficulty` shows all gunner-only integrity loss
comes from exactly two waves — wave 8 (the first Elites, reached while the squad is still rank 0)
and wave 29 (42 Elites) — with zero loss on every wave between. Four levers were measured against
all policies over sixteen seeds, not just gunner-only: plating that grows with the wave, Elite
counts scaled 1.5–2.5× across waves 11–27, and authored HP spikes of 1.5–2.4× on sets of mid
waves. Plating growth only moved the plateau's height; +1 plating at wave 10 alone dropped lives
from 12 to 2. Elite count changed nothing. Every HP spike that eroded the midgame killed
splash-control (for example 15/16 wins to 0/16), because splash does modest per-hit damage and
plating absorbs it. An earlier gunner-only search had recommended a ×2.4 spike that, measured
across policies, stopped splash and diverse builds dead at wave 12. The shipped build is the
only measured shape with three viable strategies, so the plateau stays as a known trade-off.

**New tests.** `tests/game.test.ts` pins plating arithmetic (9 − 6 = 3, the floor of 1, and the
shipped values 6 and 8). `tests/difficulty.test.ts` pins the curve's shape on the tuning seeds:
gunner-only must lose integrity by wave 12, never finish at 20 lives, and still win at least
once. Both were mutation-checked: removing the plating subtraction fails with `expected 9 to be
3`, and zeroing Armored and Elite plating fails the shape test with `expected undefined to be
defined` — that seed never loses integrity at all.

**Tooling.** The difficulty probe moved from gitignored scratch space to `tools/difficulty.ts`
(`npm run difficulty`), so the measurements behind these decisions survive the checkout.

**Audio.** A synthesized impact thud now plays 0.22 s after each shot, matching the moment the
tracer lands, with its own rate limit so sustained fire does not become a drum roll.

Browser verification was not possible for this batch: the Playwright MCP server failed to
connect. The impact sound is verified by tests and build only.
