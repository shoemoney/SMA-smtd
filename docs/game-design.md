# ShoeMoney Tower Defense: game design and delivery plan

**Operation Iron Dividend · Guardian Outpost**  
Design snapshot: September 25, 2026; revised for the user's latest economy, automatic waves, six bosses, airstrikes, and visible roster rules.

This plan distinguishes the **implemented first playable release** from expansions. “Implemented” means behavior exists in source, not that balance, usability, performance, or deployment has passed acceptance. The release record must identify completed checks.

The canonical game values live in [content.ts](../src/content.ts), the rules in [game.ts](../src/game.ts), and the numeric reference in [Starting balance data](balance-data.md). The user's latest requirements take precedence over earlier proposals: start with **$100**, Cadet **$10**, progressively higher deployment prices, automatic later waves, a boss every fifth wave, and **three airstrikes for the entire campaign**. Other authored numbers remain **starting balance values**. The research report's earlier wave grammar is archival, not the current recommendation.

## 1. Pitch, audience, and scope

Defend a winding supply road with six human military specialists. Buy the right squad, choose positions that give them useful time on target, promote them through three upgrades, and survive thirty authored attacks. The payoff is a visible formation working together: a Grenadier breaks a crowd, an Engineer holds survivors in range, a Gunner bursts into rapid fire, and a Sniper lands a decisive shot.

The audience is a browser arcade player who should not need genre expertise. Returning strategy players should find depth in placement, purchases, coverage, and targeting. Phone players need time to read and make the same decisions as desktop players. The first release uses a fixed route and numbered positions.

The present scope includes one battlefield, sixteen deployment positions, six visible soldier cards, four ranks per soldier, seven enemy profiles, thirty automatically progressing waves after the initial launch, six escorted bosses, three campaign airstrikes, pause, two speeds, targeting, selling, sound, a field manual, restart, results, and local best-score storage. Optional arcade score submission remains browser-reported, not a verified replay or authoritative simulation.

There is no implemented campaign checkpoint save, roster unlock economy, difficulty selector, endless mode, map editor, multiplayer, aim-controlled hero, consumable shop, or early-wave calling. Those features must not appear as completed promises in promotional copy. Local best-score storage does not preserve a live squad or wave.

## 2. Fiction and visual identity

Guardian Outpost protects a supply corridor from a fictional rogue force. Lieutenant Flint, Captain Iron, Major Ash, Colonel Steel, Brigadier Storm, and General Redline lead escorted attacks on waves 5, 10, 15, 20, 25, and 30. These six commanders share a gameplay profile with individually authored health; their names do not imply six unique ability kits.

The renderer constructs human figures with heads, torsos, limbs, uniforms, helmets, boots, and distinct equipment. Because the camera is a steep top-down view, identity is carried by stance and by shapes offset across the ground plane; vertical or centred props foreshorten into near-invisible dots and are not used for identification. The Cadet carries a pistol with a rifle slung diagonally across the back; the Gunner an automatic weapon over a splayed bipod in a wide braced stance; the Sniper a long barrel with a front bipod and scope tower in a low crouch; the Grenadier a shoulder-mounted launcher tube; the Engineer an oversized field pack rising above the head line with a forward hunch; the Officer command headgear, a holstered sidearm and a raised arm. Silhouettes remain legible without color. The inspector and visual marks communicate rank without requiring tiny uniform details.

Every enemy profile carries its own shape cue rather than a scale factor applied to one shared body. Scouts carry a hip kit pouch, runners lean forward with trailing speed fins, and swarm units hunch into a wide crouch with stubby arms, so the three light profiles are separable without color. Armored infantry gain broad shoulder blocks held close to the body, elites a crest swept back off the head, medics a supply pack with a cross, and bosses a much heavier tracked vehicle silhouette with hull, turret and cannon. These are fictional units; story expansion should avoid implying affiliation with real present-day conflicts or armies. The present tone is an arcade defense operation, with stylized effects rather than gore.

ShoeMoney branding is integral to the composition. Use the supplied logo and robot artwork. The robot stays faded but visibly identifiable behind the battlefield; it is neither a replacement for the six human soldiers nor an opaque foreground obstruction. The source includes a dedicated decorative backdrop, a transparent renderer, and a subdued tactical palette. Acceptance requires checking the rendered result because layer opacity alone does not prove the robot remains visible beneath the board.

The interface uses dark navy surfaces, bright cyan selection, warm supply indicators, and clear enemy contrast. Actual Font Awesome icons represent actions and roles. Generic arrows, decorative starbursts, and emoji replacements are outside the visual direction. Effects should make attacks and status changes readable without obscuring numbered positions or enemy health.

## 3. The player loop and state model

The opening state gives the player **$100**, twenty base integrity, and all six soldier types available. All six remain visible as cards above the battlefield; soldier selection never uses a dropdown. Hovering a card exposes its statistics, while keyboard focus and tapping provide the same information. Select a card, then an empty numbered position. Deployment spends dollars immediately. Occupied positions select the existing soldier for inspection, promotion, targeting, or recall.

Launch the operation once when ready. Soldiers attack automatically, and subsequent waves begin automatically after a six-simulation-second intermission following a full clear. There is no repeated start prompt or manual skip of later countdowns. Read incoming information during combat or intermission; pause freezes the countdown and provides planning time. Deploy, promote, sell, and retarget during combat. A clear requires the entire spawn queue and all enemies to resolve. Wave thirty wins if integrity remains; zero integrity loses immediately.

| State | Entry | Allowed decisions | Exit and consequence |
| --- | --- | --- | --- |
| Initial preparation | New session, before wave one | Deploy, promote, sell, retarget, inspect, pause | One manual launch starts the campaign without a dollar cost |
| Intermission | Full clear of waves 1–29 | Squad changes, inspect, pause | Next wave starts automatically after six simulation seconds |
| Combat | Initial launch or expired intermission | Squad changes, pause, speed, eligible airstrike | Full resolution grants reward; zero integrity ends the run |
| Paused | Pause control, dialog, hidden tab, or graphics interruption | Inspect; application controls determine which squad actions remain reachable | Explicit resume or appropriate dialog close restores simulation |
| Victory/defeat | Final clear or exhausted integrity | View results and restart; optional score submission | Restart resets squad, economy, combat, and RNG |

The simulation advances at sixty ticks per second. The six-second intermission is 360 ticks; at 2× speed it takes roughly three wall-clock seconds. Pause freezes intermission, rage, and airstrike cooldown. Unpaused intermission advances those timers. Waiting earns no interest. Restart restores the seed, $100, integrity, and all three airstrikes; ordinary wave transitions never replenish airstrikes.

## 4. The six soldiers and exactly three promotions

Each role has one fixed ladder: base rank plus three sequential upgrades. Prices below are incremental; the final column includes deployment and all promotions. Complete damage, rate, range, splash, slow, and aura values for all twenty-four ranks are in [balance-data.md](balance-data.md).

| Role | Base and three upgrades | Incremental dollars | Full investment |
| --- | --- | --- | ---: |
| Cadet | Cadet; Private; Corporal; Sergeant | 10; 10; 40; 140 | 200 |
| Machine Gunner | Machine Gunner; Fireteam Gunner; Squad Gunner; Master Gunner | 25; 20; 70; 220 | 335 |
| Sniper | Sniper; Marksman; Sharpshooter; Scout Sniper | 40; 25; 90; 280 | 435 |
| Grenadier | Grenadier; Assault Grenadier; Demolition Specialist; Ordnance Chief | 55; 25; 90; 260 | 430 |
| Combat Engineer | Combat Engineer; Sapper; Field Engineer; Chief Engineer | 70; 20; 70; 220 | 380 |
| Field Officer | Field Officer; Lieutenant; Captain; Major | 85; 25; 90; 280 | 480 |

**Cadet.** The low-cost pistol establishes the opening and catches damaged stragglers. Its rate remains two shots per second across every rank, while damage progresses from 9 to 55 and range from 3.4 to 4.4. It has no proc, aura, splash, slow, or hidden special effect at any rank. Its test is economic relevance: a cheap rear guard should sometimes be a better correction than saving for another expensive specialist.

**Machine Gunner.** Sustained single-target fire is its identity. Starting damage is 12 at three shots per second; final damage is 64 at four. Its requested five-percent rage is explained below. A $25 deployment uses one quarter of the opening budget. Test whether several cheap Gunners crowd out mixed openings. Adjust ordinary damage, range, or other starting balance values before changing the promised proc contract or required economy.

**Sniper.** High damage, slow cadence, and long range reward valuable targets and long sightlines. Damage progresses from 95 to 490, rate from 0.5 to 0.65, and range from 6 to 7.2. Its headshot can remove any normal enemy, including armor, medic, and elite. Normal hits still receive the same armor reduction as other attacks. The weapon has no hidden armor penetration. Its weaknesses should be target throughput and wasted overkill, not undisclosed immunity exceptions.

**Grenadier.** Area damage resolves around the selected enemy immediately. Damage progresses from 35 to 195, rate from 0.8 to one, and splash radius from 1.5 to 2.3. Each living enemy inside that radius is processed once and receives its own armor mitigation. There is no projectile travel simulation, ballistic miss, or secondary random proc. A visual blast is feedback for the resolved damage, not another source of damage.

**Combat Engineer.** Low direct damage buys allies more firing time. The normal-enemy slow increases from 35% to 50% across ranks and lasts two seconds after a hit; boss slow is capped at 15%. A weak direct-damage chart cannot establish that this role is weak. Evaluate useful damage gained by allies, prevented leaks, and the opportunity cost of its position.

**Field Officer.** A sidearm and local damage aura reward a compact formation. Aura strength progresses through 15%, 20%, 25%, and 30%; its radius equals that rank's listed range. Only the strongest in-range Officer applies. Officers never buff themselves or other Officers. The aura changes ordinary damage only: it does not improve rate, proc probability, splash radius, slow, another aura, or bounty.

## 5. Exact combat contracts

### Attacks, targeting, and damage

Soldiers select among living in-range enemies. “First” means greatest progress along the route, “Strongest” means greatest **current HP**, and “Weakest” means least current HP. Ties use stable enemy IDs. There is no direct enemy-click targeting or dedicated medic-priority policy. Therefore a briefing about focusing medics must not imply a control that does not exist; formation, damage distribution, and the three actual policies are the available tools.

Shot credit accumulates according to rate during combat and is capped at one while idle. A new soldier begins with an available shot. No firing time can be banked into an unlimited burst while targets are absent. Ordinary useful damage is `min(remainingHP, max(1, rawDamage × (1 − armor)))`. Killing credits the bounty once. Dead enemies are excluded from subsequent damage and target searches. Movement and leaks resolve before towers attack on a tick, so an enemy crossing the exit cannot be rescued by a later shot in that tick.

### Machine Gunner rage

Each emitted shot while rage is inactive makes one five-percent roll. The trigger shot is ordinary. Rage then lasts 300 ticks, with subsequent shot-credit accumulation at five times the rank's ordinary rate. Active rage cannot roll, refresh, stack, extend, or queue. Expiry restores ordinary cadence; no extra recovery cooldown exists. An upgrade changes the current rank's stats but preserves the active deadline. Selling removes the unit and its state.

This ability is a substantial sustained contribution. With continuously available targets and ordinary rate `r`, an analytical approximation gives uptime `5 / (5 + 1/(0.05r))` and average rate multiplier `1 + 4 × uptime`. It is an estimate, not observed campaign damage. Timing boundaries, overkill, range, and idle time change actual value. Rate upgrades increase both baseline throughput and the rate of future eligible proc opportunities.

### Sniper headshot

Every emitted Sniper shot makes one independent ten-percent roll. Success immediately kills a normal enemy regardless of remaining HP or armor. A boss instead receives five times that shot's raw damage, then the usual armor reduction. The Officer multiplier is included once before that calculation. The effect is single-target and pays only one bounty.

Against a boss, mean pre-mitigation damage is `0.9D + 0.1(5D) = 1.4D`. Across ten independent shots, the probability of at least one headshot is `1 − 0.9^10`, about 65%. A workable defense must not depend on a guaranteed proc that the rules do not provide. Very large normal-enemy health pools favor instant kills disproportionately; test late Sniper-heavy builds before adding more health inflation.

### Support and healing

Engineer hits retain the strongest slow factor already present and reset the expiry to 120 ticks after the latest hit. In this implementation, a weaker Engineer hit can therefore prolong an existing stronger slow. That is the actual contract, not independent expiry tracking per source. Boss speed can be reduced by at most 15%. If per-source expiration becomes desirable, it is a deliberate future rules change requiring new tests.

A medic heals every second, first healing one second after spawning. Each pulse restores 2% of each other normal enemy's maximum HP within 2.2 units, capped at maximum health. It cannot heal itself or a boss, but can heal another medic. Multiple medics each contribute their own pulse; there is no shared healing cap. This makes medical formations an important stress and balance test.

One seeded RNG stream is shared by eligible combat proc rolls. The visible client starts with seed 7341; it currently has no seed selector. Cosmetic effects do not consume combat randomness. Identical ordered commands and tick advances reproduce combat, but changing purchase order can change which soldier receives later rolls. Per-soldier streams, replay files, and persisted checkpoints remain future work.

### Airstrikes

The campaign starts with **three charges total**, not three per wave. An airstrike requires active, unpaused combat, at least one living spawned enemy, a charge remaining, and an expired twelve-simulation-second cooldown. A valid activation consumes one charge and sets a 720-tick rearm deadline. Rejected activations consume nothing.

The strike kills every normal enemy currently spawned. Each currently spawned boss instead loses 35% of its maximum HP, capped by remaining HP and ignoring armor. It does not affect future spawn packets, cancel a wave queue, heal the base, or grant Sniper headshots. Kills use the normal once-only bounty and score path; damage contributes to run totals without attributing it to a soldier. Cooldown continues across unpaused intermission and freezes during pause. Three strikes can theoretically remove more than one full boss health bar, but cost the entire campaign reserve and require rearming between uses.

## 6. Enemy roles and boss counterplay

Scouts are the baseline coverage test. Runners trade durability for speed. Swarms test target throughput and splash placement. Armored Infantry receive 30% ordinary damage reduction and cost two integrity on escape. Elites combine more health, faster movement than armor, and 20% reduction; they also cost two integrity. Medics create a support-target problem. None of these six normal profiles becomes a boss because it gains wave-scaled health.

Commanders have 25% armor, speed 0.85, a five-integrity leak penalty, and ten times their wave's ordinary bounty. Explicit maximum HP is 748, 3,003, 5,586, 11,470, 18,379, and 31,500 on waves 5, 10, 15, 20, 25, and 30 respectively. These values are not multiplied by the normal wave HP factor again. Every boss wave contains supporting enemies. Bosses do not fire at soldiers, disable them, spawn enemies dynamically, or enter invulnerability. Medics heal escorts but cannot heal commanders.

Counterplay is sustained coverage, strong ordinary damage, Sniper bursts, and the Engineer's modest boss slow. Soldiers cannot be damaged or killed in the current simulation. Killing a boss does not complete a wave while an escort remains or a scheduled group has not spawned. The different arrival times let fast escorts move ahead of a slow commander; map-distance arrival times, rather than spawn offsets alone, determine which threats overlap in a kill zone.

## 7. The implemented thirty-wave campaign

This is the **actual campaign**, not the earlier research sketch. The table records each wave's contact count, HP multiplier, clear reward, and design purpose. Exact enemy groups, spawn offsets, and intervals are in [All 30 wave schedules](balance-data.md#all-30-wave-schedules). These values should be generated or checked against content data whenever balance changes.

| Wave and name | Contacts | Normal HP factor | Clear dollars | Purpose and evaluation question |
| --- | ---: | ---: | ---: | --- |
| 1 First Contact | 8 | 1 | 5 | Teach deployment and long coverage; can a novice begin unaided? |
| 2 Running Patrol | 12 | 1.05 | 5 | Introduce runners beside familiar scouts; expose an entrance-only defense |
| 3 Close Formation | 18 | 1.1 | 5 | Introduce dense swarm traffic and the value of splash |
| 4 Steel Helmets | 14 | 1.15 | 5 | Introduce partial armor without damage immunity |
| 5 Lieutenant Flint | 16 | 1.2 | 7 | First boss plus scouts and medics; test early warning and reliable damage |
| 6 Double Time | 20 | 1.3 | 7 | Two runner sections reinforce coverage and slow value |
| 7 Packed Road | 30 | 1.4 | 7 | Mix crowd pressure with armor |
| 8 Veteran Patrol | 17 | 1.5 | 7 | Introduce elites beside runners and invite promotion |
| 9 Triage Line | 31 | 1.6 | 7 | Test armor, healing, and splash together before the boss |
| 10 Captain Iron | 23 | 1.65 | 9 | Captain Iron, scouts, and medics; second boss and airstrike-reserve decision |
| 11 Broken Convoy | 34 | 1.8 | 9 | Shift back to scouts and runners; check post-boss affordability |
| 12 Armored Screen | 20 | 2 | 9 | Durable normal targets reward appropriate priorities |
| 13 Flood the Road | 56 | 2.2 | 9 | Two distinct swarm packets test splash and sustained throughput |
| 14 Medical Escort | 24 | 2.4 | 9 | Armor and multiple medics test healing control |
| 15 Major Ash | 35 | 2.6 | 11 | Third boss with runners and elites tests simultaneous fast pressure |
| 16 Siege Infantry | 42 | 2.8 | 11 | Extended armor traffic rewards formation support |
| 17 Second Wind | 25 | 3 | 11 | Elite/medic synergy tests mutual healing and priority limitations |
| 18 Rush and Crush | 60 | 3.2 | 11 | Swarm front followed by armor changes the damage demand |
| 19 Command Guard | 52 | 3.4 | 11 | Mixed guards test readiness before the fourth boss |
| 20 Colonel Steel | 35 | 3.6 | 13 | Colonel Steel with armor and elites; fourth boss tests sustained coverage |
| 21 Deep Patrol | 54 | 3.9 | 13 | Long mixed sequence examines coverage and supply reserves |
| 22 Relentless Rush | 58 | 4.2 | 13 | Repeated runners and elites; speed itself remains unchanged |
| 23 Living Shield | 72 | 4.5 | 13 | Heavy medic support behind armor exposes targeting tradeoffs |
| 24 Crowded Front | 84 | 4.8 | 13 | Large swarm followed by elite spearhead |
| 25 Brigadier Storm | 65 | 5.1 | 15 | Fifth boss with armor, elites, and medics tests reserve discipline |
| 26 Night March | 80 | 5.4 | 15 | Scouts, runners, and elites create continuous target demand |
| 27 Final Reinforcements | 52 | 5.7 | 15 | Concentrated elites and medics test late healing loops |
| 28 Overrun Attempt | 130 | 6 | 15 | Largest contact count: crowd, armor, and runner tail |
| 29 General's Guard | 88 | 6.3 | 15 | Final combined-arms exam and spending decision |
| 30 General Redline | 117 | 6.6 | 17 | General Redline plus elites, swarm, and medics; sixth boss requires the whole queue resolved |

The intended arc is introduce, reinforce, combine, then examine, within the required five-wave boss cadence. Wave five combines the first commander and medical support, making it an important teaching test. Six-second intermissions maintain automatic momentum; pause supplies optional thinking time. Neither feature proves that the campaign has adequate recovery in its encounter pressure. Tune supporting formations and income without removing required bosses or returning to repeated manual starts.

## 8. Progression, economy, and score

Normal HP is `round(baseHP × waveHPFactor)`. Boss HP comes from the explicit six-wave HP table. Movement speed, armor, and leak damage remain profile values. There is no hidden speed ramp. Dollar bounties scale by wave, not enemy type: `ordinaryBounty = 1 + floor((wave − 1) / 3)` and `bossBounty = 10 × ordinaryBounty`. Thus normal kills pay $1 on waves 1–3, $2 on 4–6, and reach $10 on 28–30.

Cash equals $100 plus kill bounties, clear grants, and sell refunds, minus deployments and promotions. Each death pays once, including an airstrike kill; escapes pay nothing. Clear reward is `5 + floor(wave / 5) × 2` dollars, paid only after the queue and living enemies resolve. It begins at $5 and reaches $17 on wave thirty. Selling returns `floor(totalInvested × 0.70)`, including before launch. There is no free deployment undo, so test touch mistakes carefully.

Score gains `bounty × 10` per kill, `waveNumber × 100` per clear, and `remainingIntegrity × 500` on final victory. Dollars left and elapsed time do not directly award score. Airstrike kills receive the same kill score, once. A leak loses its bounty and kill-score opportunity as well as integrity. Starting dollars and refunds are separate from kill/clear earned-stat totals.

Promotions strengthen an existing position; purchases add firing locations. There are no account-level power bonuses, grind requirements, random unlocks, or persistent ranks. A new browser profile must be able to complete the campaign using this economy.

The arcade submission form obtains a run token at the first wave on the arcade hostname and submits the terminal browser-reported result after the player enters a name. Local best works separately and storage failure must not end play. Endpoint availability, duplicate submission handling, and displayed ranking require integration verification; a client form is not proof of a trustworthy competitive leaderboard.

## 9. Camera, input, interface, accessibility, and audio

The battlefield uses an orthographic camera without orbit, pan, or tactical zoom. Resize refits the frustum to the map plus a constant margin, and phone-width layouts rotate the framing to portrait, so the whole route stays on screen at every aspect ratio; the player never gains a camera control. Deployment pads rest as small studs and expand into numbered chips on hover, focus or selection, so a deployed soldier is not hidden behind its own label, while the touch target keeps a constant size and the position number stays in the accessible name. Resize preserves the map; DOM buttons represent positions. Six visible cards support equivalent hover, focus, and tap inspection. There is no soldier dropdown; targeting uses a separate select. Unaffordable cards are gray and cannot select a deployment type until the displayed funds cover their cost. Hover and keyboard focus still expose their statistics. Cards regain their color and availability as income arrives. Keys one through six select soldiers; A requests an airstrike. Space launches wave one or toggles pause afterward outside focused control activation. Escape clears selection. Dialogs and fullscreen have explicit controls.

The DOM owns readable text, buttons, forms, briefings, dialogs, and the HUD. The current stylesheet starts with an eighteen-pixel root and twenty-pixel body. The product requirement is a hard minimum of eighteen computed CSS pixels for all readable text, including tooltips, badges, chart labels, and mobile metadata. Controls should generally use twenty. Reflow and scroll are preferable to shrinking type. Verify actual rendered sizes, contrast, focus, and hit areas; source declarations alone are not acceptance evidence.

The field manual provides interactive ECharts for wave composition and equal-rank soldier damage comparisons, followed by optional tables. It labels analytical special-effect estimates and excludes context-dependent splash and support value from the direct-DPS comparison. Counts describe composition rather than difficulty. Future measured balance charts should use synchronized wave axes and separate measured traces from forecasts.

Sound begins disabled and is enabled by a user gesture. Verified CC0 pistol, rifle, and burst recordings supply the firearm layer. Each of the six roles resolves to a different combination of clip, playback rate, filter and level, so no two soldiers share a firing voice; the shaping is procedural and adds no per-role sample files. The Grenadier is a launcher thump layered with a synthesized detonation rather than a generic impact tone. The production arcade also reuses its existing suppressed-shot and casing cues; local builds and forks use a filtered sniper treatment and procedural casing fallback when those hosted cues are unavailable. Original synthesized feedback covers enemy deaths, boss deaths, boss arrivals, Berserker Rage procs, blasts, headshots, leaks, deployment, promotions, and wave clears. Shot sounds are throttled with bounded simultaneous voices, delayed casings, and master compression. There is no voiced campaign or adaptive musical score. See ASSETS.md and the audio credits for provenance. Visual information must remain sufficient when muted. Reduced-motion preference is read at launch and has an in-game override; status visibility must survive the reduction.

WebGPU is preferred; the shared scene can use WebGL2 compatibility rendering. The active backend is labeled. Initialization failure shows an explicit unsupported state. Graphics loss pauses the session and offers battlefield restoration; hidden tabs also pause. Recovery should preserve the current CPU state, while restoration and resume remain visible player actions. Actual fallback and loss recovery require testing on delivered builds. See the [Three.js renderer guide](https://threejs.org/manual/pages/webgpurenderer) and [MDN GPU device-loss documentation](https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/lost).

## 10. Five-component evaluation of the important mechanics

This assessment uses **Clarity, Motivation, Response, Satisfaction, and Fit**. These are design questions, not numerical quality scores. A listed strength is a reason to test, not a substitute for observing players.

| Mechanic | Clarity | Motivation | Response | Satisfaction | Fit |
| --- | --- | --- | --- | --- | --- |
| Deployment | Price, numbered pad, and range preview | Spend to protect an exposed segment | Immediate command result; invalid actions refuse safely | Visible soldier and optional placement tone | A commander assigning a human squad |
| Promotion | Next rank and incremental price | Improve an existing strong position | Immediate stats; no timer reset | Rank change plus upgrade tone | Military advancement with understandable equipment growth |
| Rage | Rule text and active visual ring | Sudden power under sustained pressure | Automatic roll; player shapes exposure | Faster visible fire and distinct tone | Gunner identity; avoid reading it as an unexplained manual skill |
| Headshot | Normal-kill/boss-damage distinction | Remove a valuable threat | Target policy affects opportunity, not the roll | Distinct event and tone | Precision role; ordinary damage must still matter |
| Engineer | Slow amount and boss exception | Prevent leaks and help allies | Hits apply immediately | Visible slowed status; indirect benefit needs observation | Battlefield control rather than magic stun-lock |
| Officer | Radius and strongest-only wording | Improve a deliberately arranged formation | Recomputed from current nearby Officers | Contribution is currently less obvious than direct kills | Local command support; no amplification loop |
| Wave progression | Initial launch, visible countdown, boss warnings | Keep the defense ready for automatic pressure | Later starts automatic; pause freezes countdown | Predictable arrival and clear feedback | Continuous arcade operation |
| Airstrike | Three-charge counter, cooldown, boss exception | Trade a scarce reserve for immediate relief | One valid activation; invalid inputs spend nothing | Battlefield clear and distinct strike feedback | Limited military air support |

Investigate response and clarity before raising damage. If a player cannot select the desired occupied pad, a cheaper upgrade will not fix the experience. If they cannot see that a medic is healing others, adding more damage conceals the rule instead of teaching it. A future support-contribution indicator should be justified by observed confusion.

## 11. Balance experiments and adjustment direction

Use equal investment, legal purchase chronology, identical content versions, and shared seed sets when comparing strategies. Record success, first failure, integrity, role damage, kills, proc counts, spending, idle time, overheal, overkill, and useful support contribution where instrumentation supports it. The present session counters do not yet measure every proposed metric; add instrumentation before claiming those results.

| Starting hypothesis | Micro test and provisional acceptance | Adjustment direction if it fails |
| --- | --- | --- |
| Required $100 opening and $10 Cadet teach a fair opening | Observe five new players; four deploy and launch unaided, understand automatic continuation, and explain their first leak | Fix card information and countdown clarity first; tune enemy spacing/coverage while preserving required dollar values |
| Six roles produce meaningful alternatives | Test several credible equal-budget formations over a preselected seed set; require two materially different viable campaign builds | Change cost, range opportunity, or ordinary damage of a dominant role; preserve requested procs |
| Armor is understandable partial resistance | Ask players to predict an armored hit and a headshot before resolving them | Improve explanation and enemy distinction before changing armor |
| Medic groups create decisions rather than stalemates | Measure survival time and health restoration in waves 5, 17, 23, and 27; no indefinite stable healing loop in credible builds | Reduce medic count, pulse amount/radius, or mutual-healing interaction |
| Rage provides drama without deciding every result | Compare proc counts, uptime, and outcomes across at least 200 prespecified seeds as a starting sample | Adjust Gunner price/damage/range and encounter geometry; do not secretly alter chance |
| Final boss is beatable without a lucky first volley | Test conservative mixed defenses on a held-out seed set and inspect poor-proc runs | Reduce boss HP, improve ordinary damage coverage, or adjust escort overlap |
| Promotions compete with expansion | Compare upgrading a strong position against buying a new one at similar budget | Adjust incremental prices or coverage value; do not equalize every stat |
| Three airstrikes offer a meaningful reserve | Compare early rescue, saved boss use, and no-strike runs; verify every activation's cost and victims | Tune supporting encounters and clarify the boss exception; preserve campaign charges, cooldown, and damage contract |

These sample sizes and thresholds are **starting acceptance proposals**, not measured results or statistical guarantees. Hold back seeds from tuning, report uncertainty, and include losing traces. Avoid drawing dominance conclusions from a weak scripted strategy. Present the comparison interactively before raw tables, with the same wave scale and clear labels.

## 12. Phased roadmap and acceptance gates

**First playable verification.** Verify desktop/phone play, all six visible cards and equivalent inspection, new economy, automatic countdowns, six escorted bosses, airstrike limits, exact proc rules, a legal thirty-wave completion, an alternate strategy, restart, pause, ranks, audio, manual, fallback, and graphics recovery. Confirm human silhouettes and faded robot in screenshots. Follow the [playtest plan](playtest-plan.md).

**Balance and teaching pass.** Evaluate early healing, pre-boss pressure, late Sniper/Gunner dominance, Engineer refresh behavior, and Officer visibility. Accept only with reproducible seed and purchase records, understandable novice failures, and multiple viable formations. Add measured contribution charts before claiming parity among roles. Tune counts and timing before escalating HP further.

**Campaign persistence.** Planned checkpoints must preserve RNG, tick, spawn queue, intermission deadline, airstrike charges/rearm deadline, enemies, statuses, shot credit, investments, economy, and content version. Acceptance requires identical resumed outcomes, atomic saves, corruption handling, and migration rules. Wave number and cash alone are insufficient. A future retry policy must define score eligibility.

**Additional operations and difficulty.** New maps should change useful coverage rather than recolor the same route. Difficulty settings should state their changed parameters and preserve readable mechanics. Acceptance requires separate economy and seed testing for each mode, with no unannounced speed or immunity change. Distinct boss abilities need previews, counterplay, and dedicated tests before promotion as new boss designs.

**Endless and challenge play.** Planned endless mode requires explicit scaling, performance limits, anti-stalemate rules, and scoring. Roster or spending challenges can reuse content. Neither should silently replace the campaign's automatic waves, boss cadence, or three-strike reserve. Early calling is absent; adding it would require a separately approved rules change.

**Trustworthy competition.** A future verified board needs server replay or an equivalent authoritative validation design, versioned rules, duplicate-run protection, abuse handling, and honest separation from browser-reported scores. Cosmetics should never modify a run's RNG or combat. Multiplayer is a later product decision, not an implicit extension of the current local session.

## Research basis

The complete thirteen-source study is linked above. Three particular primary sources inform this plan: George Fan's [GDC tutorial slides](https://media.gdcvault.com/gdc2012/slides/Design%20Track/Fan_George_How%20I%20Got.pdf) support teaching through short, contextual actions; the [Defense Grid manual](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/18500/manuals/manual_english.pdf?t=1721059385) demonstrates the importance of coverage and enemy information; Robot Entertainment's [Orcs Must Die! 3 balance update](https://robotentertainment.com/news-archive/2023/5/31/orcs-must-die-3-update-1210-2b5a6) demonstrates that prices, preparation time, and resistance strength are independent tuning tools. Sources were accessed September 25, 2026. Our roster, schedule, formulas, and acceptance proposals are original project decisions, not source-backed claims of optimal balance.
