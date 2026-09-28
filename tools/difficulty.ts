// Difficulty probe: WHEN a policy starts losing integrity, how fast it erodes, and WHICH waves do
// the damage. End-state win rate alone hid a wall at wave 29 for a full day, so this reports the
// shape first.
//
//   npm run difficulty                        gunner-greedy over 40 seeds
//   npm run difficulty -- splash-control 24   any POLICIES entry, any seed count
import { WAVES } from '../src/content';
import { POLICIES, type PolicyId, runCampaign } from './balance';

const policy = (process.argv[2] ?? 'gunner-greedy') as PolicyId;
const count = Number(process.argv[3] ?? 40);
if (!POLICIES.includes(policy)) throw new Error(`Unknown policy "${policy}". Use one of: ${POLICIES.join(', ')}`);
if (!Number.isInteger(count) || count < 1) throw new Error('Seed count must be a positive integer');

const seeds = Array.from({ length: count }, (_, index) => 1000 + index * 137);
const runs = seeds.map(seed => runCampaign({ seed, policy, maxTicks: 500_000 }));
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]!;
const wins = runs.filter(run => run.final.phase === 'victory').length;
const bleeds = runs.map(run => run.waves.find(wave => wave.livesAtEnd < wave.livesAtStart)?.wave).filter((wave): wave is number => wave !== undefined);

console.log(`${policy} — ${count} seeds`);
console.log(`wins ${wins}/${count} (${Math.round(wins / count * 100)}%), median final lives ${median(runs.map(run => run.final.lives))}`);
console.log(bleeds.length
  ? `first integrity loss: median wave ${median(bleeds)}, earliest ${Math.min(...bleeds)} (bled in ${bleeds.length}/${count} runs)`
  : 'first integrity loss: never');

console.log('\nmedian lives after milestone waves (runs still alive):');
for (const milestone of [5, 10, 15, 20, 25, 28, 30]) {
  const lives = runs.map(run => run.waves.find(wave => wave.wave === milestone)?.livesAtEnd).filter((value): value is number => value !== undefined);
  if (lives.length) console.log(`  wave ${String(milestone).padStart(2)}  ${String(median(lives)).padStart(2)}/20  (${lives.length}/${count})`);
}

console.log('\nwaves that cost integrity:');
for (const wave of WAVES) {
  const lost = runs.map(run => run.waves.find(entry => entry.wave === wave.number)).filter(entry => entry !== undefined).map(entry => entry!.livesAtStart - entry!.livesAtEnd);
  const leaked = lost.filter(value => value > 0).length;
  if (!leaked) continue;
  const mean = lost.reduce((sum, value) => sum + value, 0) / lost.length;
  console.log(`  wave ${String(wave.number).padStart(2)} ${wave.name.padEnd(22)} leaked in ${leaked}/${lost.length}, mean ${mean.toFixed(1)} lives   ${wave.groups.map(group => `${group.kind}×${group.count}`).join(' ')}`);
}
