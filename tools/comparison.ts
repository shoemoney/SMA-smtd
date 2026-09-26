import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { evaluateGates, HELD_OUT_SEEDS, POLICIES, summarize, TUNING_SEEDS, validateLedger } from './balance';
import type { makeReport } from './balance';

type PanelReport = Omit<ReturnType<typeof makeReport>, 'summary'> & { summary?: unknown };
const requireValue = (condition: boolean, reason: string) => { if (!condition) throw new Error(`Invalid comparison: ${reason}`); };
const equal = (left: unknown, right: unknown, reason: string) => requireValue(isDeepStrictEqual(left, right), reason);
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

function validate(input: unknown): PanelReport {
  requireValue(!!input && typeof input === 'object', 'report must be an object');
  const report = input as PanelReport;
  requireValue(report.schemaVersion === 1, 'unsupported schemaVersion');
  requireValue(['tuning', 'held-out'].includes(report.split), 'unknown split');
  requireValue(['none', 'fixed-rescue'].includes(report.strikeMode), 'unknown strikeMode');
  equal(report.seeds, report.split === 'tuning' ? TUNING_SEEDS : HELD_OUT_SEEDS, 'seed list differs from declared split');
  requireValue(!!report.policies && typeof report.policies === 'object', 'missing policy specification');
  requireValue(report.policyHash === hash(report.policies), 'policyHash does not match policies');
  requireValue(!!report.sourceFiles && typeof report.sourceFiles === 'object', 'missing sourceFiles');
  equal(Object.keys(report.sourceFiles).sort(), ['src/content.ts', 'src/game.ts', 'src/types.ts', 'tools/balance.ts'], 'sourceFiles inventory differs');
  requireValue(Object.values(report.sourceFiles).every(value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)), 'invalid source file hash');
  requireValue(report.contentHash === report.sourceFiles['src/content.ts'] && report.sourceHash === hash(report.sourceFiles), 'source metadata hash mismatch');
  requireValue(Array.isArray(report.runs) && report.runs.length === report.seeds.length * POLICIES.length, 'missing or extra run');
  const seen = new Set<string>();
  for (const run of report.runs) {
    requireValue(!!run && report.seeds.includes(run.seed) && POLICIES.includes(run.policy), 'run is outside declared panel');
    const key = `${run.seed}:${run.policy}`;
    requireValue(!seen.has(key), 'duplicate seed/policy run'); seen.add(key);
    requireValue(run.schemaVersion === 1 && run.strikeMode === report.strikeMode && run.policyHash === report.policyHash
      && run.sourceHash === report.sourceHash && run.contentHash === report.contentHash, 'run provenance differs from panel');
    validateLedger(run);
    const last = run.waves.at(-1);
    requireValue(!!last && last.endTick === run.ticks, 'missing final wave boundary');
    const final = run.final; const terminal = final.phase === 'victory' || final.phase === 'defeat';
    requireValue(['victory', 'defeat', 'build', 'combat'].includes(final.phase) && run.timeout === !terminal, 'phase/timeout mismatch');
    requireValue(final.wave === (last!.startTick === null ? last!.wave - 1 : last!.wave), 'final wave mismatch');
    requireValue(final.cash === last!.cashAtEnd && final.lives === last!.livesAtEnd, 'final cash/lives mismatch');
    if (final.phase === 'victory') requireValue(last!.outcome === 'cleared' && final.wave === 30 && final.lives > 0, 'victory outcome mismatch');
    else if (final.phase === 'defeat') requireValue(last!.outcome === 'defeat' && final.lives === 0, 'defeat outcome mismatch');
    else requireValue(last!.outcome === 'timeout' && (final.phase === 'build' ? last!.startTick === null : last!.startTick !== null)
      || final.phase === 'build' && last!.outcome === 'cleared' && last!.startTick !== null, 'partial outcome mismatch');
  }
  for (const seed of report.seeds) for (const policy of POLICIES) requireValue(seen.has(`${seed}:${policy}`), 'missing seed/policy run');
  return report;
}

export function compareReports(baselineInput: unknown, selectedInput: unknown) {
  const baseline = validate(baselineInput); const selected = validate(selectedInput);
  equal(baseline.split, selected.split, 'split mismatch');
  equal(baseline.strikeMode, selected.strikeMode, 'strikeMode mismatch');
  equal(baseline.seeds, selected.seeds, 'seed list mismatch');
  equal(baseline.policyHash, selected.policyHash, 'policyHash mismatch');
  equal(baseline.policies, selected.policies, 'policies mismatch');
  for (const path of Object.keys(baseline.sourceFiles)) {
    if (path !== 'src/content.ts') equal(baseline.sourceFiles[path], selected.sourceFiles[path], `source mismatch: ${path}`);
  }
  const baselineSummary = summarize(baseline.runs); const selectedSummary = summarize(selected.runs);
  return { baselineSummary, selectedSummary, ...evaluateGates(baselineSummary, selectedSummary) };
}
