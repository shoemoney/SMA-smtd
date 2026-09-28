import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Command, Role, WaveSpec } from '../src/types';

// Fixtures replace content at the module boundary; production exposes no cheat API.
vi.mock('../src/content', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/content')>();
  return { ...actual, UNITS: structuredClone(actual.UNITS), ENEMIES: structuredClone(actual.ENEMIES),
    WAVES: structuredClone(actual.WAVES), PADS: structuredClone(actual.PADS) };
});
import { BOSS_HP, ENEMIES, PADS, UNITS, WAVES, waveBounty } from '../src/content';
import { createSession } from '../src/game';
const actual = await vi.importActual<typeof import('../src/content')>('../src/content');
const roles = Object.keys(UNITS) as Role[];
beforeEach(() => {
  for (const role of roles) UNITS[role] = structuredClone(actual.UNITS[role]);
  for (const kind of Object.keys(ENEMIES) as (keyof typeof ENEMIES)[]) ENEMIES[kind] = { ...actual.ENEMIES[kind] };
  WAVES.splice(0, WAVES.length, ...structuredClone(actual.WAVES));
  PADS.splice(0, PADS.length, ...structuredClone(actual.PADS));
});
function fixture(kind: 'scout' | 'boss' = 'boss', count = 1) {
  const wave: WaveSpec = { number: 1, name: 'Fixture', briefing: '', lesson: '', reward: 50,
    hpMultiplier: 1, groups: [{ kind, count, at: 0, interval: 0 }] };
  WAVES.splice(0, WAVES.length, wave, { ...wave, number: 2, groups: [] });
  ENEMIES[kind] = { ...ENEMIES[kind], hp: 1e9, speed: 0, armor: 0 };
  PADS.splice(0, PADS.length, ...roles.map((_, id) => ({ id, name: `Fixture ${id}`, x: -12, z: -5 })));
  for (const role of roles) for (const rank of UNITS[role].ranks) rank.cost = 0;
}
function deployed(role: Role, seed = 7341) {
  const session = createSession(seed);
  expect(session.command({ kind: 'place', role, pad: 0 }).ok).toBe(true);
  session.command({ kind: 'start-wave' });
  return session;
}

describe('actual campaign content and player command rules', () => {
  it('has thirty deliberate waves, six complete four-rank ladders and bounded geometry', () => {
    expect(WAVES).toHaveLength(30); expect(roles).toHaveLength(6); expect(PADS).toHaveLength(16);
    for (const role of roles) expect(UNITS[role].ranks).toHaveLength(4);
    expect(WAVES.filter(wave => wave.groups.some(group => group.kind === 'boss')).map(wave => wave.number)).toEqual([5, 10, 15, 20, 25, 30]);
    for (const wave of WAVES.filter(w => w.bossName)) expect(wave.groups.some(group => group.kind !== 'boss')).toBe(true);
    expect(Object.values(BOSS_HP)).toEqual([748, 3003, 5586, 11470, 18379, 31500]);
    expect(roles.map(role => UNITS[role].ranks[0].cost)).toEqual([10, 25, 40, 55, 70, 85]);
    expect(new Set(WAVES.map(wave => wave.name)).size).toBe(30);
    for (const point of [...PADS, ...actual.ROUTE]) {
      expect(Math.abs(point.x)).toBeLessThanOrEqual(12); expect(Math.abs(point.z)).toBeLessThanOrEqual(8);
    }
  });
  it('starts with 100 cash and 20 lives, and cannot win without starting combat', () => {
    const session = createSession(); session.advance(10_000);
    expect(session.frame()).toMatchObject({ cash: 100, lives: 20, wave: 0, phase: 'build', score: 0, nextWaveIn: null, airstrikes: 3 });
  });
  it('rejects invalid placements, duplicate pads and unaffordable spending atomically', () => {
    const session = createSession();
    for (const command of [{ kind: 'place', role: 'bogus', pad: 0 }, { kind: 'place', role: 'cadet', pad: -1 },
      { kind: 'place', role: '__proto__', pad: 0 }, { kind: 'upgrade', tower: 999 }] as unknown as Command[]) {
      expect(session.command(command).ok).toBe(false);
    }
    session.command({ kind: 'place', role: 'gunner', pad: 0 });
    for (const pad of [1, 2, 3]) session.command({ kind: 'place', role: 'gunner', pad });
    const before = session.frame();
    expect(session.command({ kind: 'place', role: 'cadet', pad: 0 }).ok).toBe(false);
    expect(session.command({ kind: 'place', role: 'cadet', pad: 4 }).ok).toBe(false);
    expect(session.frame()).toEqual(before);
  });
  it('caps upgrades at rank three, sells 70% of all invested cash, and rejects a stale id', () => {
    const session = createSession(); session.command({ kind: 'place', role: 'cadet', pad: 0 });
    const tower = session.frame().towers[0]!.id;
    session.command({ kind: 'upgrade', tower });
    expect(session.frame().towers[0]!.invested).toBe(20);
    session.command({ kind: 'sell', tower }); expect(session.frame().cash).toBe(100 - 20 + Math.floor(20 * 0.7));
    expect(session.command({ kind: 'sell', tower }).ok).toBe(false);
    fixture(); const free = deployed('cadet'); const id = free.frame().towers[0]!.id;
    for (let rank = 1; rank <= 3; rank++) expect(free.command({ kind: 'upgrade', tower: id }).ok).toBe(true);
    expect(free.frame().towers[0]!.rank).toBe(3);
    expect(free.command({ kind: 'upgrade', tower: id }).ok).toBe(false);
  });
  it('pauses all time and resumes explicitly; advancing invalid ticks throws', () => {
    const session = deployed('cadet'); session.advance(120); session.command({ kind: 'pause', value: true });
    const before = session.frame(); session.advance(100_000); expect(session.frame()).toEqual(before);
    session.command({ kind: 'pause', value: false }); session.advance(1); expect(session.frame().time).toBeGreaterThan(before.time);
    for (const ticks of [-1, 0.5, Infinity, NaN]) expect(() => session.advance(ticks)).toThrow();
  });
  it('reproduces a seed and isolates snapshots from external mutation', () => {
    const a = deployed('gunner', 52); const b = deployed('gunner', 52);
    a.advance(2400); b.advance(2400); expect(a.frame()).toEqual(b.frame());
    const copy = a.frame(); copy.cash = 1e8; copy.towers[0]!.rank = 3; copy.stats.kills = 10000;
    expect(a.frame()).toEqual(b.frame());
  });
  it('clears only when all scheduled enemies are resolved and never rewards twice', () => {
    fixture('scout'); ENEMIES.scout.hp = 1;
    const session = deployed('cadet');
    expect(session.command({ kind: 'start-wave' }).ok).toBe(false);
    session.advance(1); expect(session.frame().phase).toBe('build');
    expect(session.frame().stats.kills).toBe(1);
    const cash = session.frame().cash; const score = session.frame().score;
    expect(session.frame().nextWaveIn).toBe(6);
    session.command({ kind: 'pause', value: true }); session.advance(600); expect(session.frame().nextWaveIn).toBe(6);
    session.command({ kind: 'pause', value: false });
    session.advance(359); expect(session.frame().cash).toBe(cash); expect(session.frame().score).toBe(score);
    expect(session.command({ kind: 'start-wave' }).ok).toBe(false);
    session.advance(1);
    expect(session.frame().phase).toBe('victory');
    expect(session.frame().score).toBe(score + 200 + 20 * 500);
  });
  it('can complete all thirty authored waves with a reproducible diverse defense', () => {
    const session = createSession(7341);
    // All six roles, ordered by route coverage. The previous four-cadet opening no longer
    // survives the steeper HP curve; this plan finishes seed 7341 with 12 of 20 lives, so the
    // campaign stays provably completable without the margin being comfortable.
    const plan: [number, Role][] = [[0, 'gunner'], [3, 'gunner'], [7, 'gunner'], [9, 'grenadier'],
      [1, 'gunner'], [5, 'grenadier'], [8, 'sniper'], [4, 'gunner'], [2, 'engineer'],
      [11, 'gunner'], [10, 'grenadier'], [6, 'officer'], [12, 'gunner'], [14, 'sniper'], [15, 'cadet'], [13, 'engineer']];
    for (let wave = 1; wave <= 30; wave++) {
      for (const [pad, role] of plan) if (!session.frame().towers.some(tower => tower.pad === pad)) {
        session.command({ kind: 'place', role, pad });
      }
      for (let rank = 1; rank <= 3; rank++) for (const tower of session.frame().towers) if (tower.rank < rank) {
        session.command({ kind: 'upgrade', tower: tower.id });
      }
      if (wave === 1) expect(session.command({ kind: 'start-wave' }).ok).toBe(true);
      else session.advance(360);
      for (let ticks = 0; ticks < 12000 && session.frame().phase === 'combat'; ticks += 60) session.advance(60);
      expect(session.frame().phase).toBe(wave === 30 ? 'victory' : 'build');
    }
    expect(new Set(session.frame().towers.map(tower => tower.role)).size).toBe(6);
    expect(session.frame().lives).toBeGreaterThan(0);
  });
  it('uses wave bounty tiers, fixed boss totals, and small clear rewards', () => {
    expect(Array.from({ length: 30 }, (_, index) => waveBounty(index + 1))).toEqual(
      [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10]);
    expect(waveBounty(30, true)).toBe(100);
    const session = deployed('cadet'); session.advance(1);
    expect(session.frame().enemies[0]!.bounty).toBe(1);
    expect(WAVES.map(wave => wave.reward)).toEqual(WAVES.map(wave => 5 + Math.floor(wave.number / 5) * 2));
  });
  it('assigns the scaled bounty at spawn and uses exact boss HP on wave five', () => {
    fixture('scout'); ENEMIES.scout.hp = 1;
    const prototype = structuredClone(WAVES[0]!);
    WAVES.splice(0, WAVES.length, ...Array.from({ length: 5 }, (_, index) => ({ ...structuredClone(prototype), number: index + 1 })));
    WAVES[4]!.groups = [{ kind: 'boss', count: 1, at: 0, interval: 1 }];
    ENEMIES.boss.speed = 0;
    const session = deployed('cadet'); session.advance(1);
    for (let wave = 2; wave <= 3; wave++) {
      session.advance(360);
      while (session.frame().phase === 'combat') session.advance(1);
    }
    ENEMIES.scout.hp = 1e9; session.advance(360);
    expect(session.frame().wave).toBe(4); expect(session.frame().enemies[0]!.bounty).toBe(2);
    session.command({ kind: 'airstrike' }); session.advance(1); session.advance(360);
    expect(session.frame().wave).toBe(5);
    expect(session.frame().enemies[0]).toMatchObject({ boss: true, maxHp: 748, bounty: 20 });
  });
});

describe('combat contract with isolated content fixtures', () => {
  it('fires a normal trigger shot, blocks active rage rolls and expires at exactly 300 ticks', () => {
    fixture(); const session = deployed('gunner');
    let trigger = session.frame();
    for (let tick = 0; tick < 20_000; tick++) { session.advance(1); trigger = session.frame(); if (trigger.stats.rageProcs) break; }
    expect(trigger.stats.rageProcs).toBe(1);
    const tower = trigger.towers[0]!;
    expect(Math.round((tower.rageUntil - trigger.time) * 60)).toBe(300);
    expect(trigger.events.filter(event => event.kind === 'shot').at(-1)!.amount).toBe(12);
    session.command({ kind: 'upgrade', tower: tower.id });
    expect(session.frame().towers[0]!.rageUntil).toBe(tower.rageUntil);
    session.advance(299); expect(session.frame().stats.rageProcs).toBe(1);
    expect(session.frame().time).toBeLessThan(tower.rageUntil);
    session.advance(1); expect(session.frame().time).toBe(tower.rageUntil);
    // At the deadline active cadence has ended; next shot's RNG is eligible again.
    expect(session.frame().towers[0]!.cooldown).toBeLessThanOrEqual(1 / 3.2);
  });
  it('samples near 5% per eligible gunner shot and near 10% per sniper shot', () => {
    fixture(); UNITS.gunner.ranks[0].rate = 60;
    const gunner = deployed('gunner', 914); let eligible = 0; let rolls = 0; let lastEvent = 0;
    for (let tick = 0; tick < 80_000; tick++) {
      const before = gunner.frame(); gunner.advance(1); const after = gunner.frame();
      const shots = after.events.filter(event => event.id > lastEvent && event.kind === 'shot');
      if (Math.round(before.towers[0]!.rageUntil * 60) <= Math.round(after.time * 60)) eligible += shots.length;
      rolls = after.stats.rageProcs; lastEvent = after.events.at(-1)?.id ?? lastEvent;
    }
    expect(eligible).toBeGreaterThan(4000); expect(rolls / eligible).toBeGreaterThan(0.04); expect(rolls / eligible).toBeLessThan(0.06);
    fixture(); UNITS.sniper.ranks[0].rate = 60;
    const sniper = deployed('sniper', 914); sniper.advance(20_000);
    expect(sniper.frame().stats.headshots / 20_001).toBeGreaterThan(0.09);
    expect(sniper.frame().stats.headshots / 20_001).toBeLessThan(0.11);
  });
  it('headshots ignore ordinary armor and deal fivefold damage to bosses before armor', () => {
    let headshotSeed = -1;
    for (let seed = 0; seed < 100; seed++) {
      fixture(); const session = deployed('sniper', seed); session.advance(1);
      if (session.frame().stats.headshots) { headshotSeed = seed; break; }
    }
    expect(headshotSeed).toBeGreaterThanOrEqual(0);
    fixture(); ENEMIES.boss.armor = 0.25;
    const boss = deployed('sniper', headshotSeed); boss.advance(1);
    expect(boss.frame().stats.damage).toBe(95 * 5 * 0.75); expect(boss.frame().enemies).toHaveLength(1);
    expect(boss.frame().stats).toMatchObject({ headshots: 1, headshotKills: 0, kills: 0 });
    fixture('scout'); ENEMIES.scout.armor = 0.99;
    const ordinary = deployed('sniper', headshotSeed); ordinary.advance(1);
    expect(ordinary.frame().stats).toMatchObject({ headshots: 1, headshotKills: 1, kills: 1 });
    expect(ordinary.frame().enemies).toHaveLength(0);
    fixture(); ENEMIES.boss.hp = 100; ENEMIES.boss.armor = 0.25;
    const lethalBoss = deployed('sniper', headshotSeed); lethalBoss.advance(1);
    expect(lethalBoss.frame().stats).toMatchObject({ headshots: 1, headshotKills: 1, kills: 1 });
    lethalBoss.advance(600); expect(lethalBoss.frame().stats.headshotKills).toBe(1);
  });
  it('plating subtracts a flat amount from every hit after armor, never below one', () => {
    // Percentage armor scales with the hit; plating does not. A 9-damage Cadet round against
    // plating 6 lands 3, while the same plating barely dents a heavy round.
    fixture('scout'); ENEMIES.scout.plating = 6;
    const light = deployed('cadet'); light.advance(1);
    expect(light.frame().stats.damage).toBe(9 - 6);
    fixture('scout'); ENEMIES.scout.plating = 6; ENEMIES.scout.armor = 0.3;
    const armored = deployed('cadet'); armored.advance(1);
    expect(armored.frame().stats.damage).toBe(1);      // 9 × 0.7 − 6 = 0.3, floored to 1
    fixture('scout'); ENEMIES.scout.plating = 500;
    const immune = deployed('cadet'); immune.advance(1);
    expect(immune.frame().stats.damage).toBe(1);        // the floor: nothing is ever immune
    expect(actual.ENEMIES.armored.plating).toBe(6);
    expect(actual.ENEMIES.elite.plating).toBe(8);
  });
  it('does not bank idle fire, applies strongest aura once, and excludes officers', () => {
    fixture(); WAVES[0]!.groups[0]!.at = 10;
    const idle = deployed('cadet'); idle.advance(601);
    expect(idle.frame().stats.damage).toBe(9);
    fixture(); const session = deployed('cadet');
    session.command({ kind: 'place', role: 'officer', pad: 1 });
    session.command({ kind: 'place', role: 'officer', pad: 2 });
    const second = session.frame().towers[2]!.id; session.command({ kind: 'upgrade', tower: second });
    session.advance(1);
    expect(session.frame().towers[0]!.damageDealt).toBeCloseTo(9 * 1.2);
    expect(session.frame().towers[1]!.damageDealt).toBe(12);
    expect(session.frame().towers[2]!.damageDealt).toBe(22);
  });
  it('refreshes strongest slow without multiplication and caps boss slow', () => {
    fixture('scout'); const session = deployed('engineer');
    session.command({ kind: 'place', role: 'engineer', pad: 1 });
    const other = session.frame().towers[1]!.id; session.command({ kind: 'upgrade', tower: other });
    session.advance(1); expect(session.frame().enemies[0]!.slowFactor).toBeCloseTo(0.6);
    session.command({ kind: 'sell', tower: other }); session.command({ kind: 'sell', tower: session.frame().towers[0]!.id });
    session.advance(119); expect(session.frame().enemies[0]!.slowFactor).toBeCloseTo(0.6);
    session.advance(1); expect(session.frame().enemies[0]!.slowFactor).toBe(1);
    fixture(); const boss = deployed('engineer'); boss.advance(1); expect(boss.frame().enemies[0]!.slowFactor).toBe(0.85);
  });
  it('splash pays each victim once and targeting chooses health or route progress deterministically', () => {
    fixture('scout', 3); ENEMIES.scout.hp = 10;
    const splash = deployed('grenadier'); splash.advance(1);
    expect(splash.frame().stats.kills).toBe(3);
    expect(splash.frame().stats.earned).toBe(3 * ENEMIES.scout.bounty + 50);
    fixture('scout'); WAVES[0]!.groups.push({ kind: 'boss', count: 1, at: 0, interval: 1 }); ENEMIES.boss.speed = 0;
    ENEMIES.scout.hp = 100; ENEMIES.boss.hp = 1000;
    const targeting = deployed('cadet'); const id = targeting.frame().towers[0]!.id;
    targeting.command({ kind: 'target', tower: id, policy: 'strongest' }); targeting.advance(1);
    expect(targeting.frame().enemies.find(enemy => enemy.kind === 'boss')!.hp).toBe(1000 - 9 * 0.75);
  });
  it('medics heal normal allies on one-second pulses, without healing themselves or bosses', () => {
    fixture('scout');
    WAVES[0]!.groups.push({ kind: 'medic', count: 1, at: 0, interval: 1 }, { kind: 'boss', count: 1, at: 0, interval: 1 });
    ENEMIES.scout.hp = 1000; ENEMIES.medic.speed = 0; ENEMIES.boss.speed = 0;
    const session = deployed('grenadier'); session.advance(1);
    const before = session.frame();
    session.command({ kind: 'sell', tower: before.towers[0]!.id });
    session.advance(59); expect(session.frame().enemies.find(enemy => enemy.kind === 'scout')!.hp).toBe(965);
    session.advance(1);
    expect(session.frame().enemies.find(enemy => enemy.kind === 'scout')!.hp).toBe(985);
    expect(session.frame().enemies.find(enemy => enemy.kind === 'medic')!.hp).toBe(before.enemies.find(enemy => enemy.kind === 'medic')!.hp);
    expect(session.frame().enemies.find(enemy => enemy.kind === 'boss')!.hp).toBe(before.enemies.find(enemy => enemy.kind === 'boss')!.hp);
  });
  it('airstrikes clear current normals, damage bosses by 35% max HP, preserve future spawns and pay once', () => {
    fixture('scout'); ENEMIES.scout.hp = 100; ENEMIES.boss.hp = 1000; ENEMIES.boss.speed = 0; ENEMIES.boss.armor = 0.9;
    WAVES[0]!.groups.push({ kind: 'boss', count: 1, at: 0, interval: 1 }, { kind: 'scout', count: 1, at: 25, interval: 1 });
    const session = createSession();
    expect(session.command({ kind: 'airstrike' }).ok).toBe(false);
    session.command({ kind: 'start-wave' }); expect(session.command({ kind: 'airstrike' }).ok).toBe(false);
    session.advance(1);
    session.command({ kind: 'pause', value: true }); expect(session.command({ kind: 'airstrike' }).ok).toBe(false);
    session.command({ kind: 'pause', value: false }); expect(session.command({ kind: 'airstrike' }).ok).toBe(true);
    expect(session.frame()).toMatchObject({ cash: 101, airstrikes: 2, airstrikeReadyIn: 12, spawned: 2 });
    expect(session.frame().enemies[0]!.hp).toBe(650);
    expect(session.frame().stats).toMatchObject({ kills: 1, headshots: 0, headshotKills: 0, earned: 1 });
    expect(session.frame().events.filter(event => event.kind === 'airstrike')).toHaveLength(1);
    expect(session.command({ kind: 'airstrike' }).ok).toBe(false);
    session.command({ kind: 'pause', value: true }); session.advance(1000); expect(session.frame().airstrikeReadyIn).toBe(12);
    session.command({ kind: 'pause', value: false }); session.advance(719); expect(session.command({ kind: 'airstrike' }).ok).toBe(false);
    session.advance(1); expect(session.command({ kind: 'airstrike' }).ok).toBe(true);
    expect(session.frame().enemies[0]!.hp).toBe(300); expect(session.frame().cash).toBe(101);
    session.advance(720); expect(session.command({ kind: 'airstrike' }).ok).toBe(true);
    expect(session.frame()).toMatchObject({ airstrikes: 0, cash: 111, score: 110 });
    expect(session.frame().stats).toMatchObject({ kills: 2, headshots: 0, headshotKills: 0, earned: 11 });
    expect(session.frame().phase).toBe('combat'); session.advance(60);
    expect(session.frame().spawned).toBe(3); expect(session.frame().enemies).toHaveLength(1);
    expect(session.command({ kind: 'airstrike' }).ok).toBe(false);
    session.command({ kind: 'restart' }); expect(session.frame()).toMatchObject({ airstrikes: 3, airstrikeReadyIn: 0, nextWaveIn: null, cash: 100 });
  });
});
