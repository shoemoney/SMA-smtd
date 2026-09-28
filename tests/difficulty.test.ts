import { describe, expect, it } from 'vitest';
import { runCampaign, TUNING_SEEDS } from '../tools/balance';

// Pins the SHAPE of the difficulty curve, not its exact numbers. On 2026-09-26 a re-tune made
// the finale hard and left waves 1-28 untouched (first integrity loss at wave 29 on every
// seed) and nothing caught it, because every check measured the end state rather than when
// the pressure arrives. Single-role gunner spam is the strategy players reported cruising on.
describe('difficulty shape', () => {
  const runs = TUNING_SEEDS.map(seed => runCampaign({ seed, policy: 'gunner-greedy' }));

  it('makes gunner-only spam bleed early, not just at the finale', () => {
    for (const run of runs) {
      const firstLoss = run.waves.find(wave => wave.livesAtEnd < wave.livesAtStart)?.wave;
      expect(firstLoss, `seed ${run.seed}`).toBeDefined();
      expect(firstLoss!, `seed ${run.seed}`).toBeLessThanOrEqual(12);
    }
  });

  it('never lets gunner-only spam finish the campaign untouched', () => {
    for (const run of runs) expect(run.final.lives, `seed ${run.seed}`).toBeLessThan(20);
  });

  it('keeps gunner-only spam winnable on at least one seed', () => {
    expect(runs.some(run => run.final.phase === 'victory')).toBe(true);
  });
});
