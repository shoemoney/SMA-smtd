import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compareReports } from '../tools/comparison';
import { createSession } from '../src/game';
import { CONTENT_HASH, POLICY_HASH, POLICY_SPEC, POLICIES, runCampaign, SOURCE_FILES, SOURCE_HASH, summarize, TUNING_SEEDS } from '../tools/balance';

const runs = TUNING_SEEDS.flatMap(seed => POLICIES.map(policy => runCampaign({ seed, policy, maxTicks: 1 })));
const panel = { schemaVersion: 1, split: 'tuning', strikeMode: 'none', seeds: TUNING_SEEDS,
  policyHash: POLICY_HASH, policies: POLICY_SPEC, sourceFiles: SOURCE_FILES, sourceHash: SOURCE_HASH,
  contentHash: CONTENT_HASH, runs, summary: summarize(runs) };
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

describe('paired campaign comparison', () => {
  it('recomputes summaries instead of trusting supplied summaries', () => {
    const altered = structuredClone(panel); altered.summary.forEach(row => { row.wins = 8; row.timeouts = 0; });
    const comparison = compareReports(panel, altered);
    expect(comparison.selectedSummary).toEqual(summarize(runs));
    expect(comparison.pass).toBe(false);
  });
  it.each([
    ['schema', (p: typeof panel) => { p.schemaVersion = 2; }],
    ['split', (p: typeof panel) => { p.split = 'held-out'; }],
    ['strikeMode', (p: typeof panel) => { p.strikeMode = 'fixed-rescue'; }],
    ['seeds', (p: typeof panel) => { p.seeds.reverse(); }],
    ['policyHash', (p: typeof panel) => { p.policyHash = 'f'.repeat(64); }],
    ['policies', (p: typeof panel) => { p.policies.version++; p.policyHash = hash(p.policies); p.runs.forEach(run => { run.policyHash = p.policyHash; }); }],
    ['source metadata', (p: typeof panel) => { p.sourceHash = 'f'.repeat(64); }],
    ['source inventory', (p: typeof panel) => { p.sourceFiles['extra.ts'] = 'f'.repeat(64); }],
    ['duplicate run', (p: typeof panel) => { p.runs[1] = structuredClone(p.runs[0]!); }],
    ['missing run', (p: typeof panel) => { p.runs.pop(); }],
    ['outside seed', (p: typeof panel) => { p.runs[0]!.seed = 1; }],
  ])('rejects mismatched %s', (_, mutate) => {
    const altered = structuredClone(panel); mutate(altered);
    expect(() => compareReports(panel, altered)).toThrow('Invalid comparison');
  });
  it('rejects changed engine hashes even when source metadata and run provenance are internally consistent', () => {
    const altered = structuredClone(panel); altered.sourceFiles['src/game.ts'] = 'f'.repeat(64);
    altered.sourceHash = hash(altered.sourceFiles); altered.runs.forEach(run => { run.sourceHash = altered.sourceHash; });
    expect(() => compareReports(panel, altered)).toThrow('source mismatch: src/game.ts');
  });
  it('allows only the content source hash to differ', () => {
    const altered = structuredClone(panel); altered.contentHash = 'f'.repeat(64);
    altered.sourceFiles['src/content.ts'] = altered.contentHash; altered.sourceHash = hash(altered.sourceFiles);
    altered.runs.forEach(run => { run.sourceHash = altered.sourceHash; run.contentHash = altered.contentHash; });
    expect(compareReports(panel, altered).selectedSummary).toEqual(summarize(runs));
  });
  it.each([
    ['spending', (p: typeof panel) => { p.runs[0]!.waves[0]!.spending++; }, 'Wave cash identity'],
    ['phase', (p: typeof panel) => { p.runs[0]!.final.phase = 'victory'; }, 'phase/timeout mismatch'],
    ['timeout', (p: typeof panel) => { p.runs[0]!.timeout = false; }, 'phase/timeout mismatch'],
    ['final wave', (p: typeof panel) => { p.runs[0]!.final.wave++; }, 'final wave mismatch'],
    ['final cash', (p: typeof panel) => { p.runs[0]!.final.cash++; }, 'final cash/lives mismatch'],
    ['final lives', (p: typeof panel) => { p.runs[0]!.final.lives--; }, 'final cash/lives mismatch'],
    ['outcome', (p: typeof panel) => { p.runs[0]!.waves[0]!.outcome = 'cleared'; }, 'partial outcome mismatch'],
    ['victory outcome', (p: typeof panel) => { p.runs[0]!.final.phase = 'victory'; p.runs[0]!.timeout = false; }, 'victory outcome mismatch'],
    ['defeat outcome', (p: typeof panel) => {
      p.runs[0]!.final.phase = 'defeat'; p.runs[0]!.timeout = false;
      p.runs[0]!.final.lives = 0; p.runs[0]!.waves[0]!.livesAtEnd = 0;
    }, 'defeat outcome mismatch'],
  ])('rejects corrupted %s', (_, mutate, reason) => {
    const altered = structuredClone(panel); mutate(altered);
    expect(() => compareReports(panel, altered)).toThrow(reason);
  });
  it('accepts a valid partial timeout during intermission with an upcoming unstarted wave record', () => {
    const partial = runCampaign({ seed: 52, policy: 'diverse-greedy', maxTicks: 3000 });
    const firstClear = partial.waves[0]!.endTick;
    const intermission = runCampaign({ seed: 52, policy: 'diverse-greedy', maxTicks: firstClear });
    const session = createSession(52);
    for (const record of intermission.commands) session.command(record.command);
    session.advance(firstClear + 1);
    const frame = session.frame(); const last = intermission.waves[0]!;
    intermission.ticks++;
    intermission.waves.push({ ...last, wave: 2, decisionTick: firstClear, startTick: null, endTick: firstClear + 1,
      outcome: 'timeout', cashBeforePurchases: last.cashAtEnd, cashAtStart: last.cashAtEnd,
      spending: 0, income: 0, refunds: 0, promotions: 0, startHash: null, endHash: hash(frame) });
    intermission.finalHash = hash(frame);
    expect(intermission.final).toMatchObject({ phase: 'build', wave: 1 });
    expect(intermission.waves.at(-1)).toMatchObject({ wave: 2, startTick: null, outcome: 'timeout' });
    const altered = structuredClone(panel); altered.runs[0] = intermission;
    expect(compareReports(panel, altered).selectedSummary[0]!.timeouts).toBe(8);
  });
  it.skipIf(!process.env.SMTD_BALANCE_REVIEW_DIR)('validates actual saved paired panels without rerunning campaigns', () => {
    const load = (file: string) => JSON.parse(readFileSync(join(process.env.SMTD_BALANCE_REVIEW_DIR!, file), 'utf8'));
    expect(compareReports(load('baseline.json'), load('candidate-measured.json')).pass).toBe(true);
    expect(compareReports(load('baseline.json'), load('candidate-deep.json')).pass).toBe(true);
    expect(compareReports(load('candidate-baseline-held-out.json'), load('selected.json')).pass).toBe(true);
    const rescue = compareReports(load('candidate-baseline-rescue.json'), load('candidate-measured-rescue.json'));
    expect(rescue.selectedSummary.every(row => row.timeouts === 0)).toBe(true);
    expect(() => compareReports(load('baseline.json'), load('selected.json'))).toThrow('split mismatch');
    expect(() => compareReports(load('candidate-baseline-held-out.json'), load('candidate-measured-rescue.json'))).toThrow('strikeMode mismatch');
  });
});
