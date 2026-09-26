# ShoeMoney Tower Defense brief

User requests a deeply researched, extremely detailed plan and implementation of a military tower-defense browser game, using WebGPU. Create the `smtd` project folder and a public open-source GitHub repository. Hosting destination is ShoeMoney Arcade at arcade.shoemoney.com. Use actual ShoeMoney robot and brand assets from shoemoneyx. Robot must remain faded but visibly present behind the battlefield.

Six military people are the towers. Each has a base rank and exactly three upgrades. Preserve Cadet pistol with medium fire rate, low damage, and no special effect. Preserve Machine Gunner with high fire rate, medium damage, 5% chance on an eligible shot to trigger 5x firing rate for five seconds. Preserve Sniper with slow fire rate, high damage, 10% headshot chance, instant normal-enemy kill, and 5x damage to bosses. Define all proc stacking and timing behavior explicitly. Fill the other roles with complementary soldiers.

Deliver the plan and playable implementation together.

All UI text is at least 18 CSS pixels, body and controls at least 20 when practical, across desktop and mobile. Use meaningful official Font Awesome icons, never generic arrows, chevrons, decorative starbursts, or emoji substitutes. Numerical comparisons lead with interactive ECharts. Distinguish starting balance values from empirical results. Tests must include actual user-visible play, not just builds.

Prefer a well-finished, complete fixed-route campaign, with deterministic combat separated from the renderer, static deployment, accessible DOM controls, and explicit browser support states. No live trading code or secrets are relevant to this game.

## Confirmed economy and controls

Start with $100. Cadets cost $10; later soldier types cost progressively more. The player launches wave one, then later waves start automatically. Every fifth wave includes a boss and supporting monsters. Wave-one monsters pay $1 each, with scaling bounties afterward. Each run has exactly three emergency airstrikes. All six soldier types appear as cards, with statistics on hover or focus. Unaffordable cards are gray until funds are sufficient. Use suitable gunfire, suppressed-shot, and casing effects from the related Shoeinator audio collection with documented provenance.
