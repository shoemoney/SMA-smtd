# Playtest and release verification plan

This plan covers the latest required rules: $100 start; $10 Cadet and progressively higher soldier deployment prices; automatic later waves after six simulation seconds; bosses every fifth wave; and three campaign airstrikes. Most items remain proposed checks; the current evidence and remaining release gates are recorded separately in [the verification record](verification.md). Record build, browser, device, backend, seed, commands, observations, and failures. Sample sizes and performance targets are starting acceptance proposals.

## 1. New-player session

Recruit five people unfamiliar with this build. Give only: “Defend the outpost.” Observe without coaching through at least the first boss or a natural failure. Record time to the first deployment, accidental purchases, the first unrecognized enemy, use of pause, first leak, and purchase changes after failure.

Before explaining, ask what each visible card offers, what range means, whether recall returns every dollar, and what medics heal. Ask what “Strongest” targets and whether three airstrikes means per wave or per campaign. After a proc, ask what caused it. Before wave two, ask whether the next wave needs another launch. Hover, focus, and tap must reveal equivalent statistics without a soldier dropdown.

Starting criterion: four of five deploy and launch unaided, predict automatic continuation, and explain their first leak. Revise controls or teaching before damage. Observe the first escorted boss and medics on wave five, including whether the boss warning and airstrike exception are understood.

## 2. Skill and strategy session

Have experienced players complete legal runs with materially different formations and purchase orders. Require at least one full thirty-wave completion using only ordinary controls. Record placement, promotion, targeting, spending, remaining integrity, and whether a specialist felt mandatory. Compare improvements on a second attempt with the same seed.

Test Cadet-heavy, Gunner-heavy, Sniper-heavy, splash/control, and mixed formations at comparable costs. Compare saved, early-rescue, and unused airstrikes. A weak automated placement policy does not establish role weakness. Inspect waves 4, 9, 14, 19, 24, and 29 for excessive pre-boss pressure. Test whether Officer value is understandable.

### Current findings and the next balance experiment

The engine verification lead reports legal public-command completions with all six roles at seeds 7341, 42, and 914. Each completed thirty waves with twenty lives and three unused strikes, spending $2,435, earning $10,484, and ending with $8,149 after the $100 start. Base-rank Cadets alone lost on wave twelve; maximum-rank Cadets alone lost on wave twenty-three. Maximum-rank Gunner-only, Grenadier-only, and Sniper-only policies each finished all thirty waves with full integrity. The reported single-role results do not yet establish matched budgets, a common seed sample, or strike-use parity. See [the evidence limitations](verification.md#current-balance-findings).

Treat this as a feasible but forgiving starting balance. A mixed victory does not prove role interdependence, and perfect single-role victories leave meaningful tradeoffs unvalidated. No balance changes accompany these findings. Before tuning, retain each exact placement, purchase, targeting, and strike schedule, then compare matched-budget policies on prespecified and held-out seeds. Plot cash over time, spending, leaks, boss time in range, kill distribution, and completion variance. Separate earned-but-unspent cash from cash that arrives after the last useful purchase window.

If surplus emerges early across credible policies, test tighter later income or more valuable promotions, keeping the required starting cash and deployment prices intact. If Snipers dominate at matched cost, test denser staggered escorts and shorter overlapping coverage windows before changing the promised headshot rule. If Grenadiers dominate, test more spaced armored pressure that exposes low single-target efficiency. If Gunners dominate, inspect actual rage uptime and sustained boss damage before adjusting ordinary damage, promotion cost, or pressure. Do not create blanket immunities merely to force a purchase. If these policies already diverge under equal budgets, prioritize better encounter teaching over nerfs. Change one causal variable per experiment and preserve the six bosses, automatic cadence, three-strike allowance, and exact proc semantics.

## 3. Shot, deadline, proc, and support contracts

Use deterministic simulation checks for exact boundaries, then observe representative cases in the browser. Rage should roll only on an emitted eligible inactive shot, preserve an ordinary trigger shot, and expire at its 300-tick deadline. Verify a shot immediately before, at, and after expiry. Upgrading, pausing, leaving range, or changing speed must not refresh or extend it. Idle shot credit must never bank more than one shot.

Verify ten-percent Sniper rolls against every normal profile, including armored infantry, medics, and elites. Normal headshots kill regardless of armor; boss headshots apply five times raw damage followed by armor once. Check a target already killed by an earlier soldier, several attackers on the same tick, and last-life leaks. Each enemy pays one bounty. An enemy already crossing the exit on that tick leaks before later tower fire.

Test Engineer strongest-slow retention, two-second refresh, expiry, and the fifteen-percent boss cap. Confirm the current weaker-hit-refreshes-stronger-slow behavior. Test overlapping Officers of different ranks, removal of the strongest, movement-independent coverage, and Officer exclusion. Multiple medics can heal one another; none can heal itself or a boss. Check overlapping pulses and maximum-health caps.

## 4. RNG and balance variance

The visible client uses seed 7341; access alternate seeds through the simulation harness rather than pretending the UI offers a selector. Replay identical ordered commands and ticks to prove repeatability. Change rendering quality, particles, mute state, and motion preference: combat must remain identical. Different purchase orders may legitimately redistribute rolls from the shared combat RNG.

Begin with 200 prespecified seeds per credible strategy and a separate held-out seed set. Plot completion, first failing wave, integrity, rage count, headshot count, and useful damage where available. Include low-proc runs and uncertainty, not only mean damage. Never infer a guaranteed headshot from the ten-percent chance. Test a boss defense with poor early headshot luck. Revise ordinary damage, cost, coverage, health, or escort overlap before changing promised proc semantics.

## 5. Input stress and abuse

Check exact economy: $100 start; deployment prices $10/$25/$40/$55/$70/$85; normal bounty `1 + floor((wave − 1)/3)`; boss bounty ten times normal; clear reward `5 + floor(wave/5) × 2`. Check bounty boundaries at waves 3/4 and 27/28 and rewards at 4/5 and 29/30. Verify a supported boss on every fifth wave with authored HP; no second normal-HP multiplier applies to bosses.

Rapidly repeat deploy, upgrade, sell, target, start, pause, restart, and dialog commands. Test insufficient cash, occupied or invalid positions, maximum rank, terminal phases, and stale tower selections. None may duplicate spending, refunds, income, kills, or clear rewards. Selling always floors seventy percent of total investment; repurchasing must not create cash.

After the initial launch, reject manual start commands. A full clear begins a 360-tick intermission: no launch at tick 359, exactly one launch at 360. Pause, dialogs, hidden tabs, and graphics loss freeze it; 2× speed changes wall time, not the tick count. Kill all visible enemies before a delayed packet and kill a boss before escorts: neither ends the unfinished wave. Wave thirty never schedules wave thirty-one. Restart resets intermission and restores three strikes.

Airstrike tests: reject paused, prelaunch, intermission, empty-field, cooling-down, exhausted, and terminal activation without spending a charge. Each valid strike kills current normal enemies and removes exactly 35% maximum HP from each current boss, ignoring armor and capped by remaining HP. Future packets survive. Check one charge spent, one bounty/score payment per death, no headshot credit, no RNG roll, and no soldier-kill attribution. Check cooldown at ticks 719/720 and across pause/intermission. Three charges never replenish at a clear; the fourth activation fails.

For arcade scoring, test missing token, failed request, double submit, retry, restart during a pending request, and names containing markup. Results remain client-reported; do not claim anti-cheat validation from a successful submission. Local best should survive restart, and unavailable browser storage must not prevent play.

## 6. Readability, accessibility, and presentation

Check desktop widths around 1440 and 1920 pixels, a narrow tablet, and phones around 390 and 430 pixels in both orientations. Inspect every visible computed text size, including chart labels, tooltips, badges, dialogs, inputs, and footer. Minimum is eighteen CSS pixels; body and primary controls should generally be twenty. Fail on clipped essential text, unreadable overlap, or layout tricks that visually shrink it.

Complete roster inspection, deployment, promotion, targeting, pause, airstrike, and field-manual navigation by keyboard. Check all six cards stay visible, with readable hover/focus/tap statistics, no hover-only information, and no soldier dropdown. Check focus, names, dialog return, countdown announcements, and touch accuracy. Audit VoiceOver and report spatial-gameplay limitations; DOM controls alone do not prove full screen-reader access.

Observe silhouettes without relying on color. Verify six human roles remain distinguishable, the actual ShoeMoney robot remains faintly visible, and health, path, range, and position labels remain clear during busy combat. Run muted and reduced-motion sessions. Essential information must survive both. Confirm sounds begin only after opt-in, respect mute, and do not produce excessive stacked shot noise.

## 7. Devices, fallback, and graphics loss

Test current installed Chrome/Edge and Safari on macOS where available, plus a real iPhone/iPad and Android browser when accessible. Record exact versions and hardware; unsupported or unavailable devices are untested, not passed. Confirm the displayed backend matches the renderer actually created. Force compatibility mode with `?renderer=webgl` and compare identical simulation results.

Test neither-backend initialization failure, denied fullscreen, resize, repeated orientation changes, hidden tabs, and returning after a long absence. Force GPU device loss and WebGL context loss in controlled tests. The operation must pause, show recovery, recreate graphics once, retain CPU state, and await an understandable resume. A recovery button appearing is not proof that recovery works.

Run wave 28 and the final boss with a full squad at both speeds. Capture frame-time percentiles, memory growth across repeated restart/recovery cycles, CPU responsiveness, and audio behavior. Initial targets are responsive controls and approximately sixty frames per second on the desktop test machine, with thirty on tested mobile hardware; report actual results and adjust effects or resolution before changing combat. Do not assert universal device performance.

## 8. Acceptance evidence

Archive a legal victory covering six escorted bosses, a loss/retry, distinct strategies, automatic transitions, airstrike limits, economy/proc checks, six-card desktop/mobile screenshots, backend evidence, and graphics recovery. Present comparisons through interactive ECharts, with logs as drilldowns. List failed, unavailable, and incomplete checks. Approval requires visible play evidence.
