import { BOSS_HP, ENEMIES, PADS, ROUTE, STARTING_CASH, STARTING_LIVES, UNITS, WAVES, waveBounty } from './content';
import type { Command, CommandResult, CombatEvent, Enemy, Frame, GameStats, Point, Rank, Role, Session, Tower } from './types';

const HZ = 60;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);
const segments = ROUTE.slice(1).map((point, index) => distance(ROUTE[index]!, point));
const roadLength = segments.reduce((sum, length) => sum + length, 0);
function roadPoint(progress: number): Point {
  let remaining = progress;
  for (let index = 0; index < segments.length; index++) {
    const length = segments[index]!;
    if (remaining <= length) {
      const a = ROUTE[index]!; const b = ROUTE[index + 1]!;
      const ratio = remaining / length;
      return { x: a.x + (b.x - a.x) * ratio, z: a.z + (b.z - a.z) * ratio };
    }
    remaining -= length;
  }
  return { ...ROUTE[ROUTE.length - 1]! };
}

/** Single combat writer. RNG is advanced only by an actually emitted eligible shot. */
export function createSession(seed = 7341): Session {
  if (!Number.isFinite(seed) || !Number.isInteger(seed)) throw new Error('Seed must be a finite integer.');
  let randomState = seed >>> 0;
  let tick = 0; let waveTick = 0; let phase: Frame['phase'] = 'build'; let paused = false;
  let wave = 0; let cash = STARTING_CASH; let lives = STARTING_LIVES; let score = 0;
  let entityId = 0; let eventId = 0; let spawned = 0; let spawnIndex = 0;
  let intermissionUntil: number | null = null; let airstrikes = 3; let airstrikeReadyAt = 0;
  let towers: Tower[] = []; let enemies: Enemy[] = []; let events: CombatEvent[] = [];
  let queue: { at: number; kind: Enemy['kind'] }[] = [];
  const credit = new Map<number, number>();
  const nextHeal = new Map<number, number>();
  const emptyStats = (): GameStats => ({ kills: 0, headshots: 0, headshotKills: 0, rageProcs: 0, damage: 0, spent: 0, earned: 0, leaked: 0 });
  let stats = emptyStats();
  const time = () => tick / HZ;
  const terminal = () => phase === 'victory' || phase === 'defeat';
  const random = () => {
    randomState = (randomState + 0x6D2B79F5) >>> 0;
    let value = randomState;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const event = (kind: CombatEvent['kind'], from: Point, to: Point, role?: Role, amount?: number, boss?: boolean) => {
    events.push({ id: ++eventId, time: time(), kind, from: { x: from.x, z: from.z }, to: { x: to.x, z: to.z },
      ...(role ? { role } : {}), ...(amount !== undefined ? { amount } : {}), ...(boss ? { boss } : {}) });
  };
  const earned = (amount: number) => { cash += amount; stats.earned += amount; };
  const refusal = (reason: string): CommandResult => ({ ok: false, reason });
  function startWave() {
    wave++; waveTick = 0; spawned = 0; spawnIndex = 0; intermissionUntil = null;
    queue = WAVES[wave - 1]!.groups.flatMap(group => Array.from({ length: group.count }, (_, index) => ({
      at: Math.round((group.at + group.interval * index) * HZ), kind: group.kind,
    }))).sort((a, b) => a.at - b.at);
    phase = 'combat';
  }

  function command(input: Command): CommandResult {
    if (!input || typeof input !== 'object') return refusal('Invalid command.');
    if (input.kind === 'restart') {
      randomState = seed >>> 0; tick = 0; waveTick = 0; phase = 'build'; paused = false;
      wave = 0; cash = STARTING_CASH; lives = STARTING_LIVES; score = 0;
      entityId = 0; spawned = 0; spawnIndex = 0; towers = []; enemies = []; events = []; queue = [];
      intermissionUntil = null; airstrikes = 3; airstrikeReadyAt = 0;
      credit.clear(); nextHeal.clear(); stats = emptyStats();
      return { ok: true };
    }
    if (input.kind === 'pause') {
      if (typeof input.value !== 'boolean') return refusal('Pause requires a boolean value.');
      paused = input.value; return { ok: true };
    }
    if (phase === 'victory' || phase === 'defeat') return refusal('Restart to begin another campaign.');
    if (input.kind === 'airstrike') {
      if (paused || phase !== 'combat') return refusal('Air support requires active combat.');
      if (!enemies.some(enemy => enemy.hp > 0)) return refusal('No hostiles are currently on the battlefield.');
      if (airstrikes <= 0) return refusal('All three airstrikes have been used.');
      if (tick < airstrikeReadyAt) return refusal('Air support is rearming.');
      airstrikes--; airstrikeReadyAt = tick + 720;
      event('airstrike', { x: 0, z: 0 }, { x: 0, z: 0 });
      for (const enemy of enemies) damage(null, enemy, enemy.maxHp * 0.35, !enemy.boss, true);
      enemies = enemies.filter(enemy => enemy.hp > 0);
      return { ok: true };
    }
    if (input.kind === 'start-wave') {
      if (phase !== 'build' || wave !== 0) return refusal('Later waves launch automatically after intermission.');
      startWave(); return { ok: true };
    }
    if (input.kind === 'place') {
      if (!Object.prototype.hasOwnProperty.call(UNITS, input.role)) return refusal('Unknown soldier.');
      const pad = PADS.find(candidate => candidate.id === input.pad);
      if (!pad) return refusal('Choose a deployment position.');
      if (towers.some(tower => tower.pad === input.pad)) return refusal('This position is occupied.');
      const spec = UNITS[input.role].ranks[0];
      if (cash < spec.cost) return refusal('Not enough cash to deploy this soldier.');
      cash -= spec.cost; stats.spent += spec.cost;
      const tower: Tower = { ...pad, id: ++entityId, pad: pad.id, role: input.role, rank: 0,
        cooldown: 0, rageUntil: 0, targetId: null, policy: 'first', kills: 0, damageDealt: 0, invested: spec.cost };
      towers.push(tower); credit.set(tower.id, 1); event('deploy', tower, tower, tower.role); return { ok: true };
    }
    if (input.kind !== 'upgrade' && input.kind !== 'sell' && input.kind !== 'target') return refusal('Unknown command.');
    const tower = towers.find(candidate => candidate.id === input.tower);
    if (!tower) return refusal('This soldier is no longer deployed.');
    if (input.kind === 'target') {
      if (!['first', 'strongest', 'weakest'].includes(input.policy)) return refusal('Unknown targeting policy.');
      tower.policy = input.policy; return { ok: true };
    }
    if (input.kind === 'sell') {
      cash += Math.floor(tower.invested * 0.7); towers = towers.filter(candidate => candidate.id !== tower.id);
      credit.delete(tower.id); return { ok: true };
    }
    if (tower.rank === 3) return refusal('This soldier already has all three upgrades.');
    const rank = (tower.rank + 1) as Rank; const spec = UNITS[tower.role].ranks[rank];
    if (cash < spec.cost) return refusal('Not enough cash for this upgrade.');
    cash -= spec.cost; stats.spent += spec.cost; tower.invested += spec.cost; tower.rank = rank;
    event('upgrade', tower, tower, tower.role); return { ok: true };
  }

  function spawn() {
    const definition = WAVES[wave - 1]!;
    while (spawnIndex < queue.length && queue[spawnIndex]!.at <= waveTick) {
      const kind = queue[spawnIndex++]!.kind; const spec = ENEMIES[kind];
      const hp = kind === 'boss' ? BOSS_HP[wave] ?? Math.round(spec.hp * definition.hpMultiplier) : Math.round(spec.hp * definition.hpMultiplier);
      const enemy: Enemy = { ...roadPoint(0), id: ++entityId, kind, hp, maxHp: hp, progress: 0,
        armor: spec.armor, plating: spec.plating, speed: spec.speed, slowUntil: 0, slowFactor: 1,
        bounty: waveBounty(wave, kind === 'boss'), leak: spec.leak, boss: kind === 'boss' };
      enemies.push(enemy); if (kind === 'medic') nextHeal.set(enemy.id, tick + HZ); spawned++;
    }
  }
  function damage(tower: Tower | null, enemy: Enemy, raw: number, instant = false, ignoreArmor = false) {
    if (enemy.hp <= 0) return;
    const shielded = ignoreArmor ? raw : raw * (1 - enemy.armor) - enemy.plating;
    const amount = instant ? enemy.hp : Math.min(enemy.hp, Math.max(1, shielded));
    enemy.hp -= amount; if (tower) tower.damageDealt += amount; stats.damage += amount;
    if (enemy.hp <= 0) {
      enemy.hp = 0; if (tower) tower.kills++; stats.kills++; earned(enemy.bounty); score += enemy.bounty * 10;
      event('kill', tower ?? { x: 0, z: 0 }, enemy, tower?.role, amount, enemy.boss); nextHeal.delete(enemy.id);
    }
  }
  function attack(tower: Tower, target: Enemy) {
    const spec = UNITS[tower.role].ranks[tower.rank];
    let aura = 0;
    if (tower.role !== 'officer') for (const officer of towers) {
      if (officer.role !== 'officer') continue;
      const buff = UNITS.officer.ranks[officer.rank];
      if (distance(officer, tower) <= buff.range) aura = Math.max(aura, buff.aura ?? 0);
    }
    const raw = spec.damage * (1 + aura);
    const headshot = tower.role === 'sniper' && random() < 0.1;
    const rage = tower.role === 'gunner' && tick >= Math.round(tower.rageUntil * HZ) && random() < 0.05;
    if (headshot) { stats.headshots++; event('headshot', tower, target, tower.role, target.boss ? raw * 5 : target.hp); }
    event(spec.splash ? 'blast' : 'shot', tower, target, tower.role, raw);
    const victims = spec.splash ? enemies.filter(enemy => enemy.hp > 0 && distance(enemy, target) <= spec.splash!) : [target];
    for (const victim of victims) {
      damage(tower, victim, headshot && victim.boss ? raw * 5 : raw, headshot && !victim.boss);
      if (headshot && victim.hp === 0) stats.headshotKills++;
      if (spec.slow && victim.hp > 0) {
        const slow = victim.boss ? Math.min(spec.slow, 0.15) : spec.slow;
        victim.slowFactor = Math.min(victim.slowFactor, 1 - slow); victim.slowUntil = (tick + 120) / HZ;
      }
    }
    if (rage) { tower.rageUntil = (tick + 300) / HZ; stats.rageProcs++; event('rage', tower, tower, tower.role, 5); }
  }
  function step() {
    tick++;
    if (phase === 'build' && intermissionUntil !== null && tick >= intermissionUntil) startWave();
    if (phase !== 'combat') { events = events.filter(item => item.time >= time() - 1); return; }
    spawn();
    for (const enemy of enemies) {
      if (tick >= Math.round(enemy.slowUntil * HZ)) enemy.slowFactor = 1;
      enemy.progress += enemy.speed * enemy.slowFactor / HZ;
      Object.assign(enemy, roadPoint(enemy.progress));
      if (enemy.progress >= roadLength) {
        lives = Math.max(0, lives - enemy.leak); stats.leaked++; enemy.hp = 0;
        nextHeal.delete(enemy.id); event('leak', enemy, enemy, undefined, enemy.leak);
      }
    }
    enemies = enemies.filter(enemy => enemy.hp > 0);
    if (lives <= 0) { phase = 'defeat'; return; }
    for (const medic of enemies) {
      if (medic.kind !== 'medic' || tick < nextHeal.get(medic.id)!) continue;
      for (const enemy of enemies) if (enemy.id !== medic.id && !enemy.boss && distance(medic, enemy) <= 2.2) {
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.maxHp * 0.02);
      }
      nextHeal.set(medic.id, tick + HZ);
    }
    for (const tower of towers) {
      const spec = UNITS[tower.role].ranks[tower.rank];
      const candidates = enemies.filter(enemy => enemy.hp > 0 && distance(tower, enemy) <= spec.range);
      candidates.sort((a, b) => {
        const difference = tower.policy === 'strongest' ? b.hp - a.hp : tower.policy === 'weakest' ? a.hp - b.hp : b.progress - a.progress;
        return difference || a.id - b.id;
      });
      tower.targetId = candidates[0]?.id ?? null;
      const multiplier = tick < Math.round(tower.rageUntil * HZ) ? 5 : 1;
      let available = (credit.get(tower.id) ?? 0) + spec.rate * multiplier / HZ;
      if (!candidates.length) available = Math.min(1, available);
      while (available >= 1 - 1e-9 && candidates.length) {
        const target = candidates.find(enemy => enemy.hp > 0);
        if (!target) { available = Math.min(1, available); break; }
        attack(tower, target); available -= 1;
      }
      credit.set(tower.id, Math.max(0, available));
      tower.cooldown = Math.max(0, 1 - available) / (spec.rate * multiplier);
    }
    enemies = enemies.filter(enemy => enemy.hp > 0);
    waveTick++;
    if (spawnIndex === queue.length && enemies.length === 0) {
      const reward = WAVES[wave - 1]!.reward; earned(reward); score += wave * 100;
      event('wave-clear', ROUTE[ROUTE.length - 1]!, ROUTE[ROUTE.length - 1]!, undefined, reward);
      if (wave === WAVES.length) { phase = 'victory'; score += lives * 500; }
      else { phase = 'build'; intermissionUntil = tick + 360; }
    }
    events = events.filter(item => item.time >= time() - 1);
  }
  return {
    command,
    advance(ticks: number) {
      if (!Number.isSafeInteger(ticks) || ticks < 0) throw new Error('Advance requires a nonnegative integer tick count.');
      if (paused || terminal()) return;
      for (let index = 0; index < ticks; index++) { step(); if (terminal()) break; }
    },
    frame(): Frame {
      return { time: time(), phase, paused, wave, waveTime: waveTick / HZ, cash, lives, score,
        towers: towers.map(tower => ({ ...tower })), enemies: enemies.map(enemy => ({ ...enemy })),
        events: events.map(item => ({ ...item, from: { ...item.from }, to: { ...item.to } })), stats: { ...stats },
        spawned, waveTotal: queue.length,
        nextWaveIn: intermissionUntil === null ? null : Math.max(0, (intermissionUntil - tick) / HZ),
        airstrikes, airstrikeReadyIn: Math.max(0, (airstrikeReadyAt - tick) / HZ) };
    },
  };
}
