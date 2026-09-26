# Starting balance data

These are authored starting hypotheses, not validated balance. Rates are shots per simulation second; upgrade prices are incremental. Start with 100 cash, 20 lives, and three airstrikes for the whole campaign.

## All 24 soldier ranks

| Soldier | Rank | Name | Incremental cost | Damage | Rate | Range | Effect |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Cadet | 0 | Cadet | 10 | 9 | 2 | 3.4 | None |
| Cadet | 1 | Private | 10 | 17 | 2 | 3.7 | None |
| Cadet | 2 | Corporal | 20 | 31 | 2 | 4 | None |
| Cadet | 3 | Sergeant | 35 | 55 | 2 | 4.4 | None |
| Machine Gunner | 0 | Machine Gunner | 25 | 12 | 3 | 3.8 | Berserker Rage: 5% inactive shot, 5× rate for 5 seconds |
| Machine Gunner | 1 | Fireteam Gunner | 20 | 22 | 3.2 | 4 | Berserker Rage: 5% inactive shot, 5× rate for 5 seconds |
| Machine Gunner | 2 | Squad Gunner | 35 | 38 | 3.5 | 4.3 | Berserker Rage: 5% inactive shot, 5× rate for 5 seconds |
| Machine Gunner | 3 | Master Gunner | 55 | 64 | 4 | 4.6 | Berserker Rage: 5% inactive shot, 5× rate for 5 seconds |
| Sniper | 0 | Sniper | 40 | 95 | 0.5 | 6 | Headshot: 10% per shot; normal kill / boss 5× |
| Sniper | 1 | Marksman | 25 | 165 | 0.55 | 6.4 | Headshot: 10% per shot; normal kill / boss 5× |
| Sniper | 2 | Sharpshooter | 45 | 285 | 0.6 | 6.8 | Headshot: 10% per shot; normal kill / boss 5× |
| Sniper | 3 | Scout Sniper | 70 | 490 | 0.65 | 7.2 | Headshot: 10% per shot; normal kill / boss 5× |
| Grenadier | 0 | Grenadier | 55 | 35 | 0.8 | 4.3 | Splash 1.5 |
| Grenadier | 1 | Assault Grenadier | 25 | 65 | 0.85 | 4.5 | Splash 1.7 |
| Grenadier | 2 | Demolition Specialist | 45 | 115 | 0.9 | 4.8 | Splash 2 |
| Grenadier | 3 | Ordnance Chief | 65 | 195 | 1 | 5.1 | Splash 2.3 |
| Combat Engineer | 0 | Combat Engineer | 70 | 8 | 1.2 | 3.8 | Slow 35% |
| Combat Engineer | 1 | Sapper | 20 | 15 | 1.3 | 4 | Slow 40% |
| Combat Engineer | 2 | Field Engineer | 35 | 27 | 1.4 | 4.3 | Slow 45% |
| Combat Engineer | 3 | Chief Engineer | 55 | 46 | 1.5 | 4.6 | Slow 50% |
| Field Officer | 0 | Field Officer | 85 | 12 | 1.4 | 4 | Aura 15% |
| Field Officer | 1 | Lieutenant | 25 | 22 | 1.5 | 4.3 | Aura 20% |
| Field Officer | 2 | Captain | 45 | 39 | 1.6 | 4.6 | Aura 25% |
| Field Officer | 3 | Major | 70 | 66 | 1.7 | 5 | Aura 30% |

## Enemy profiles

| Enemy | Base HP | Speed | Armor | Initial-wave bounty | Lives lost |
| --- | ---: | ---: | ---: | ---: | ---: |
| Scout | 38 | 1.6 | 0% | 1 | 1 |
| Runner | 30 | 2.9 | 0% | 1 | 1 |
| Swarm | 21 | 1.9 | 0% | 1 | 1 |
| Armored Infantry | 105 | 1.25 | 30% | 1 | 2 |
| Medic | 70 | 1.5 | 10% | 1 | 1 |
| Elite Infantry | 190 | 1.9 | 20% | 1 | 2 |
| Commander | 700 | 0.85 | 25% | 10 | 5 |

Normal HP is rounded base HP × wave multiplier. Boss HP uses the explicit totals below instead of multiplying the profile HP. Ordinary bounty at spawn is 1 + floor((wave − 1) / 3): 1 for waves 1–3, 2 for 4–6, and so on through 10 for 28–30. Boss bounty is ten times the current ordinary bounty. Wave 1 monsters therefore pay exactly one cash each. Medics heal other normal enemies within 2.2 units once per second by 2% maximum HP; no self or boss healing.

## Six commander waves

| Wave | Commander | Exact HP | Boss bounty |
| ---: | --- | ---: | ---: |
| 5 | Lieutenant Flint | 700 | 20 |
| 10 | Captain Iron | 2600 | 40 |
| 15 | Major Ash | 4500 | 50 |
| 20 | Colonel Steel | 8640 | 70 |
| 25 | Brigadier Storm | 13000 | 90 |
| 30 | General Redline | 21000 | 100 |

Every commander wave includes ordinary escort groups.

## All 30 wave schedules

Groups read kind × count @ first spawn seconds / interval seconds, relative to wave start. Times round to the nearest simulation tick. Clear reward is 5 + floor(wave / 5) × 2.

| Wave | Name | Normal HP multiplier | Clear cash | Ordinary bounty | Total enemies | Schedule |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | First Contact | 1 | 5 | 1 | 8 | scout × 8 @ 0s / 1.3s |
| 2 | Running Patrol | 1.05 | 5 | 1 | 12 | scout × 8 @ 0s / 0.9s; runner × 4 @ 5s / 1.3s |
| 3 | Close Formation | 1.1 | 5 | 1 | 18 | swarm × 18 @ 0s / 0.4s |
| 4 | Steel Helmets | 1.15 | 5 | 2 | 14 | armored × 4 @ 0s / 2s; scout × 10 @ 4s / 0.9s |
| 5 | Lieutenant Flint | 1.2 | 7 | 2 | 16 | scout × 12 @ 0s / 0.7s; medic × 3 @ 2s / 3s; boss × 1 @ 6s / 0.9s |
| 6 | Double Time | 1.3 | 7 | 2 | 20 | runner × 12 @ 0s / 0.55s; runner × 8 @ 10s / 0.5s |
| 7 | Packed Road | 1.4 | 7 | 3 | 30 | swarm × 24 @ 0s / 0.3s; armored × 6 @ 3s / 1.8s |
| 8 | Veteran Patrol | 1.5 | 7 | 3 | 17 | elite × 5 @ 0s / 2s; runner × 12 @ 3s / 0.6s |
| 9 | Triage Line | 1.6 | 7 | 3 | 31 | armored × 10 @ 0s / 1.2s; medic × 5 @ 2s / 2s; swarm × 16 @ 7s / 0.35s |
| 10 | Captain Iron | 1.65 | 9 | 4 | 23 | boss × 1 @ 4s / 1s; scout × 18 @ 0s / 0.7s; medic × 4 @ 7s / 2s |
| 11 | Broken Convoy | 1.8 | 9 | 4 | 34 | scout × 20 @ 0s / 0.5s; runner × 14 @ 8s / 0.6s |
| 12 | Armored Screen | 2 | 9 | 4 | 20 | armored × 14 @ 0s / 0.8s; elite × 6 @ 5s / 1.4s |
| 13 | Flood the Road | 2.2 | 9 | 5 | 56 | swarm × 32 @ 0s / 0.25s; swarm × 24 @ 10s / 0.25s |
| 14 | Medical Escort | 2.4 | 9 | 5 | 24 | armored × 16 @ 0s / 0.8s; medic × 8 @ 1s / 1.7s |
| 15 | Major Ash | 2.6 | 11 | 5 | 35 | runner × 24 @ 0s / 0.4s; elite × 10 @ 4s / 1s; boss × 1 @ 6s / 0.9s |
| 16 | Siege Infantry | 2.8 | 11 | 6 | 42 | armored × 24 @ 0s / 0.6s; scout × 18 @ 7s / 0.5s |
| 17 | Second Wind | 3 | 11 | 6 | 25 | elite × 15 @ 0s / 0.9s; medic × 10 @ 2s / 1.4s |
| 18 | Rush and Crush | 3.2 | 11 | 6 | 60 | swarm × 42 @ 0s / 0.22s; armored × 18 @ 9s / 0.7s |
| 19 | Command Guard | 3.4 | 11 | 7 | 52 | elite × 20 @ 0s / 0.65s; runner × 26 @ 7s / 0.4s; medic × 6 @ 5s / 2s |
| 20 | Colonel Steel | 3.6 | 13 | 7 | 35 | boss × 1 @ 5s / 0.9s; armored × 22 @ 0s / 0.7s; elite × 12 @ 10s / 0.9s |
| 21 | Deep Patrol | 3.9 | 13 | 7 | 54 | elite × 22 @ 0s / 0.7s; scout × 32 @ 10s / 0.4s |
| 22 | Relentless Rush | 4.2 | 13 | 8 | 58 | runner × 24 @ 0s / 0.32s; runner × 24 @ 10s / 0.32s; elite × 10 @ 5s / 0.9s |
| 23 | Living Shield | 4.5 | 13 | 8 | 72 | armored × 30 @ 0s / 0.5s; medic × 14 @ 2s / 1s; swarm × 28 @ 10s / 0.25s |
| 24 | Crowded Front | 4.8 | 13 | 8 | 84 | swarm × 64 @ 0s / 0.18s; elite × 20 @ 10s / 0.6s |
| 25 | Brigadier Storm | 5.1 | 15 | 9 | 65 | armored × 34 @ 0s / 0.45s; elite × 18 @ 8s / 0.6s; medic × 12 @ 3s / 1.2s; boss × 1 @ 6s / 0.9s |
| 26 | Night March | 5.4 | 15 | 9 | 80 | scout × 28 @ 0s / 0.3s; runner × 30 @ 4s / 0.3s; elite × 22 @ 11s / 0.5s |
| 27 | Final Reinforcements | 5.7 | 15 | 9 | 52 | elite × 34 @ 0s / 0.5s; medic × 18 @ 2s / 0.8s |
| 28 | Overrun Attempt | 6 | 15 | 10 | 130 | swarm × 72 @ 0s / 0.16s; armored × 30 @ 10s / 0.4s; runner × 28 @ 16s / 0.3s |
| 29 | General’s Guard | 6.3 | 15 | 10 | 88 | elite × 42 @ 0s / 0.4s; armored × 30 @ 8s / 0.45s; medic × 16 @ 4s / 0.9s |
| 30 | General Redline | 6.6 | 17 | 10 | 117 | boss × 1 @ 8s / 0.9s; elite × 36 @ 0s / 0.5s; swarm × 64 @ 8s / 0.2s; medic × 16 @ 15s / 0.8s |

## Automatic waves and air support

The first wave starts on player command. Every later wave starts automatically after six simulation seconds of intermission following the previous clear. Pause freezes the countdown. Deploying, upgrading, targeting, and selling remain available during intermission. Early manual launch of later waves is refused.

Airstrike requires active, unpaused combat, at least one living enemy, a charge, and zero cooldown. It immediately kills all currently living ordinary enemies and removes 35% of each current boss’s maximum HP, ignoring armor and clamping damage to remaining health. Future spawns are untouched. Each kill pays the same ordinary bounty/score once. An airstrike has a twelve-second simulation cooldown and consumes one of three charges; restart restores all three. Airstrikes never increment headshot counts.

## Money and score

Kills pay their spawn bounty once. Escapes pay nothing. Clearing all current enemies and scheduled spawns pays the small authored reward once. Selling returns floor(70% of total deployment and upgrade costs). Score adds bounty × 10 per kill, wave number × 100 per clear, and remaining lives × 500 on final victory.

stats.headshots counts successful Headshot procs, including nonfatal boss hits. stats.headshotKills counts only enemies killed by those procs, including lethal boss hits. The arcade headshots payload is the kill count and never exceeds total kills. There is no additional headshot score bonus.

## Deterministic timing

Simulation advances at 60 ticks per second. Berserker Rage excludes active shots from RNG rolls, cannot refresh or stack, and begins after the ordinary trigger shot for exactly 300 ticks. Engineer slow lasts 120 ticks; strongest wins and refreshes, with 15% maximum slow for bosses. Officer buffs use only the strongest nearby officer and exclude all officers. Cadet has no special. Idle credit caps at one shot.
