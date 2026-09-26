# Tower defense research for ShoeMoney Tower Defense

Research date: **September 25, 2026**. Campaign: **Operation Iron Dividend**. Battlefield: **Guardian Outpost**.

The recommendation is a fixed-route campaign whose difficulty comes mainly from enemy combinations, arrival timing, placement, and spending decisions. Six recognizable soldiers and thirty deliberately authored waves are enough for a complete first game. The requested Machine Gunner and Sniper abilities are unusually powerful; their timing rules and the campaign's weakest acceptable random outcomes matter more than adding more tower types.

This is research and an implementation-oriented design proposal, not a claim that the proposed balance has passed playtesting. **Observed** below means a mechanic or design statement actually described in a primary source. **Inference** means our interpretation. **Starting value** means an original number to test. No source's wave schedule, map, art, characters, or complete progression is reproduced. Store descriptions establish advertised mechanics, not empirical proof of balance or current player satisfaction.

## Current user rules override earlier proposals

**The user's latest instructions are authoritative.** The historical examples and earlier design alternatives below do not override these current campaign rules:

- Start with **$100**. Deployment prices increase across the visible roster: Cadet **$10**, Machine Gunner **$25**, Sniper **$40**, Grenadier **$55**, Combat Engineer **$70**, Field Officer **$85**. Each still has exactly three upgrades.
- Ordinary kill bounty is `1 + floor((wave − 1) / 3)` dollars: $1 in waves 1–3, rising every three waves. Boss bounty is ten times that wave's ordinary bounty. Clear reward is `5 + floor(wave / 5) × 2` dollars. These replace earlier economy examples.
- The player launches once. Later waves begin **automatically after six simulation seconds** following a full clear. Pause freezes the countdown. There are no repeated manual wave starts or early-call rewards.
- An escorted boss appears on **every fifth wave: 5, 10, 15, 20, 25, and 30**. Current authored boss HP is 700, 2,600, 4,500, 8,640, 13,000, and 21,000 respectively, without multiplying by normal wave health scaling again.
- **Three airstrikes are available for the entire campaign**, with a twelve-simulation-second cooldown. A strike kills currently spawned normal enemies and deals 35% maximum HP to currently spawned bosses, ignoring armor. Future spawn packets are unaffected. Kills pay the ordinary bounty and score once. Charges do not replenish between waves.
- All six soldiers remain displayed as **visible cards**, with statistics available through hover, keyboard focus, and tap. No soldier-selection dropdown is used.

The [current game plan](../game-design.md), [balance reference](../balance-data.md), and exported [content data](../../src/content.ts) describe the live rules. **Section 5's earlier thirty-wave schedule is an archival alternative, not a current recommendation or an implementation claim.** Primary-source facts in Section 1 remain unchanged.

## 1. Primary-source evidence

All sources below were opened and accessed on **2026-09-25**. Each source summary is deliberately short; the detailed design that follows is our own proposal. Historical documents are identified explicitly because they should not be mistaken for the current versions of their games.

### S1. Kingdom Rush: specialized defenses and active intervention

**Observed:** Ironhide's own Steam description presents tower specializations, soldiers that fight directly, reinforcements, spells, heroes, distinct enemies, bosses, and an in-game tower/enemy encyclopedia. These are several different ways to express tactical decisions around a defense layout. The page describes the original *Kingdom Rush*, not the later PvP game.

**Inference:** A military roster benefits from immediately different jobs and a small number of readable emergency decisions. An encyclopedia should explain every threat encountered; it should not be required reading before wave one.

Source: [Ironhide, Kingdom Rush official product description](https://store.steampowered.com/app/246420/Kingdom_Rush/).

### S2. Kingdom Rush Battles: visible resistances

**Observed:** Ironhide's *Battles* support guide distinguishes physical armor from magic resistance, identifies their icons, and tells players to inspect enemies and use complementary tower classes. This is evidence about *Kingdom Rush Battles*, not verification that every franchise entry uses identical rules.

**Inference:** Show what armor does and which soldiers remain useful before the enemy arrives. Do not make color the only carrier of that information.

Source: [Ironhide, Armor Types Breakdown](https://support.ironhidegames.com/support/solutions/articles/4000223666-armor-types-breakdown-kingdom-rush-battles-guide), modified November 3, 2025.

### S3. Bloons TD 6: combinations and replayable rules

**Observed:** Ninja Kiwi's Steam description advertises tower upgrade paths, heroes, handmade maps, boss events, challenges, and a browser for community-created challenges and Odysseys. Its advertised breadth combines authored content with variations in rules.

**Inference:** Replay value need not require more raw enemy HP. A later ShoeMoney challenge mode could constrain spending, ranks, or roster choices after the normal campaign is proven. The original brief's exactly three sequential upgrades should remain simpler than Bloons' branching system.

Source: [Ninja Kiwi, Bloons TD 6 official product description](https://store.steampowered.com/app/960090/Bloons_TD_6/).

### S4. Bloons TD 6: an actual balance rationale

**Observed:** Ninja Kiwi's official version 50.0 update post explains an increase to Crossbow pierce in terms of the number of child Bloons produced by popped targets. It also describes an updated tutorial and changes to attack behavior. This is a dated developer balance example, not a statement about the latest patch.

**Inference:** Balance at the encounter level. The number of targets created or clustered together can change an attack's usefulness even when nominal damage is unchanged. Fix the interaction that fails instead of inflating every stat.

Source: [Ninja Kiwi, official Bloons TD 6 v50.0 update notes](https://www.reddit.com/r/btd6/comments/1n163k9/bloons_td_6_v500_update_notes/), official post by `savnk`. Community replies are not used as evidence.

### S5. Defense Grid: route control, information, and recovery

**Observed:** The original official manual explains both roadside construction and open areas where towers lengthen the route; enemies can traverse tower force fields if completely blocked. It documents incoming-enemy reconnaissance, range/path displays, recoverable stolen cores, checkpoints, interest on unspent resources, and multiple enemy capabilities. Its cannon can waste damage on weak enemies, while area weapons benefit from dense groups.

**Inference:** Coverage, useful damage, and readable previews matter as much as nominal DPS. A fixed route captures these placement decisions without making the first release responsible for maze pathfinding. Mistakes can be recoverable without being consequence-free.

Source: [Hidden Path, Defense Grid: The Awakening official manual](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/18500/manuals/manual_english.pdf?t=1721059385), particularly pages 2–4 and 9–11. This is the original game's historical manual.

### S6. Plants vs. Zombies: lane pressure and investment

**Observed:** PopCap's manual describes a grid of rows and columns, sun as the planting resource, sun-producing plants, different environmental stages, limited loadout selection, and survival modes. A lane reaching the house is a concrete loss condition; the defensive problem is spatial as well as economic.

**Inference:** A player should be able to see which part of the defense is failing. Economic choices should have visible consequences in the next encounter. Avoid adding a resource-production subsystem merely because another successful game has one.

Source: [PopCap, Plants vs. Zombies official readme/manual](https://akamai.cdn.ea.com/eadownloads/u/f/manuals/GAME-PVZ/en_US_readme.html), version 1.0.40, build dated October 17, 2012.

### S7. George Fan's GDC tutorial design lessons

**Observed:** In his GDC 2012 slides, the designer of *Plants vs. Zombies* recommends learning through actions in safe situations, spacing out mechanics, keeping messages brief, minimizing interruptions, using adaptive prompts, and making units communicate their function visually. The slides describe experimentation around teaching the game's economic plant.

**Inference:** The first campaign waves should teach through comfortable successes. One new threat, one short explanation, then time to use the answer. A giant tutorial overlay would work against the battlefield's purpose.

Source: [George Fan, How I Got My Mom to Play Through Plants vs. Zombies, GDC 2012 slides](https://media.gdcvault.com/gdc2012/slides/Design%20Track/Fan_George_How%20I%20Got.pdf), March 9, 2012; especially slides 34–56, 83–86, 117–145, and 150. The relevant teaching and visual-design slides were also inspected as rendered PDF pages.

### S8. Orcs Must Die! 3: action hybrid and alternate modes

**Observed:** Robot Entertainment presents traps, personal weapons, large War Scenarios, mountable War Machines, campaign play, designer-made weekly challenges, Endless mode, and randomized Scramble maps with debuffs.

**Inference:** Direct player combat is a second demand on attention. Borrow its sense of impact and its clear trap combinations, while keeping this browser game's core decision loop centered on soldiers. Endless should be a separate promise from finishing thirty waves.

Source: [Robot Entertainment, Orcs Must Die! 3 official page](https://robotentertainment.com/omd3).

### S9. Orcs Must Die! 3: economy and preparation are balance tools

**Observed:** Update 1.2.1.0 explicitly addresses the balance between trap damage and player damage. It lowers many trap prices, increases selected trap damage, lengthens certain preparation breaks, and removes full fire immunity from Fire Fiends.

**Inference:** Price, preparation time, and degree of resistance are independent tuning tools. A wave that feels unfair may need a longer planning interval or a less absolute counter, not a universal enemy nerf.

Source: [Robot Entertainment, Orcs Must Die! 3 update 1.2.1.0](https://robotentertainment.com/news-archive/2023/5/31/orcs-must-die-3-update-1210-2b5a6), June 5, 2023.

### S10. Orcs Must Die! Deathtrap: assumptions must survive real play

**Observed:** Robot's patch 1.0.7 explains why it introduced a fixed initial supply of free barricades: predictable map possibilities, reduced novice overspending, and multiple interesting solutions. It then raises the supply for smaller teams after player feedback and reduces progression costs. The developer acknowledges that extensive internal balancing did not settle how those constraints felt.

**Inference:** A mathematically solvable layout can still feel restrictive or confusing. Validate with actual first-time players and record whether they understand why a failure happened.

Source: [Robot Entertainment, Deathtrap patch 1.0.7](https://robotentertainment.com/news-archive/2025/1/31/patch-107), January 31, 2025.

### S11. Rogue Tower: controlled uncertainty and encounter geometry

**Observed:** Die of Death describes player-chosen path expansion directions, randomly twisting or splitting paths, elevation-based tower bonuses, card upgrades, and enemies with healing, sprinting, spawning, and nearby-unit effects. Its description explicitly contrasts enemies arriving separately with merging them for area damage.

**Inference:** Composition, geometry, and timing jointly create a wave. Procedural route changes offer replayability but also create a much larger balance space than this first campaign needs.

Source: [Die of Death Games, Rogue Tower official product description](https://store.steampowered.com/app/1843760/Rogue_Tower/).

### S12. Infinitode 2: survival, feedback, and progression

**Observed:** Prineside's press kit describes endless waves, tower experience and targeting choices, resource miners, global research, modifiers, detailed statistics, and a map editor. The page contains old forward-looking platform statements, so its platform availability, counts, and size are not treated as current facts.

**Inference:** Endless modes need comprehensible feedback and a declared relationship to persistent upgrades. ShoeMoney's first campaign should be winnable with its campaign economy alone; a leaderboard should not quietly mix differently powered accounts.

Source: [Prineside, Infinitode 2 press kit](https://infinitode.prineside.com/?m=press_kit), historical/undated press material.

### S13. Element TD: support can create nonlinear value

**Observed:** A 2008 guide on the official Element TD forum, posted by a contributor labeled Designer, discusses damage and support towers, complementary damage types, slowing-induced clumping, overkill, and positions that get multiple passes over enemies. It is explicitly about the Warcraft III version, not Element TD 2.

**Inference:** The Combat Engineer and Field Officer must be evaluated by extra useful allied damage and prevented leaks, not their personal kill counts. Support placement can dominate without looking impressive in a DPS list.

Source: [Element TD, Basics of Element TD](https://forums.eletd.com/topic/945-basics-of-element-td/), July 22, 2008, by `holepercent`. No forum reply or historical numeric balance table is imported into our game.

## 2. What each tower-defense structure asks of a player

These are analytical categories, not mutually exclusive industry rules. The examples' relevant mechanics are sourced above.

| Structure | Main decision | Strength for this project | Additional burden | Decision |
| --- | --- | --- | --- | --- |
| Fixed-route defense | Place overlapping coverage and buy the appropriate mix before a known route overwhelms it | Legible on mobile; deterministic campaign tuning; easy route previews | Every useful build position needs a real tradeoff | Use for the first campaign |
| Maze building | Spend space and money to shape travel distance and repeated coverage | Strong expression and replayability | Path legality, blocking, rerouting abuse, recalculation, and difficult novice layouts | Consider later as a separate mode |
| Lane defense | Allocate limited defenses and economy among simultaneous fronts | Immediately visible allocation problem | Lane UI, transfer rules, and damage distribution are a different game | Borrow readable local pressure, keep the fixed route |
| Action hybrid | Divide attention between construction and direct combat | Spectacle and personal agency | Input conflicts, aiming, camera, difficulty based on physical dexterity | Keep optional battlefield abilities limited; no action-character dependency |
| Roguelite defense | Adapt a build to uncertain tools or changing terrain | Strong replay variation | Unwinnable combinations, unlock economy, random offer fairness | Reserve for later; no random soldier availability in the campaign |
| Survival/endless | Extend endurance against continued pressure | Natural post-campaign activity | Scaling limits, stalemates, performance ceilings, meaningful scoring | Separate from the thirty-wave victory condition |

The first campaign should have several useful coverage patterns on one route: a bend that favors splash; a long sightline for the Sniper; a middle position that can affect two nearby path segments; and a rear guard position that catches runners. Fixed route does not mean identical placement. A dominant center tile with access to every segment would erase these distinctions.

## 3. Soldier identities and the constraints they place on waves

All six soldiers have a base rank and exactly three upgrades. The upgrades should improve the same understandable role rather than secretly changing the rules halfway through the run. The following are role definitions and design implications, not a second conflicting stat sheet.

| Soldier | Required identity | Legitimate limitation | Encounter that gives the role a purpose |
| --- | --- | --- | --- |
| Cadet | Medium-rate pistol, low damage, no special effect at any rank | Limited range and throughput | Affordable opening, rear guard, finishing damaged scouts |
| Machine Gunner | High rate, medium damage; eligible shots have 5% chance of 5× rate for five seconds | Single target; moderate range; armor reduces ordinary bullet damage | Streams of scouts and runners; sustained pressure rather than one isolated giant |
| Sniper | Slow rate, high damage; 10% headshot chance; kills any normal enemy outright; 5× damage against bosses | Low target throughput, overkill, limited firing opportunities | Dangerous medics and elites; large boss health pool with normal backup damage |
| Grenadier | Area damage against clusters | Slow cadence; modest benefit against one isolated enemy | Dense swarm packets and healer escorts |
| Combat Engineer | EMP slowing with reduced effect on bosses | Low personal damage; slow effects do not accumulate indefinitely | Catching fast packs and extending allied firing opportunities |
| Field Officer | Sidearm plus nearby allied damage aura | No self-buff; only the strongest aura applies; no support feedback | Efficient mixed formation after enough damage soldiers exist |

Do not make every role mandatory in every successful build. A player should have more than one solution to scouts, runners, and armor. The campaign should reward mixed defenses without checking a hidden six-soldier shopping list. Cadets must retain a useful low-cost niche even when premium soldiers are unlocked.

Armor must be a **partial** reduction with an explicit displayed value. It cannot negate a normal-enemy Sniper headshot. If Grenadier attacks use less armor mitigation than bullets, that difference must be visible in its description; otherwise its armor-counter role is only a developer assumption. A medic's healing should be local, bounded, and visible, with no self-healing loop and no healing after death.

## 4. A wave is an arrival pattern, not a health multiplier

For each wave, author five things: its teaching purpose, composition, spawn timing, available preparation, and expected economic decision. Health is only one variable.

An encounter's important properties include:

- **Total work:** effective health that the defense must remove, including bounded healing.
- **Throughput demand:** targets arriving per second, especially where a slow single-target attack wastes damage.
- **Exposure:** how long an enemy remains inside each soldier's range, and whether it is seen again at a later bend.
- **Concurrency:** the largest number of important threats demanding attention at once.
- **Target interference:** low-priority enemies consuming shots intended for a medic, elite, or boss.
- **Counter availability:** whether the player could reasonably afford and understand more than one answer before the wave.

For a simple straight path, a soldier's approximate contribution is `damage per shot × shots per second × time in range`, adjusted for useful target access, mitigation, misses if any, and overkill. The units matter: a soldier with excellent nominal DPS may contribute little if it sees the runner for only one second.

Two waves with identical total health can differ dramatically. A long stream lets soldiers repeatedly reacquire; a dense packet rewards splash; separated elites waste splash capacity but reward precision. A medic behind armored units changes target priority. A late runner packet catches a defense that concentrated all damage at the entrance. These are original design applications, not measured results.

### The campaign's teaching cycle

**Teach:** introduce one mechanic in a forgiving encounter with a short preview. **Reinforce:** repeat it in a recognizable context. **Examine:** combine only threats that have already been taught. **Recover:** lower concurrency and provide a real spending opportunity. A recovery wave can still contain meaningful choices; it should not be an unannounced source of more dangerous enemies.

Do not introduce armor, healing, boss resistance, and a new ability simultaneously. If the player fails, the cause should be describable in one sentence, such as “runners passed the front position while it was shooting the armored escort.” The post-wave recap should show the enemy types that leaked and where they passed the last useful defense.

### Spacing, density, and catch-up

Use **spawn gaps within packets**, **gaps between packets**, and **movement speed** as separate controls. At speed `v` and spawn interval `g`, same-speed enemies initially separate by approximately `v × g` world units. Changing `g` alters splash opportunity without changing health.

A fast enemy launched behind a slow one can catch it. For a destination at distance `d`, arrival time is `spawnTime + d / speed`; use that expression to place packet overlap at a chosen bend. Do not eyeball spawn time alone. An escort spawned seconds after a boss may nevertheless reach a kill zone first.

For the first version, use authored times with no hidden timing jitter. If future variation is added, bound it and validate that it does not turn a deliberate separated threat into an accidental pileup. Spawn timing and combat must use simulation time, so pausing and 2× speed do not change the encounter.

## 5. Archival thirty-wave alternative — superseded

**ARCHIVE: Do not implement or recommend this schedule as the current campaign.** It records the original research alternative before the user required a boss every fifth wave, automatic progression, the revised dollar economy, and campaign airstrikes. Its former boss timing and preparation assumptions are superseded. The current schedule has six escorted bosses and is documented in [game-design.md](../game-design.md#7-the-implemented-thirty-wave-campaign). These historical rows remain only to preserve the reasoning behind composition, spacing, and recovery experiments; none is a tested balance result.

Enemy abbreviations: **SC** scout, **RU** runner, **SW** swarm infantry, **AR** armored infantry, **ME** medic, **EL** elite, **B** boss. All except B are normal enemies for the Sniper rule. A boss designation must be explicit at spawn and shown to the player; do not relabel ordinary elites to remove their headshot vulnerability.

Notation: `SC 8 @ 1.2` means eight scouts, one every 1.2 seconds. A block's first unit spawns at its listed start time; its last appears at `start + (count − 1) × gap`. Blocks in the same wave may overlap. Time offsets are seconds from that wave's start. The table defines spawn structure only; effective health, movement, income, and geometry must be tuned together.

| Wave | Purpose | Authored blocks and start times | Player-facing lesson or warning |
| --- | --- | --- | --- |
| 1 | Teach basic coverage | t0: SC 8 @ 1.6 | Deploy a Cadet covering a long section; identify entrance and base |
| 2 | Reinforce spending | t0: SC 12 @ 1.2 | A second position or first promotion both have time to contribute |
| 3 | Teach speed | t0: SC 8 @ 1.2; t8: RU 4 @ 1.5 | Runner preview; preserve rear coverage |
| 4 | Examine speed and coverage | t0: SC 14 @ 0.9; t7: RU 6 @ 1.0 | Runners overlap ordinary traffic |
| 5 | Teach density | t0: SW 12 @ 0.25; t9: SC 8 @ 1.1 | Grenadier preview: clustered infantry reward area damage |
| 6 | Reinforce density | t0: SW 12 @ 0.25; t9: SW 12 @ 0.25; t16: RU 6 @ 1.1 | Two clusters plus a separate fast tail |
| 7 | Teach armor | t0: AR 3 @ 3.0; t9: SC 12 @ 0.9 | Show the armor reduction and available answers before start |
| 8 | Examine first concepts | t0: AR 4 @ 2.5; t4: SW 16 @ 0.3; t17: RU 8 @ 0.7 | Dense infantry behind armor, then runners |
| 9 | Recovery and boss preparation | t0: SC 16 @ 1.1; t12: AR 2 @ 4.0 | Lower peak demand; announce boss properties for wave 10 |
| 10 | First boss exam | t0: SC 8 @ 0.9; t8: B 1; t15: AR 4 @ 2.2; t24: RU 6 @ 0.9 | One boss with a short readable opening and known escort types |
| 11 | Recovery and teach healing | t0: SC 10 @ 1.0; t5: ME 1; t18: SC 6 @ 1.2 | One medic in a weak escort; visible healing radius and pulse |
| 12 | Reinforce priority | t0: AR 5 @ 1.8; t4: ME 2 @ 6.0; t17: SC 10 @ 0.8 | Prioritize medics or clear their escort quickly |
| 13 | Examine fast pressure | t0: RU 12 @ 0.65; t12: RU 12 @ 0.65; t20: SC 12 @ 0.7 | Engineer slow and distributed firing positions help |
| 14 | Contrast density | t0: SW 24 @ 0.22; t11: AR 6 @ 2.2 | Splash burst followed by separated durable targets |
| 15 | Teach elite | t0: EL 2 @ 6.0; t9: SC 14 @ 0.8; t19: RU 8 @ 0.7 | Elite toughness without new immunity or hidden boss status |
| 16 | Reinforce elite | t0: EL 3 @ 5.0; t3: SW 24 @ 0.25; t19: ME 1 | Target selection matters; elite and healer remain headshot-eligible |
| 17 | Examine support positioning | t0: AR 8 @ 1.4; t8: RU 16 @ 0.5; t20: SW 18 @ 0.25 | Officer formation and Engineer coverage compete for useful ground |
| 18 | Combined-arms exam | t0: AR 6 @ 1.6; t4: ME 2 @ 7.0; t12: EL 3 @ 4.0; t22: RU 12 @ 0.55 | Several known threats; no new rule |
| 19 | Recovery and second-boss preparation | t0: SC 24 @ 0.9; t15: SW 12 @ 0.3 | Income and a calm upgrade interval; full boss briefing |
| 20 | Second boss exam | t0: AR 4 @ 2.0; t8: B 1; t14: SW 24 @ 0.25; t25: ME 2 @ 6.0; t32: RU 10 @ 0.65 | A boss can occupy precision fire while escorts threaten leaks |
| 21 | Recovery with precision | t0: EL 3 @ 6.0; t12: SC 20 @ 0.9 | Slow durable targets give an intelligible post-boss adjustment |
| 22 | Sustained throughput | t0: SC 36 @ 0.55; t10: SW 30 @ 0.2; t27: RU 12 @ 0.5 | Long stream tests sustainable damage after rage ends |
| 23 | Healing exam | t0: AR 10 @ 1.5; t5: ME 3 @ 6.0; t24: EL 3 @ 4.0 | Identify the healing source; bounded healing must not stall forever |
| 24 | Alternating packets | t0: SW 18 @ 0.22; t7: EL 2 @ 4.0; t16: SW 18 @ 0.22; t24: EL 2 @ 4.0 | A single damage profile is efficient for only part of the wave |
| 25 | Recovery and positioning | t0: SC 28 @ 0.9; t18: RU 8 @ 1.0 | Repair a weak rear guard before the closing exams |
| 26 | Armor and speed exam | t0: AR 12 @ 1.35; t8: RU 22 @ 0.5; t25: ME 2 @ 7.0 | Runners catch armored traffic; slow placement has visible value |
| 27 | Crowd and priority exam | t0: SW 42 @ 0.2; t8: EL 5 @ 3.0; t16: ME 2 @ 7.0 | Dense crowd, costly targets, and readable healer intervention |
| 28 | Combined mastery | t0: AR 10 @ 1.3; t6: ME 2 @ 7.0; t13: EL 4 @ 3.0; t24: RU 20 @ 0.5; t30: SW 24 @ 0.22 | Highest ordinary-wave complexity; all concepts were taught |
| 29 | Final preparation | t0: SC 28 @ 0.85; t16: AR 5 @ 2.5 | Lower peak demand, final purchases, final boss briefing |
| 30 | Final exam | t0: AR 6 @ 1.5; t8: B 1; t15: SW 30 @ 0.22; t23: EL 4 @ 3.0; t30: ME 2 @ 6.0; t38: RU 16 @ 0.55 | Boss plus timed escort phases; victory requires all scheduled enemies resolved |

### Lessons from the archival grammar for the current campaign

Keep each enemy's baseline speed and behavior recognizable across the run. If health tiers increase, expose those tiers and use restrained chapter steps before considering per-wave inflation. Do not accidentally apply both a chapter multiplier and an independent exponential wave multiplier. Recalculate affordability and time-to-kill whenever a rank's rate, damage, aura strength, or range changes.

The archived counts are not a promise that the revised economy can pay for them. Test the actual six-boss schedule with legal $100 openings, $10 Cadets, early promotions, specialty purchases, and mixed formations. Count healing as extra work and bosses separately. Lower escort concurrency or adjust timing when a teaching encounter is too hard; retain every required fifth-wave boss.

Preserve three kinds of contrast: dense versus spaced, fast versus durable, and useful precision targets versus cheap target saturation. A later wave can be harder while containing fewer enemies. Recovery waves intentionally create troughs in pressure; they are not mistakes to flatten away.

### Boss escort timing

Each boss needs an explicit readable label, health bar, leak cost, and Engineer slow resistance. Show these before the player commits. Use a brief isolated entrance so its silhouette and rate of movement can be read, then introduce already-known escort roles. Avoid a first boss that immediately disables the entire defense or introduces an untaught invulnerability phase.

The archived entry offsets are illustrative only. Validate current boss and escort **arrival times at the actual damage zone**, using route distance and movement speed. Give precision fire a readable opening while preserving supporting monsters on all six boss waves. The first boss is wave five. Do not add health-triggered reinforcements unless their thresholds are visible and covered by deterministic tests.

Killing the boss does not finish its wave while an escort is alive or another packet is still scheduled. Likewise, killing the entire currently visible pack does not complete a wave before a delayed packet spawns. These are essential rules, not presentation details.

## 6. Required proc contracts and anti-dominance analysis

The probabilities and multipliers below preserve the user's requirements. The restrictions define eligible events and stacking; they do not lower the requested percentages.

### Machine Gunner: five percent rage

Recommended contract:

1. A committed normal shot at a valid living target is eligible only while this soldier is not raging. Make one independent roll with `p = 0.05`.
2. On success, the current shot resolves normally and rage starts at that simulation timestamp. Subsequent shot intervals use five times the current rank's base rate for exactly five simulation seconds.
3. Rage shots do not roll for another rage. Rage does not refresh, stack, extend, or queue. After it expires, the next otherwise eligible normal shot can roll again. Do not add a hidden post-rage cooldown.
4. The clock continues while no enemy is in range. Pausing freezes simulation time; changing render frame rate does not alter duration. Upgrading cannot reset or extend rage. Specify whether the active rank's rate is recomputed immediately; doing so is the simpler transparent rule.
5. The Field Officer boosts damage, not fire rate or proc chance. Aura changes do not restart rage. Visual effects use a separate random stream.

**Analytical inference, not simulation output:** With uninterrupted target access and base rate `r` shots/second, the average number of eligible shots before a proc is `1 / 0.05 = 20`. A useful renewal approximation is:

`non-rage waiting time ≈ 1 / (0.05r)`

`rage uptime ≈ 5 / (5 + 1 / (0.05r))`

`average firing-rate multiplier ≈ 1 + 4 × rage uptime`

At a hypothetical four normal shots per second, this approximation gives about half the firing time in rage and three times ordinary sustained throughput. Exact results depend on shot scheduling at the boundary, first-shot timing, and time without targets. The important conclusion is that the ability is much more valuable than a five-percent damage bonus. Price and baseline damage must account for sustained rage uptime at every rank.

If rage shots were eligible and refreshed the timer, that same hypothetical soldier would attempt about one hundred rolls within five rage seconds. The chance of at least one success would be `1 − 0.95^100`, approximately **99.41%**. Repeated refreshes would make prolonged rage overwhelmingly likely. This is why the eligibility rule is a balance requirement.

Counter it through legitimate encounter variety: armor's partial mitigation, separated enemies that waste the active window, limited range, and dense packs that a single-target weapon cannot clear efficiently enough. Do not silently turn off rage on boss waves. Upgrade fire rate increases both baseline throughput and rage frequency, so equal percentage rate and damage upgrades are not equally valuable.

### Sniper: ten percent headshot

Recommended contract:

1. Each committed Sniper shot at a valid living target rolls once with `p = 0.10`.
2. A success against **any non-boss** kills that target immediately, including armored enemies, medics, and elites. Do not impose an undisclosed health ceiling.
3. A success against a boss makes that shot deal five times its ordinary damage before the same documented mitigation applied to an ordinary hit. Apply rank damage, the strongest eligible Officer aura, the headshot multiplier, and mitigation exactly once each.
4. The proc hits one target. It does not spread through a splash, chain, or aura. A normal enemy does not receive both an instant-kill bounty and a second damage-kill bounty.
5. Define target selection explicitly. First, strongest, and medic-priority targeting can dramatically alter value. Stable tie-breaks keep replays reproducible. A shot already committed cannot be redirected after its victim dies just to rescue a favorable roll.

For boss damage before mitigation and overkill, the expected multiplier is `0.90 × 1 + 0.10 × 5 = 1.40`. That is forty percent above ordinary shot damage on average, not five times sustained boss damage.

For a normal enemy with remaining health `H` and ordinary shot damage `D`, expected useful health removed by one shot is `0.90 × min(D, H) + 0.10 × H`. This increases with enemy health; a normal elite with enormous health inadvertently becomes an especially efficient Sniper target. Once ordinary damage already kills an enemy, a headshot adds spectacle but no useful damage.

The probability of at least one headshot in `n` shots is `1 − 0.9^n`. Even ten shots give only about **65.13%**. A campaign boss must not require a lucky headshot within a tiny firing window to be beatable. Conversely, late non-boss health inflation disproportionately rewards mass Snipers. Protect diversity through target count, shot cadence, range geometry, target interference, and economy rather than headshot immunity.

### Combat Engineer: control cannot become a permanent stop

Use the strongest active slow, not the sum or product of every Engineer's slow. A weaker hit may refresh its own status but cannot replace a stronger effect with a weaker one. Give each status a deterministic expiry. Apply the stated boss resistance to the slow's strength or duration using one documented rule, not both by accident. There should be a movement-speed floor and no stacking combination that reduces speed to zero indefinitely.

An illustrative fifty-percent slow doubles time in coverage on a straight segment. That can roughly double allied opportunities there before considering splash clumping. It is not “only support.” Test Engineer-plus-Grenadier and Engineer-plus-Machine-Gunner combinations against solo towers at equal total cost and equivalent build-space use.

### Field Officer: one strongest aura, no circular amplification

Each allied soldier receives at most the strongest in-range aura. An Officer never buffs itself. Aura strength is derived from that Officer's rank only; receiving another Officer's aura cannot increase the aura it emits. If Officers can buff other Officers' sidearms, that must affect only their weapon damage, with no feedback into support strength. Prohibit overlapping auras from multiplying or adding together.

Illustrative analysis: a twenty-percent aura covering five allies, each actually contributing thirty useful DPS, adds thirty useful DPS before overkill and geometry effects. The same aura covering one idle ally adds zero. The tower's value depends on formation, not a universal flat DPS number. Keep placements constrained enough that the whole board cannot receive one aura for negligible opportunity cost.

### Campaign airstrikes and decision value

The current three-charge reserve introduces a distinct decision: rescue an endangered base now or retain a strike for a later dense pack or commander. The twelve-second cooldown prevents instant consecutive use. Current normal enemies die, current bosses lose 35% maximum HP ignoring armor, and delayed packets remain intact. This is a battlefield effect, not an instruction to skip a wave. After striking, a wave clears only when its full queue and all survivors resolve.

Evaluate early rescue, late boss concentration, and no-strike strategies on the same seeds and purchase histories. Record charges spent, useful damage, lives preserved, affected normal enemies, boss damage, and resulting bounty income. A huge apparent damage number may simply reflect healthy enemies that the squad would already have killed. Do not count a strike as a headshot or multiply its damage with an Officer aura. Reject invalid, paused, empty-field, rearming, and exhausted activations without spending a charge. This analysis is our design inference, not a claim taken from the researched games.

## 7. Current economy and automatic preparation

Use one visible dollar balance for soldiers and promotions. The required $100 start and ascending $10/$25/$40/$55/$70/$85 roster prices offer several opening decisions. Every ordinary enemy in a wave pays the same wave-scaled bounty; a boss pays ten times that amount. Headshots, splash, and airstrikes do not multiply rewards. Grant each death bounty once and distinguish kill income, wave-completion income, and sell refunds in the ledger.

Normal bounty is `1 + floor((wave − 1)/3)` and clear reward is `5 + floor(wave/5) × 2`. These explicit formulas should let the player forecast a purchase. There is no interest, mining, persistent power, or early-call income. Evaluate whether a leak leaves a credible corrective purchase under the current economy; do not substitute the earlier research's larger rewards.

Initial preparation waits for the player's launch. After a full clear, a six-simulation-second intermission automatically starts the next wave. Pause freezes that deadline and all combat timers. Keep the remaining time and next boss warning readable. At 2× speed the wall-clock preparation interval is shorter, so phone players must be able to pause and inspect easily. All six cards expose statistics by hover, focus, or tap rather than hiding the roster in a dropdown.

Do not import early-call mechanics from a reference game into this campaign. Later manual starts are refused and there is no early-call grant. Test the intermission boundary at 359 and 360 ticks, repeated commands, pause, speed changes, hidden tabs, boss clears, and the final wave. No countdown should launch twice or grant another reward. Future persistence must save its exact deadline and the airstrike state.

Current sell refunds are `floor(70% × total deployment and upgrade investment)`, including before launch. Test whether accidental touch purchases are sufficiently preventable and understandable; the former full-refund preparation suggestion is superseded. Refunds cannot create profit through repeated purchase/sell cycles.

## 8. Determinism and honest balance validation

Seeded randomness makes a run reproducible; it does not prove a game is fair. Preserve independent Bernoulli behavior for the two requested procs unless a future design explicitly changes that contract. A “guaranteed success every ten shots” bag is not equivalent to an independent ten-percent chance.

Use fixed simulation steps or equivalently deterministic event scheduling; keep simulation state separate from WebGPU drawing. Use stable entity IDs and stable target tie-breaks. Store the seed, simulation version, wave definitions, player commands with simulation timestamps, and relevant random counters for a replay. Avoid a global random generator shared by bullets, particles, voice barks, and spawn decisions. A change to visual sparks must not change whether the next Sniper shot is a headshot.

One practical approach is a deterministic per-soldier combat random stream keyed by the run seed and stable soldier ID, with an eligible-shot counter. Enemy scheduling should have its own stream if randomness is ever introduced. Rendering has a separate cosmetic stream. Do not offer secret favorable rerolls on pause/resume or resaving. Version saves if the combat algorithm or balance data changes.

### Necessary tests for these mechanics

| Concern | Evidence needed |
| --- | --- |
| Rate and timing | Rage ends at five simulation seconds; boundary shots cannot double-fire; 1× and 2× speed produce equivalent state at matching simulation times |
| Proc eligibility | Rage cannot retrigger or extend; dead/missing targets do not create extra eligible shots; upgrades do not reset timers |
| Headshot semantics | Every normal class can be killed instantly; bosses receive one fivefold shot; each enemy pays bounty once |
| Support bounds | Strongest aura only, no self-buff or circular aura; strongest slow and boss resistance behave as documented |
| Wave completion | Delayed groups prevent premature completion; boss death leaves escorts active; no wave rewards are duplicated |
| Automatic progression | Only the first launch is manual; later waves begin once after 360 unpaused ticks; final victory schedules no further wave |
| Airstrikes | Three campaign charges; 720-tick cooldown; current normal kills and current boss 35%-maximum-HP damage; future packets survive; one reward per death |
| Reproduction | Same seed and commands reproduce enemies, money, procs, leaks, and outcome; changing particle count does not alter combat |
| Failures and recovery | Losing, restarting, pausing, hidden tabs, and loading a save cannot create free attacks or currency |

These tests prove contracts. They do **not** establish that the game is enjoyable or balanced.

### Balance evaluation matrix

First compare scripted strategies under an equal total investment and legal purchase chronology: Cadet-heavy, Gunner-heavy, Sniper-heavy, Grenadier-heavy, mixed damage, mixed damage plus Engineer, and mixed damage plus Officer. Do not compare a completed expensive army with a cheap starting army or teleport upgrades into the past. Keep the actual path, placement slots, rank limits, target rules, and wave economy in the simulation.

Use a prespecified seed set across strategies and record the same seeds for all candidates. Summarize full distributions: campaign completion, first failing wave, lives left, useful damage, overkill, damage by role, time with no target, rage uptime, headshot counts, healing performed, and income/spending by wave. Mean damage alone hides unlucky early losses. Hold back additional seeds during tuning and evaluate them once a candidate balance is selected.

Start with hundreds of automated runs if the simulation is cheap; increase only when the confidence needed justifies it. “Hundreds” is a proposed workflow, not a report that these runs occurred. A simplistic placement script failing proves little; include several credible placements and purchase policies before concluding that a tower is weak. Statistical precision cannot repair a bad policy model.

A dominance finding is contextual: one strategy repeatedly offers equal or better success for equal or lower cost across diverse encounters and needs no compensating skill or placement tradeoff. Check combinations too. A mixed build that contains one of every soldier winning once is not evidence that all roles are balanced. Avoid forcing each role's win share toward an arbitrary equal target.

### Human playtests and interactive reporting

Observe first-time players without coaching. Record their first purchase, their first misunderstanding, the wave they first leak, whether they can explain why, and whether the next attempt uses a different plan. Ask them to predict what armor, a medic, an Officer, and a raging Gunner will do before explaining. Observe an experienced player looking for a dominant formation. Run real mouse and touch sessions on the delivered build, not just isolated simulation tests.

For numerical review, present **interactive ECharts first**: synchronized wave axes for composition, peak concurrency, leaks, army value, income, and spending; hover details for each wave's purpose; and proc/role contribution plots with clear analytical-versus-measured labels. Allow build and seed filtering. Show worst-case and median examples instead of only a showcase victory. Raw tables and replay logs are optional drilldowns. All chart labels and tooltips must meet the user's eighteen-pixel readable-text floor.

## 9. Release decisions and limits of this research

This research supports the user's current campaign: one clear route, six visible soldier cards, thirty automatically progressing waves after launch, six escorted bosses, three airstrikes, the revised dollar economy, partial resistances, and explicit proc/support rules. It does not establish that the starting balance, completion rate, performance, or deployment has passed validation. The historical schedule is not the current recommendation; use the live content and current game plan.

Keep the ShoeMoney robot visibly faded behind the battlefield without reducing route, enemy, projectile, or selection contrast. Use the real brand asset; no researched game's visual identity should be imported. Clear silhouettes, restrained effects, recognizable range displays, large controls, and short warnings let spectacle serve decisions. Reduced motion must preserve combat information, and WebGPU availability must be communicated honestly.

The most valuable next evidence is a full legal campaign completion plus a deliberately different viable defense, a losing run with understandable causes, a proc-boundary test, and a desktop/mobile visual inspection. Until those exist, describe the numbers as starting balance values and the campaign as implemented but unvalidated where appropriate.
