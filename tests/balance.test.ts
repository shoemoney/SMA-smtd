import { describe, expect, it } from 'vitest';
import { createSession } from '../src/game';
import { assertCashIdentity, evaluateGates, recordCommand, replay, runCampaign, summarize, validateLedger } from '../tools/balance';

describe('public-command balance ledger', () => {
  it('accounts for sales separately from earned income and preserves refused commands', () => {
    const session = createSession(52); const initial = session.frame();
    const records = [recordCommand(session, { kind: 'place', role: 'cadet', pad: 0 }, 0)];
    const id = session.frame().towers[0]!.id;
    records.push(recordCommand(session, { kind: 'upgrade', tower: id }, 0));
    records.push(recordCommand(session, { kind: 'sell', tower: id }, 0));
    records.push(recordCommand(session, { kind: 'sell', tower: id }, 0));
    expect(records[2]!.refund).toBe(14); expect(records[3]!.result.ok).toBe(false);
    expect(session.frame().stats.earned).toBe(0);
    assertCashIdentity(initial, session.frame(), records);
  });
  it('replays an exact partial public-command campaign, including refusals', () => {
    const run = runCampaign({ seed: 52, policy: 'diverse-greedy', maxTicks: 120 });
    expect(run.timeout).toBe(true); expect(run.commands.some(command => !command.result.ok)).toBe(true);
    expect(replay(run).stats).toEqual(run.final.stats); validateLedger(run);
    const corrupted = structuredClone(run); corrupted.waves[0]!.income++;
    expect(() => validateLedger(corrupted)).toThrow('Wave cash identity');
    const altered = structuredClone(run); altered.commands[0]!.cashAfter++;
    expect(() => replay(altered)).toThrow('Command replay');
  });
  it('assigns intermission purchases to the upcoming wave and replays its exact start', () => {
    const run = runCampaign({ seed: 52, policy: 'diverse-greedy', maxTicks: 3000 });
    expect(run.waves.length).toBeGreaterThan(1);
    const second = run.waves[1]!;
    expect(second.decisionTick).toBe(run.waves[0]!.endTick);
    expect(second.startTick).toBe(second.decisionTick + 360);
    expect(second.cashAtStart).toBe(second.cashBeforePurchases - second.spending);
    expect(replay(run).cash).toBe(run.final.cash);
  });
  it('rejects missing policy groups and panels with the wrong sample count', () => {
    const partial = summarize([runCampaign({ seed: 52, policy: 'diverse-greedy', maxTicks: 1 })]);
    expect(() => evaluateGates(partial.slice(1), partial)).toThrow('five unique policies');
    expect(() => evaluateGates(partial, partial)).toThrow('eight samples');
  });
});
