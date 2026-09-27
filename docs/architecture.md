# Architecture and implementation contract

The game uses a deterministic CPU simulation and a Three.js WebGPURenderer battlefield. The DOM owns all readable text and controls. `src/types.ts` is the shared contract.

## Caller usage

```ts
const session = createSession(7341);
session.command({ kind: 'place', role: 'cadet', pad: 0 });
session.command({ kind: 'start-wave' });
session.advance(60);
const frame = session.frame();
battlefield.render(frame, selectedPad, selectedRole, reducedMotion);
```

`createSession(seed?: number)` is exported from `src/game.ts`. `createBattlefield(host, onDeviceLost)` is exported from `src/battlefield.ts` and returns a Promise of Battlefield. Content exports from `src/content.ts` are `UNITS: Record<Role, UnitSpec>`, `ENEMIES: Record<EnemyKind, EnemySpec>`, `WAVES: WaveSpec[]`, `PADS: Pad[]`, `ROUTE: Point[]`, `STARTING_CASH`, and `STARTING_LIVES`. Coordinates use x/z on a horizontal ground plane. Map bounds are x -12 to 12, z -8 to 8. Route and pads share those bounds. The orthographic camera looks from positive z toward the origin on desktop and from positive x on phone-width layouts, so the long axis of the map always runs across the longer side of the viewport. The frustum is fitted to the map plus a 1.5-unit margin rather than pinned to a constant: the margin is carried in the width term, because a fixed floor holds its margin at one aspect ratio only and collapses at others. The route's first and last points sit exactly on the x boundary, so losing that margin clips the entry beacon and the outpost.

## Ownership

The session owns commands, money, targeting, time, RNG, statuses, damage, rewards, and phase transitions. The content file owns all six rank ladders, all thirty wave compositions, route geometry, and deployment pads. The battlefield owns meshes, camera, lighting, visual effects, resizing, WebGPU selection, and disposal. The app owns DOM, one animation loop, accessible controls, sound, local best scores, and pause on visibility loss. The field manual consumes the same content arrays for ECharts and reference tables.

All simulation time is seconds advanced in exact 1/60-second ticks. Each snapshot copies tower/enemy records so the view cannot mutate combat. Events retain the most recent one second, with monotonically increasing IDs. A kill event also carries the victim's `boss` flag as optional metadata, because the event's target point is narrowed to x/z and cannot otherwise identify what died; this is additive only and draws no randomness. The app tracks event IDs to avoid replaying sound. Renderers never consume combat RNG. Invalid commands cannot spend money or randomness. Shot cooldown does not bank while idle.

The Machine Gunner rolls 5% once per shot while rage is inactive. The trigger shot is ordinary. Subsequent cadence is 5x for five simulation seconds. Active rage cannot roll, stack, or refresh. Sniper rolls 10% on each shot, kills any nonboss regardless of armor, and deals 5x shot damage to bosses before armor. Upgrades preserve active timers. Selling cancels a unit. Cadet has no special at any rank. Engineer slow refreshes two seconds, strongest wins, boss slow is capped at 15%. Officer damage aura uses the strongest nearby officer, never self, and officers cannot buff officers.

## Synthesis

Candidate A is the base. Its session API keeps combat independent of GPU lifetime and makes exact mechanics testable. Candidate B contributes explicit backend diagnostics and a requirement that fallback cannot change combat. Native sprite batching loses because hand-written graphics recovery and separate Canvas2D maintenance increase delivery risk and do not provide the desired dimensional human soldier silhouettes. Its rage refresh would cause positive feedback and is rejected. Three.js WebGPU has a documented WebGL2 fallback, so both modes use one scene.

The initial scope uses one fixed route and deployment pads. Free-form maze building requires path validation and creates additional placement ambiguity on touch screens. The 30-wave campaign is authored. The first wave starts on command; later waves start automatically after six simulation seconds. Bosses appear every fifth wave. Three airstrikes per run clear current normal enemies and damage current bosses by 35% maximum HP. Each strike has a twelve-second cooldown. Enemy HP scaling accompanies deliberate composition changes. It does not replace them.

## Principles applied

Model the Domain led to one phase model, typed commands, and four-rank tuples. Experience First led to immediate deployment feedback, readable DOM controls, and one finished campaign. Prove It Works requires actual browser play and an observed active renderer backend in addition to compilation and simulation tests.

## Runtime and recovery

Initialize the GPU asynchronously before animation. Cap elapsed wall time at 0.1 seconds and simulation ticks per frame at twelve. Speed selection is 1x or 2x. Hidden tabs pause and require an explicit resume. GPU loss pauses play and presents recovery controls. Browser resize changes only the camera and projected control positions. Restart resets simulation and sound deduplication. There is no multiplayer or server-authoritative leaderboard in the first release.

## Source grounding

The original brand asset README confirms the user-supplied logo. The inspected armored robot is copied unchanged. Only those authorized brand assets are imported. Arcade registration uses its current registry, complete-release builder, and deployment tooling. The older arcade checkout targets a different domain and is not used.

Three.js documents WebGPU as primary and WebGL2 as fallback, with asynchronous initialization. See [WebGPURenderer guide](https://threejs.org/manual/pages/webgpurenderer). GPU devices may be lost after initialization. See [MDN device loss](https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/lost).

## Revised economy and automatic pacing

The user replaced the initial economy with $100 starting funds and $10 Cadets. Current base prices, promotion costs, scaled monster bounties, and six boss encounters live in content.ts. Frame exposes nextWaveIn, airstrikes, and airstrikeReadyIn. The airstrike command validates combat phase, living targets, pause, charges, and cooldown before any mutation. Airstrike kills award normal rewards exactly once and never increase headshot counts. Paused simulation freezes automatic wave starts and rearming.
