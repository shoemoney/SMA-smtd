# Working on ShoeMoney Tower Defense

Read docs/architecture.md and docs/game-design.md before changing combat behavior. The exact current values live in src/content.ts. The research report is design evidence, not a second runtime specification.

Preserve all six soldiers and exactly three upgrades after each base rank. Preserve the user's Machine Gunner and Sniper probabilities, multipliers, and durations. Do not let rage refresh itself. Keep simulation independent of rendering.

Use at least 18 CSS pixels for every readable UI and chart label. Default body and controls to 20 pixels. Use meaningful official Font Awesome icons. No decorative arrows, chevrons, starbursts, or emoji icon substitutes.

Keep the original robot faded but visibly present behind the field. The board must not hide it behind an opaque ground surface. Soldiers must have recognizable human silhouettes and distinct equipment.

Run npm test and npm run build for combat or integration work. Verify actual browser interaction and both desktop and mobile layouts for UI changes. Report the observed backend, not merely the presence of navigator.gpu.

The public repository is SMA-smtd; the deployment slug is smtd. Never commit environment files, private deployment credentials, workstation-specific paths, or unrelated ShoeMoneyX source. Preserve brand license exclusions in ASSETS.md.
