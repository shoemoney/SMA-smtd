# ShoeMoney Tower Defense

**Six soldiers. Thirty waves. One outpost.**

Operation Iron Dividend is a free military tower-defense game built for [ShoeMoney Arcade](https://arcade.shoemoney.com/). Human soldiers defend Guardian Outpost while the original ShoeMoney robot watches over the battlefield.

[Play the game](https://arcade.shoemoney.com/smtd/) · [Game design](docs/game-design.md) · [Deep research](docs/research/tower-defense-research.md) · [All balance values](docs/balance-data.md)

![Actual ShoeMoney Tower Defense gameplay](public/preview/gameplay.png)

## Play

Choose a soldier from the six visible squad cards. Select a numbered position to deploy. Launch the operation when your formation is ready. Subsequent waves arrive automatically after six-second intermissions. Hover a soldier card for its statistics, or focus/tap the card. Unaffordable soldiers are gray and become selectable as funds increase; their statistics remain available. Select a deployed soldier to promote it, change its targeting, or recall it for 70% of the invested supplies.

The campaign includes six soldiers, each with a base rank and three upgrades.

- Cadet uses a pistol with no special effect.
- Machine Gunner has a 5% chance per eligible shot to enter Berserker Rage, firing five times faster for five seconds.
- Sniper has a 10% Headshot chance, instantly killing normal enemies and dealing fivefold damage to bosses.
- Grenadier damages groups with explosives.
- Combat Engineer slows enemies and extends allied firing opportunities.
- Field Officer increases nearby allied damage without stacking auras.

You start with $100 and Cadets cost $10. Normal monsters pay $1 on wave one, increasing by $1 every three waves. A boss with supporting monsters arrives every five waves. Survive all thirty waves to secure the outpost. Rage cannot refresh itself. Bosses resist slowing. Officers cannot buff themselves or other Officers.

Each run has three airstrikes. A strike clears current normal monsters and removes 35% of each current boss's maximum health. Strikes need twelve simulation seconds to rearm. Future spawns are unaffected. Press A or use the Airstrike button.

Keys 1 through 6 select soldiers. Space starts the first wave or pauses when a native control does not own the key. Escape closes dialogs. Sound is optional. Hidden tabs pause. Fullscreen retains game controls. The field manual contains interactive wave composition and soldier damage charts, with exact tables available on demand.

## Run locally

Use a current Node.js version supported by Vite 8. The project was built with Node 26.10.0. Node 22.12 or newer is the CI baseline.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. WebGPU requires a secure context, including localhost. The renderer automatically uses WebGL2 compatibility mode if WebGPU is unavailable. The UI reports the active backend. Add `?renderer=webgl` to test the fallback.

```sh
npm test
npm run build
npm run preview
```

The static release is in `dist/`. Relative asset URLs support the `/smtd/` arcade route. No server or credentials are required to play. The optional arcade scoreboard uses the existing same-origin Arcade API only on the production arcade hostname. Score submissions are client-reported, not cheat-proof.

## Read the plan

- [Game design and delivery roadmap](docs/game-design.md) defines the experience, rules, enemies, progression, and future work.
- [Tower-defense research](docs/research/tower-defense-research.md) examines thirteen primary sources, genre formats, wave pacing, and proc balance.
- [Exact starting balance data](docs/balance-data.md) records all twenty-four rank definitions and thirty authored wave schedules.
- [Architecture](docs/architecture.md) defines ownership, command handling, deterministic combat, and renderer recovery.
- [Playtest plan](docs/playtest-plan.md) covers learning, strategy, stress, abuse, readability, and browser support.
- [Verification record](docs/verification.md) separates completed checks from remaining playtesting.
- [Asset provenance](ASSETS.md) identifies original branding and dependency licenses.

The numeric balance is a starting point. Rules tests and a legal campaign completion do not establish broad strategic balance or first-time-player difficulty.

## Contribute

Keep simulation rules in `src/game.ts`, content in `src/content.ts`, rendering in `src/battlefield.ts`, and UI in `src/main.ts`. Use the shared types in `src/types.ts`. Preserve the explicit proc contracts and four-rank ladders. Add a focused behavioral test when changing combat rules.

All readable UI and chart text must remain at least 18 CSS pixels. Body copy and controls use 20 pixels where practical. Use meaningful Font Awesome icons. Keep graphics timing out of combat randomness. Verify real rendering and touch controls as well as the build.

## License

Game code and original procedural geometry are [MIT licensed](LICENSE). ShoeMoney brand artwork and trademarks are excluded from the software license. See [asset terms](ASSETS.md).
