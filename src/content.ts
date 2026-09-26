import type { EnemyKind, EnemySpec, Pad, Point, Role, UnitSpec, WaveSpec, SpawnGroup } from './types';

export const STARTING_CASH = 100;
export const STARTING_LIVES = 20;
export const BOSS_HP: Record<number, number> = { 5: 700, 10: 2600, 15: 4500, 20: 8640, 25: 13000, 30: 21000 };
export const waveBounty = (wave: number, boss = false) => (1 + Math.floor((wave - 1) / 3)) * (boss ? 10 : 1);
export const ROUTE: Point[] = [
  { x: -12, z: -5 }, { x: -8, z: -5 }, { x: -8, z: 3 },
  { x: -3, z: 3 }, { x: -3, z: -3 }, { x: 3, z: -3 },
  { x: 3, z: 4 }, { x: 8, z: 4 }, { x: 8, z: -4 }, { x: 12, z: -4 },
];
export const PADS: Pad[] = [
  [-10, -3], [-6, -4], [-10, 0], [-6, 0], [-9, 5], [-5, 5], [-1, 2], [-5, -2],
  [-1, -5], [1, -1], [5, -5], [5, 1], [1, 6], [6, 6], [10, 2], [10, -2],
].map(([x, z], id) => ({ id, name: `Position ${id + 1}`, x: x!, z: z! }));

export const UNITS: Record<Role, UnitSpec> = {
  cadet: { id: 'cadet', name: 'Cadet', tag: 'Affordable pistol', color: '#59b99a',
    description: 'Medium fire rate and low damage. An affordable recruit for the opening defense.',
    special: 'No special effect at any rank.', ranks: [
      { name: 'Cadet', cost: 10, damage: 9, rate: 2, range: 3.4 },
      { name: 'Private', cost: 10, damage: 17, rate: 2, range: 3.7 },
      { name: 'Corporal', cost: 40, damage: 31, rate: 2, range: 4 },
      { name: 'Sergeant', cost: 140, damage: 55, rate: 2, range: 4.4 },
    ] },
  gunner: { id: 'gunner', name: 'Machine Gunner', tag: 'Sustained fire', color: '#e7b657',
    description: 'High fire rate and medium damage. Holds a busy lane under sustained pressure.',
    special: 'Berserker Rage: each inactive shot has a 5% chance of 5× firing rate for five seconds. No stacking or refresh.', ranks: [
      { name: 'Machine Gunner', cost: 25, damage: 12, rate: 3, range: 3.8 },
      { name: 'Fireteam Gunner', cost: 20, damage: 22, rate: 3.2, range: 4 },
      { name: 'Squad Gunner', cost: 70, damage: 38, rate: 3.5, range: 4.3 },
      { name: 'Master Gunner', cost: 220, damage: 64, rate: 4, range: 4.6 },
    ] },
  sniper: { id: 'sniper', name: 'Sniper', tag: 'Boss precision', color: '#8cbde9',
    description: 'Slow fire rate and high damage. Covers a long section of the supply road.',
    special: 'Headshot: 10% chance per shot. Instantly kills normal enemies; bosses take 5× damage before armor.', ranks: [
      { name: 'Sniper', cost: 40, damage: 95, rate: 0.5, range: 6 },
      { name: 'Marksman', cost: 25, damage: 165, rate: 0.55, range: 6.4 },
      { name: 'Sharpshooter', cost: 90, damage: 285, rate: 0.6, range: 6.8 },
      { name: 'Scout Sniper', cost: 280, damage: 490, rate: 0.65, range: 7.2 },
    ] },
  grenadier: { id: 'grenadier', name: 'Grenadier', tag: 'Crowd control', color: '#e58b60',
    description: 'An explosive attack damages every enemy around its target.',
    special: 'Area damage resolves once per enemy; armor applies to each victim. No random proc.', ranks: [
      { name: 'Grenadier', cost: 55, damage: 35, rate: 0.8, range: 4.3, splash: 1.5 },
      { name: 'Assault Grenadier', cost: 25, damage: 65, rate: 0.85, range: 4.5, splash: 1.7 },
      { name: 'Demolition Specialist', cost: 90, damage: 115, rate: 0.9, range: 4.8, splash: 2 },
      { name: 'Ordnance Chief', cost: 260, damage: 195, rate: 1, range: 5.1, splash: 2.3 },
    ] },
  engineer: { id: 'engineer', name: 'Combat Engineer', tag: 'Slow the advance', color: '#bd9ae5',
    description: 'Low damage with reliable slowing fire to extend everyone’s time on target.',
    special: 'Slow lasts two seconds. Strongest slow wins and refreshes; bosses are capped at 15%.', ranks: [
      { name: 'Combat Engineer', cost: 70, damage: 8, rate: 1.2, range: 3.8, slow: 0.35 },
      { name: 'Sapper', cost: 20, damage: 15, rate: 1.3, range: 4, slow: 0.4 },
      { name: 'Field Engineer', cost: 70, damage: 27, rate: 1.4, range: 4.3, slow: 0.45 },
      { name: 'Chief Engineer', cost: 220, damage: 46, rate: 1.5, range: 4.6, slow: 0.5 },
    ] },
  officer: { id: 'officer', name: 'Field Officer', tag: 'Local damage support', color: '#e0dfb1',
    description: 'Moderate fire and a local damage aura for nearby soldiers.',
    special: 'Only the strongest nearby aura applies. Officers cannot buff themselves or other officers.', ranks: [
      { name: 'Field Officer', cost: 85, damage: 12, rate: 1.4, range: 4, aura: 0.15 },
      { name: 'Lieutenant', cost: 25, damage: 22, rate: 1.5, range: 4.3, aura: 0.2 },
      { name: 'Captain', cost: 90, damage: 39, rate: 1.6, range: 4.6, aura: 0.25 },
      { name: 'Major', cost: 280, damage: 66, rate: 1.7, range: 5, aura: 0.3 },
    ] },
};

export const ENEMIES: Record<EnemyKind, EnemySpec> = {
  scout: { name: 'Scout', hp: 38, speed: 1.6, armor: 0, bounty: 1, leak: 1, color: '#d9a878', description: 'Light infantry. The first test of coverage.' },
  runner: { name: 'Runner', hp: 30, speed: 2.9, armor: 0, bounty: 1, leak: 1, color: '#edb954', description: 'Fast infantry that exposes short coverage.' },
  swarm: { name: 'Swarm', hp: 21, speed: 1.9, armor: 0, bounty: 1, leak: 1, color: '#eeb997', description: 'Dense groups that reward explosive defense.' },
  armored: { name: 'Armored Infantry', hp: 105, speed: 1.25, armor: 0.3, bounty: 1, leak: 2, color: '#afbbc4', description: 'Armor reduces ordinary damage by 30%.' },
  medic: { name: 'Medic', hp: 70, speed: 1.5, armor: 0.1, bounty: 1, leak: 1, color: '#b4deb9', description: 'Each second heals other normal enemies within 2.2 units by 2% of their maximum HP. Cannot heal bosses or itself.' },
  elite: { name: 'Elite Infantry', hp: 190, speed: 1.9, armor: 0.2, bounty: 1, leak: 2, color: '#bf899a', description: 'Durable fast infantry with 20% damage reduction.' },
  boss: { name: 'Commander', hp: 700, speed: 0.85, armor: 0.25, bounty: 10, leak: 5, color: '#e46465', description: 'Commander every fifth wave, with explicitly authored HP and escorts. Bounty is ten times the wave’s ordinary bounty. Headshots deal fivefold damage; slow is capped at 15%.' },
};

const group = (kind: EnemyKind, count: number, at = 0, interval = 0.9): SpawnGroup => ({ kind, count, at, interval });
const authored: [string, string, string, number, SpawnGroup[], string?][] = [
  ['First Contact', 'Scouts approach the supply road.', 'Deploy a Cadet near the first bend.', 1, [group('scout', 8, 0, 1.3)]],
  ['Running Patrol', 'Runners mix with another scout patrol.', 'Cover more than the entrance.', 1.05, [group('scout', 8), group('runner', 4, 5, 1.3)]],
  ['Close Formation', 'A dense infantry section is approaching.', 'Explosives punish tightly spaced groups.', 1.1, [group('swarm', 18, 0, 0.4)]],
  ['Steel Helmets', 'Armored infantry lead a scout formation.', 'Precision damage helps against armor.', 1.15, [group('armored', 4, 0, 2), group('scout', 10, 4)]],
  ['Lieutenant Flint', 'Medics escort the first commander.', 'Focus a medic before it heals the column.', 1.2, [group('scout', 12, 0, 0.7), group('medic', 3, 2, 3)]],
  ['Double Time', 'Fast runners arrive in two sections.', 'A slowing engineer gives damage dealers more time.', 1.3, [group('runner', 12, 0, 0.55), group('runner', 8, 10, 0.5)]],
  ['Packed Road', 'Armored infantry hide among a dense swarm.', 'Combine crowd control and focused damage.', 1.4, [group('swarm', 24, 0, 0.3), group('armored', 6, 3, 1.8)]],
  ['Veteran Patrol', 'Elites join the road for the first time.', 'Upgrade a primary damage dealer.', 1.5, [group('elite', 5, 0, 2), group('runner', 12, 3, 0.6)]],
  ['Triage Line', 'Medics sustain a heavy column.', 'Cover the full formation with precision fire and splash damage.', 1.6, [group('armored', 10, 0, 1.2), group('medic', 5, 2, 2), group('swarm', 16, 7, 0.35)]],
  ['Captain Iron', 'Captain Iron advances behind an escort.', 'A sniper and an engineer can hold a boss in range.', 1.65, [group('boss', 1, 4, 1), group('scout', 18, 0, 0.7), group('medic', 4, 7, 2)], 'Captain Iron'],
  ['Broken Convoy', 'Scattered sections arrive from a broken convoy.', 'Coverage at several bends reduces leaks.', 1.8, [group('scout', 20, 0, 0.5), group('runner', 14, 8, 0.6)]],
  ['Armored Screen', 'Armored squads shield elite soldiers.', 'Strongest targeting focuses larger health pools.', 2, [group('armored', 14, 0, 0.8), group('elite', 6, 5, 1.4)]],
  ['Flood the Road', 'Two packed swarms press the outpost.', 'Splash upgrades expand the damage area.', 2.2, [group('swarm', 32, 0, 0.25), group('swarm', 24, 10, 0.25)]],
  ['Medical Escort', 'Armored troops escort a medical section.', 'Kill supporting medics and break the formation.', 2.4, [group('armored', 16, 0, 0.8), group('medic', 8, 1, 1.7)]],
  ['Major Ash', 'The third commander advances with elites and runners.', 'Support fire and slows protect your heavy weapons.', 2.6, [group('runner', 24, 0, 0.4), group('elite', 10, 4, 1)]],
  ['Siege Infantry', 'A long armored section advances steadily.', 'Officer auras improve nearby damage.', 2.8, [group('armored', 24, 0, 0.6), group('scout', 18, 7, 0.5)]],
  ['Second Wind', 'Repeated medical teams support elite patrols.', 'Avoid allowing a wounded pack to recover.', 3, [group('elite', 15, 0, 0.9), group('medic', 10, 2, 1.4)]],
  ['Rush and Crush', 'A swarm rush is followed by heavy armor.', 'Balance burst area damage with armor control.', 3.2, [group('swarm', 42, 0, 0.22), group('armored', 18, 9, 0.7)]],
  ['Command Guard', 'Elite guards and runners prepare the way.', 'Finish important upgrades before the next commander.', 3.4, [group('elite', 20, 0, 0.65), group('runner', 26, 7, 0.4), group('medic', 6, 5, 2)]],
  ['Colonel Steel', 'A stronger commander arrives with armored escorts.', 'The commander has 8,640 HP. Keep boss damage in range.', 3.6, [group('boss', 1, 5), group('armored', 22, 0, 0.7), group('elite', 12, 10, 0.9)], 'Colonel Steel'],
  ['Deep Patrol', 'Veteran sections attack in a long sequence.', 'Keep cash for the final upgrades.', 3.9, [group('elite', 22, 0, 0.7), group('scout', 32, 10, 0.4)]],
  ['Relentless Rush', 'Two runner sections and elite support test every turn.', 'Slows and broad coverage help against repeated fast arrivals.', 4.2, [group('runner', 24, 0, 0.32), group('runner', 24, 10, 0.32), group('elite', 10, 5, 0.9)]],
  ['Living Shield', 'Medics hide between armored sections.', 'The strongest target policy may leave a medic alive.', 4.5, [group('armored', 30, 0, 0.5), group('medic', 14, 2, 1), group('swarm', 28, 10, 0.25)]],
  ['Crowded Front', 'A massive swarm precedes an elite spearhead.', 'Maximize splash coverage along the middle bends.', 4.8, [group('swarm', 64, 0, 0.18), group('elite', 20, 10, 0.6)]],
  ['Brigadier Storm', 'The fifth commander leads heavy infantry and medics.', 'Top-rank snipers remove ordinary armor instantly on headshots.', 5.1, [group('armored', 34, 0, 0.45), group('elite', 18, 8, 0.6), group('medic', 12, 3, 1.2)]],
  ['Night March', 'Mixed sections arrive without a long break.', 'Match each role to the coverage it offers.', 5.4, [group('scout', 28, 0, 0.3), group('runner', 30, 4, 0.3), group('elite', 22, 11, 0.5)]],
  ['Final Reinforcements', 'Medics support a large elite force.', 'The best aura applies once; spreading officers improves coverage.', 5.7, [group('elite', 34, 0, 0.5), group('medic', 18, 2, 0.8)]],
  ['Overrun Attempt', 'Swarm waves attack between armored sections.', 'Maintain damage across the entire road.', 6, [group('swarm', 72, 0, 0.16), group('armored', 30, 10, 0.4), group('runner', 28, 16, 0.3)]],
  ['General’s Guard', 'The general’s elite guard attacks first.', 'Prepare fully upgraded boss damage and slowing coverage.', 6.3, [group('elite', 42, 0, 0.4), group('armored', 30, 8, 0.45), group('medic', 16, 4, 0.9)]],
  ['General Redline', 'The final commander commits the entire reserve.', 'The final commander has 21,000 HP. Use air support wisely.', 6.6, [group('boss', 1, 8), group('elite', 36, 0, 0.5), group('swarm', 64, 8, 0.2), group('medic', 16, 15, 0.8)], 'General Redline'],
];
export const WAVES: WaveSpec[] = authored.map(([name, briefing, lesson, hpMultiplier, groups, bossName], index) => {
  const number = index + 1;
  const addedBoss = number % 5 === 0 && !groups.some(group => group.kind === 'boss');
  return { number, name, briefing, lesson, reward: 5 + Math.floor(number / 5) * 2, hpMultiplier,
    groups: addedBoss ? [...groups, group('boss', 1, 6)] : groups,
    ...(number % 5 === 0 ? { bossName: bossName ?? ({ 5: 'Lieutenant Flint', 15: 'Major Ash', 25: 'Brigadier Storm' } as Record<number, string>)[number] } : {}),
  };
});
