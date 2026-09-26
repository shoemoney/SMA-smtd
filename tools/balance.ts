import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { createSession } from '../src/game';
import { PADS, UNITS } from '../src/content';
import type { Command, CommandResult, Frame, Role, Session, Rank } from '../src/types';

export const TUNING_SEEDS = [52, 914, 7341, 1009, 65537, 20260926, 17, 97];
export const HELD_OUT_SEEDS = [113, 509, 12347, 98761, 314159, 271828, 8675309, 424242];
export const CANDIDATES = { measured: [1, 2, 4], deep: [1, 3, 6] } as const;
export const PAD_ORDER = [0, 3, 7, 9, 1, 5, 8, 4, 2, 11, 10, 6, 12, 14, 15, 13];
export const DIVERSE: Role[] = ['cadet', 'cadet', 'cadet', 'cadet', 'gunner', 'grenadier', 'sniper', 'engineer',
  'officer', 'grenadier', 'gunner', 'sniper', 'engineer', 'gunner', 'sniper', 'officer'];
export const SPLASH_CONTROL: Role[] = ['cadet', 'cadet', 'cadet', 'cadet', 'grenadier', 'engineer', 'sniper', 'grenadier',
  'officer', 'grenadier', 'engineer', 'sniper', 'grenadier', 'gunner', 'sniper', 'officer'];
export const POLICIES = ['diverse-greedy', 'splash-control', 'gunner-greedy', 'sniper-greedy', 'diverse-frozen-10'] as const;
export type PolicyId = typeof POLICIES[number];
export type StrikeMode = 'none' | 'fixed-rescue';
export const POLICY_SPEC = {
  version: 1, padOrder: PAD_ORDER, diverse: DIVERSE, splashControl: SPLASH_CONTROL,
  target: 'first', buying: 'one deployment pass then three promotion passes in deployment order, initial/intermission only',
  frozen: 'identical to diverse until wave 10 begins; no purchases for waves 11 onward',
  rescue: 'one attempt per wave 15/25/30 at first combat tick with waveTime>=8; no retry',
  candidates: CANDIDATES, tuningSeeds: TUNING_SEEDS, heldOutSeeds: HELD_OUT_SEEDS,
};
const hash = (value: unknown) => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
export const POLICY_HASH = hash(POLICY_SPEC);
export const SOURCE_FILES = Object.fromEntries(['src/content.ts', 'src/game.ts', 'src/types.ts', 'tools/balance.ts'].map(path =>
  [path, hash(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'))]));
export const CONTENT_HASH = SOURCE_FILES['src/content.ts'];
export const SOURCE_HASH = hash(SOURCE_FILES);
const frameHash = (frame: Frame) => hash(frame);
const check = (condition: boolean, message: string) => { if (!condition) throw new Error(message); };
const same = (a: unknown, b: unknown, message: string) => check(isDeepStrictEqual(a, b), message);

export interface CommandRecord {
  tick: number; wave: number; phase: Frame['phase']; command: Command; result: CommandResult;
  cashBefore: number; cashAfter: number; spentDelta: number; earnedDelta: number; refund: number;
  beforeHash: string; afterHash: string;
}
export interface WaveRecord {
  wave: number; decisionTick: number; startTick: number | null; endTick: number;
  outcome: 'cleared' | 'defeat' | 'timeout'; cashBeforePurchases: number; cashAtStart: number;
  cashAtEnd: number; spending: number; income: number; refunds: number;
  livesAtStart: number; livesAtEnd: number; promotions: number; maxRankTowers: number;
  towers: { pad: number; role: Role; rank: Rank; invested: number }[];
  airstrikesUsed: number; startHash: string | null; endHash: string;
}
export interface CampaignRun {
  schemaVersion: 1; seed: number; policy: PolicyId; strikeMode: StrikeMode;
  contentHash: string; policyHash: string; sourceHash: string; ticks: number; timeout: boolean;
  firstAllDeployedMaxedWave: number | null; commands: CommandRecord[]; waves: WaveRecord[];
  final: Pick<Frame, 'phase' | 'wave' | 'cash' | 'lives' | 'score' | 'stats' | 'airstrikes'>;
  finalHash: string;
}
export function recordCommand(session: Session, command: Command, tick: number): CommandRecord {
  const before = session.frame(); const result = session.command(command); const after = session.frame();
  const refund = command.kind === 'sell' && result.ok ? after.cash - before.cash : 0;
  const record = { tick, wave: before.wave, phase: before.phase, command: structuredClone(command), result,
    cashBefore: before.cash, cashAfter: after.cash, spentDelta: after.stats.spent - before.stats.spent,
    earnedDelta: after.stats.earned - before.stats.earned, refund, beforeHash: frameHash(before), afterHash: frameHash(after) };
  check(record.cashAfter === record.cashBefore + record.earnedDelta + refund - record.spentDelta, 'Command cash identity');
  if (!result.ok) same(before, after, 'Refused command mutated session');
  return record;
}
export function assertCashIdentity(before: Frame, after: Frame, commands: CommandRecord[]) {
  const refunds = commands.reduce((sum, command) => sum + command.refund, 0);
  check(after.cash === before.cash + after.stats.earned - before.stats.earned + refunds - (after.stats.spent - before.stats.spent), 'Session cash identity');
}
function purchases(session: Session, policy: PolicyId, upcoming: number, tick: number, commands: CommandRecord[]) {
  if (policy === 'diverse-frozen-10' && upcoming > 10) return;
  const roles = policy === 'splash-control' ? SPLASH_CONTROL : policy === 'gunner-greedy' ? PAD_ORDER.map(() => 'gunner' as Role)
    : policy === 'sniper-greedy' ? PAD_ORDER.map(() => 'sniper' as Role) : DIVERSE;
  PAD_ORDER.forEach((pad, index) => {
    if (!session.frame().towers.some(tower => tower.pad === pad)) commands.push(recordCommand(session, { kind: 'place', pad, role: roles[index]! }, tick));
  });
  for (let rank = 1; rank <= 3; rank++) for (const tower of session.frame().towers) {
    if (tower.rank < rank) commands.push(recordCommand(session, { kind: 'upgrade', tower: tower.id }, tick));
  }
}
export function runCampaign(input: { seed: number; policy: PolicyId; strikeMode?: StrikeMode; maxTicks?: number }): CampaignRun {
  const { seed, policy, strikeMode = 'none', maxTicks = 180_000 } = input;
  check(POLICIES.includes(policy), 'Unknown policy');
  check(Number.isInteger(maxTicks) && maxTicks > 0, 'Invalid tick limit');
  const session = createSession(seed); const commands: CommandRecord[] = []; const waves: WaveRecord[] = [];
  let tick = 0; let frame = session.frame(); let firstAllDeployedMaxedWave: number | null = null;
  while (tick < maxTicks && frame.phase !== 'victory' && frame.phase !== 'defeat') {
    const upcoming = frame.wave + 1; const decisionTick = tick; const before = frame; const commandBegin = commands.length;
    purchases(session, policy, upcoming, tick, commands);
    frame = session.frame();
    if (firstAllDeployedMaxedWave === null && frame.towers.length === PADS.length && frame.towers.every(tower => tower.rank === 3)) firstAllDeployedMaxedWave = upcoming;
    if (frame.wave === 0) commands.push(recordCommand(session, { kind: 'start-wave' }, tick));
    frame = session.frame();
    while (frame.phase === 'build' && tick < maxTicks) { session.advance(1); tick++; frame = session.frame(); }
    const startTick = frame.phase === 'combat' ? tick : null;
    const cashAtStart = frame.cash; const startHash = startTick === null ? null : frameHash(frame);
    let strikeAttempted = false;
    while (frame.phase === 'combat' && tick < maxTicks) {
      if (strikeMode === 'fixed-rescue' && [15, 25, 30].includes(frame.wave) && frame.waveTime >= 8 && !strikeAttempted) {
        commands.push(recordCommand(session, { kind: 'airstrike' }, tick)); strikeAttempted = true; frame = session.frame();
      }
      session.advance(1); tick++; frame = session.frame();
    }
    const boundaryCommands = commands.slice(commandBegin);
    assertCashIdentity(before, frame, boundaryCommands);
    waves.push({ wave: upcoming, decisionTick, startTick, endTick: tick,
      outcome: frame.phase === 'defeat' ? 'defeat' : frame.phase === 'combat' || frame.phase === 'build' && startTick === null ? 'timeout' : 'cleared',
      cashBeforePurchases: before.cash, cashAtStart, cashAtEnd: frame.cash,
      spending: frame.stats.spent - before.stats.spent, income: frame.stats.earned - before.stats.earned,
      refunds: boundaryCommands.reduce((sum, command) => sum + command.refund, 0),
      livesAtStart: before.lives, livesAtEnd: frame.lives,
      promotions: boundaryCommands.filter(command => command.command.kind === 'upgrade' && command.result.ok).length,
      maxRankTowers: frame.towers.filter(tower => tower.rank === 3).length,
      towers: frame.towers.map(({ pad, role, rank, invested }) => ({ pad, role, rank, invested })),
      airstrikesUsed: before.airstrikes - frame.airstrikes, startHash, endHash: frameHash(frame) });
    check(frame.phase !== 'build' || frame.wave === upcoming, 'Wave boundary mismatch');
  }
  const { phase, wave, cash, lives, score, stats, airstrikes } = frame;
  const run: CampaignRun = { schemaVersion: 1, seed, policy, strikeMode, contentHash: CONTENT_HASH, policyHash: POLICY_HASH,
    sourceHash: SOURCE_HASH, ticks: tick, timeout: phase !== 'victory' && phase !== 'defeat', firstAllDeployedMaxedWave,
    commands, waves, final: { phase, wave, cash, lives, score, stats, airstrikes }, finalHash: frameHash(frame) };
  validateLedger(run); return run;
}
export function validateLedger(run: CampaignRun) {
  check(run.waves.every(wave => wave.cashAtEnd === wave.cashBeforePurchases + wave.income + wave.refunds - wave.spending), 'Wave cash identity');
  check(run.waves.reduce((sum, wave) => sum + wave.spending, 0) === run.final.stats.spent, 'Wave spending total');
  check(run.waves.reduce((sum, wave) => sum + wave.income, 0) === run.final.stats.earned, 'Wave income total');
  check(run.commands.reduce((sum, command) => sum + command.spentDelta, 0) === run.final.stats.spent, 'Command spending total');
  check(run.waves.every((wave, index) => wave.wave === index + 1 && wave.decisionTick === (index === 0 ? 0 : run.waves[index - 1]!.endTick)), 'Boundary continuity');
  check(run.waves.every(wave => wave.startTick === null || wave.endTick >= wave.startTick), 'Boundary tick order');
  check(run.waves.every((wave, index) => index === 0 || wave.startTick === null || wave.startTick === wave.decisionTick + 360), 'Automatic wave cadence');
}
export function replay(run: CampaignRun) {
  check(run.sourceHash === SOURCE_HASH && run.policyHash === POLICY_HASH, 'Replay source/policy changed');
  const session = createSession(run.seed); let tick = 0; let commandIndex = 0;
  const starts = new Map(run.waves.filter(wave => wave.startTick !== null).map(wave => [wave.startTick!, wave]));
  const ends = new Map(run.waves.map(wave => [wave.endTick, wave]));
  while (tick <= run.ticks) {
    const end = ends.get(tick); if (end) same(frameHash(session.frame()), end.endHash, `End replay at ${tick}`);
    while (run.commands[commandIndex]?.tick === tick) {
      const expected = run.commands[commandIndex++]!;
      same(recordCommand(session, expected.command, tick), expected, `Command replay at ${tick}`);
    }
    const start = starts.get(tick); if (start) same(frameHash(session.frame()), start.startHash, `Start replay at ${tick}`);
    if (tick === run.ticks) break;
    session.advance(1); tick++;
  }
  check(commandIndex === run.commands.length, 'Unreplayed commands');
  same(frameHash(session.frame()), run.finalHash, 'Final replay');
  return session.frame();
}
export function median(values: number[]) { const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2; }
export function summarize(runs: CampaignRun[]) {
  return POLICIES.map(policy => {
    const group = runs.filter(run => run.policy === policy);
    return { policy, runs: group.length, wins: group.filter(run => run.final.phase === 'victory').length,
      earlyDefeats: group.filter(run => run.final.phase === 'defeat' && run.final.wave < 10).length,
      medianLives: median(group.map(run => run.final.lives)), medianCash: median(group.map(run => run.final.cash)),
      medianSpending: median(group.map(run => run.final.stats.spent)),
      medianLateSpending: median(group.map(run => run.waves.filter(wave => wave.wave >= 21).reduce((sum, wave) => sum + wave.spending, 0))),
      saturationWaves: group.map(run => run.firstAllDeployedMaxedWave),
      medianSaturationWave: Number.isFinite(median(group.map(run => run.firstAllDeployedMaxedWave ?? Infinity)))
        ? median(group.map(run => run.firstAllDeployedMaxedWave ?? Infinity)) : null,
      saturationLowerBoundWave: median(group.map(run => run.firstAllDeployedMaxedWave ?? run.final.wave + 1)),
      medianEndingWave: median(group.map(run => run.final.wave)), timeouts: group.filter(run => run.timeout).length };
  });
}
export function evaluateGates(baseline: ReturnType<typeof summarize>, selected: ReturnType<typeof summarize>) {
  for (const panel of [baseline, selected]) {
    check(panel.length === POLICIES.length && POLICIES.every(policy => panel.filter(row => row.policy === policy).length === 1), 'Gate panel requires all five unique policies');
    check(panel.every(row => row.runs === 8 && row.wins >= 0 && row.wins <= row.runs && row.saturationWaves.length === 8), 'Gate panel requires eight samples per policy');
  }
  const mixed = ['diverse-greedy', 'splash-control'] as const;
  const checks = mixed.flatMap(policy => {
    const before = baseline.find(row => row.policy === policy)!; const after = selected.find(row => row.policy === policy)!;
    return [{ gate: `${policy}: feasibility`, pass: after.wins >= 6 && before.wins - after.wins <= 2 },
      { gate: `${policy}: no early collapse`, pass: after.earlyDefeats <= 2 },
      { gate: `${policy}: later saturation`, pass: before.medianSaturationWave !== null && after.saturationLowerBoundWave >= Math.max(20, before.medianSaturationWave + 4) },
      { gate: `${policy}: late spending`, pass: after.medianLateSpending > 0 }];
  });
  const frozen = selected.find(row => row.policy === 'diverse-frozen-10')!;
  const evolving = selected.find(row => row.policy === 'diverse-greedy')!;
  checks.push({ gate: 'continued spending matters', pass: frozen.wins < evolving.wins || frozen.medianLives < evolving.medianLives });
  checks.push({ gate: 'no timeouts', pass: selected.every(row => row.timeouts === 0) });
  return { pass: checks.every(check => check.pass), checks };
}
export function makeReport(label: string, split: 'tuning' | 'held-out', strikeMode: StrikeMode = 'none') {
  const seeds = split === 'tuning' ? TUNING_SEEDS : HELD_OUT_SEEDS;
  const runs = seeds.flatMap(seed => POLICIES.map(policy => runCampaign({ seed, policy, strikeMode })));
  check(runs.every(run => !run.timeout), 'Benchmark timeout');
  for (const policy of POLICIES) replay(runs.find(run => run.seed === seeds[0] && run.policy === policy)!);
  return { schemaVersion: 1, label, split, strikeMode, sourceHash: SOURCE_HASH, contentHash: CONTENT_HASH,
    policyHash: POLICY_HASH, sourceFiles: SOURCE_FILES, policies: POLICY_SPEC, seeds,
    prices: Object.fromEntries(Object.entries(UNITS).map(([role, unit]) => [role, unit.ranks.map(rank => rank.cost)])),
    replayedSeeds: [seeds[0]], runs, summary: summarize(runs) };
}
