# Asset provenance and terms

`public/brand/robot.webp` is the unchanged armored ShoeMoney robot from the project owner's ShoeMoneyX brand collection. `public/brand/shoemoney.png` is the unchanged blue ShoeMoney logo from that same collection. The source collection identifies the logo as artwork supplied by the owner. The owner explicitly requested their use in this public game.

These brand assets are included for this ShoeMoney release. They are not covered by the MIT software license, and that license grants no rights to the ShoeMoney name, logo, robot identity, or trademarks. Forks can replace the two files with their own art without changing combat. No proprietary trading code, account data, or private source from ShoeMoneyX is included.

Soldiers, enemies, terrain, platforms, weapons, and effects are original geometry generated in `src/battlefield.ts`. Audio combines CC0 firearm recordings with procedural effects in `src/audio.ts`; production also reuses two existing Arcade sound URLs under the terms described below. Original geometry and procedural audio source are MIT licensed. Recording terms are separate.

Font Awesome Free provides the interface icons through its published packages. Its icons are CC BY 4.0 and its code is MIT. See [Font Awesome licensing](https://fontawesome.com/license/free). No Pro package is included.

Barlow and Barlow Condensed load from Google Fonts, with local sans-serif and Impact fallbacks if that service is unavailable. They use the SIL Open Font License. See [Barlow source and license](https://github.com/jpt/barlow).

Three.js is MIT licensed. Apache ECharts and ZRender use Apache License 2.0. Dependency license texts are included in `public/THIRD_PARTY_LICENSES.txt` and in the static release.

Gameplay previews are captures of this actual game. They are not pre-rendered promises of absent gameplay.

## Gunfire and casing audio

The owner requested sounds from ShoeINATOR. Its source inventory, nested archive, imported Unreal audio assets, credits and weapon code were inspected, together with the related Last Engineer browser release.

| Bundled file | Recording source | Processing |
| --- | --- | --- |
| `public/audio/pistol-shot.wav` | ShoeINATOR `RawAssets/Audio/Weapons/pistol_shot.wav`, Walther PPQ `X_39P.wav` | Copied unchanged; playback skips the 100 ms lead-in and shortens the tail |
| `public/audio/rifle-shot.wav` | ShoeINATOR `RawAssets/Audio/Weapons/rifle_shot.wav`, AR-15 `D_32P.wav` | Copied unchanged; playback skips the 100 ms lead-in and shortens the tail |
| `public/audio/gunner-burst.wav` | `Prepared_SFX_Library.7z` → `Prepared SFX Library/AK-47/C_29P.wav` | First short burst, cropped from 0.98 s for 1.12 s; mono 44.1 kHz / 16-bit conversion, reduced amplitude and boundary fades |

These three recordings are from **The Free Firearm Sound Library**, by Ben Jaszczak, Brian Nelson, Kevin Heras and Matthew Nanney. The [publisher](https://opengameart.org/content/the-free-firearm-sound-library) lists [CC0 / no rights reserved](https://creativecommons.org/publicdomain/zero/1.0/). Attribution is retained voluntarily. Published audio credits also accompany the files in `public/audio/CREDITS.md`.

### Existing Arcade recordings, excluded from this source package

On `arcade.shoemoney.com` only, the game requests the existing same-origin Last Engineer assets `/last-engineer/game/audio/sfx/pistol_suppressed.mp3` and `/last-engineer/game/audio/sfx/bullet_casing.mp3`. The owner explicitly requested reuse of these existing game sounds. Neither recording is copied into this repository, and neither is claimed to be CC0 or covered by MIT.

Last Engineer credits identify the casing clip as an extract from the [owner-selected casing reference](https://www.youtube.com/shorts/_QOGRV6PA8o), trimmed from 0.195 s. They identify the suppressed pistol as an extract from the [owner-selected suppressor reference](https://www.youtube.com/shorts/Kh8oU2OGMAE), trimmed from 0.402–0.680 s, and expressly exclude it from that public source package. Those credits establish the sources, **not a verified redistribution license**. This package preserves that source exclusion. Forks must supply sounds for which they have rights if they want equivalent recorded effects.

The Sniper uses the existing suppressed pistol cue as a suppressed-shot game effect, not a claim that it is a recording of a sniper rifle. Local builds, forks, and failed runtime requests use a quiet, lower-pitched, low-pass treatment of the bundled rifle instead. Casing fallback is an original procedural metallic two-impact cue, not a sampled casing recording. No voice line or Mixkit recording is bundled.

Audio remains opt-in. Combat, casing and interface voices are capped at 8, 3 and 4 concurrent sources. Shots and casing impacts are throttled, casing is delayed after audible shots, and master gain/compression preserve headroom. Cosmetic variation uses event IDs without consuming combat RNG. Muting cancels active and scheduled sources. Failed recording requests quietly use procedural fallback; runtime cues are requested only on the existing Arcade domain.
