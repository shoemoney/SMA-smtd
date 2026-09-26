import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, it } from 'vitest';
import { makeReport } from '../tools/balance';
import { compareReports } from '../tools/comparison';

it.skipIf(!process.env.SMTD_BALANCE_OUT)('runs the explicitly requested frozen balance panel', () => {
  const split = process.env.SMTD_BALANCE_SPLIT ?? 'tuning';
  expect(['tuning', 'held-out']).toContain(split);
  const mode = process.env.SMTD_BALANCE_STRIKES ?? 'none';
  expect(['none', 'fixed-rescue']).toContain(mode);
  const report = makeReport(process.env.SMTD_BALANCE_LABEL ?? 'baseline', split as 'tuning' | 'held-out', mode as 'none' | 'fixed-rescue');
  const baseline = process.env.SMTD_BALANCE_BASELINE ? JSON.parse(readFileSync(process.env.SMTD_BALANCE_BASELINE, 'utf8')) : null;
  const gates = baseline ? compareReports(baseline, report) : null;
  const output = process.env.SMTD_BALANCE_OUT!;
  mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, `${JSON.stringify({ ...report, gates })}\n`);
  console.log(JSON.stringify(report.summary));
  if (process.env.SMTD_BALANCE_REQUIRE_PASS === '1') expect(gates?.pass).toBe(true);
}, 600_000);
