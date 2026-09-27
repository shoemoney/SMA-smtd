# ShoeMoney Tower Defense technical specification

Operation Iron Dividend · Guardian Outpost · September 26, 2026

## 1. Overview and document scope

ShoeMoney Tower Defense is a single-player military tower-defense game for the browser. Human soldiers occupy fixed deployment positions beside one authored route. Enemies follow that route toward headquarters. The player spends kill income and wave rewards on deployment and three sequential promotions for each soldier.

The campaign contains six soldier roles, 24 rank definitions, seven enemy classes, 30 waves, six escorted bosses, 16 deployment positions, and three airstrikes per run. The complete authored schedule contains 1,372 enemies, including six bosses. The route is 53 world units long. A run that kills every enemy and clears every wave earns $10,484 before the $100 starting balance and any recall refunds. Those totals are calculated from the current content definitions.

The game is available at [ShoeMoney Arcade](https://arcade.shoemoney.com/smtd/). Its public software repository is [shoemoney/SMA-smtd](https://github.com/shoemoney/SMA-smtd). The package version is `0.1.0`. This document describes source revision `2f9db56abfb75d0ccae5838dc64b70afb92c8fe2`, including the accepted promotion-price change. It records the Arcade API from the companion checkout inspected on September 26, 2026.

The specification covers runtime behavior, data, interfaces, visual presentation, audio, persistence, build configuration, hosting, tests, and known limits. Numerical tables come from the exported content objects. Earlier design proposals do not override the implemented source. The recorded deployment is release `20260926045134-f15e5c`; that identifier describes the verified release record, rather than an assertion that no later release can exist.

### Scope boundaries

The shipped game has one map and one 30-wave campaign. It has no free-form maze construction, path editing, flying enemies, branching upgrade trees, persistent power upgrades, difficulty selector, endless mode, co-op, PvP, paid purchases, campaign save, or authoritative server replay. The enemies are stylized military figures. The request's word "monsters" corresponds to the seven implemented enemy classes.

Bosses have distinct names and authored health totals. They share the same movement, armor, leak damage, and combat rules. No boss-specific ability script, phase transition, summon ability, or hidden immunity exists.

## 2. Key concepts and architecture

The CPU simulation owns combat. Three.js draws a scene from a copied simulation frame. DOM elements own text, controls, dialogs, statistics, and deployment hit targets. Audio consumes combat events. Rendering and sound do not decide combat outcomes.

| Component | Responsibility | Primary source |
| --- | --- | --- |
| Content | Units, four-rank ladders, enemies, route, pads, boss health, and waves | `src/content.ts` |
| Session | Commands, clock, RNG, movement, targeting, damage, statuses, economy, and phases | `src/game.ts` |
| Shared types | Data records and boundaries between the session, app, and renderer | `src/types.ts` |
| App | DOM, keyboard and pointer input, animation scheduling, local best, and scoreboard client | `src/main.ts` |
| Battlefield | Renderer selection, meshes, camera, lighting, effects, projection, and cleanup | `src/battlefield.ts` |
| Audio | Recording fetches, procedural sounds, source limits, filtering, and mute | `src/audio.ts` |
| Field manual | Rules, wave chart, soldier chart, and content tables | `src/manual.ts` |
| Styles | Layout, readability, status colors, mobile controls, and motion preferences | `src/style.css` |
| Balance tooling | Legal command policies, wave ledgers, replay, summary, and comparison checks | `tools/balance.ts`, `tools/comparison.ts` |
| Shared Arcade API | Run tokens and client-reported scoreboard persistence | Companion `SMA-arcade/api/server.mjs` |

The session boundary exposes `command(command)`, `advance(ticks)`, and `frame()`. The app sends a command, advances a bounded number of ticks, reads a frame, and passes it to the renderer and audio layer. The browser can reconstruct the renderer without replacing the session. A full page reload creates a new session.

The map uses the horizontal `x,z` plane. Distances are Euclidean world units. The UI formats range with `m`; this is the game's distance convention. The combat calculation does not model real weapon ballistics, terrain occlusion, elevation, cover, reloads, ammunition, friendly fire, or soldier health.

Source references are listed in section 24. The simulation, presentation, and network boundaries are documented separately below.


## 3. Campaign constants and economy

| Rule | Implemented value |
| --- | --- |
| Starting funds | $100 |
| Starting base integrity | 20 |
| Soldier roles | Six |
| Rank ladder | Base rank plus three purchased promotions |
| Deployment capacity | One soldier on each of 16 fixed pads |
| Campaign | 30 authored waves |
| First wave | Manual launch |
| Later waves | Automatic launch after a six-simulation-second clear intermission |
| Escorted boss waves | 5, 10, 15, 20, 25, and 30 |
| Airstrike reserve | Three charges for the entire run |
| Airstrike cooldown | 12 simulation seconds |
| Ordinary kill bounty | `1 + floor((wave - 1) / 3)` dollars |
| Boss kill bounty | Ten times that wave's ordinary bounty |
| Clear reward | `5 + 2 * floor(wave / 5)` dollars |
| Recall refund | `floor(0.7 * total investment)` dollars |
| Simulation rate | 60 ticks per simulation second |
| Play speed | 1x or 2x |

Funds are integer dollars. Deployment and promotion costs are incremental purchases. Rank 3 means the fourth displayed rank, because internal ranks begin at zero. A promotion does not require a certain wave or kill count. There is no interest, generator, ammunition charge, early-wave bonus, cash cap, or passive income.

The normal bounty increases every three waves. All ordinary enemy classes in the same wave pay the same amount, including armored enemies, medics, and elites. The enemy definition's base `bounty` field is descriptive content; the spawn path assigns the actual scaled value through `waveBounty`.

Kills pay once. Splash, a headshot, and an airstrike do not multiply the bounty. A leak pays no kill bounty. A cleared wave grants its clear reward even if enemies leaked, provided the base survived. Selling a soldier returns the rounded refund but does not add to `stats.earned` or subtract from `stats.spent`; those counters retain gross income and purchases.

The refund uses JavaScript `Math.floor(invested * 0.7)`, including binary floating-point behavior. An investment of $170 returns $118, and an investment of $90 returns $62, because those products fall just below 119 and 63. The tables retain these actual results.

The cash identity is `cash = 100 + earned + recall refunds - spent`. For a leak-free full campaign, ordinary and boss kill income totals $10,172 and clear rewards total $312. There are no recall refunds in that total. Maximum authored income does not include the starting $100.

## 4. Complete soldier specifications

Damage is nominal health removed before armor, an Officer aura, or a special effect. Rate is the configured shots per simulation second. Range and splash use world units. Nominal DPS is `damage * rate` against one continuously available unarmored target with no proc, aura, or overkill. Tick scheduling, coverage, retargeting, overkill, healing, and proc state affect actual useful damage.

Every table lists the cost of that purchase, cumulative investment through that rank, and the recall refund at that point. A level label of 1 through 4 corresponds to internal rank 0 through 3.

### Cadet

Medium fire rate and low damage. An affordable recruit for the opening defense. No special effect at any rank.

| Level | Rank name | Purchase | Invested | Recall | Damage | Shots/s | Range | Base DPS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Cadet | $10 | $10 | $7 | 9 | 2 | 3.4 | 18 |
| 2 | Private | $10 | $20 | $14 | 17 | 2 | 3.7 | 34 |
| 3 | Corporal | $40 | $60 | $42 | 31 | 2 | 4 | 62 |
| 4 | Sergeant | $140 | $200 | $140 | 55 | 2 | 4.4 | 110 |


### Machine Gunner

High fire rate and medium damage. Holds a busy lane under sustained pressure. Berserker Rage: each inactive shot has a 5% chance of 5× firing rate for five seconds. No stacking or refresh.

| Level | Rank name | Purchase | Invested | Recall | Damage | Shots/s | Range | Base DPS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Machine Gunner | $25 | $25 | $17 | 12 | 3 | 3.8 | 36 |
| 2 | Fireteam Gunner | $20 | $45 | $31 | 22 | 3.2 | 4 | 70.4 |
| 3 | Squad Gunner | $70 | $115 | $80 | 38 | 3.5 | 4.3 | 133 |
| 4 | Master Gunner | $220 | $335 | $234 | 64 | 4 | 4.6 | 256 |

Active-rage rates are 15, 16, 17.5, 20 shots per second. Rage changes rate, not damage.


### Sniper

Slow fire rate and high damage. Covers a long section of the supply road. Headshot: 10% chance per shot. Instantly kills normal enemies; bosses take 5× damage before armor.

| Level | Rank name | Purchase | Invested | Recall | Damage | Shots/s | Range | Base DPS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Sniper | $40 | $40 | $28 | 95 | 0.5 | 6 | 47.5 |
| 2 | Marksman | $25 | $65 | $45 | 165 | 0.55 | 6.4 | 90.75 |
| 3 | Sharpshooter | $90 | $155 | $108 | 285 | 0.6 | 6.8 | 171 |
| 4 | Scout Sniper | $280 | $435 | $304 | 490 | 0.65 | 7.2 | 318.5 |


### Grenadier

An explosive attack damages every enemy around its target. Area damage resolves once per enemy; armor applies to each victim. No random proc.

| Level | Rank name | Purchase | Invested | Recall | Damage | Shots/s | Range | Base DPS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Grenadier | $55 | $55 | $38 | 35 | 0.8 | 4.3 | 28 |
| 2 | Assault Grenadier | $25 | $80 | $56 | 65 | 0.85 | 4.5 | 55.25 |
| 3 | Demolition Specialist | $90 | $170 | $118 | 115 | 0.9 | 4.8 | 103.5 |
| 4 | Ordnance Chief | $260 | $430 | $301 | 195 | 1 | 5.1 | 195 |

Splash radius by displayed rank 1 through 4 is 1.5 units, 1.7 units, 2 units, 2.3 units.


### Combat Engineer

Low damage with reliable slowing fire to extend everyone’s time on target. Slow lasts two seconds. Strongest slow wins and refreshes; bosses are capped at 15%.

| Level | Rank name | Purchase | Invested | Recall | Damage | Shots/s | Range | Base DPS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Combat Engineer | $70 | $70 | $49 | 8 | 1.2 | 3.8 | 9.6 |
| 2 | Sapper | $20 | $90 | $62 | 15 | 1.3 | 4 | 19.5 |
| 3 | Field Engineer | $70 | $160 | $112 | 27 | 1.4 | 4.3 | 37.8 |
| 4 | Chief Engineer | $220 | $380 | $266 | 46 | 1.5 | 4.6 | 69 |

Slow strength by displayed rank 1 through 4 is 35%, 40%, 45%, 50%.


### Field Officer

Moderate fire and a local damage aura for nearby soldiers. Only the strongest nearby aura applies. Officers cannot buff themselves or other officers.

| Level | Rank name | Purchase | Invested | Recall | Damage | Shots/s | Range | Base DPS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Field Officer | $85 | $85 | $59 | 12 | 1.4 | 4 | 16.8 |
| 2 | Lieutenant | $25 | $110 | $77 | 22 | 1.5 | 4.3 | 33 |
| 3 | Captain | $90 | $200 | $140 | 39 | 1.6 | 4.6 | 62.4 |
| 4 | Major | $280 | $480 | $336 | 66 | 1.7 | 5 | 112.2 |

Damage aura by displayed rank 1 through 4 is 15%, 20%, 25%, 30%.


The accepted pricing change doubles second-promotion prices and quadruples third-promotion prices relative to the original launch matrix. Base prices and first promotions are unchanged. It does not alter damage, rate, range, armor, bounties, waves, or special-effect probabilities.

## 5. Enemies, armor, healing, and leaks

| ID | Name | Base HP | Speed | Armor | Leak | Behavior |
| --- | --- | --- | --- | --- | --- | --- |
| scout | Scout | 38 | 1.6 | 0% | 1 | Light infantry. The first test of coverage. |
| runner | Runner | 30 | 2.9 | 0% | 1 | Fast infantry that exposes short coverage. |
| swarm | Swarm | 21 | 1.9 | 0% | 1 | Dense groups that reward explosive defense. |
| armored | Armored Infantry | 105 | 1.25 | 30% | 2 | Armor reduces ordinary damage by 30%. |
| medic | Medic | 70 | 1.5 | 10% | 1 | Each second heals other normal enemies within 2.2 units by 2% of their maximum HP. Cannot heal bosses or itself. |
| elite | Elite Infantry | 190 | 1.9 | 20% | 2 | Durable fast infantry with 20% damage reduction. |
| boss | Commander | 700 | 0.85 | 25% | 5 | Commander every fifth wave, with explicitly authored HP and escorts. Bounty is ten times the wave’s ordinary bounty. Headshots deal fivefold damage; slow is capped at 15%. |


Ordinary spawned health is `Math.round(base HP * wave HP multiplier)`. Speed, armor, and leak cost do not scale with the multiplier. Spawned bosses use the explicit health for their wave and are not multiplied by the normal wave multiplier again. All enemies use the same route. None attacks or destroys a deployed soldier.

The armor value is a proportional damage reduction. Ordinary damage is multiplied by `1 - armor`, with a minimum positive damage of one in the damage helper. A 30% armored target takes 70% of a normal hit. A normal-enemy instant headshot and an airstrike use armor-bypassing paths.

A Medic's first healing pulse is 60 ticks after its spawn, followed by a pulse every 60 combat ticks while it remains alive. Each pulse restores 2% of each other living normal enemy's maximum HP within 2.2 units, capped at that enemy's maximum HP. A Medic cannot heal itself or a boss. It can heal another Medic. Multiple Medics can heal the same target during one tick. Healing has no currency cost or score effect. Each Medic has its own private deadline.

An enemy that reaches the route end is removed and subtracts its `leak` amount from base integrity. Integrity clamps at zero. `stats.leaked` counts the removed enemy, rather than the number of lost integrity points. If integrity reaches zero, the run enters defeat. Other leaks later in the same movement pass can still be processed before that phase check.

### Boss roster

| Wave | Commander | HP | Spawn, s | Escorts | Bounty |
| --- | --- | --- | --- | --- | --- |
| 5 | Lieutenant Flint | 700 | 6 | 15 | $20 |
| 10 | Captain Iron | 2,600 | 4 | 22 | $40 |
| 15 | Major Ash | 4,500 | 6 | 34 | $50 |
| 20 | Colonel Steel | 8,640 | 5 | 34 | $70 |
| 25 | Brigadier Storm | 13,000 | 6 | 64 | $90 |
| 30 | General Redline | 21,000 | 8 | 116 | $100 |


All six bosses move at 0.85 world units per second, have 25% armor, and remove five integrity points on a leak. Their slow cap is 15%. They share one Commander enemy class. Killing the boss does not clear a wave while escorts or future packets remain.

## 6. Complete wave schedule

The following table describes the exported `WAVES` array after automatic boss insertion. "Last spawn" is the authored time of the last scheduled spawn, not the clear time. "All-kill income" includes every enemy bounty and the clear reward, before any purchases or refunds. Total initial HP excludes healing and is a content sum, not a difficulty rating.

| Wave | Operation | Count | HP scale | Initial HP | Last spawn | Bounty | Clear | All-kill income |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | First Contact | 8 | 1 | 304 | 9.1 s | $1 | $5 | $13 |
| 2 | Running Patrol | 12 | 1.05 | 448 | 8.9 s | $1 | $5 | $17 |
| 3 | Close Formation | 18 | 1.1 | 414 | 6.8 s | $1 | $5 | $23 |
| 4 | Steel Helmets | 14 | 1.15 | 924 | 12.1 s | $2 | $5 | $33 |
| 5 | Lieutenant Flint | 16 | 1.2 | 1,504 | 8 s | $2 | $7 | $57 |
| 6 | Double Time | 20 | 1.3 | 780 | 13.5 s | $2 | $7 | $47 |
| 7 | Packed Road | 30 | 1.4 | 1,578 | 12 s | $3 | $7 | $97 |
| 8 | Veteran Patrol | 17 | 1.5 | 1,965 | 9.6 s | $3 | $7 | $58 |
| 9 | Triage Line | 31 | 1.6 | 2,784 | 12.25 s | $3 | $7 | $100 |
| 10 | Captain Iron | 23 | 1.65 | 4,198 | 13 s | $4 | $9 | $137 |
| 11 | Broken Convoy | 34 | 1.8 | 2,116 | 15.8 s | $4 | $9 | $145 |
| 12 | Armored Screen | 20 | 2 | 5,220 | 12 s | $4 | $9 | $89 |
| 13 | Flood the Road | 56 | 2.2 | 2,576 | 15.75 s | $5 | $9 | $289 |
| 14 | Medical Escort | 24 | 2.4 | 5,376 | 12.9 s | $5 | $9 | $129 |
| 15 | Major Ash | 35 | 2.6 | 11,312 | 13 s | $5 | $11 | $231 |
| 16 | Siege Infantry | 42 | 2.8 | 8,964 | 15.5 s | $6 | $11 | $263 |
| 17 | Second Wind | 25 | 3 | 10,650 | 14.6 s | $6 | $11 | $161 |
| 18 | Rush and Crush | 60 | 3.2 | 8,862 | 20.9 s | $6 | $11 | $371 |
| 19 | Command Guard | 52 | 3.4 | 17,000 | 17 s | $7 | $11 | $375 |
| 20 | Colonel Steel | 35 | 3.6 | 25,164 | 19.9 s | $7 | $13 | $321 |
| 21 | Deep Patrol | 54 | 3.9 | 21,038 | 22.4 s | $7 | $13 | $391 |
| 22 | Relentless Rush | 58 | 4.2 | 14,028 | 17.36 s | $8 | $13 | $477 |
| 23 | Living Shield | 72 | 4.5 | 21,260 | 16.75 s | $8 | $13 | $589 |
| 24 | Crowded Front | 84 | 4.8 | 24,704 | 21.4 s | $8 | $13 | $685 |
| 25 | Brigadier Storm | 65 | 5.1 | 52,950 | 18.2 s | $9 | $15 | $681 |
| 26 | Night March | 80 | 5.4 | 33,172 | 21.5 s | $9 | $15 | $735 |
| 27 | Final Reinforcements | 52 | 5.7 | 44,004 | 16.5 s | $9 | $15 | $483 |
| 28 | Overrun Attempt | 130 | 6 | 33,012 | 24.1 s | $10 | $15 | $1,315 |
| 29 | General’s Guard | 88 | 6.3 | 77,190 | 21.05 s | $10 | $15 | $895 |
| 30 | General Redline | 117 | 6.6 | 82,432 | 27 s | $10 | $17 | $1,277 |


### Exact spawn packets and wave briefings

Each packet schedules `count` enemies at `start + index * interval`, with index starting at zero. Times are simulation seconds relative to the wave start. The queue is sorted by time. Equal-time entries keep the authored insertion order under stable sorting. Boss packets for waves 5, 15, and 25 are appended by the content constructor at six seconds. Waves 10, 20, and 30 already contain explicit boss packets.

#### Wave 1. First Contact

Scouts approach the supply road. The in-game lesson reads, "Deploy a Cadet near the first bend."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Scout | 8 | 0 | 1.3 | 9.1 | 38 |


#### Wave 2. Running Patrol

Runners mix with another scout patrol. The in-game lesson reads, "Cover more than the entrance."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Scout | 8 | 0 | 0.9 | 6.3 | 40 |
| Runner | 4 | 5 | 1.3 | 8.9 | 32 |


#### Wave 3. Close Formation

A dense infantry section is approaching. The in-game lesson reads, "Explosives punish tightly spaced groups."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Swarm | 18 | 0 | 0.4 | 6.8 | 23 |


#### Wave 4. Steel Helmets

Armored infantry lead a scout formation. The in-game lesson reads, "Precision damage helps against armor."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Armored Infantry | 4 | 0 | 2 | 6 | 121 |
| Scout | 10 | 4 | 0.9 | 12.1 | 44 |


#### Wave 5. Lieutenant Flint

Medics escort the first commander. The in-game lesson reads, "Focus a medic before it heals the column."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Scout | 12 | 0 | 0.7 | 7.7 | 46 |
| Medic | 3 | 2 | 3 | 8 | 84 |
| Commander | 1 | 6 | 0.9 | 6 | 700 |


#### Wave 6. Double Time

Fast runners arrive in two sections. The in-game lesson reads, "A slowing engineer gives damage dealers more time."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Runner | 12 | 0 | 0.55 | 6.05 | 39 |
| Runner | 8 | 10 | 0.5 | 13.5 | 39 |


#### Wave 7. Packed Road

Armored infantry hide among a dense swarm. The in-game lesson reads, "Combine crowd control and focused damage."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Swarm | 24 | 0 | 0.3 | 6.9 | 29 |
| Armored Infantry | 6 | 3 | 1.8 | 12 | 147 |


#### Wave 8. Veteran Patrol

Elites join the road for the first time. The in-game lesson reads, "Upgrade a primary damage dealer."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Elite Infantry | 5 | 0 | 2 | 8 | 285 |
| Runner | 12 | 3 | 0.6 | 9.6 | 45 |


#### Wave 9. Triage Line

Medics sustain a heavy column. The in-game lesson reads, "Cover the full formation with precision fire and splash damage."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Armored Infantry | 10 | 0 | 1.2 | 10.8 | 168 |
| Medic | 5 | 2 | 2 | 10 | 112 |
| Swarm | 16 | 7 | 0.35 | 12.25 | 34 |


#### Wave 10. Captain Iron

Captain Iron advances behind an escort. The in-game lesson reads, "A sniper and an engineer can hold a boss in range."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Commander | 1 | 4 | 1 | 4 | 2,600 |
| Scout | 18 | 0 | 0.7 | 11.9 | 63 |
| Medic | 4 | 7 | 2 | 13 | 116 |


#### Wave 11. Broken Convoy

Scattered sections arrive from a broken convoy. The in-game lesson reads, "Coverage at several bends reduces leaks."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Scout | 20 | 0 | 0.5 | 9.5 | 68 |
| Runner | 14 | 8 | 0.6 | 15.8 | 54 |


#### Wave 12. Armored Screen

Armored squads shield elite soldiers. The in-game lesson reads, "Strongest targeting focuses larger health pools."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Armored Infantry | 14 | 0 | 0.8 | 10.4 | 210 |
| Elite Infantry | 6 | 5 | 1.4 | 12 | 380 |


#### Wave 13. Flood the Road

Two packed swarms press the outpost. The in-game lesson reads, "Splash upgrades expand the damage area."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Swarm | 32 | 0 | 0.25 | 7.75 | 46 |
| Swarm | 24 | 10 | 0.25 | 15.75 | 46 |


#### Wave 14. Medical Escort

Armored troops escort a medical section. The in-game lesson reads, "Kill supporting medics and break the formation."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Armored Infantry | 16 | 0 | 0.8 | 12 | 252 |
| Medic | 8 | 1 | 1.7 | 12.9 | 168 |


#### Wave 15. Major Ash

The third commander advances with elites and runners. The in-game lesson reads, "Support fire and slows protect your heavy weapons."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Runner | 24 | 0 | 0.4 | 9.2 | 78 |
| Elite Infantry | 10 | 4 | 1 | 13 | 494 |
| Commander | 1 | 6 | 0.9 | 6 | 4,500 |


#### Wave 16. Siege Infantry

A long armored section advances steadily. The in-game lesson reads, "Officer auras improve nearby damage."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Armored Infantry | 24 | 0 | 0.6 | 13.8 | 294 |
| Scout | 18 | 7 | 0.5 | 15.5 | 106 |


#### Wave 17. Second Wind

Repeated medical teams support elite patrols. The in-game lesson reads, "Avoid allowing a wounded pack to recover."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Elite Infantry | 15 | 0 | 0.9 | 12.6 | 570 |
| Medic | 10 | 2 | 1.4 | 14.6 | 210 |


#### Wave 18. Rush and Crush

A swarm rush is followed by heavy armor. The in-game lesson reads, "Balance burst area damage with armor control."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Swarm | 42 | 0 | 0.22 | 9.02 | 67 |
| Armored Infantry | 18 | 9 | 0.7 | 20.9 | 336 |


#### Wave 19. Command Guard

Elite guards and runners prepare the way. The in-game lesson reads, "Finish important upgrades before the next commander."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Elite Infantry | 20 | 0 | 0.65 | 12.35 | 646 |
| Runner | 26 | 7 | 0.4 | 17 | 102 |
| Medic | 6 | 5 | 2 | 15 | 238 |


#### Wave 20. Colonel Steel

A stronger commander arrives with armored escorts. The in-game lesson reads, "The commander has 8,640 HP. Keep boss damage in range."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Commander | 1 | 5 | 0.9 | 5 | 8,640 |
| Armored Infantry | 22 | 0 | 0.7 | 14.7 | 378 |
| Elite Infantry | 12 | 10 | 0.9 | 19.9 | 684 |


#### Wave 21. Deep Patrol

Veteran sections attack in a long sequence. The in-game lesson reads, "Keep cash for the final upgrades."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Elite Infantry | 22 | 0 | 0.7 | 14.7 | 741 |
| Scout | 32 | 10 | 0.4 | 22.4 | 148 |


#### Wave 22. Relentless Rush

Two runner sections and elite support test every turn. The in-game lesson reads, "Slows and broad coverage help against repeated fast arrivals."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Runner | 24 | 0 | 0.32 | 7.36 | 126 |
| Runner | 24 | 10 | 0.32 | 17.36 | 126 |
| Elite Infantry | 10 | 5 | 0.9 | 13.1 | 798 |


#### Wave 23. Living Shield

Medics hide between armored sections. The in-game lesson reads, "The strongest target policy may leave a medic alive."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Armored Infantry | 30 | 0 | 0.5 | 14.5 | 473 |
| Medic | 14 | 2 | 1 | 15 | 315 |
| Swarm | 28 | 10 | 0.25 | 16.75 | 95 |


#### Wave 24. Crowded Front

A massive swarm precedes an elite spearhead. The in-game lesson reads, "Maximize splash coverage along the middle bends."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Swarm | 64 | 0 | 0.18 | 11.34 | 101 |
| Elite Infantry | 20 | 10 | 0.6 | 21.4 | 912 |


#### Wave 25. Brigadier Storm

The fifth commander leads heavy infantry and medics. The in-game lesson reads, "Top-rank snipers remove ordinary armor instantly on headshots."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Armored Infantry | 34 | 0 | 0.45 | 14.85 | 536 |
| Elite Infantry | 18 | 8 | 0.6 | 18.2 | 969 |
| Medic | 12 | 3 | 1.2 | 16.2 | 357 |
| Commander | 1 | 6 | 0.9 | 6 | 13,000 |


#### Wave 26. Night March

Mixed sections arrive without a long break. The in-game lesson reads, "Match each role to the coverage it offers."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Scout | 28 | 0 | 0.3 | 8.1 | 205 |
| Runner | 30 | 4 | 0.3 | 12.7 | 162 |
| Elite Infantry | 22 | 11 | 0.5 | 21.5 | 1,026 |


#### Wave 27. Final Reinforcements

Medics support a large elite force. The in-game lesson reads, "The best aura applies once; spreading officers improves coverage."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Elite Infantry | 34 | 0 | 0.5 | 16.5 | 1,083 |
| Medic | 18 | 2 | 0.8 | 15.6 | 399 |


#### Wave 28. Overrun Attempt

Swarm waves attack between armored sections. The in-game lesson reads, "Maintain damage across the entire road."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Swarm | 72 | 0 | 0.16 | 11.36 | 126 |
| Armored Infantry | 30 | 10 | 0.4 | 21.6 | 630 |
| Runner | 28 | 16 | 0.3 | 24.1 | 180 |


#### Wave 29. General’s Guard

The general’s elite guard attacks first. The in-game lesson reads, "Prepare fully upgraded boss damage and slowing coverage."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Elite Infantry | 42 | 0 | 0.4 | 16.4 | 1,197 |
| Armored Infantry | 30 | 8 | 0.45 | 21.05 | 662 |
| Medic | 16 | 4 | 0.9 | 17.5 | 441 |


#### Wave 30. General Redline

The final commander commits the entire reserve. The in-game lesson reads, "The final commander has 21,000 HP. Use air support wisely."

| Kind | Count | Start, s | Interval, s | Last, s | HP each |
| --- | --- | --- | --- | --- | --- |
| Commander | 1 | 8 | 0.9 | 8 | 21,000 |
| Elite Infantry | 36 | 0 | 0.5 | 17.5 | 1,254 |
| Swarm | 64 | 8 | 0.2 | 20.6 | 139 |
| Medic | 16 | 15 | 0.8 | 27 | 462 |


## 7. Battlefield geometry and placement

The route is a piecewise-linear path with ten control points and nine straight segments. Its total length is 53 units. Enemy `progress` is distance along this path. Position is interpolated on the segment that contains the current progress. The final point is headquarters.

| Point | X | Z | Segment from previous |
| --- | --- | --- | --- |
| 1 | -12 | -5 | 0 |
| 2 | -8 | -5 | 4 |
| 3 | -8 | 3 | 8 |
| 4 | -3 | 3 | 5 |
| 5 | -3 | -3 | 6 |
| 6 | 3 | -3 | 6 |
| 7 | 3 | 4 | 7 |
| 8 | 8 | 4 | 5 |
| 9 | 8 | -4 | 8 |
| 10 | 12 | -4 | 4 |


| Display position | Command pad ID | X | Z |
| --- | --- | --- | --- |
| 1 | 0 | -10 | -3 |
| 2 | 1 | -6 | -4 |
| 3 | 2 | -10 | 0 |
| 4 | 3 | -6 | 0 |
| 5 | 4 | -9 | 5 |
| 6 | 5 | -5 | 5 |
| 7 | 6 | -1 | 2 |
| 8 | 7 | -5 | -2 |
| 9 | 8 | -1 | -5 |
| 10 | 9 | 1 | -1 |
| 11 | 10 | 5 | -5 |
| 12 | 11 | 5 | 1 |
| 13 | 12 | 1 | 6 |
| 14 | 13 | 6 | 6 |
| 15 | 14 | 10 | 2 |
| 16 | 15 | 10 | -2 |


The display labels are one-based positions 1 through 16. Commands use zero-based pad IDs 0 through 15. A pad contains at most one tower. Soldiers cannot move between pads. A recall and a new purchase are separate transactions. Deployment does not modify the route, and enemies pass through route segments without collision or avoidance between one another.

Combat range uses the distance between ground positions in the x,z plane. It has no line-of-sight or elevation test. Grenadier splash is centered on the selected enemy, so a secondary victim can be outside the Grenadier's direct targeting range if it lies inside that explosion.


## 8. Combat simulation

`createSession` owns combat state. Commands change that state synchronously, and `advance` moves it through discrete ticks. The renderer receives a copied frame after simulation updates. Bullet trails, explosions, and sound playback do not delay or determine damage. [S2]

### Clock and update order

The simulation runs at 60 ticks per simulation second. `time = tick / 60` measures all unpaused session time, including preparation and intermissions. `waveTime = waveTick / 60` measures updates within the current wave. It resets when a wave starts and remains at the completed wave's value during the following intermission.

`advance(ticks)` accepts a nonnegative safe integer. Invalid values throw `Advance requires a nonnegative integer tick count.` Validation occurs even when the session is paused or terminal. A valid call has no effect while paused, after victory, or after defeat. The session itself has no per-call tick limit.

Each tick follows this order:

1. Increment the session tick.
2. Start the next wave if its intermission deadline has arrived.
3. If the phase is not combat, prune old events and end the tick.
4. Spawn all enemies whose scheduled times have arrived.
5. Expire slows, move enemies, and process leaks.
6. Remove leaked enemies. If integrity is zero, enter defeat and end the tick.
7. Apply due Medic healing pulses.
8. Update each soldier's target and firing credit, then resolve its attacks.
9. Remove killed enemies and increment the wave tick.
10. If the spawn queue is exhausted and no enemies remain, grant the clear reward and change phase.
11. Prune old events.

Movement therefore precedes firing. An enemy that reaches headquarters during movement leaks before a soldier can shoot it that tick. A Medic whose timer expires heals before soldiers attack. Soldiers resolve in deployment order, so earlier soldiers can kill enemies before later soldiers choose a target.

Spawn times use `Math.round((group.at + group.interval * index) * 60)`. The queue sorts by that tick value, with equal-time entries retaining insertion order. A manually started wave has `waveTime = 0` before its first update. Its zero-time enemies appear on the next tick and move immediately. An automatic wave starts inside the update that reaches the intermission deadline. Zero-time enemies spawn and move during that same update.

### Random number generator

The default seed is `7341`, and the browser explicitly uses that seed. Construction rejects nonfinite or noninteger seeds with `Seed must be a finite integer.` Accepted seeds become unsigned 32-bit values through `seed >>> 0`. There is no safe-integer requirement for seeds.

The generator performs this sequence for each draw:

```ts
randomState = (randomState + 0x6D2B79F5) >>> 0;
let value = randomState;
value = Math.imul(value ^ (value >>> 15), value | 1);
value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
const result = ((value ^ (value >>> 14)) >>> 0) / 4294967296;
```

Only eligible emitted shots consume a draw. Every Sniper shot tests `result < 0.1`. A Machine Gunner shot tests `result < 0.05` only while rage is inactive. Other attacks, failed commands, idle soldiers, rendering, and sound consume no combat randomness. Changing the order or timing of eligible shots can therefore change later proc results, even with the same seed.

### Targeting and fire scheduling

A soldier considers living enemies whose ground distance is no greater than its current range. The three policies sort candidates as follows:

| Policy | Primary ordering |
| --- | --- |
| `first` | Greatest route progress first |
| `strongest` | Greatest current HP first |
| `weakest` | Lowest current HP first |

Equal values resolve by lowest entity ID. Strongest uses remaining HP, not maximum HP, armor, enemy class, or boss status. Each soldier rebuilds its candidate list once per combat tick. Its shot loop skips candidates killed during that loop, but does not re-sort surviving candidates between shots.

Fire scheduling uses fractional credit rather than a countdown. A newly deployed soldier starts with one credit. Each combat tick adds `rank.rate * rage multiplier / 60` credit. Each shot spends one credit. A small comparison tolerance, `1e-9`, prevents floating-point rounding from postponing a due shot. Without a target, stored credit is capped at one. Soldiers cannot accumulate a large opening volley during idle time or intermissions.

`cooldown` is the derived display value `max(0, 1 - remaining credit) / (rank.rate * rage multiplier)`. It does not schedule attacks. Promotions retain existing firing credit, rage expiry, target policy, and statistics. The next combat update uses the promoted rank.

### Damage and special effects

An eligible Officer contributes an aura when the firing soldier lies within that Officer's current range. Only the greatest aura applies. Officers receive no Officer aura, including their own.

`raw damage = rank.damage * (1 + strongest eligible aura)`

`effective damage = min(current HP, max(1, raw damage * (1 - armor)))`

Damage may be fractional. The one-point minimum applies before the remaining-HP cap. An instant-kill hit removes all remaining HP. An armor-bypassing hit substitutes an armor multiplier of one.

| Soldier | Implemented effect |
| --- | --- |
| Cadet | No special effect at any rank. |
| Machine Gunner | An eligible shot has a 5% rage chance. Rage expires 300 ticks after the proc and multiplies firing rate by five. It changes neither damage nor range. Active rage suppresses further proc rolls, so it cannot stack or refresh. |
| Sniper | Each shot has a 10% headshot chance. A normal enemy loses all remaining HP, bypassing armor. A boss receives five times aura-adjusted raw damage, then its normal armor reduction. |
| Grenadier | Every living enemy within the inclusive splash radius of the selected enemy receives one full hit. Each victim applies its own armor. There is no falloff or victim limit. |
| Combat Engineer | A surviving victim receives a two-second slow. Normal enemies use the rank's slow percentage. Bosses cap that percentage at 15%. |
| Field Officer | The strongest eligible local aura increases other roles' damage. Multiple auras do not add or multiply. |

The rage proc occurs after the triggering shot. Rate accumulation for that tick has already happened, so the new rate multiplier starts on the following update. Rage becomes inactive when the current tick reaches its stored expiry.

An Engineer sets `slowFactor = min(existing slowFactor, 1 - applicable slow percentage)` and `slowUntil = (current tick + 120) / 60`. The strongest active slow remains. Every successful slowing hit refreshes its deadline, including a weaker hit that retains a stronger existing slow. At expiry, movement restores `slowFactor` to one before advancing the enemy.

Each Medic owns a timer. Its first heal is due 60 ticks after its spawn, and each pulse schedules the next 60 ticks later. It heals every other living nonboss enemy within 2.2 units using `min(maximum HP, current HP + 0.02 * maximum HP)`. Medics can heal other Medics. Several Medics can heal the same enemy during one tick. The Medic never heals itself or a boss.

An airstrike resolves immediately as a command. It kills every currently living normal enemy and deals 35% of maximum HP to each current boss, bypassing armor. It cannot affect future spawns. It spends one of three charges and sets a 720-tick cooldown. Kills grant ordinary bounties and score, but no soldier receives their kill or damage credit. Wave completion waits for the next simulation update.

### Kill credit and score

A kill increments global kills once, grants the enemy's bounty, and adds `10 * bounty` to score. A credited soldier also gains one kill. Damage counters record actual HP removed, excluding overkill. Healing can allow cumulative damage to exceed an enemy's initial HP.

A cleared wave adds `100 * wave number` to score and its authored cash reward to income. Victory adds `500 * remaining integrity`. Unspent cash, recalls, proc counts, and unused airstrikes do not directly add score. A full campaign with every enemy killed and all 20 integrity points retained scores 158,220.

## 9. Session phases and command contract

The session has four phases. Pause is a separate Boolean and does not replace the phase. [S2], [S3]

| Phase | Meaning and transition |
| --- | --- |
| `build` | Initial preparation at wave zero, or the interval after a cleared wave. The first wave requires `start-wave`. Later waves start at their stored deadline. |
| `combat` | A wave is active, including periods with future spawns but no current enemies. |
| `victory` | Wave 30's queue is exhausted and no enemies remain. |
| `defeat` | Movement and leak processing reduce integrity to zero. |

Clearing waves 1 through 29 sets the next deadline to `current tick + 360`. Pausing freezes that countdown. Clearing a wave requires neither a perfect defense nor a boss kill specifically. All scheduled enemies must have spawned, and every enemy must have died or leaked while the base survived.

### Commands and validation

The boundary accepts eight command kinds. Success returns `{ok:true}`. A refused command returns `{ok:false, reason}` and does not perform the requested transaction.

| Command | Fields | Successful behavior |
| --- | --- | --- |
| `place` | `role`, `pad` | Spend the base cost and add a rank-zero soldier to an empty pad. |
| `upgrade` | `tower` | Spend the next rank's incremental cost and increase rank by one. |
| `sell` | `tower` | Remove the soldier and refund `floor(invested * 0.7)`. |
| `target` | `tower`, `policy` | Replace the soldier's targeting policy. |
| `start-wave` | None | Start wave one from initial preparation. |
| `airstrike` | None | Resolve air support and consume a charge. |
| `pause` | Boolean `value` | Set the paused flag. |
| `restart` | None | Reset the campaign using the original seed. |

Runtime checks apply in the following order. The first matching refusal determines the returned reason. Extra object fields are ignored.

| Check | Exact refusal |
| --- | --- |
| Input is null or is not an object | `Invalid command.` |
| `pause.value` is not Boolean | `Pause requires a boolean value.` |
| Any command other than valid pause or restart in a terminal phase | `Restart to begin another campaign.` |
| Airstrike while paused or outside combat | `Air support requires active combat.` |
| Airstrike without a living enemy | `No hostiles are currently on the battlefield.` |
| Airstrike with zero charges | `All three airstrikes have been used.` |
| Airstrike before its cooldown expires | `Air support is rearming.` |
| Start outside wave-zero build | `Later waves launch automatically after intermission.` |
| Place with a role absent from `UNITS` own properties | `Unknown soldier.` |
| Place with no matching pad ID | `Choose a deployment position.` |
| Place on an occupied pad | `This position is occupied.` |
| Place without the base cost | `Not enough cash to deploy this soldier.` |
| Unrecognized remaining command kind | `Unknown command.` |
| Upgrade, sell, or target with no matching soldier ID | `This soldier is no longer deployed.` |
| Target with a policy other than the three defined values | `Unknown targeting policy.` |
| Upgrade at internal rank three | `This soldier already has all three upgrades.` |
| Upgrade without the next rank's cost | `Not enough cash for this upgrade.` |

The engine permits deployment, promotion, recall, and retargeting during preparation, intermissions, combat, and pause. It also permits starting wave one while paused, although the UI disables that action. The resulting combat phase remains frozen until resumed. Pause and restart remain accepted after victory or defeat.

A placement receives a new shared entity ID, target policy `first`, no current target, zero kill and damage counters, and an investment equal to its purchase cost. Recall deletes that soldier's firing credit. It does not undo gross spending or add its refund to earned income.

Restart clears soldiers, enemies, queues, events, timers, statistics, and firing credit. It restores $100, 20 integrity, three airstrikes, wave zero, time zero, and the original RNG state. The entity-ID counter resets. The event-ID counter does not reset.

## 10. Events, snapshots, and data boundaries

`Session` exposes three methods, `command`, `advance`, and `frame`. No method imports a saved frame, replaces combat state, changes the seed after construction, or exports the internal random state. [S3]

### Frame schema

`frame()` returns 17 fields.

| Field | Meaning |
| --- | --- |
| `time` | Session simulation seconds, including preparation and intermissions. |
| `phase` | `build`, `combat`, `victory`, or `defeat`. |
| `paused` | Whether advancement is suspended. |
| `wave` | Current or most recently completed wave number. Zero before launch. |
| `waveTime` | Combat updates in that wave divided by 60. |
| `cash`, `lives`, `score` | Current economy, base integrity, and score. |
| `towers` | Copied deployed-soldier records. |
| `enemies` | Copied current-enemy records. |
| `events` | Copied retained presentation events. |
| `stats` | Copied cumulative statistics. |
| `spawned` | Number spawned in the current wave. |
| `waveTotal` | Current wave's expanded queue length. |
| `nextWaveIn` | Nonnegative intermission seconds, or null without a deadline. |
| `airstrikes` | Remaining charges. |
| `airstrikeReadyIn` | Nonnegative seconds until the cooldown expires. |

Each soldier record contains position, identity, role, rank, pad, cooldown, rage expiry, target ID, policy, kills, damage dealt, and total investment. Each enemy contains position, identity, class, current and maximum HP, route progress, armor, speed, slow expiry, slow factor, bounty, leak damage, and boss status.

The eight statistics are `kills`, `headshots`, `headshotKills`, `rageProcs`, `damage`, `spent`, `earned`, and `leaked`. `headshots` counts successful procs. `headshotKills` counts lethal proc hits, including lethal boss headshots. `leaked` counts enemies, not integrity points lost. `spent` and `earned` are gross purchase and income totals.

The frame copies every record and both nested event points. Mutating a returned frame does not mutate the session. A frame remains incomplete for restoration because firing credit, RNG state, spawn cursor, future queue, and Medic timers are private.

### Event contract

Each event contains an increasing `id`, simulation `time`, `kind`, copied `from` and `to` points, and optional `role` and `amount`.

| Kind | Meaning of `amount` |
| --- | --- |
| `shot` | Aura-adjusted raw damage, before armor or the boss headshot multiplier. |
| `blast` | The same raw damage for a splash attack, not summed victim damage. |
| `headshot` | A normal target's current HP, or five times raw damage for a boss. |
| `rage` | Five, the firing-rate multiplier. |
| `kill` | Effective damage from the lethal hit. |
| `leak` | The enemy's leak damage. |
| `wave-clear` | The cash clear reward. |
| `deploy` | Absent. |
| `upgrade` | Absent. |
| `airstrike` | Absent. |

A headshot event precedes its shot event. Kill events occur during damage resolution. A rage event follows the triggering attack. Airstrike emits its event before any resulting kills. Deploy and upgrade use the soldier's position for both points. Wave-clear uses headquarters. Airstrike uses the origin, and its kill events have no soldier role.

Events are retained when `event.time >= current time - 1` during pruning. They are presentation history, not a complete replay log. Paused and terminal sessions stop normal pruning. Defeat also returns before that tick's final pruning. A consumer that skips sufficient simulation time can miss expired events.

The browser avoids duplicate sound playback by remembering the last event ID. Restart resets that consumer cursor while the session continues increasing event IDs. Soldier `targetId` identifies the first candidate chosen at that soldier's update; it can refer to an enemy killed later in the same tick. These records describe simulation decisions, not persistent object references.


## 11. Browser runtime and controls

The browser creates one session with seed `7341`. A page reload uses that seed again. Startup selects Cadet, selects no pad, sets speed to 1x, and keeps sound off. The reduced-motion flag initially follows the operating system's `prefers-reduced-motion` setting. The DOM and initial HUD appear before asynchronous battlefield initialization completes. [S4]

### Frame scheduling

The app has one `requestAnimationFrame` loop. It caps elapsed wall time at 0.1 seconds, multiplies elapsed time by the selected speed, and adds it to an accumulator. It advances at most `min(12, floor(accumulator * 60))` ticks in a rendered frame, subtracting the consumed time from the accumulator. It discards wall time beyond the 0.1-second cap rather than simulating an arbitrarily long missed interval.

The renderer draws the latest snapshot without interpolation between simulation ticks. HUD updates normally occur at intervals greater than 150 milliseconds, with forced updates after commands and selection changes. Pad-button projection updates every render. The screen position includes a 22-pixel vertical offset beneath the projected world point. This scheduling targets a 60-Hz simulation; it is not a measured claim of 60 rendered frames per second.

### Visible interface

The main order is header, mission title, all six soldier cards, battlefield with command panel, and footer controls. The header links to the Arcade, field manual, sound toggle, and source repository. The HUD shows integrity, funds, wave, and score. The command panel shows a soldier's statistics, special, rank, targeting, promotion, recall, next-contact briefing, and status messages.

Remaining contacts equal `max(0, waveTotal - spawned + living enemies)`, including future spawns. Wave progress represents resolved contacts, whether killed or leaked. The intelligence panel shows the current wave in combat and the upcoming wave during preparation, capped at wave 30. It displays contact count, clear reward, ordinary bounty, and a boss marker when applicable.

All six role cards stay visible. Hover with a non-touch pointer or keyboard focus displays a tooltip and inspector preview. The tooltip includes base damage, rate, range, deployment price, and special. It is clamped to 12-pixel horizontal margins and placed above or below the card to fit. Pointer leave, blur, or scrolling hides the floating tooltip. A tap or click makes the inspector available without hover.

An affordable card selects its role and clears the selected pad. It does not spend money until an empty pad is selected. Clicking a pad selects it, then immediately places the selected role if the pad is empty and the purchase succeeds. An occupied pad selects its existing soldier. There is no drag-to-place action or separate placement confirmation.

Unaffordable cards use grayscale styling and `aria-disabled="true"`. They remain native enabled buttons so hover and focus statistics remain available. Clicking one previews its stats and announces the cash requirement without changing the active selected role. This differs from the promotion button, which uses native disabled state when funds are insufficient.

The inspector shows displayed rank 1 through 4, current damage, rate, range, special, and next incremental promotion cost. It replaces the promotion control with a maximum-rank message after the third promotion. It also shows the next rank's damage and rate. Target priority offers First to headquarters, Strongest enemy, and Weakest enemy. Recall displays the rounded 70% refund.

### Inputs

| Input | Behavior |
| --- | --- |
| Keys 1 through 6 | Select the corresponding role card in roster order |
| A | Request an airstrike |
| Space outside a button | Launch the first wave in initial unpaused preparation; otherwise toggle pause |
| Space on a button | Preserve native activation of that button |
| Escape with no dialog | Clear selected pad |
| Escape in a native dialog | Dismiss according to native dialog behavior |
| Tab and Shift+Tab | Native focus navigation |
| Enter on a focused button | Native activation |
| Speed button | Toggle 1x and 2x |
| Sound button | Enable or mute sound |
| Motion button | Toggle the app's reduced-motion flag |
| Fullscreen button | Request fullscreen for the main element, including gameplay controls |
| Restart operation | Open confirmation and reset the run if confirmed |

Global shortcuts are ignored while any dialog is open or while the target is an input, select, or textarea. There are no movement keys for soldiers, camera controls, or promotion hotkeys. A native targeting select is present; soldier selection uses the visible cards.

The app blocks launch, airstrike, and resume while the renderer is unavailable. It also ignores pad clicks in that state. It blocks the launch button after wave one, during pause, and outside initial preparation. Airstrike requires a ready renderer, unpaused combat, at least one living enemy, a charge, and an expired cooldown. The UI reports cooldown with ceiling-rounded seconds.

### Pause, dialogs, and restart

Pause displays an overlay with a Resume button. Help, restart confirmation, field manual, and result use native modal dialogs. Opening the first dialog remembers the previous pause state and pauses the session. Closing the final dialog resumes only when the session was previously running, the document is visible, and the renderer is ready.

Hiding the browser page pauses the session. Returning does not resume automatically. At 2x speed an unpaused six-second intermission lasts about three wall-clock seconds, subject to frame scheduling. Pause freezes that countdown. Existing scheduled audio sources are not suspended by a combat pause.

Fullscreen failure reports a message and leaves windowed play available. It does not change combat. Renderer recovery preserves the session and still requires an explicit resume.

Restart resets selection, preview, processed audio-event tracking, result latch, speed, score token, pending token reference, frozen submission payload, and score form. It closes open dialogs and sends the session restart command. Sound and the app's motion preference survive an in-page restart; a page reload restores their startup defaults.

## 12. Rendering, scene, and effects

### Backend and recovery

The battlefield uses Three.js `WebGPURenderer` from `three/webgpu`. It reports the actual backend as `WEBGPU ACTIVE` or `WEBGL2 COMPATIBILITY`. The query `?renderer=webgl` forces the compatibility backend. There is no Canvas2D gameplay fallback. [S5]

Renderer settings enable alpha and antialiasing, use a transparent clear color, use sRGB output, and cap pixel ratio at 1.5. The game uses Three.js geometry and materials. It contains no custom WGSL compute program, GPU combat simulation, ray tracing, or post-processing pipeline.

The code watches the WebGPU device's `lost` promise and the canvas's `webglcontextlost` event. It prevents the latter's default behavior and suppresses duplicate loss callbacks. The app pauses and offers Restore battlefield. Restore disposes the old scene and constructs a new renderer without replacing the simulation. Initialization failure displays a hardware-acceleration requirement and reload control.

Disposal disconnects the resize observer, removes the context-loss listener, stops renderer animation hooks, disposes the renderer, removes the canvas, disposes cached geometry and materials, and clears maps, pools, and the scene. The app cannot promise recovery on every browser merely because the recovery path exists.

### Camera and lighting

| Setting | Value |
| --- | --- |
| World dimensions | 24 by 16 in X/Z |
| Camera | Orthographic; near 0.1, far 100 |
| Desktop position | `(0, 22, 20)`, looking at the origin |
| Host width below 650 px | Camera position `(22, 30, 0)` |
| Desktop view height | `max(18.4, 24 / aspect)` |
| Mobile view height | `max(19.2, 18 / aspect)` |
| Horizontal bounds | `±viewHeight * aspect / 2` |
| Vertical bounds | `±viewHeight / 2` |
| Ambient light | Blue, intensity 1.35 |
| Key light | Warm, intensity 2.6, position `(-7, 15, 9)` |
| Rim light | Cyan, intensity 1.3, position `(8, 10, -8)` |

ResizeObserver updates camera fitting, renderer size, and pixel ratio. The player cannot pan, zoom, orbit, or shake the camera.

### Brand and field geometry

The original ShoeMoney robot is a decorative DOM image behind the transparent scene. Its desktop opacity is 0.20 with saturation 0.5; mobile opacity is 0.24. The logo appears in the header and favicon. The game does not synthesize a replacement brand identity.

The scene contains a translucent 24.32 by 16.32 board, a 24 by 16 floor, one-unit grid spacing, and a road built from the exact combat route. Board opacity is 0.20 and floor opacity is 0.52, with depth writing disabled for both. Road width is 0.82 units. Cyan rails sit 0.36 units from the center, and center dashes are spaced 0.92 units apart.

Sandbags, rocks, edge lights, an orange entry beacon, the cyan headquarters platform, and its antenna are decorative. Deployment pads use twelve-sided bases, twenty-four-sided upper disks, rings, and status studs. Those objects do not change collision, route length, armor, or damage.

### Actor geometry

Soldiers use procedural legs, boots, torso, vest, arms, hands, head, visor, helmet, and equipment. Cadet and Officer carry pistols. Gunner has a larger receiver, barrel, and magazine. Sniper has a long barrel and scope. Grenadier carries launcher geometry and side grenades. Engineer carries a carbine, pack, and tool roll. Officer's cap differs from the standard helmet.

Each role has a shared template cloned into actors. A promotion adds a ground ring of radius `0.56 + rank * 0.08`, tube thickness `0.018 + rank * 0.006`, and rank-count shoulder marks. The soldier turns toward its current target. There are no imported skinned models, skeletal walk cycles, animated limbs, or weapon recoil in this implementation.

Normal enemies use procedural humanoid shapes. Runner and Swarm stature differs. Armored and Elite enemies have additional plates and helmets. Medic has a marked medical pack. A boss is drawn as a broad tracked hull, turret, and cannon with a root scale of 1.45. This is its visual form despite the underlying Commander class name.

Enemies face the current route segment. Their health bars represent `clamp(hp / maxHp, 0, 1)` and retreat from one side. Actor pools are keyed by soldier role or enemy kind. Removed actors become invisible and return to a reuse pool. Geometry and materials are cached. No explicit hard actor-pool capacity or measured memory ceiling exists in the source.

### Range and visual events

The selected pad can display a cyan 64-segment range ring at the actual current rank's range, with opacity 0.22. An empty selected pad can display a translucent soldier preview at opacity 0.34. The range follows actual selection, not a temporarily hovered role preview. Selecting an occupied pad suppresses the ghost.

Active Gunner rage displays an amber ring. Active enemy slow displays a cyan ring. Shot effects are beams between event endpoints. Damage already resolved in the session; the beam does not travel and then apply a second hit.

| Effect | Lifetime in simulation seconds | Presentation |
| --- | --- | --- |
| Shot and headshot | 0.25 | Beam between source and target |
| Rage | 0.62 | Expanding ring |
| Blast | 0.66 | Expanding ring |
| Airstrike | 1.4 | Aircraft, trail, and five timed impact clusters |

Kill, leak, deploy, upgrade, and wave-clear events have no dedicated 3D effect. Airstrike flight occurs at world height 8.6, with diagonal direction alternating by event-ID parity. Each impact cluster contains rings, a column, and a flash. The visual flight path is not a damage footprint; the strike affects the current battlefield according to the session rule.

The configured airstrike effect lifetime is 1.4 seconds, but its animation updates only while its event remains in the one-second frame event buffer. Source inspection therefore indicates that the final roughly 0.4 seconds retain the last visual state until removal. This is a source-derived limit, not a new browser observation.

Effect pools are keyed by event kind and recycled after expiry. Time moving backward on restart clears active effects into pools. Effects use simulation time, so 2x speed shortens their wall-clock presentation.

Reduced motion removes aircraft flight and trail, hides strike columns and flashes, substitutes static impact rings, and disables ring expansion for rage and blast. Enemy movement and shot beams remain. The operating-system reduced-motion CSS query still disables CSS transitions when the player toggles the app's motion flag back to full.

## 13. Audio specification

Sound is opt-in. Enabling sound creates or resumes the AudioContext and starts cached recording loads. There is no music track, speech system, or player volume slider. Audio consumes simulation events without consuming combat RNG. It uses event IDs for cosmetic variation. [S6]

The audio graph is source, optional low-pass filter, stereo panner, per-voice gain, master gain, dynamics compressor, and output. Synthesized UI tones pass through their voice gain and the same master path. The master ramps to -10 dB with a 20-millisecond time constant. Mute ramps toward zero with an 8-millisecond constant and immediately stops active and scheduled tracked voices.

Compressor threshold is -18 dB, knee 10 dB, ratio 8, attack 0.003 seconds, and release 0.18 seconds. These are implementation settings, not a loudness guarantee on physical speakers.

| Voice group | Limit | Capacity behavior |
| --- | --- | --- |
| Combat | 8 | Drop a nonpriority request; a priority request can stop the oldest matching voice |
| Casing | 3 | Requests are nonpriority |
| UI | 4 | Event tones can replace an old voice |

Voice completion removes its tracking record and disconnects associated nodes. A source rejected by one path may trigger a permitted synthesized fallback, subject to that fallback's group limit.

### Recordings and load behavior

Bundled clips are `audio/pistol-shot.wav`, `audio/rifle-shot.wav`, and `audio/gunner-burst.wav`, resolved relative to Vite's base URL and the document base. On the exact production hostname, the game also requests the existing Last Engineer suppressed-shot and casing MP3 URLs listed in section 21.

Each fetch has a six-second AbortSignal timeout. Loads use `Promise.allSettled`, so one failed file does not reject the whole set. The cached loading promise does not automatically retry failed clips later. Missing files use remaining recordings or procedural cues.

### Shot routing

| Role or state | Preferred clip | Gain before master | Playback rate |
| --- | --- | --- | --- |
| Cadet, Engineer, Officer | Pistol | -7 dB | `0.98 + (event.id % 5) * 0.01` |
| Ordinary Gunner | Rifle | -11 dB | Same deterministic variation |
| Raging Gunner | Burst | -14 dB | Same deterministic variation |
| Sniper with production clip | Suppressed cue | -8 dB | Same deterministic variation |
| Sniper fallback | Rifle, low-pass filtered | -15 dB | 0.75 |

Grenadier attacks emit `blast`, so they use the 55-Hz blast tone and do not play a pistol sample or schedule a casing. Both recorded Sniper paths use priority playback. The filtered Sniper cue uses a 1,500-Hz low-pass with Q 0.5. Stereo pan is shooter X divided by 24, clamped to ±0.65. Ordinary clips skip 0.1 seconds of leading audio. Burst and suppressed clips start at zero. Requested durations are the full suppressed clip, 0.62 seconds of burst, 0.44 seconds of filtered rifle, and 0.58 seconds of ordinary sample. A fade occupies the final 35 milliseconds after playback-rate adjustment.

An unavailable sample or rejected voice can fall back to a short triangle tone. Sniper uses 95 Hz; other shots use 170 Hz. The tone lasts 0.055 seconds at linear gain 0.055.

Shot throttling uses AudioContext wall time. Minimum per-role spacing is 0.22 seconds for raging Gunner, 0.15 seconds for Sniper, and 0.065 seconds otherwise. Non-Sniper shots also require a 0.045-second global gap. The per-role gate is shared by all towers of that role, so a large army does not play a sample for every simulated shot. Doubling simulation speed does not simply double audible event density.

### Shell casings

A successfully audible shot may schedule a casing if 0.2 wall-clock seconds have elapsed since the previous casing schedule. Delay is 0.32 seconds for Sniper, 0.20 for Gunner, and 0.18 for other roles, plus `(event.id % 3) * 0.012`. Casing rate is `0.96 + (event.id % 7) * 0.012`. Real casing gain is -18 dB; procedural gain is -6 dB. Playback is capped at 0.85 seconds and panned from the shooter.

The procedural fallback is a mono 0.26-second metallic cue with 4,200-Hz and 6,700-Hz components, seeded noise, exponential decay, and a second bounce at 0.11 seconds. Its local generator starts with state 19 and does not access session RNG.

### Event tones

| Event | Starting frequency | Duration | Linear voice gain |
| --- | --- | --- | --- |
| Airstrike | 38 Hz | 0.85 s | 0.13 |
| Blast | 55 Hz | 0.20 s | 0.10 |
| Headshot | 800 Hz | 0.12 s | 0.07 |
| Leak | 120 Hz | 0.30 s | 0.085 |
| Deploy | 520 Hz | 0.12 s | 0.075 |
| Upgrade | 750 Hz | 0.18 s | 0.08 |
| Wave clear | 960 Hz | 0.35 s | 0.09 |

Blast uses the combat group; the other listed tones use UI. Upgrade rises to 1.5 times its starting frequency. Other listed tones fall to half their initial frequency. They use sine oscillators. There is no dedicated kill tone. A headshot can also have its associated shot cue.

When incoming event time moves backward, audio clears rage and throttle tracking and stops old voices. Pausing the game does not suspend AudioContext or explicitly cancel a previously scheduled casing. Muting does cancel it.

## 14. Field manual and analytical charts

The manual's module loads on first open. Failed import displays a retry message; closing and reopening can try again. Once mounted, it remains in the page. Switching a tab disposes the previous ECharts instance. ResizeObserver sizes the active chart. The chart renderer is SVG, animations are disabled, and chart text is 18 CSS pixels. [S7]

Wave intelligence is a stacked count chart across all 30 waves with one series per enemy kind, an axis tooltip, selectable legend, and slider zoom. Clicking a bar updates the operation name, briefing, and lesson. Hover supplies the chart tooltip; it does not update that briefing. The expandable schedule lists all groups and clear rewards. Enemy counts do not encode HP, armor, speed, packet density, or coverage.

Soldier comparison chooses the same rank for all six roles. It shows nominal direct DPS and a separate theoretical bonus for Gunner or Sniper. It excludes splash victim count, Engineer control value, and Officer support value.

The Gunner bonus is `baseDPS * (4 * 5 / (5 + 1 / (0.05 * rate)))`. This estimates uninterrupted firing with no active-rage rerolls. It is analytical, not an exact tick-scheduled measurement. The Sniper expected boss bonus is `baseDPS * 0.4`, because `0.9 * 1 + 0.1 * 5 = 1.4` before armor and overkill. Neither estimate is a measured campaign damage total.

The manual also has a research tab and expandable exact rank tables. Its research links are contextual background, not evidence that the current game has every mechanic mentioned by a referenced title. This specification's interactive charts are an additional document view; they do not add in-game controls.

## 15. Accessibility, responsiveness, and readability

The WebGPU canvas is `aria-hidden`. HTML pad buttons, HUD text, inspector controls, dialog labels, and a polite status region provide the DOM interface. Pad names include the position and either the placement action or deployed role and rank. Decorative Font Awesome icons are hidden from assistive technology. Icon-only controls have accessible names. Tooltips use `role="tooltip"` and temporary `aria-describedby` links. [S4], [S5], [S8]

Dialogs use the browser's native modal behavior rather than a custom focus trap. Field-manual tabs have ARIA roles but no custom arrow-key or roving-tabindex behavior. The charts have descriptive containers and textual tables; their full interactions are not mirrored as native keyboard controls. These measures do not establish complete screen-reader accessibility.

The root font size is 18 CSS pixels, body text is 20 pixels, and secondary readable UI text is generally 18 pixels. Buttons and controls normally use 20 pixels. Focus-visible controls receive a 3-pixel amber outline with a 5-pixel offset. Barlow and Barlow Condensed load through Google Fonts, with Arial, generic sans-serif, and Impact fallbacks.

| Viewport | Main layout |
| --- | --- |
| Above 1,250 px | Six roster columns and a 350-pixel command column beside the battlefield |
| 1,250 px or below | Three roster columns and a 310-pixel command column |
| 950 px or below | Single main column; inspector and intelligence can share a row |
| 650 px or below | Two roster columns; command panel stacks; source header link hides; labeled manual icon remains; airstrike spans its row |
| Below 360 px | The body retains a 360-pixel minimum width |

The battlefield height is 530 pixels normally, 610 at viewport widths of at least 1,600, 520 at 1,250 or below, 560 at 950 or below, and 620 at 650 or below. The last mobile override supersedes an earlier shorter declaration.

Desktop empty-pad controls are 44 by 40 pixels; occupied pads are 34 by 30. Mobile controls are 36 by 38, including occupied pads. Not every target is 44 pixels. Roster cards are typically at least 154 pixels high on desktop and 152 on mobile; mobile role labels remain 22 pixels.

There is no game-specific high-contrast selector, text-to-speech engine, localization selector, or remappable-key interface. The document language is English. Physical-device and assistive-technology coverage remain separate verification tasks.

## 16. Browser storage and score submission

The only game-managed localStorage key is `smtd-best-v1`. Load and save failures are caught. On the first terminal result, the app updates the local best independently of online submission. It does not persist an active campaign, purchases, seed, pause state, sound preference, speed, or motion preference. There is no service worker or offline cache layer in the application. [S4]

A successful first launch on `arcade.shoemoney.com` starts a request for a score token. Other hostnames do not request one. A generation counter stops a late response from a restarted run installing its token into the newer run. Network failure leaves no token. The request has no explicit client timeout or automatic retry.

Victory and defeat open the result once, displaying score, wave reached, kills, and remaining integrity. The form is visible only on the exact production hostname. The name input is required, has a maximum length of 24, and uses nickname autocomplete.

Submitting disables the button and waits for the pending token request. If no token is available, the app reports that the board is unavailable while retaining the local best. Otherwise it freezes token, trimmed name, floored score, wave, kills, headshot kills, and rounded simulation duration into a payload. Duration includes initial unpaused build and intermission time; it is not wall-clock browser session length or combat-only time.

The client posts the frozen result to the score endpoint. Success displays returned rank and leaves submission disabled. Failure re-enables the button. Retries retain the frozen payload, except HTTP 400 clears it so input can be corrected. There is no automatic token re-acquisition or request abort on restart. The token response has a run-generation guard, but the score-submission response handler has no corresponding generation check.

The game itself does not fetch or render the online top-ten list. The Arcade owns board display. The client explicitly describes scores as browser-reported. Server validation and limitations follow in section 17.


## 17. Shared Arcade scoreboard API

The shared API belongs to the Arcade host, outside the standalone SMTD software package. SMTD uses score version 1. The same server also supports Last Engineer version 2; that game's qualification and recalculated score flow does not apply to SMTD.

The scoreboard accepts browser-reported results. A run token limits duplicate submission. It does not prove that combat occurred, that a score is legitimate, or that the browser used the published game rules. The API does not replay SMTD commands or calculate the SMTD score from authoritative combat events.

### Endpoints

| Method and path | Input | Success result |
| --- | --- | --- |
| `GET /api/health` | None | HTTP 200 with `{"ok":true}` after a database query |
| `POST /api/games/smtd/runs` | JSON object; `scoreVersion` is optional and must be 1 | HTTP 201 with a run token, score version, and expiry timestamp |
| `GET /api/games/smtd/scores` | Optional `scoreVersion=1` | HTTP 200 with up to ten scores, version 1, and `order:"highest"` |
| `POST /api/games/smtd/scores` | Run token and result fields | HTTP 201 for the first accepted result; HTTP 200 for an identical retry |

`/api/games/smtd/qualify` does not implement an SMTD qualification flow. That route is reserved by the shared router but rejected for SMTD. No deletion or score-edit endpoint exists.

### Submitted version 1 fields

| Field | Type and permitted values |
| --- | --- |
| `runToken` | String matching 43 base64url characters |
| `name` | String normalized with NFKC, trimmed, and repeated ASCII spaces collapsed; 1 to 24 Unicode code points; control, format, and line/paragraph separator characters rejected by the implemented Unicode category check |
| `score` | Safe integer from 0 to 1,000,000,000 |
| `wave` | Safe integer from 0 to 10,000 |
| `kills` | Safe integer from 0 to 10,000,000 |
| `headshots` | Safe integer from 0 to 10,000,000 and no greater than `kills` |
| `duration` | Finite number from 0 to 86,400 seconds |
| `scoreVersion` | Optional; if supplied for this flow, 1 |

These are API bounds, not campaign rules. For example, the API's `wave` ceiling is greater than the game's 30-wave maximum. The client sends `headshotKills` in the `headshots` field, including a lethal boss headshot. Total headshot procs can include nonlethal boss hits and would not satisfy the API's kills bound.

The API generates 32 random bytes and encodes the token as base64url. It stores only the token's SHA-256 hash. Tokens expire 24 hours after creation. The token is tied to a game and a score version. An existing accepted result is checked before expiry during a retry, so an identical retry can still return the existing result after the original token expiry.

The server normalizes the submitted result and compares its serialized payload on a repeated token. An identical result returns the same score with `replayed:true`. A changed result for the same token returns HTTP 409. Score insertion runs inside a `BEGIN IMMEDIATE` transaction, and the token hash has a unique constraint in the score table.

### Ordering and response fields

The board orders scores descending, then creation time ascending, then row ID ascending. The public score record contains `id`, `name`, `score`, `scoreVersion`, `completedWaves`, `combatSeconds`, and `createdAt`. The last two gameplay metrics are null for version 1 rows. Acceptance also returns `accepted`, `replayed`, `rank`, `scoreVersion`, and the public score record.

The registry limits the displayed board to ten rows. The version 1 server does not require a score to qualify for the top ten before storing it. A zero-point entry is permitted by validation.

### Request limits and errors

All requests count toward a default limit of 120 per IP in a 60-second bucket. Run creation has an additional limit of 30 per IP in that interval. At most 10,000 rate-limit buckets are retained before new buckets can be rejected. A sweep on requests removes expired buckets and expired run records without a linked score. These limits are process memory and reset on server restart.

POST requests require `application/json` and an allowed Origin. GET requests with an explicit unapproved Origin are rejected. A GET without an Origin header can succeed. Production allows the configured Arcade origin; an optional development origin can be added by configuration. There is no account or login requirement.

The JSON body limit is 8,192 bytes, checked against both the Content-Length header and streamed bytes. Request and header timeouts are ten seconds. API responses use `Cache-Control:no-store` and `X-Content-Type-Options:nosniff`.

| Status | Implemented condition |
| --- | --- |
| 400 | Invalid JSON, field, score version, name, token format, or inconsistent headshot count |
| 403 | Origin not allowed |
| 404 | Unknown game or endpoint, or a run token not found for this game |
| 405 | Unsupported method on a matched game endpoint |
| 409 | Token score-version conflict or a different result already saved for the token |
| 410 | Unsaved run token has expired |
| 413 | Body exceeds 8,192 bytes |
| 415 | Content type is not application/json |
| 429 | Rate limit or bucket capacity reached; includes `Retry-After:60` |
| 500 | Unexpected server or database error; public message asks the player to retry |

### Database contract

SQLite uses WAL mode, a five-second busy timeout, and foreign-key enforcement. The `runs` table stores token hash, game, creation time, expiry, score version, and an optional finalized result payload used by the other game's version 2 flow. The `scores` table stores the unique token hash, game, normalized name, submitted score, wave, kills, headshots, duration, creation time, serialized payload, score version, and the nullable version 2 metrics.

Indexes support leaderboard order, ranked version order, and run expiry. Startup adds missing version columns to older databases. Persistent score data lives outside application releases. The source contains no SMTD server simulation, user profile service, cloud save, analytics pipeline, or anti-cheat replay service.

Source snapshot `A1` identifies the companion API file inspected for this section.

## 18. Build, dependencies, and source layout

The application is TypeScript and native DOM code. It does not use React, Vue, or a game-framework scene lifecycle. Vite builds static browser assets. Three.js supplies WebGPU and WebGL rendering. ECharts supplies the field manual charts. Font Awesome Free supplies interface icons.

| Package | Lockfile version |
| --- | --- |
| three | 0.186.1 |
| @types/three | 0.183.1 |
| typescript | 5.9.3 |
| vite | 8.3.1 |
| vitest | 4.1.11 |
| echarts | 6.1.0 |
| zrender | 6.1.0 |
| @fortawesome/fontawesome-svg-core | 7.3.1 |
| @fortawesome/free-solid-svg-icons | 7.3.1 |


The declared package ranges can resolve to newer versions in a future install without the lockfile. `package-lock.json` is the exact dependency snapshot. The lockfile values above identify this inspected revision.

| Package script | Behavior |
| --- | --- |
| `npm run dev` | Vite development server bound to 127.0.0.1 |
| `npm run build` | `tsc --noEmit` followed by the Vite production build |
| `npm run preview` | Vite static build preview bound to 127.0.0.1 |
| `npm test` | Vitest noninteractive test run |
| `npm run test:balance` | The explicit balance benchmark test file; a report path enables its campaign panel |

`npm ci` installs from the lockfile. The recorded build used Node 26.10.0. CI uses Node 22; the README specifies Node 22.12 or newer as the baseline. TypeScript targets ES2022 with DOM and DOM.Iterable libraries, ESNext modules, Bundler resolution, strict checking, no emit, and `skipLibCheck`. Its configured include is `src`; the separate tools and tests execute through Vitest rather than that application type-check include.

Vite uses `base:'./'`, which supports the game's `/smtd/` subdirectory. The static result is `dist/`. Three.js is separated into a `three` chunk. ECharts and ZRender share a `charts` chunk. The manual loads on demand. The build does not enable source maps in its configuration. Recorded production builds report a large-chunk advisory for the Three.js and chart bundles; that advisory is not a measured runtime performance failure.

GitHub Actions runs on pushes and pull requests with read-only repository content permission. Its `verify` job uses Ubuntu, Node 22, npm caching, `npm ci`, `npm test`, and `npm run build`. It does not run a physical-device test, human campaign playtest, or production deployment.

## 19. Arcade packaging and deployment

The standalone game can run as static files without a server account or credentials. The production Arcade adds the optional shared score API and two same-origin audio recordings. Local builds and forks retain combat and fallback sound when those services are absent.

The companion Arcade keeps three registrations consistent. `src/games.json` describes the game card and preview. `api/games.json` registers the scoreboard. The private `ops/game-sources.json` maps each slug to its local build source. The slug is `smtd`, and the public route is `/smtd/`.

`ops/build-release.py` builds the Arcade and every configured game into one staged release. It validates slugs, registry coverage, build scripts, output locations, and the presence of each index page. It rejects symlink outputs and database files. It preserves eligible existing game directories that are not in the current local configuration. A staged directory replaces the previous local output with a rollback backup if activation fails. Static directories use mode 755 and static files use mode 644.

`ops/deploy.py` accepts a reviewed payload and a privacy-clearance receipt. The payload contains public static files and API source. The script rejects links, databases, and environment files, verifies web-readability and the clearance, creates an archive, and verifies its SHA-256 after upload. Deployment creates a new release directory, backs up SQLite through its backup API, atomically changes the `current` symlink, and restarts the API service. It retries the health check up to five times with one-second delays. If health fails, it restores the prior symlink and restarts the prior service when a previous release exists.

The deployment tree contains `releases/<release>/public`, `releases/<release>/api`, `current`, and `shared`. SQLite and backups live in `shared`, so static releases do not replace score data. This document excludes SSH credentials and private deployment keys.

The checked-in Nginx configuration serves `current/public`, proxies `/api/` to the loopback API on port 3784, sends the client address through `X-Real-IP`, sets content-type sniffing and referrer headers, denies dotfiles, and returns 404 for missing static paths. The API trusts `X-Real-IP` only when its direct peer is loopback. The Nginx template shown in source listens on port 80; the public game's HTTPS endpoint is a recorded deployment observation, not proof that this template contains certificate configuration.

The systemd service binds the API to loopback, uses `ARCADE_ORIGIN`, `ARCADE_DB_PATH`, and `PORT`, restarts on failure after three seconds, and enables `NoNewPrivileges`, `PrivateTmp`, strict system protection, and home protection. Its writable path is the shared-data directory. The standalone server's default port is 3012; production overrides it to 3784. `HOST` appears in the service environment but the server code binds loopback directly.

The latest recorded verification for this specification found the Arcade homepage, SMTD, Last Engineer, both scoreboards, the SMTD preview, poster, suppressed-shot cue, and casing cue responding successfully. The non-SMTD pages and existing board responses matched their predeployment bytes. These observations are dated release evidence, not uptime monitoring.


## 20. Balance tooling and verification evidence

The balance tool exercises only the public session API. It does not inject funds, teleport upgrades, edit enemy state, or read hidden RNG state. Reports store each attempted command, its result, integer tick, cash before and after, gross spending, income, recall refund, and before/after frame hashes. Refused commands must preserve the complete frame. [S10], [S11]

Wave records begin at preparation for the upcoming wave and end at that wave's exact clear, defeat, or timeout tick. Purchases after a clear belong to the next wave. The next wave starts 360 ticks after the preceding clear. Each wave and command must reconcile `ending cash = opening cash + income + refunds - spending`.

Report schema version 1 carries the exact source-file hashes for content, game, types, and the runner, plus the frozen policy hash. The output includes command records, wave records, final state, final hash, and whether a timeout occurred. A replay requires matching source and policy hashes, repeats the recorded commands, and compares results and boundary frames. A Frame by itself is insufficient to reconstruct that replay.

### Experiment definition

Five policies use the same pad order and initial/intermission decision opportunities. They make one deployment pass and three promotion passes in deployment order. All use First targeting. The Diverse policy uses all roles. Splash/control puts more emphasis on Grenadiers. Concentrated policies use only Gunners or Snipers. Frozen follows Diverse through preparation for wave ten and then stops purchasing. Spending differs between policies; this is not an equal-budget role ranking.

| Policy | Roster in deployment order |
| --- | --- |
| diverse-greedy | Cadet, Cadet, Cadet, Cadet, Gunner, Grenadier, Sniper, Engineer, Officer, Grenadier, Gunner, Sniper, Engineer, Gunner, Sniper, Officer |
| splash-control | Cadet, Cadet, Cadet, Cadet, Grenadier, Engineer, Sniper, Grenadier, Officer, Grenadier, Engineer, Sniper, Grenadier, Gunner, Sniper, Officer |
| gunner-greedy | Gunner in all 16 positions |
| sniper-greedy | Sniper in all 16 positions |
| diverse-frozen-10 | Diverse roster and purchase rule until wave 10 begins; no purchases for waves 11 onward |

The zero-based pad order is `0, 3, 7, 9, 1, 5, 8, 4, 2, 11, 10, 6, 12, 14, 15, 13`.


Tuning seeds are `52, 914, 7341, 1009, 65537, 20260926, 17, 97`. Held-out seeds are `113, 509, 12347, 98761, 314159, 271828, 8675309, 424242`. The main panel uses no strikes. A separate fixed-rescue panel attempts one strike on waves 15, 25, and 30 at the first observed combat tick with wave time at least eight seconds. It does not retry. A wave that ends earlier uses no strike.

The selected Measured candidate multiplies the first, second, and third promotion prices by 1, 2, and 4 relative to the original table. The tested Deep candidate uses 1, 3, and 6. Deployment prices stay fixed. Both passed the tuning gates; the milder candidate was selected before its held-out evaluation.

The default campaign tick limit is 180,000 ticks, equivalent to 3,000 simulation seconds. The benchmark is enabled by `SMTD_BALANCE_OUT`; without that variable its test is skipped. A report label does not apply a candidate's prices. The checked-out `src/content.ts` supplies the actual data. Reconstructing another candidate requires the corresponding content matrix, with the frozen runner unchanged.

| Environment variable | Meaning |
| --- | --- |
| `SMTD_BALANCE_OUT` | Output report path and explicit benchmark enable switch |
| `SMTD_BALANCE_LABEL` | Descriptive label, default `baseline`; it does not mutate content |
| `SMTD_BALANCE_SPLIT` | `tuning` or `held-out`; default `tuning` |
| `SMTD_BALANCE_STRIKES` | `none` or `fixed-rescue`; default `none` |
| `SMTD_BALANCE_BASELINE` | Optional prior report path for a paired comparison |
| `SMTD_BALANCE_REQUIRE_PASS` | Value `1` makes failed comparison gates fail the test |
| `SMTD_BALANCE_REVIEW_DIR` | Enables validation of retained paired reports in the comparison tests |

The comparison checks schema, declared split, strike mode, exact seeds, policy specification/hash, source inventory, unique seed/policy membership, per-run provenance, ledger identity, and final-state agreement with the last wave record. Across paired reports, only the content source hash may differ. It recomputes summaries instead of trusting supplied summaries. These checks detect inconsistent reports; they are not tamper-proof authentication or a replacement for combat replay.

### Acceptance gates and measured result

Each mixed policy must win at least six of eight samples, lose no more than two victories against baseline, and have no more than two defeats before wave ten. Median full-board rank-three saturation must move at least four waves later and reach wave twenty or remain unobserved with an explicit bound. Median spending during waves 21 through 30 must be positive. Frozen must have fewer wins or lower median ending integrity than evolving Diverse. Timeouts fail. Concentrated-policy outcomes are disclosed without requiring those policies to lose.

An unobserved saturation remains null. The lower-bound field uses one beyond the last observed wave as a censoring bound. It does not claim that full promotion actually happened at that wave. A median can remain null when the middle observations are censored.

In the recorded held-out run, both mixed policies won all eight samples with 20 integrity and no strikes. Diverse's full promotion moved from wave 20 to wave 26, with $3,020 spent during waves 21 through 30. Splash/control moved from wave 20 to wave 27, with $3,240 late spending. Ending funds fell from $8,149 to $4,894 for Diverse and from $8,039 to $4,704 for Splash/control. Frozen won none of its eight samples. Gunner-only and Sniper-only still won all eight.

The paired fixed-rescue panel did not change those completion counts. Across seven final panels, 280 run ledgers and 35 full command replays passed. These are recorded deterministic experiment results. They do not estimate general human win rate, demonstrate that all roles are necessary, or establish that the three strikes are needed for a strong defense.

### Automated tests and browser evidence

A clean checkout of the inspected revision has 46 passing tests and two intentional skips, the explicit campaign benchmark and private saved-panel comparison. The recorded run with saved panels had 47 passing tests and skipped the campaign benchmark. The source contains game-behavior tests, ledger and replay tests, comparison validation and rejection tests, and the opt-in campaign panel. The documentation pass reran the source suite with private publication copies excluded and confirmed 46 passing tests and two skips. Historical production builds passed TypeScript and Vite, with the documented chunk-size advisory.

Game tests cover starting state, placement failures, upgrade cap, recall rounding, invalid ticks, pause, snapshot isolation, same-seed behavior, wave completion, clear rewards, the 360-tick intermission, a legal campaign completion, bounty scaling, exact boss health, rage timing, sampled proc frequencies, headshots, idle credit, aura exclusions, slow refresh, splash, medic healing, and airstrike effects. Named test coverage does not imply every possible boundary or combination is exhaustively tested.

Recorded browser checks include actual WebGPU play, WebGL2 startup, visible role statistics, affordability transitions, range display, automatic progression, strike use, help and pause, desktop and 390-pixel viewport readability, keyboard-control sampling, all six soldier forms, robot visibility, audio initialization, and the live promotion price. The latest live-price check showed a rank-two Gunner with $55 remaining and a disabled $70 next promotion, with no console errors and no measured text below 18 CSS pixels.

The initial live score test accepted a clearly named zero-point QA result with HTTP 201. An identical retry returned HTTP 200 and the same row with `replayed:true`. That verification entry remains because no cleanup endpoint is documented. Later deployment verification used read-only scoreboard checks rather than creating another result.

Physical-phone performance, sustained frame time under heavy waves, memory ceilings, complete screen-reader play, full keyboard campaign completion, real fullscreen, browser device-loss recovery, and a complete WebGL2 campaign have not been established by the cited verification records. No minimum GPU model, hardware memory requirement, or supported-browser matrix has been measured for this release.

## 21. Assets, copyright, and licensing

The software and original procedural geometry use the MIT license. The software license excludes ShoeMoney brand artwork, robot identity, name, and trademarks. The unchanged logo and armored robot came from the owner's ShoeMoneyX collection at the owner's request. A fork can replace those assets without changing combat. [S13]

The bundled pistol and rifle WAVs come from The Free Firearm Sound Library. The Gunner burst was extracted from the related source archive, trimmed, converted to mono 44.1-kHz 16-bit audio, attenuated, and faded at its boundaries. The source package retains attribution to Ben Jaszczak, Brian Nelson, Kevin Heras, and Matthew Nanney and records CC0 terms. The document reports the repository's recorded provenance; it does not relicense any third-party work.

| Asset | Distribution and role |
| --- | --- |
| `public/brand/robot.webp` | ShoeMoney brand asset; faded background; excluded from MIT |
| `public/brand/shoemoney.png` | ShoeMoney brand logo and favicon; excluded from MIT |
| `public/audio/pistol-shot.wav` | Bundled CC0 firearm recording |
| `public/audio/rifle-shot.wav` | Bundled CC0 firearm recording |
| `public/audio/gunner-burst.wav` | Processed CC0 firearm burst |
| `/last-engineer/game/audio/sfx/pistol_suppressed.mp3` | Existing same-origin production recording; excluded from this source package |
| `/last-engineer/game/audio/sfx/bullet_casing.mp3` | Existing same-origin production recording; excluded from this source package |
| `public/preview/gameplay.gif` and `gameplay.png` | Captures of actual game play |
| `public/THIRD_PARTY_LICENSES.txt` | Retained dependency license texts |

The production suppressed sound is an existing suppressed-pistol cue used for the Sniper. It is not documented as a recording of a sniper rifle. The source credits identify the suppressed and casing reference recordings but do not establish a redistribution license. Those MP3s remain outside this repository. Local and forked builds use the filtered rifle and procedural casing fallbacks unless their operator supplies rights-cleared alternatives.

Font Awesome Free icons use CC BY 4.0, and its code uses MIT. No Pro package is bundled. Barlow uses the SIL Open Font License. Three.js uses MIT. ECharts and ZRender use Apache License 2.0. The definitive retained notices are the source license and asset-provenance files.

## 22. Known limits and unimplemented systems

The campaign is demonstrably completable by the recorded scripted policies. Concentrated Gunners and Snipers still succeed with full integrity in those samples. The promotion-price change improves purchase timing; it does not prove broad strategic balance or a target level of challenge for new players.

The browser uses one fixed seed. The engine supports other integer seeds, but the player has no seed selector. Session snapshots are detached views and cannot restore a run. The event buffer retains approximately one simulation second rather than a complete combat log. Pause stops new simulation events but does not cancel scheduled audio. Rendering can pause or fail independently of combat state, and recovery code requires browser verification beyond source inspection.

The native body has a 360-pixel minimum width. Some pad hit areas are smaller than 44 pixels. Full chart interaction is not mirrored as native keyboard controls. The manual's wave briefing changes on click, while hover shows the chart tooltip. The operating-system reduced-motion rule can continue to suppress CSS transitions even when the app's motion label says full.

Online scores are browser-reported. The form has no client request timeout, no automatic token recovery, and no generation guard on the final submission response. These are current integration limits. The version 1 API accepts results below the displayed top ten and does not prove game completion.

There is no infinite-wave generator, secondary map, flying route, boss phase AI, active tower movement, alternate difficulty, campaign checkpoint, cloud save, multiplayer, account inventory, authoritative score replay, localization framework, or content editor. Future ideas in the roadmap and research remain proposals until implemented and separately verified.

## 23. Complete type reference and metadata

The types below are the exported contracts from `src/types.ts`. Optional fields use `?`. Runtime validation remains defined by the command implementation; a TypeScript type alone does not validate untrusted JavaScript. Coordinates and ranges are world units; session timestamps and deadlines are simulation seconds, except integer tick arguments. Money and IDs are integers. HP and accumulated damage can be fractional.

### Role

```ts
type Role = 'cadet' | 'gunner' | 'sniper' | 'grenadier' | 'engineer' | 'officer';
```

### Rank

```ts
type Rank = 0 | 1 | 2 | 3;
```

### EnemyKind

```ts
type EnemyKind = 'scout' | 'runner' | 'swarm' | 'armored' | 'medic' | 'elite' | 'boss';
```

### Phase

```ts
type Phase = 'build' | 'combat' | 'victory' | 'defeat';
```

### TargetPolicy

```ts
type TargetPolicy = 'first' | 'strongest' | 'weakest';
```

### Point

```ts
interface Point {
	x: number;
	z: number;
}
```

### Pad

```ts
interface Pad extends Point {
	id: number;
	name: string;
}
```

### RankSpec

```ts
interface RankSpec {
	name: string;
	cost: number;
	damage: number;
	rate: number;
	range: number;
	splash?: number;
	slow?: number;
	aura?: number;
}
```

### UnitSpec

```ts
interface UnitSpec {
	id: Role;
	name: string;
	tag: string;
	description: string;
	special: string;
	color: string;
	ranks: [RankSpec, RankSpec, RankSpec, RankSpec];
}
```

### EnemySpec

```ts
interface EnemySpec {
	name: string;
	hp: number;
	speed: number;
	armor: number;
	bounty: number;
	leak: number;
	color: string;
	description: string;
}
```

### SpawnGroup

```ts
interface SpawnGroup {
	kind: EnemyKind;
	count: number;
	at: number;
	interval: number;
}
```

### WaveSpec

```ts
interface WaveSpec {
	number: number;
	name: string;
	briefing: string;
	lesson: string;
	reward: number;
	groups: SpawnGroup[];
	bossName?: string;
	hpMultiplier: number;
}
```

### Tower

```ts
interface Tower extends Point {
	id: number;
	role: Role;
	rank: Rank;
	pad: number;
	cooldown: number;
	rageUntil: number;
	targetId: number | null;
	policy: TargetPolicy;
	kills: number;
	damageDealt: number;
	invested: number;
}
```

### Enemy

```ts
interface Enemy extends Point {
	id: number;
	kind: EnemyKind;
	hp: number;
	maxHp: number;
	progress: number;
	armor: number;
	speed: number;
	slowUntil: number;
	slowFactor: number;
	bounty: number;
	leak: number;
	boss: boolean;
}
```

### CombatEvent

```ts
interface CombatEvent {
	id: number;
	time: number;
	kind: 'shot' | 'blast' | 'headshot' | 'rage' | 'kill' | 'leak' | 'wave-clear' | 'deploy' | 'upgrade' | 'airstrike';
	from: Point;
	to: Point;
	role?: Role;
	amount?: number;
}
```

### GameStats

```ts
interface GameStats {
	kills: number;
	headshots: number;
	headshotKills: number;
	rageProcs: number;
	damage: number;
	spent: number;
	earned: number;
	leaked: number;
}
```

### Frame

```ts
interface Frame {
	time: number;
	phase: Phase;
	paused: boolean;
	wave: number;
	waveTime: number;
	cash: number;
	lives: number;
	score: number;
	towers: Tower[];
	enemies: Enemy[];
	events: CombatEvent[];
	stats: GameStats;
	spawned: number;
	waveTotal: number;
	nextWaveIn: number | null;
	airstrikes: number;
	airstrikeReadyIn: number;
}
```

### Command

```ts
type Command = { kind: 'place'; role: Role; pad: number } | { kind: 'upgrade' | 'sell'; tower: number } | { kind: 'target'; tower: number; policy: TargetPolicy } | { kind: 'start-wave' | 'restart' | 'airstrike' } | { kind: 'pause'; value: boolean };
```

### CommandResult

```ts
type CommandResult = { ok: true } | { ok: false; reason: string };
```

### Session

```ts
interface Session {
	command(command: Command): CommandResult;
	advance(ticks: number): void;
	frame(): Frame;
}
```

### Battlefield

```ts
interface Battlefield {
	render(frame: Frame, selectedPad: number | null, role: Role | null, reducedMotion: boolean): void;
	project(point: Point): { x: number;
	y: number };
	backend: 'WebGPU' | 'WebGL2';
	dispose(): void;
}
```

The HTML entry declares English, UTF-8, a device-width viewport, theme color `#07121d`, the title `ShoeMoney Tower Defense | Operation Iron Dividend`, a canonical production URL, Open Graph website metadata, and the Arcade's SMTD gameplay poster. It mounts the app at `#app` and loads `/src/main.ts` through Vite. No tracking script or service-worker registration appears in the inspected entry and application modules.

## 24. Source index and revision identity

This document's source references point to the inspected game revision. The companion Arcade files are identified by file name and SHA-256 because they belong to a separate checkout. The hashes identify the read snapshot and do not certify deployment or authorship.

| ID | Source | SHA-256 |
| --- | --- | --- |
| S1 | [src/content.ts](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/src/content.ts) | 455d053df5f9ec996cbcb031f5f9b4604b7c2116b0749b5654bdacddbb3e15ba |
| S2 | [src/game.ts](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/src/game.ts) | bd690080bfa6111291a08d7de54456887d242ba118e5e9993065ad8180835b8b |
| S3 | [src/types.ts](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/src/types.ts) | fdba36a276ca33be58dd8c2fe361f02629d127b175cfb16f1809d09cd68eda6f |
| S4 | [src/main.ts](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/src/main.ts) | 6097a36d649a27822c7e146c58e4572251e8413cd401c650c03952c3775de0a9 |
| S5 | [src/battlefield.ts](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/src/battlefield.ts) | 695cad2fa82f386530cd892f63fe2ca1fb4e5c707346a6145d7ad4ae2238715e |
| S6 | [src/audio.ts](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/src/audio.ts) | 2357749bacce7f174c45280aa3408975378f3c4682eda383252944b177939c12 |
| S7 | [src/manual.ts](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/src/manual.ts) | d7f3ee13c43bd7699845d62ef53d919a1a86c763f71170e09eb8a50774b25232 |
| S8 | [src/style.css](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/src/style.css) | 957d7587b2262bde06462199aace69c14d546a51d6756f2b65fa7f9a072ba72a |
| S9 | [index.html](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/index.html) | 3a90b3fb30f9689cc757bdf3223c988725f746f42dee598aac0b73d48ae3fae5 |
| S10 | [tools/balance.ts](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/tools/balance.ts) | 54ea36ab377a5414ad4d7bacc6f24fbf56e63084ed2bc66255071e67c4f12da6 |
| S11 | [tools/comparison.ts](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/tools/comparison.ts) | c910be9febc1d8adc6679da83772f11ac7e86dc252e5c7c39e94d0109740a8e1 |
| S12 | [tests/game.test.ts](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/tests/game.test.ts) | c6994bcdf630ec1b9ae722dd180204818fa2e67cb48ecfcf2803f4b12deeffed |
| S13 | [ASSETS.md](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/ASSETS.md) | 79db7e2a113185b550aa633812dbe20b9ac8cedeafeee4d6e0ceb955cb2f288f |
| S14 | [package.json](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/package.json) | 97d518c8be67d2c237b7aed63ea5fb5628d5a373c83143417c2769d76394d5c1 |
| S15 | [package-lock.json](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/package-lock.json) | 0ba7bc52e81b8a3a412a5e5f12baa1c92b6c515c003ade45e7e02caf45ae9bed |
| S16 | [vite.config.ts](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/vite.config.ts) | e827d13cff6e3c4b557315141bb411509e6187d23fd9565059703948283506f6 |
| S17 | [tsconfig.json](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/tsconfig.json) | a861390dce0b773c99875359644ce09d8fbe8f094f2a531cefb197f0fae5b18e |
| S18 | [.github/workflows/checks.yml](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/.github/workflows/checks.yml) | 251761103f0403b498e41b463acda6723d3b43d82057616af8daaba9f93a919d |
| S19 | [docs/balance-method.md](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/docs/balance-method.md) | 5a53300de9c3172838483bebfacb6ecf9e304d724c85805b9c937971856c3e92 |
| S20 | [docs/verification.md](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/docs/verification.md) | 8bdcb54cc4f0d880eb0f60a073b4a4d167037f64109b4e54afaaea182e6d571b |
| S21 | [tests/balance.test.ts](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/tests/balance.test.ts) | 35f0f7e2964991ee87b69eab8dbf2410cfc377cd67b47c25330d7b1b04cb9dbc |
| S22 | [tests/comparison.test.ts](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/tests/comparison.test.ts) | c42ab5cb52537a76b37407bfc03dd56f22ad4b76ee4e27a6112b46a4cd382565 |
| S23 | [tests/balance.benchmark.test.ts](https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/tests/balance.benchmark.test.ts) | 4c1572a3f136e06307b03639bd7ab21c5661df551a558da4c4438b50690b57b7 |
| A1 | SMA-arcade/api/server.mjs | 81e3ad85ba825471f8fdf98de198f9d164fbd84e44d654d3b24e1262d058a343 |
| A2 | SMA-arcade/api/games.json | 47bf041d902c5642bf431307fe50f8f10ac8946e0e3ca0c64c7202b05fd7d23f |
| A3 | SMA-arcade/ops/build-release.py | e6518ca0a8d5cc767e573fcf6a98d8883b535065092fd0b4f44f536017a49664 |
| A4 | SMA-arcade/ops/deploy.py | b979a091c4f33e1ca67bd1aefa8c0e4dae2a209329fef3a15cc89abe517e99da |
| A5 | SMA-arcade/ops/arcade.nginx.conf | 26d0880a457a90f26f89e0ac97ace6842dd6de92a84100b14c5d51e0748a419f |
| A6 | SMA-arcade/ops/arcade-api.service | db4f0d307b63e31f046344cbaa036146883b40862062ace88c8b79297942baeb |


The earlier research report is retained at `docs/research/tower-defense-research.md`. It records a thirteen-source study dated September 25, 2026, including historical manuals and developer discussions of several tower-defense formats. Its archival wave alternatives, illustrative economies, proposed modes, and proposed tests are not runtime specifications. The current exported data and engine rules in this document take precedence for this release.

The source also retains `docs/game-design.md`, `docs/architecture.md`, `docs/balance-data.md`, `docs/balance-method.md`, `docs/playtest-plan.md`, and `docs/verification.md`. The older verification record contains launch-era results; section 20 identifies the later promotion-timing evidence and its limits.

[S1]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/src/content.ts
[S2]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/src/game.ts
[S3]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/src/types.ts
[S4]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/src/main.ts
[S5]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/src/battlefield.ts
[S6]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/src/audio.ts
[S7]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/src/manual.ts
[S8]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/src/style.css
[S9]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/index.html
[S10]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/tools/balance.ts
[S11]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/tools/comparison.ts
[S12]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/tests/game.test.ts
[S13]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/ASSETS.md
[S14]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/package.json
[S15]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/package-lock.json
[S16]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/vite.config.ts
[S17]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/tsconfig.json
[S18]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/.github/workflows/checks.yml
[S19]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/docs/balance-method.md
[S20]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/docs/verification.md
[S21]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/tests/balance.test.ts
[S22]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/tests/comparison.test.ts
[S23]: https://github.com/shoemoney/SMA-smtd/blob/2f9db56abfb75d0ccae5838dc64b70afb92c8fe2/tests/balance.benchmark.test.ts
